/**
 * IdentityUserDeletedEventHandler
 * Handles identity.user.deleted events from Identity Service
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Event-Driven Architecture
 */

import { ILogger } from "@shared/application/services/logger.interface";
import { IPatientRepository } from "../../../domain/repositories/IPatientRepository";

/**
 * Identity User Deleted Event Data
 */
export interface IdentityUserDeletedEventData {
  userId: string;
  email: string;
  role: string;
  deletedAt: string;
  deletedBy: string;
  reason?: string;
}

/**
 * Identity User Deleted Event Handler
 * Processes user deletion events from Identity Service
 */
export class IdentityUserDeletedEventHandler {
  constructor(
    private logger: ILogger,
    private patientRepository: IPatientRepository,
  ) {}

  /**
   * Handle identity.user.deleted event
   */
  async handle(eventData: IdentityUserDeletedEventData): Promise<void> {
    try {
      this.logger.info("Processing identity.user.deleted event", {
        userId: eventData.userId,
        role: eventData.role,
      });

      // If role is provided and not PATIENT -> skip. If missing, proceed (assume patient).
      if (eventData.role && eventData.role !== "PATIENT") {
        this.logger.debug("Skipping non-patient user deletion", {
          userId: eventData.userId,
          role: eventData.role,
        });
        return;
      }

      const deleteResult = await this.patientRepository.hardDeleteByUserId(
        eventData.userId,
        {
          deletedBy: eventData.deletedBy,
          reason:
            eventData.reason ||
            "Identity user hard deleted - removing patient record",
        },
      );

      if (!deleteResult.deleted) {
        this.logger.warn("No patient record removed for deleted user", {
          userId: eventData.userId,
        });
        return;
      }

      this.logger.info("Patient record hard deleted after user deletion", {
        userId: eventData.userId,
        patientId: deleteResult.patientId,
        deletedBy: eventData.deletedBy,
        deletedAt: eventData.deletedAt,
        reason: eventData.reason,
      });
    } catch (error) {
      this.logger.error("Error handling identity.user.deleted event", {
        userId: eventData.userId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }
}
