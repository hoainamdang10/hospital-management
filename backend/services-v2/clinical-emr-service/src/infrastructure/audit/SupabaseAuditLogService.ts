/**
 * SupabaseAuditLogService - Audit Logging Implementation
 * Stores security audit logs in Supabase
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, HIPAA, Security
 */

import { inject, injectable } from 'inversify';
import { SupabaseClient } from '@supabase/supabase-js';
import { 
  IAuditLogService, 
  AuditLogEntry, 
  AuditAction,
  AuditSeverity 
} from '../../application/services/IAuditLogService';
import { ILogger } from '../logging/logger';
import { TYPES } from '../di/types';

@injectable()
export class SupabaseAuditLogService implements IAuditLogService {
  private readonly tableName = 'audit_logs';

  constructor(
    @inject(TYPES.SupabaseClient) private readonly supabase: SupabaseClient,
    @inject(TYPES.Logger) private readonly logger: ILogger
  ) {}

  async log(entry: Omit<AuditLogEntry, 'timestamp'>): Promise<void> {
    try {
      const logEntry: AuditLogEntry = {
        ...entry,
        timestamp: new Date()
      };

      const { error } = await this.supabase
        .from(this.tableName)
        .insert({
          action: logEntry.action,
          user_id: logEntry.userId,
          user_email: logEntry.userEmail,
          user_role: logEntry.userRole,
          resource_type: logEntry.resourceType,
          resource_id: logEntry.resourceId,
          patient_id: logEntry.patientId,
          details: logEntry.details || {},
          ip_address: logEntry.ipAddress,
          user_agent: logEntry.userAgent,
          severity: logEntry.severity,
          success: logEntry.success,
          error_message: logEntry.errorMessage,
          metadata: logEntry.metadata || {},
          timestamp: logEntry.timestamp.toISOString()
        });

      if (error) {
        this.logger.error('Failed to write audit log', { error, entry: logEntry });
      }

    } catch (error) {
      this.logger.error('Audit log error', { error, entry });
    }
  }

  async logSuccess(
    action: AuditAction,
    userId: string,
    resourceType: string,
    resourceId?: string,
    details?: Record<string, any>
  ): Promise<void> {
    await this.log({
      action,
      userId,
      resourceType,
      resourceId,
      details,
      severity: AuditSeverity.INFO,
      success: true
    });
  }

  async logFailure(
    action: AuditAction,
    userId: string,
    resourceType: string,
    error: string,
    details?: Record<string, any>
  ): Promise<void> {
    await this.log({
      action,
      userId,
      resourceType,
      details,
      severity: AuditSeverity.ERROR,
      success: false,
      errorMessage: error
    });
  }

  async logPHIAccess(
    userId: string,
    patientId: string,
    resourceType: string,
    resourceId: string,
    action: AuditAction,
    ipAddress?: string
  ): Promise<void> {
    await this.log({
      action,
      userId,
      patientId,
      resourceType,
      resourceId,
      ipAddress,
      severity: AuditSeverity.INFO,
      success: true,
      details: {
        phi_access: true,
        compliance: 'HIPAA'
      }
    });
  }

  async query(filters: {
    userId?: string;
    patientId?: string;
    resourceType?: string;
    action?: AuditAction;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<AuditLogEntry[]> {
    try {
      let query = this.supabase
        .from(this.tableName)
        .select('*')
        .order('timestamp', { ascending: false });

      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }

      if (filters.patientId) {
        query = query.eq('patient_id', filters.patientId);
      }

      if (filters.resourceType) {
        query = query.eq('resource_type', filters.resourceType);
      }

      if (filters.action) {
        query = query.eq('action', filters.action);
      }

      if (filters.startDate) {
        query = query.gte('timestamp', filters.startDate.toISOString());
      }

      if (filters.endDate) {
        query = query.lte('timestamp', filters.endDate.toISOString());
      }

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 100) - 1);
      }

      const { data, error } = await query;

      if (error) {
        this.logger.error('Failed to query audit logs', { error, filters });
        return [];
      }

      return (data || []).map((row: any) => ({
        action: row.action,
        userId: row.user_id,
        userEmail: row.user_email,
        userRole: row.user_role,
        resourceType: row.resource_type,
        resourceId: row.resource_id,
        patientId: row.patient_id,
        details: row.details || {},
        ipAddress: row.ip_address,
        userAgent: row.user_agent,
        severity: row.severity,
        timestamp: new Date(row.timestamp),
        success: row.success,
        errorMessage: row.error_message,
        metadata: row.metadata || {}
      }));

    } catch (error) {
      this.logger.error('Audit log query error', { error, filters });
      return [];
    }
  }
}
