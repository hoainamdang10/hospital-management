/**
 * IAuditLogService - Audit Logging Service Interface
 * Interface for security audit logging
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, HIPAA, Security
 */
export declare enum AuditAction {
    MEDICAL_RECORD_CREATED = "medical_record.created",
    MEDICAL_RECORD_ACCESSED = "medical_record.accessed",
    MEDICAL_RECORD_UPDATED = "medical_record.updated",
    MEDICAL_RECORD_DELETED = "medical_record.deleted",
    CLINICAL_NOTE_CREATED = "clinical_note.created",
    CLINICAL_NOTE_ACCESSED = "clinical_note.accessed",
    CLINICAL_NOTE_UPDATED = "clinical_note.updated",
    CLINICAL_NOTE_COSIGNED = "clinical_note.cosigned",
    DIAGNOSTIC_REPORT_CREATED = "diagnostic_report.created",
    DIAGNOSTIC_REPORT_ACCESSED = "diagnostic_report.accessed",
    DIAGNOSTIC_REPORT_UPDATED = "diagnostic_report.updated",
    DIAGNOSTIC_REPORT_FINALIZED = "diagnostic_report.finalized",
    PRESCRIPTION_CREATED = "prescription.created",
    PRESCRIPTION_ACCESSED = "prescription.accessed",
    PRESCRIPTION_UPDATED = "prescription.updated",
    PRESCRIPTION_DISPENSED = "prescription.dispensed",
    TREATMENT_PLAN_CREATED = "treatment_plan.created",
    TREATMENT_PLAN_ACCESSED = "treatment_plan.accessed",
    TREATMENT_PLAN_UPDATED = "treatment_plan.updated",
    TREATMENT_PLAN_COMPLETED = "treatment_plan.completed",
    ACCESS_GRANTED = "access.granted",
    ACCESS_REVOKED = "access.revoked",
    ACCESS_DENIED = "access.denied",
    AUTHENTICATION_SUCCESS = "auth.success",
    AUTHENTICATION_FAILED = "auth.failed",
    AUTHORIZATION_FAILED = "auth.authorization_failed"
}
export declare enum AuditSeverity {
    INFO = "info",
    WARNING = "warning",
    ERROR = "error",
    CRITICAL = "critical"
}
export interface AuditLogEntry {
    action: AuditAction;
    userId: string;
    userEmail?: string;
    userRole?: string;
    resourceType: string;
    resourceId?: string;
    patientId?: string;
    details?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    severity: AuditSeverity;
    timestamp: Date;
    success: boolean;
    errorMessage?: string;
    metadata?: Record<string, any>;
}
export interface IAuditLogService {
    /**
     * Log an audit event
     */
    log(entry: Omit<AuditLogEntry, 'timestamp'>): Promise<void>;
    /**
     * Log successful action
     */
    logSuccess(action: AuditAction, userId: string, resourceType: string, resourceId?: string, details?: Record<string, any>): Promise<void>;
    /**
     * Log failed action
     */
    logFailure(action: AuditAction, userId: string, resourceType: string, error: string, details?: Record<string, any>): Promise<void>;
    /**
     * Log access to PHI (Protected Health Information)
     */
    logPHIAccess(userId: string, patientId: string, resourceType: string, resourceId: string, action: AuditAction, ipAddress?: string): Promise<void>;
    /**
     * Query audit logs (for compliance reporting)
     */
    query(filters: {
        userId?: string;
        patientId?: string;
        resourceType?: string;
        action?: AuditAction;
        startDate?: Date;
        endDate?: Date;
        limit?: number;
        offset?: number;
    }): Promise<AuditLogEntry[]>;
}
//# sourceMappingURL=IAuditLogService.d.ts.map