"use strict";
/**
 * IAuditLogService - Audit Logging Service Interface
 * Interface for security audit logging
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, HIPAA, Security
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditSeverity = exports.AuditAction = void 0;
var AuditAction;
(function (AuditAction) {
    // Medical Records
    AuditAction["MEDICAL_RECORD_CREATED"] = "medical_record.created";
    AuditAction["MEDICAL_RECORD_ACCESSED"] = "medical_record.accessed";
    AuditAction["MEDICAL_RECORD_UPDATED"] = "medical_record.updated";
    AuditAction["MEDICAL_RECORD_DELETED"] = "medical_record.deleted";
    // Clinical Notes
    AuditAction["CLINICAL_NOTE_CREATED"] = "clinical_note.created";
    AuditAction["CLINICAL_NOTE_ACCESSED"] = "clinical_note.accessed";
    AuditAction["CLINICAL_NOTE_UPDATED"] = "clinical_note.updated";
    AuditAction["CLINICAL_NOTE_COSIGNED"] = "clinical_note.cosigned";
    // Diagnostic Reports
    AuditAction["DIAGNOSTIC_REPORT_CREATED"] = "diagnostic_report.created";
    AuditAction["DIAGNOSTIC_REPORT_ACCESSED"] = "diagnostic_report.accessed";
    AuditAction["DIAGNOSTIC_REPORT_UPDATED"] = "diagnostic_report.updated";
    AuditAction["DIAGNOSTIC_REPORT_FINALIZED"] = "diagnostic_report.finalized";
    // Prescriptions
    AuditAction["PRESCRIPTION_CREATED"] = "prescription.created";
    AuditAction["PRESCRIPTION_ACCESSED"] = "prescription.accessed";
    AuditAction["PRESCRIPTION_UPDATED"] = "prescription.updated";
    AuditAction["PRESCRIPTION_DISPENSED"] = "prescription.dispensed";
    // Treatment Plans
    AuditAction["TREATMENT_PLAN_CREATED"] = "treatment_plan.created";
    AuditAction["TREATMENT_PLAN_ACCESSED"] = "treatment_plan.accessed";
    AuditAction["TREATMENT_PLAN_UPDATED"] = "treatment_plan.updated";
    AuditAction["TREATMENT_PLAN_COMPLETED"] = "treatment_plan.completed";
    // Access Control
    AuditAction["ACCESS_GRANTED"] = "access.granted";
    AuditAction["ACCESS_REVOKED"] = "access.revoked";
    AuditAction["ACCESS_DENIED"] = "access.denied";
    // Authentication
    AuditAction["AUTHENTICATION_SUCCESS"] = "auth.success";
    AuditAction["AUTHENTICATION_FAILED"] = "auth.failed";
    AuditAction["AUTHORIZATION_FAILED"] = "auth.authorization_failed";
})(AuditAction || (exports.AuditAction = AuditAction = {}));
var AuditSeverity;
(function (AuditSeverity) {
    AuditSeverity["INFO"] = "info";
    AuditSeverity["WARNING"] = "warning";
    AuditSeverity["ERROR"] = "error";
    AuditSeverity["CRITICAL"] = "critical";
})(AuditSeverity || (exports.AuditSeverity = AuditSeverity = {}));
//# sourceMappingURL=IAuditLogService.js.map