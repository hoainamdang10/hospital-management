/**
 * PatientLifecycleEventHandler - Handle patient lifecycle events from Patient Registry Service
 *
 * Handles:
 * - patient.deceased → Permanently deactivate user account
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Event-Driven Architecture, HIPAA
 */

import { ILogger } from "../../../application/services/ILogger";
import { DeactivateUserUseCase } from "../../../application/use-cases/DeactivateUserUseCase";
import { InboxService } from "../../inbox/InboxService";

export interface PatientDeceasedEvent {
  eventId: string;
  patientId: string;
  userId: string;
  dateOfDeath: Date;
  deathCertificateNumber?: string;
  reportedBy: string; // Staff ID who reported
  occurredAt: Date;
}

export class PatientLifecycleEventHandler {
  constructor(
    private deactivateUserUseCase: DeactivateUserUseCase,
    private inboxService: InboxService,
    private logger: ILogger,
  ) {}

  /**
   * Handle patient.deceased event
   * Permanently deactivate user account when patient is deceased
   * This is irreversible - different from account lock
   */
  async handlePatientDeceased(event: PatientDeceasedEvent): Promise<void> {
    try {
      // Idempotency check
      const processed = await this.inboxService.checkProcessed(event.eventId);
      if (processed) {
        this.logger.debug("Event already processed", {
          eventId: event.eventId,
        });
        return;
      }

      // Store event in inbox
      await this.inboxService.storeEvent({
        eventId: event.eventId,
        eventType: "PatientDeceasedEvent",
        aggregateId: event.patientId,
        aggregateType: "Patient",
        payloadJson: event,
        sourceService: "patient-registry-service",
        routingKey: "patient.deceased",
        occurredAt: event.occurredAt,
      });

      this.logger.info("Processing patient deceased event", {
        eventId: event.eventId,
        patientId: event.patientId,
        userId: event.userId,
        dateOfDeath: event.dateOfDeath,
      });

      // Permanently deactivate user account
      await this.deactivateUserUseCase.execute({
        userId: event.userId,
        deactivatedBy: "SYSTEM_AUTO",
        reason: `Patient deceased on ${event.dateOfDeath.toISOString().split("T")[0]}${
          event.deathCertificateNumber
            ? ` (Certificate: ${event.deathCertificateNumber})`
            : ""
        }`,
        terminateSessions: true,
      });

      this.logger.info(
        "User account permanently deactivated for deceased patient",
        {
          userId: event.userId,
          patientId: event.patientId,
          dateOfDeath: event.dateOfDeath,
          deathCertificateNumber: event.deathCertificateNumber,
        },
      );

      // Mark as processed
      await this.inboxService.markProcessed(event.eventId);
    } catch (error) {
      this.logger.error("Error handling patient deceased event", {
        eventId: event.eventId,
        error: error instanceof Error ? error.message : String(error),
      });
      await this.inboxService.markFailed(
        event.eventId,
        error instanceof Error ? error.message : "Unknown error",
      );
      throw error;
    }
  }
}
