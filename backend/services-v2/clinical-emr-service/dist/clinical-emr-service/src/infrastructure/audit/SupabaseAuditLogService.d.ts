/**
 * SupabaseAuditLogService - Audit Logging Implementation
 * Stores security audit logs in Supabase
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, HIPAA, Security
 */
import { SupabaseClient } from '@supabase/supabase-js';
import { IAuditLogService, AuditLogEntry, AuditAction } from '../../application/services/IAuditLogService';
import { ILogger } from '../logging/logger';
export declare class SupabaseAuditLogService implements IAuditLogService {
    private readonly supabase;
    private readonly logger;
    private readonly tableName;
    constructor(supabase: SupabaseClient, logger: ILogger);
    log(entry: Omit<AuditLogEntry, 'timestamp'>): Promise<void>;
    logSuccess(action: AuditAction, userId: string, resourceType: string, resourceId?: string, details?: Record<string, any>): Promise<void>;
    logFailure(action: AuditAction, userId: string, resourceType: string, error: string, details?: Record<string, any>): Promise<void>;
    logPHIAccess(userId: string, patientId: string, resourceType: string, resourceId: string, action: AuditAction, ipAddress?: string): Promise<void>;
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