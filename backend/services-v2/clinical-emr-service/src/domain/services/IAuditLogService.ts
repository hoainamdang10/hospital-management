/**
 * IAuditLogService - Domain Service Interface
 * HIPAA Compliance: PHI access audit logging
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

export interface AuditLogFilter {
  patientId?: string;
  userId?: string;
  action?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  resourceType: string;
  resourceId: string;
  patientId?: string;
  patientName?: string;
  ipAddress?: string;
  userAgent?: string;
  purpose?: string;
  outcome: 'success' | 'failure';
  details?: string;
}

export interface AuditLogResult {
  logs: AuditLogEntry[];
  total: number;
}

export interface IAuditLogService {
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
}

