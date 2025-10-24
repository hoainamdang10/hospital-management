/**
 * Audit Service Implementation
 * HIPAA-compliant audit logging for Provider/Staff Service
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance HIPAA, Vietnamese Healthcare Standards
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { IAuditService, AuditLogEntry } from '../../application/interfaces/IAuditService';
import { ILogger } from '../../application/interfaces/ILogger';

export interface AuditServiceConfig {
  supabaseUrl: string;
  supabaseKey: string;
  logger: ILogger;
  serviceName?: string;
}

/**
 * Audit Service Implementation
 * Logs all data access and modifications for HIPAA compliance
 */
export class AuditService implements IAuditService {
  private supabase: SupabaseClient;
  private logger: ILogger;
  private serviceName: string;

  constructor(config: AuditServiceConfig) {
    this.supabase = createClient(config.supabaseUrl, config.supabaseKey);
    this.logger = config.logger;
    this.serviceName = config.serviceName || 'provider-staff-service';
  }

  /**
   * Log data access event
   */
  async logDataAccess(entry: AuditLogEntry): Promise<void> {
    try {
      const auditRecord = {
        service_name: this.serviceName,
        action: entry.action,
        resource_type: entry.resourceType,
        resource_id: entry.resourceId,
        user_id: entry.userId,
        timestamp: entry.timestamp.toISOString(),
        details: entry.details || {},
        ip_address: entry.ipAddress,
        user_agent: entry.userAgent,
        session_id: entry.sessionId,
        compliance_level: entry.details?.complianceLevel || 'hipaa',
        contains_phi: entry.details?.containsPHI || false,
        created_at: new Date().toISOString()
      };

      // Log to Supabase audit table
      const { error } = await this.supabase
        .from('audit_logs')
        .insert(auditRecord);

      if (error) {
        this.logger.error('Failed to write audit log to database', {
          error: error.message,
          action: entry.action,
          resourceType: entry.resourceType
        });
        
        // Fallback: Log to application logger
        this.logger.warn('AUDIT_LOG_FALLBACK', {
          ...auditRecord,
          fallback_reason: 'database_write_failed'
        });
      } else {
        this.logger.debug('Audit log written successfully', {
          action: entry.action,
          resourceType: entry.resourceType,
          resourceId: entry.resourceId
        });
      }

    } catch (error) {
      this.logger.error('Audit logging failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        action: entry.action,
        resourceType: entry.resourceType
      });

      // Critical: Always log audit failures
      this.logger.fatal('AUDIT_LOG_FAILURE', {
        action: entry.action,
        resourceType: entry.resourceType,
        resourceId: entry.resourceId,
        userId: entry.userId,
        timestamp: entry.timestamp.toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Log data modification event
   */
  async logDataModification(entry: AuditLogEntry): Promise<void> {
    await this.logDataAccess({
      ...entry,
      action: `MODIFY_${entry.action}`,
      details: {
        ...entry.details,
        modificationType: 'data_change',
        requiresReview: true
      }
    });
  }

  /**
   * Log security event
   */
  async logSecurityEvent(entry: AuditLogEntry): Promise<void> {
    await this.logDataAccess({
      ...entry,
      action: `SECURITY_${entry.action}`,
      details: {
        ...entry.details,
        securityLevel: 'high',
        requiresAlert: true
      }
    });
  }

  /**
   * Query audit logs
   */
  async queryAuditLogs(filters: {
    userId?: string;
    resourceType?: string;
    resourceId?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<AuditLogEntry[]> {
    try {
      let query = this.supabase
        .from('audit_logs')
        .select('*')
        .eq('service_name', this.serviceName);

      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }

      if (filters.resourceType) {
        query = query.eq('resource_type', filters.resourceType);
      }

      if (filters.resourceId) {
        query = query.eq('resource_id', filters.resourceId);
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

      query = query
        .order('timestamp', { ascending: false })
        .limit(filters.limit || 100);

      const { data, error } = await query;

      if (error) {
        this.logger.error('Failed to query audit logs', {
          error: error.message,
          filters
        });
        return [];
      }

      return (data || []).map(record => ({
        action: record.action,
        resourceType: record.resource_type,
        resourceId: record.resource_id,
        userId: record.user_id,
        timestamp: new Date(record.timestamp),
        details: record.details,
        ipAddress: record.ip_address,
        userAgent: record.user_agent,
        sessionId: record.session_id
      }));

    } catch (error) {
      this.logger.error('Error querying audit logs', {
        error: error instanceof Error ? error.message : 'Unknown error',
        filters
      });
      return [];
    }
  }

  /**
   * Get audit statistics
   */
  async getAuditStatistics(filters: {
    startDate?: Date;
    endDate?: Date;
  }): Promise<{
    totalEvents: number;
    eventsByAction: Record<string, number>;
    eventsByResourceType: Record<string, number>;
    securityEvents: number;
    phiAccessEvents: number;
  }> {
    try {
      let query = this.supabase
        .from('audit_logs')
        .select('action, resource_type, details')
        .eq('service_name', this.serviceName);

      if (filters.startDate) {
        query = query.gte('timestamp', filters.startDate.toISOString());
      }

      if (filters.endDate) {
        query = query.lte('timestamp', filters.endDate.toISOString());
      }

      const { data, error } = await query;

      if (error || !data) {
        this.logger.error('Failed to get audit statistics', {
          error: error?.message
        });
        return {
          totalEvents: 0,
          eventsByAction: {},
          eventsByResourceType: {},
          securityEvents: 0,
          phiAccessEvents: 0
        };
      }

      const eventsByAction: Record<string, number> = {};
      const eventsByResourceType: Record<string, number> = {};
      let securityEvents = 0;
      let phiAccessEvents = 0;

      data.forEach(record => {
        // Count by action
        eventsByAction[record.action] = (eventsByAction[record.action] || 0) + 1;

        // Count by resource type
        eventsByResourceType[record.resource_type] = 
          (eventsByResourceType[record.resource_type] || 0) + 1;

        // Count security events
        if (record.action.startsWith('SECURITY_')) {
          securityEvents++;
        }

        // Count PHI access events
        if (record.details?.containsPHI) {
          phiAccessEvents++;
        }
      });

      return {
        totalEvents: data.length,
        eventsByAction,
        eventsByResourceType,
        securityEvents,
        phiAccessEvents
      };

    } catch (error) {
      this.logger.error('Error getting audit statistics', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return {
        totalEvents: 0,
        eventsByAction: {},
        eventsByResourceType: {},
        securityEvents: 0,
        phiAccessEvents: 0
      };
    }
  }

  /**
   * Health check
   */
  async isHealthy(): Promise<boolean> {
    try {
      // Test database connection
      const { error } = await this.supabase
        .from('audit_logs')
        .select('id')
        .limit(1);

      return !error;
    } catch (error) {
      this.logger.error('Audit service health check failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }
}
