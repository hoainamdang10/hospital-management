/**
 * ClinicalComplianceEventHandler - Handle events from Clinical EMR Service
 *
 * Handles:
 * - medical-record.flagged → Lock account when suspicious activity detected
 * - prescription.abuse_detected → Lock account + terminate sessions for controlled substance abuse
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Event-Driven Architecture, HIPAA, Clinical Compliance
 */

import { ILogger } from "../../../application/services/ILogger";
import { LockAccountUseCase } from "../../../application/use-cases/LockAccountUseCase";
import { TerminateAllSessionsUseCase } from "../../../application/use-cases/TerminateAllSessionsUseCase";
import { InboxService } from "../../inbox/InboxService";
import { SupabaseClient } from "@supabase/supabase-js";

export interface MedicalRecordFlaggedEvent {
  eventId: string;
  recordId: string;
  patientId: string;
  providerId: string;
  flagReason: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  suspiciousActivity: string;
  occurredAt: Date;
}

export interface PrescriptionAbuseDetectedEvent {
  eventId: string;
  prescriptionId: string;
  patientId: string;
  providerId: string;
  drugName: string;
  drugClass: string; // e.g., 'controlled_substance', 'opioid'
  abusePattern: string;
  severity: "HIGH" | "CRITICAL";
  occurredAt: Date;
}

export class ClinicalComplianceEventHandler {
  constructor(
    private lockAccountUseCase: LockAccountUseCase,
    private terminateAllSessionsUseCase: TerminateAllSessionsUseCase,
    private inboxService: InboxService,
    private supabaseClient: SupabaseClient,
    private logger: ILogger,
  ) {}

  /**
   * Handle medical-record.flagged event
   * Lock account when suspicious activity detected with medical records
   */
  async handleMedicalRecordFlagged(
    event: MedicalRecordFlaggedEvent,
  ): Promise<void> {
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
        eventType: "MedicalRecordFlaggedEvent",
        aggregateId: event.recordId,
        aggregateType: "MedicalRecord",
        payloadJson: event,
        sourceService: "clinical-emr-service",
        routingKey: "medical-record.flagged",
        occurredAt: event.occurredAt,
      });

      this.logger.warn("Processing medical record flagged event", {
        eventId: event.eventId,
        recordId: event.recordId,
        patientId: event.patientId,
        providerId: event.providerId,
        severity: event.severity,
      });

      // Determine user ID based on who accessed the record
      // If provider accessed inappropriately, lock provider account
      // If patient tampered with record, lock patient account
      const userId = event.providerId; // Assuming provider is the violator

      // Lock account for CRITICAL or HIGH severity
      if (event.severity === "CRITICAL" || event.severity === "HIGH") {
        await this.lockAccountUseCase.execute({
          userId,
          lockedBy: "SYSTEM_AUTO",
          reason: `Medical record violation: ${event.flagReason}`,
          terminateSessions: true,
        });

        // Flag account
        await this.flagUserAccount(
          userId,
          "MEDICAL_RECORD_VIOLATION",
          event.severity,
          {
            recordId: event.recordId,
            patientId: event.patientId,
            flagReason: event.flagReason,
            suspiciousActivity: event.suspiciousActivity,
          },
          event.eventId,
        );

        // HIPAA compliance audit log
        await this.auditLog({
          action: "MEDICAL_RECORD_VIOLATION_DETECTED",
          userId,
          severity: event.severity,
          details: {
            recordId: event.recordId,
            patientId: event.patientId,
            providerId: event.providerId,
            flagReason: event.flagReason,
            suspiciousActivity: event.suspiciousActivity,
            eventId: event.eventId,
            hipaaCompliance: "PHI_BREACH_SUSPECTED",
          },
        });

        this.logger.error(
          "User account locked due to medical record violation",
          {
            userId,
            recordId: event.recordId,
            severity: event.severity,
            flagReason: event.flagReason,
          },
        );
      }

      // Mark as processed
      await this.inboxService.markProcessed(event.eventId);
    } catch (error) {
      this.logger.error("Error handling medical record flagged event", {
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

  /**
   * Handle prescription.abuse_detected event
   * Lock account + terminate sessions for controlled substance abuse
   */
  async handlePrescriptionAbuseDetected(
    event: PrescriptionAbuseDetectedEvent,
  ): Promise<void> {
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
        eventType: "PrescriptionAbuseDetectedEvent",
        aggregateId: event.prescriptionId,
        aggregateType: "Prescription",
        payloadJson: event,
        sourceService: "clinical-emr-service",
        routingKey: "prescription.abuse_detected",
        occurredAt: event.occurredAt,
      });

      this.logger.error("Processing prescription abuse detected event", {
        eventId: event.eventId,
        prescriptionId: event.prescriptionId,
        providerId: event.providerId,
        drugName: event.drugName,
        drugClass: event.drugClass,
        severity: event.severity,
      });

      // Lock provider account (who prescribed the controlled substance)
      const userId = event.providerId;

      // Lock account immediately
      await this.lockAccountUseCase.execute({
        userId,
        lockedBy: "SYSTEM_AUTO",
        reason: `Prescription abuse detected: ${event.abusePattern} (Drug: ${event.drugName})`,
        terminateSessions: true,
      });

      // Terminate all sessions
      await this.terminateAllSessionsUseCase.execute({
        userId,
      });

      // Flag account with CRITICAL severity
      await this.flagUserAccount(
        userId,
        "PRESCRIPTION_ABUSE",
        "CRITICAL",
        {
          prescriptionId: event.prescriptionId,
          patientId: event.patientId,
          drugName: event.drugName,
          drugClass: event.drugClass,
          abusePattern: event.abusePattern,
        },
        event.eventId,
      );

      // HIPAA + DEA compliance audit log
      await this.auditLog({
        action: "PRESCRIPTION_ABUSE_DETECTED",
        userId,
        severity: "CRITICAL",
        details: {
          prescriptionId: event.prescriptionId,
          patientId: event.patientId,
          providerId: event.providerId,
          drugName: event.drugName,
          drugClass: event.drugClass,
          abusePattern: event.abusePattern,
          eventId: event.eventId,
          hipaaCompliance: "CONTROLLED_SUBSTANCE_VIOLATION",
          deaReportingRequired: true,
        },
      });

      this.logger.error("Provider account locked due to prescription abuse", {
        userId,
        prescriptionId: event.prescriptionId,
        drugName: event.drugName,
        drugClass: event.drugClass,
        abusePattern: event.abusePattern,
      });

      // Mark as processed
      await this.inboxService.markProcessed(event.eventId);
    } catch (error) {
      this.logger.error("Error handling prescription abuse detected event", {
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

  /**
   * Flag user account
   */
  private async flagUserAccount(
    userId: string,
    flagType: string,
    severity: string,
    metadata: any,
    sourceEventId: string,
  ): Promise<void> {
    const { error } = await this.supabaseClient
      .schema("auth_schema")
      .from("user_flags")
      .insert({
        user_id: userId,
        flag_type: flagType,
        severity,
        is_active: true,
        flagged_by: "SYSTEM_AUTO",
        metadata,
        source_event_id: sourceEventId,
        source_service: "clinical-emr-service",
      });

    if (error) {
      throw new Error(`Failed to flag user account: ${error.message}`);
    }
  }

  /**
   * Audit log for HIPAA compliance
   */
  private async auditLog(log: {
    action: string;
    userId: string;
    severity: string;
    details: any;
  }): Promise<void> {
    const { error } = await this.supabaseClient
      .schema("auth_schema")
      .from("audit_logs")
      .insert({
        actor_id: log.userId,
        action: log.action,
        resource_type: "CLINICAL_COMPLIANCE",
        resource_id: log.userId,
        details: log.details,
        severity: log.severity.toLowerCase(),
        success: true,
      });

    if (error) {
      this.logger.error("Error writing audit log", { error: error.message });
    }
  }
}
