/**
 * Audit Service Implementation - Shared Infrastructure
 * Standard audit service for all services
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { IAuditService, AuditLogEntry } from '../../application/services/audit.service.interface';
export declare class AuditService implements IAuditService {
    private logs;
    log(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void>;
    getLogsForResource(resource: string, resourceId: string): Promise<AuditLogEntry[]>;
    getLogsForUser(userId: string, limit?: number): Promise<AuditLogEntry[]>;
    private generateId;
}
//# sourceMappingURL=audit.service.d.ts.map