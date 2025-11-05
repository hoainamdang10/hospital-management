/**
 * AuditLogServiceAdapter - Infrastructure Layer
 * Adapter to match IAuditLogService interface with existing SupabaseAuditLogService
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { injectable, inject } from 'inversify';
import { 
  IAuditLogService, 
  AuditLogFilter, 
  AuditLogEntry, 
  AuditLogResult 
} from '../../domain/services/IAuditLogService';
import { SupabaseAuditLogService } from '../audit/SupabaseAuditLogService';
import { TYPES } from '../di/types';

@injectable()
export class AuditLogServiceAdapter implements IAuditLogService {
  constructor(
    @inject(TYPES.AuditLogService) private readonly supabaseAuditService: SupabaseAuditLogService
  ) {}

  /**
   * Get audit logs with filters and pagination
   */
  async getAuditLogs(filters: AuditLogFilter, limit: number, offset: number): Promise<AuditLogResult> {
    // Convert filters to SupabaseAuditLogService format
    const queryFilters: any = {
      limit,
      offset
    };

    if (filters.patientId) queryFilters.patientId = filters.patientId;
    if (filters.userId) queryFilters.userId = filters.userId;
    if (filters.action) queryFilters.action = filters.action;
    if (filters.startDate) queryFilters.startDate = filters.startDate;
    if (filters.endDate) queryFilters.endDate = filters.endDate;

    // Query audit logs
    const logs = await this.supabaseAuditService.query(queryFilters);

    // Map to domain format
    const mappedLogs: AuditLogEntry[] = logs.map(log => ({
      id: log.resourceId || `${log.userId}-${log.timestamp.getTime()}`,
      timestamp: log.timestamp.toISOString(),
      userId: log.userId,
      userName: log.userEmail || 'Unknown',
      userRole: log.userRole || 'Unknown',
      action: this.mapAction(log.action),
      resourceType: log.resourceType,
      resourceId: log.resourceId || '',
      patientId: log.patientId,
      patientName: log.details?.patientName,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      purpose: log.details?.purpose,
      outcome: log.success ? 'success' : 'failure',
      details: log.errorMessage
    }));

    // Get total count (approximate - in production, use separate count query)
    const total = logs.length >= limit ? offset + logs.length + 1 : offset + logs.length;

    return {
      logs: mappedLogs,
      total
    };
  }

  /**
   * Log PHI access
   */
  async logAccess(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void> {
    await this.supabaseAuditService.log({
      action: entry.action,
      userId: entry.userId,
      userEmail: entry.userName,
      userRole: entry.userRole,
      resourceType: entry.resourceType,
      resourceId: entry.resourceId,
      patientId: entry.patientId,
      ipAddress: entry.ipAddress,
      userAgent: entry.userAgent,
      success: entry.outcome === 'success',
      errorMessage: entry.outcome === 'failure' ? entry.details : undefined,
      details: {
        patientName: entry.patientName,
        purpose: entry.purpose
      }
    });
  }

  /**
   * Get audit logs for specific patient
   */
  async getPatientAuditLogs(patientId: string, limit: number, offset: number): Promise<AuditLogResult> {
    return this.getAuditLogs({ patientId }, limit, offset);
  }

  /**
   * Get audit logs for specific user
   */
  async getUserAuditLogs(userId: string, limit: number, offset: number): Promise<AuditLogResult> {
    return this.getAuditLogs({ userId }, limit, offset);
  }

  /**
   * Map action string to standardized format
   */
  private mapAction(action: string): string {
    // Map various action formats to standardized format
    const actionMap: Record<string, string> = {
      'medical_record.accessed': 'read',
      'medical_record.created': 'write',
      'medical_record.updated': 'update',
      'medical_record.deleted': 'delete',
      'medical_record.exported': 'export',
      'medical_record.printed': 'print',
      'phi.accessed': 'read',
      'phi.exported': 'export'
    };

    return actionMap[action] || action;
  }
}

