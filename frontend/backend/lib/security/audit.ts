/**
 * Audit Logging System
 * Tracks all security-related events and user actions
 */

export interface AuditLogEntry {
  id?: string
  actorId?: string // User who performed the action
  action: string // What action was performed
  resourceType?: string // Type of resource affected
  resourceId?: string // ID of the resource affected
  details?: Record<string, any> // Additional details
  severity: 'info' | 'warning' | 'error' | 'critical'
  timestamp?: Date
  ipAddress?: string
  userAgent?: string
  sessionId?: string
  success?: boolean
}

export interface AuditContext {
  ipAddress?: string
  userAgent?: string
  sessionId?: string
  timestamp: Date
}

class AuditLoggerService {
  private logs: AuditLogEntry[] = []
  private maxLogs = 10000 // Keep last 10k logs in memory

  async log(entry: AuditLogEntry): Promise<void> {
    const logEntry: AuditLogEntry = {
      id: this.generateId(),
      timestamp: new Date(),
      ...entry,
    }

    // Add to in-memory store
    this.logs.unshift(logEntry)
    
    // Keep only recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs)
    }

    // In production, you would also save to database
    // await this.saveToDatabase(logEntry)
    
    // Log to console for development
    console.log(`[AUDIT] ${logEntry.severity.toUpperCase()}: ${logEntry.action}`, {
      actorId: logEntry.actorId,
      resourceType: logEntry.resourceType,
      resourceId: logEntry.resourceId,
      details: logEntry.details,
      ipAddress: logEntry.ipAddress,
    })
  }

  async logSecurityEvent(
    action: string,
    actorId?: string,
    context?: AuditContext,
    details?: Record<string, any>
  ): Promise<void> {
    await this.log({
      actorId,
      action,
      resourceType: 'security',
      details,
      severity: 'warning',
      ...context,
    })
  }

  async logUserAction(
    action: string,
    actorId: string,
    resourceType?: string,
    resourceId?: string,
    details?: Record<string, any>,
    context?: AuditContext
  ): Promise<void> {
    await this.log({
      actorId,
      action,
      resourceType,
      resourceId,
      details,
      severity: 'info',
      success: true,
      ...context,
    })
  }

  async logError(
    action: string,
    error: Error | string,
    actorId?: string,
    context?: AuditContext,
    details?: Record<string, any>
  ): Promise<void> {
    await this.log({
      actorId,
      action,
      resourceType: 'error',
      details: {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        ...details,
      },
      severity: 'error',
      success: false,
      ...context,
    })
  }

  async getRecentLogs(limit = 100): Promise<AuditLogEntry[]> {
    return this.logs.slice(0, limit)
  }

  async getLogsByActor(actorId: string, limit = 100): Promise<AuditLogEntry[]> {
    return this.logs
      .filter(log => log.actorId === actorId)
      .slice(0, limit)
  }

  async getLogsByAction(action: string, limit = 100): Promise<AuditLogEntry[]> {
    return this.logs
      .filter(log => log.action === action)
      .slice(0, limit)
  }

  async getSecurityLogs(limit = 100): Promise<AuditLogEntry[]> {
    return this.logs
      .filter(log => log.severity === 'warning' || log.severity === 'error' || log.severity === 'critical')
      .slice(0, limit)
  }

  async getFailedLogins(limit = 50): Promise<AuditLogEntry[]> {
    return this.logs
      .filter(log => log.action === 'login_failed' || log.action === 'login_attempt')
      .slice(0, limit)
  }

  async getStats(): Promise<{
    totalLogs: number
    recentActivity: number
    securityEvents: number
    failedLogins: number
  }> {
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    
    const recentActivity = this.logs.filter(log => 
      log.timestamp && log.timestamp > oneHourAgo
    ).length
    
    const securityEvents = this.logs.filter(log => 
      log.severity === 'warning' || log.severity === 'error' || log.severity === 'critical'
    ).length
    
    const failedLogins = this.logs.filter(log => 
      log.action === 'login_failed'
    ).length

    return {
      totalLogs: this.logs.length,
      recentActivity,
      securityEvents,
      failedLogins,
    }
  }

  private generateId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // In production, implement database persistence
  // private async saveToDatabase(entry: AuditLogEntry): Promise<void> {
  //   // Save to Supabase or other database
  // }
}

// Singleton instance
export const AuditLogger = new AuditLoggerService()

// Helper function to extract audit context from request
export function extractAuditContext(request: Request): AuditContext {
  return {
    ipAddress: getClientIP(request),
    userAgent: request.headers.get('user-agent') || undefined,
    sessionId: extractSessionId(request),
    timestamp: new Date(),
  }
}

function getClientIP(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip')
  
  return forwardedFor?.split(',')[0]?.trim() || 
         realIp || 
         cfConnectingIp || 
         'unknown'
}

function extractSessionId(request: Request): string | undefined {
  // Try to extract session ID from cookies or headers
  const cookies = request.headers.get('cookie')
  if (cookies) {
    const sessionMatch = cookies.match(/session=([^;]+)/)
    if (sessionMatch) {
      return sessionMatch[1]
    }
  }
  return undefined
}

export default AuditLogger
