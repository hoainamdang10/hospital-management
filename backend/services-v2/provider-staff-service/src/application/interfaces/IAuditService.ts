/**
 * IAuditService Interface - Application Layer
 * V2 Clean Architecture + DDD Implementation
 * Audit service interface for HIPAA compliance
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, HIPAA
 */

export interface AuditLogEntry {
  action: string;
  resourceType: string;
  resourceId: string;
  userId: string;
  timestamp: Date;
  details?: Record<string, any>;
}

export interface IAuditService {
  logDataAccess(entry: AuditLogEntry): Promise<void>;
  logDataModification(entry: AuditLogEntry): Promise<void>;
  logSecurityEvent(entry: AuditLogEntry): Promise<void>;
}

