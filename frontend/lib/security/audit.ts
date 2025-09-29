/**
 * Audit Logging System
 * Comprehensive audit trail for security and compliance
 */

import { supabaseAdmin } from '@/lib/supabase/server'

export type AuditAction = 
  | 'user_register' | 'user_login' | 'user_logout' | 'user_login_failed'
  | 'profile_update' | 'profile_view' | 'role_change' | 'account_lock' | 'account_unlock'
  | 'invitation_create' | 'invitation_send' | 'invitation_accept' | 'invitation_revoke'
  | 'consent_grant' | 'consent_revoke' | 'consent_update'
  | 'document_upload' | 'document_view' | 'document_download' | 'document_delete'
  | 'mfa_enable' | 'mfa_disable' | 'mfa_verify' | 'mfa_backup_use'
  | 'password_change' | 'password_reset_request' | 'password_reset_complete'
  | 'session_create' | 'session_destroy' | 'session_expire'
  | 'admin_action' | 'data_export' | 'data_delete'

export type ResourceType = 
  | 'user' | 'profile' | 'invitation' | 'consent' | 'document' 
  | 'appointment' | 'medical_record' | 'payment' | 'session'

export type AuditSeverity = 'low' | 'info' | 'warning' | 'high' | 'critical'

export interface AuditLogEntry {
  actorId?: string // Who performed the action
  targetId?: string // Who was affected
  action: AuditAction
  resourceType: ResourceType
  resourceId?: string
  details?: Record<string, any>
  ipAddress?: string
  userAgent?: string
  sessionId?: string
  severity?: AuditSeverity
}

export interface AuditContext {
  ipAddress?: string
  userAgent?: string
  sessionId?: string
  requestId?: string
}

/**
 * Main audit logging class
 */
export class AuditLogger {
  /**
   * Log an audit event
   */
  static async log(entry: AuditLogEntry): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('audit_logs')
        .insert({
          actor_id: entry.actorId,
          target_id: entry.targetId,
          action: entry.action,
          resource_type: entry.resourceType,
          resource_id: entry.resourceId,
          details: entry.details || {},
          ip_address: entry.ipAddress,
          user_agent: entry.userAgent,
          session_id: entry.sessionId,
          severity: entry.severity || 'info'
        })

      if (error) {
        console.error('Failed to log audit event:', error)
        // Don't throw error to avoid breaking main functionality
      }
    } catch (error) {
      console.error('Audit logging error:', error)
    }
  }

  /**
   * Log user authentication events
   */
  static async logAuth(
    action: 'user_login' | 'user_logout' | 'user_login_failed',
    userId?: string,
    context?: AuditContext,
    details?: Record<string, any>
  ): Promise<void> {
    await this.log({
      actorId: userId,
      action,
      resourceType: 'user',
      resourceId: userId,
      details,
      severity: action === 'user_login_failed' ? 'warning' : 'info',
      ...context
    })
  }

  /**
   * Log user registration
   */
  static async logRegistration(
    userId: string,
    role: string,
    context?: AuditContext,
    details?: Record<string, any>
  ): Promise<void> {
    await this.log({
      actorId: userId,
      action: 'user_register',
      resourceType: 'user',
      resourceId: userId,
      details: { role, ...details },
      severity: 'info',
      ...context
    })
  }

  /**
   * Log profile changes
   */
  static async logProfileUpdate(
    actorId: string,
    targetId: string,
    changes: Record<string, any>,
    context?: AuditContext
  ): Promise<void> {
    await this.log({
      actorId,
      targetId,
      action: 'profile_update',
      resourceType: 'profile',
      resourceId: targetId,
      details: { changes },
      severity: 'info',
      ...context
    })
  }

  /**
   * Log role changes (high severity)
   */
  static async logRoleChange(
    actorId: string,
    targetId: string,
    oldRole: string,
    newRole: string,
    context?: AuditContext
  ): Promise<void> {
    await this.log({
      actorId,
      targetId,
      action: 'role_change',
      resourceType: 'user',
      resourceId: targetId,
      details: { oldRole, newRole },
      severity: 'high',
      ...context
    })
  }

  /**
   * Log invitation events
   */
  static async logInvitation(
    action: 'invitation_create' | 'invitation_send' | 'invitation_accept' | 'invitation_revoke',
    actorId: string,
    invitationId: string,
    details?: Record<string, any>,
    context?: AuditContext
  ): Promise<void> {
    await this.log({
      actorId,
      action,
      resourceType: 'invitation',
      resourceId: invitationId,
      details,
      severity: action === 'invitation_accept' ? 'info' : 'low',
      ...context
    })
  }

  /**
   * Log consent events (GDPR compliance)
   */
  static async logConsent(
    action: 'consent_grant' | 'consent_revoke' | 'consent_update',
    userId: string,
    consentType: string,
    context?: AuditContext,
    details?: Record<string, any>
  ): Promise<void> {
    await this.log({
      actorId: userId,
      action,
      resourceType: 'consent',
      resourceId: userId,
      details: { consentType, ...details },
      severity: 'info',
      ...context
    })
  }

  /**
   * Log document events
   */
  static async logDocument(
    action: 'document_upload' | 'document_view' | 'document_download' | 'document_delete',
    actorId: string,
    documentId: string,
    ownerId?: string,
    context?: AuditContext,
    details?: Record<string, any>
  ): Promise<void> {
    await this.log({
      actorId,
      targetId: ownerId,
      action,
      resourceType: 'document',
      resourceId: documentId,
      details,
      severity: action === 'document_delete' ? 'warning' : 'info',
      ...context
    })
  }

  /**
   * Log MFA events
   */
  static async logMFA(
    action: 'mfa_enable' | 'mfa_disable' | 'mfa_verify' | 'mfa_backup_use',
    userId: string,
    context?: AuditContext,
    details?: Record<string, any>
  ): Promise<void> {
    await this.log({
      actorId: userId,
      action,
      resourceType: 'user',
      resourceId: userId,
      details,
      severity: action === 'mfa_disable' ? 'warning' : 'info',
      ...context
    })
  }

  /**
   * Log password events
   */
  static async logPassword(
    action: 'password_change' | 'password_reset_request' | 'password_reset_complete',
    userId: string,
    context?: AuditContext,
    details?: Record<string, any>
  ): Promise<void> {
    await this.log({
      actorId: userId,
      action,
      resourceType: 'user',
      resourceId: userId,
      details,
      severity: 'info',
      ...context
    })
  }

  /**
   * Log admin actions (high severity)
   */
  static async logAdminAction(
    actorId: string,
    action: string,
    targetId?: string,
    resourceType: ResourceType = 'user',
    context?: AuditContext,
    details?: Record<string, any>
  ): Promise<void> {
    await this.log({
      actorId,
      targetId,
      action: 'admin_action',
      resourceType,
      resourceId: targetId,
      details: { adminAction: action, ...details },
      severity: 'high',
      ...context
    })
  }

  /**
   * Log security events (critical severity)
   */
  static async logSecurityEvent(
    action: AuditAction,
    actorId?: string,
    context?: AuditContext,
    details?: Record<string, any>
  ): Promise<void> {
    await this.log({
      actorId,
      action,
      resourceType: 'user',
      details,
      severity: 'critical',
      ...context
    })
  }
}

/**
 * Extract audit context from request
 */
export function extractAuditContext(request: Request): AuditContext {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip')
  
  return {
    ipAddress: forwarded?.split(',')[0] || realIp || cfConnectingIp || undefined,
    userAgent: request.headers.get('user-agent') || undefined,
    sessionId: request.headers.get('x-session-id') || undefined,
    requestId: request.headers.get('x-request-id') || undefined
  }
}

/**
 * Middleware to add audit context to requests
 */
export function withAuditContext(
  handler: (request: Request, context: AuditContext, ...args: any[]) => Promise<Response>
) {
  return async function (request: Request, ...args: any[]): Promise<Response> {
    const context = extractAuditContext(request)
    return handler(request, context, ...args)
  }
}

/**
 * Query audit logs with filters
 */
export async function queryAuditLogs(filters: {
  actorId?: string
  targetId?: string
  action?: AuditAction
  resourceType?: ResourceType
  severity?: AuditSeverity
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
}) {
  try {
    let query = supabaseAdmin
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })

    if (filters.actorId) {
      query = query.eq('actor_id', filters.actorId)
    }

    if (filters.targetId) {
      query = query.eq('target_id', filters.targetId)
    }

    if (filters.action) {
      query = query.eq('action', filters.action)
    }

    if (filters.resourceType) {
      query = query.eq('resource_type', filters.resourceType)
    }

    if (filters.severity) {
      query = query.eq('severity', filters.severity)
    }

    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate.toISOString())
    }

    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate.toISOString())
    }

    if (filters.limit) {
      query = query.limit(filters.limit)
    }

    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1)
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    return data
  } catch (error) {
    console.error('Error querying audit logs:', error)
    throw error
  }
}

/**
 * Get audit statistics
 */
export async function getAuditStats(timeframe: 'day' | 'week' | 'month' = 'day') {
  try {
    const now = new Date()
    let startDate: Date

    switch (timeframe) {
      case 'day':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        break
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
    }

    const { data, error } = await supabaseAdmin
      .from('audit_logs')
      .select('action, severity, created_at')
      .gte('created_at', startDate.toISOString())

    if (error) {
      throw error
    }

    // Process statistics
    const stats = {
      total: data.length,
      byAction: {} as Record<string, number>,
      bySeverity: {} as Record<string, number>,
      timeline: [] as Array<{ date: string; count: number }>
    }

    data.forEach(log => {
      // Count by action
      stats.byAction[log.action] = (stats.byAction[log.action] || 0) + 1
      
      // Count by severity
      stats.bySeverity[log.severity] = (stats.bySeverity[log.severity] || 0) + 1
    })

    return stats
  } catch (error) {
    console.error('Error getting audit stats:', error)
    throw error
  }
}

export default AuditLogger
