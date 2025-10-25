/**
 * Audit Service Implementation - Shared Infrastructure
 * Standard audit service for all services
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { IAuditService, AuditLogEntry } from '../../application/services/audit.service.interface';

export class AuditService implements IAuditService {
  private logs: AuditLogEntry[] = [];

  async log(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void> {
    const logEntry: AuditLogEntry = {
      id: this.generateId(),
      timestamp: new Date(),
      ...entry
    };
    
    this.logs.push(logEntry);
    
    // In a real implementation, this would write to database
    console.log('[AUDIT]', logEntry);
  }

  async getLogsForResource(resource: string, resourceId: string): Promise<AuditLogEntry[]> {
    return this.logs.filter(
      log => log.resource === resource && log.resourceId === resourceId
    );
  }

  async getLogsForUser(userId: string, limit: number = 100): Promise<AuditLogEntry[]> {
    return this.logs
      .filter(log => log.userId === userId)
      .slice(0, limit);
  }

  private generateId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

