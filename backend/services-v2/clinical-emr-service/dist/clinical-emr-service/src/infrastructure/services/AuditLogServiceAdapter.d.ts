/**
 * AuditLogServiceAdapter - Infrastructure Layer
 * Adapter to match IAuditLogService interface with existing SupabaseAuditLogService
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { IAuditLogService, AuditLogFilter, AuditLogEntry, AuditLogResult } from '../../domain/services/IAuditLogService';
import { SupabaseAuditLogService } from '../audit/SupabaseAuditLogService';
export declare class AuditLogServiceAdapter implements IAuditLogService {
    private readonly supabaseAuditService;
    constructor(supabaseAuditService: SupabaseAuditLogService);
    /**
     * Get audit logs with filters and pagination
     */
    getAuditLogs(filters: AuditLogFilter, limit: number, offset: number): Promise<AuditLogResult>;
    /**
     * Log PHI access
     */
    logAccess(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void>;
    /**
     * Get audit logs for specific patient
     */
    getPatientAuditLogs(patientId: string, limit: number, offset: number): Promise<AuditLogResult>;
    /**
     * Get audit logs for specific user
     */
    getUserAuditLogs(userId: string, limit: number, offset: number): Promise<AuditLogResult>;
    /**
     * Map action string to standardized format
     */
    private mapAction;
}
//# sourceMappingURL=AuditLogServiceAdapter.d.ts.map