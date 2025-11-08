/**
 * SupabaseAuditLogService - Audit Logging Implementation
 * Stores security audit logs in Supabase (shared public.audit_logs table)
 *
 * @author Hospital Management Team
 * @version 2.1.0
 * @compliance Clean Architecture, HIPAA, Security
 * @updated 2025-11-02 - Migrated to shared public.audit_logs
 */
import { SupabaseClient } from "@supabase/supabase-js";
import { IAuditLogService, AuditLogEntry, AuditAction } from "../../application/services/IAuditLogService";
import { ILogger } from "../logging/logger";
export declare class SupabaseAuditLogService implements IAuditLogService {
    private readonly supabase;
    private readonly logger;
    private readonly tableName;
    private readonly serviceName;
    constructor(supabase: SupabaseClient, logger: ILogger);
    /**
     * Check if entry contains PHI (Protected Health Information)
     */
    private containsPHI;
    /**
     * Main logging method - writes to shared public.audit_logs
     */
    log(entry: Omit<AuditLogEntry, "timestamp">): Promise<void>;
    /**
     * Log successful action
     */
    logSuccess(action: AuditAction, userId: string, resourceType: string, resourceId?: string, details?: Record<string, any>): Promise<void>;
    /**
     * Log failed action
     */
    logFailure(action: AuditAction, userId: string, resourceType: string, error: string, details?: Record<string, any>): Promise<void>;
    /**
     * Log PHI (Protected Health Information) access
     * HIPAA compliance requirement
     */
    logPHIAccess(userId: string, patientId: string, resourceType: string, resourceId: string, action: AuditAction, ipAddress?: string): Promise<void>;
    /**
     * Query audit logs with filters
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
//# sourceMappingURL=SupabaseAuditLogService.d.ts.map