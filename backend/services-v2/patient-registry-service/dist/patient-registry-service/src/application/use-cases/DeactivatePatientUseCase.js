"use strict";
/**
 * DeactivatePatientUseCase - Application Use Case
 *
 * Deactivates a patient (soft delete)
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards, HIPAA
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeactivatePatientUseCase = void 0;
const crypto_1 = require("crypto");
const PatientId_1 = require("../../domain/value-objects/PatientId");
class DeactivatePatientUseCase {
    constructor(patientRepository, eventBus, logger, auditService) {
        this.patientRepository = patientRepository;
        this.eventBus = eventBus;
        this.logger = logger;
        this.auditService = auditService;
    }
    async execute(request) {
        try {
            this.logger.info("Starting patient deactivation", {
                patientId: request.patientId,
                performedBy: request.performedBy,
                reason: request.reason,
            });
            // 1. Find patient
            const patientId = PatientId_1.PatientId.create(request.patientId);
            const patient = await this.patientRepository.findById(patientId);
            if (!patient) {
                this.logger.warn("Patient deactivation failed: patient not found", {
                    patientId: request.patientId,
                });
                return {
                    success: false,
                    message: "Không tìm thấy bệnh nhân",
                    errors: ["PATIENT_NOT_FOUND"],
                };
            }
            // 2. Check if patient is already inactive
            if (patient.isInactive()) {
                return {
                    success: false,
                    message: "Bệnh nhân đã bị vô hiệu hóa trước đó",
                    errors: ["PATIENT_ALREADY_INACTIVE"],
                };
            }
            // 3. Check if patient is merged
            if (patient.isMerged()) {
                return {
                    success: false,
                    message: "Không thể vô hiệu hóa bệnh nhân đã được merge",
                    errors: ["PATIENT_ALREADY_MERGED"],
                };
            }
            // 4. Check if patient is deceased
            if (patient.isDeceased()) {
                return {
                    success: false,
                    message: "Không thể vô hiệu hóa bệnh nhân đã qua đời",
                    errors: ["PATIENT_ALREADY_DECEASED"],
                };
            }
            // 5. Deactivate patient
            patient.deactivate(request.reason, request.performedBy);
            // 6. Save patient
            await this.patientRepository.save(patient);
            // 7. Publish domain events
            await this.publishDomainEvents(patient);
            // 8. HIPAA audit logging
            await this.auditPatientDeactivation(patient, request);
            this.logger.info("Patient deactivation completed successfully", {
                patientId: request.patientId,
                performedBy: request.performedBy,
            });
            // 9. Return success response
            return {
                success: true,
                message: "Vô hiệu hóa bệnh nhân thành công",
                data: {
                    patientId: request.patientId,
                    deactivatedAt: new Date().toISOString(),
                },
            };
        }
        catch (error) {
            // Handle validation errors
            if (error instanceof Error) {
                this.logger.error("Patient deactivation failed", {
                    patientId: request.patientId,
                    error: error.message,
                    stack: error.stack,
                });
                return {
                    success: false,
                    message: "Vô hiệu hóa bệnh nhân thất bại",
                    errors: [error.message],
                };
            }
            // Handle unexpected errors
            this.logger.error("Unexpected error during patient deactivation", {
                patientId: request.patientId,
                error: "UNEXPECTED_ERROR",
            });
            return {
                success: false,
                message: "Đã xảy ra lỗi không mong muốn",
                errors: ["UNEXPECTED_ERROR"],
            };
        }
    }
    /**
     * Publish domain events
     */
    async publishDomainEvents(patient) {
        try {
            const events = patient.getUncommittedEvents();
            for (const event of events) {
                await this.eventBus.publish(event);
            }
            patient.markEventsAsCommitted();
        }
        catch (error) {
            this.logger.warn("Event publishing failed, but patient was deactivated", {
                patientId: patient.getPatientId(),
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    /**
     * HIPAA audit logging for patient deactivation
     * Logs to audit_logs table via AuditService
     */
    async auditPatientDeactivation(patient, request) {
        try {
            // Log to audit_logs table (HIPAA compliance)
            await this.auditService.logAudit({
                eventId: (0, crypto_1.randomUUID)(),
                eventType: "patient.deactivated",
                aggregateType: "Patient",
                aggregateId: patient.getPatientId() || "unknown",
                action: "PATIENT_DEACTIVATION",
                userId: request.performedBy ?? undefined,
                patientId: patient.getPatientId() ?? undefined,
                containsPHI: true,
                changedFields: {
                    dataAccessed: "patient_status",
                    requestedBy: request.performedBy || "system",
                    reason: request.reason,
                },
                complianceLevel: "hipaa",
            });
            this.logger.info("Patient deactivation audited successfully", {
                patientId: patient.getPatientId(),
            });
        }
        catch (error) {
            this.logger.error("Failed to audit patient deactivation", {
                patientId: patient.getPatientId(),
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
}
exports.DeactivatePatientUseCase = DeactivatePatientUseCase;
//# sourceMappingURL=DeactivatePatientUseCase.js.map