/**
 * Audit Service Interface - Shared Application Layer
 * Defines contract for audit logging across all services
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
}

export interface IAuditService {
  /**
   * Log an audit entry
   */
  log(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void>;

  /**
   * Get audit logs for a resource
   */
  getLogsForResource(resource: string, resourceId: string): Promise<AuditLogEntry[]>;

  /**
   * Get audit logs for a user
   */
  getLogsForUser(userId: string, limit?: number): Promise<AuditLogEntry[]>;
}

