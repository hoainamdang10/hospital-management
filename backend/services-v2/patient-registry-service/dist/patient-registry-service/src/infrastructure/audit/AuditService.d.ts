/**
 * AuditService - HIPAA-compliant audit logging
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance HIPAA, Clean Architecture
 */
import { SupabaseClient } from '@supabase/supabase-js';
import { ILogger } from '../../../../shared/application/services/logger.interface';
export interface AuditLogEntry {
    eventId: string;
    eventType: string;
    aggregateType: string;
    aggregateId: string;
    action: string;
    userId?: string;
    userRole?: string;
    patientId?: string;
    containsPHI: boolean;
    changedFields?: Record<string, any>;
    oldValues?: Record<string, any>;
    newValues?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
    correlationId?: string;
    complianceLevel: string;
}
export interface PHIAccessLogEntry {
    patientId: string;
    userId: string;
    userRole?: string;
    accessType: 'READ' | 'WRITE' | 'EXPORT' | 'PRINT' | 'DELETE' | 'SEARCH';
    accessedFields?: string[];
    reason?: string;
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
}
export declare class AuditService {
    private supabase;
    private logger;
    constructor(supabase: SupabaseClient, logger: ILogger);
    /**
     * Log audit event
     */
    logAudit(entry: AuditLogEntry): Promise<void>;
    /**
     * Log PHI access
     */
    logPHIAccess(entry: PHIAccessLogEntry): Promise<void>;
    /**
     * Check if event was already processed (idempotency)
     */
    isEventProcessed(eventId: string): Promise<boolean>;
    /**
     * Mark event as processing
     */
    markEventProcessing(eventId: string, eventType: string, handlerName: string, eventPayload: any): Promise<string | null>;
    /**
     * Mark event as completed
     */
    markEventCompleted(eventId: string, processingDurationMs: number): Promise<void>;
    /**
     * Mark event as failed
     */
    markEventFailed(eventId: string, errorMessage: string, errorStack?: string): Promise<void>;
}
//# sourceMappingURL=AuditService.d.ts.map