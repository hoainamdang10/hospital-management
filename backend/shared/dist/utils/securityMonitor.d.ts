/**
 * Security Monitor - Real-time Security Event Monitoring
 * Hospital Management System
 */
export interface SecurityEvent {
    type: SecurityEventType;
    severity: SecuritySeverity;
    message: string;
    details: any;
    timestamp: Date;
    service: string;
    userId?: string;
    ip?: string;
    userAgent?: string;
}
export declare enum SecurityEventType {
    AUTHENTICATION_FAILURE = "auth_failure",
    AUTHORIZATION_FAILURE = "authz_failure",
    SUSPICIOUS_ACTIVITY = "suspicious_activity",
    KEY_COMPROMISE = "key_compromise",
    RATE_LIMIT_EXCEEDED = "rate_limit_exceeded",
    INVALID_TOKEN = "invalid_token",
    BRUTE_FORCE_ATTEMPT = "brute_force_attempt",
    DATA_ACCESS_VIOLATION = "data_access_violation",
    CONFIGURATION_ERROR = "config_error",
    SECURITY_SCAN_DETECTED = "security_scan_detected"
}
export declare enum SecuritySeverity {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
export declare class SecurityMonitor {
    private static instance;
    private eventBuffer;
    private readonly MAX_BUFFER_SIZE;
    private readonly ALERT_THRESHOLDS;
    private constructor();
    static getInstance(): SecurityMonitor;
    /**
     * Log a security event
     */
    logSecurityEvent(type: SecurityEventType, severity: SecuritySeverity, message: string, details?: any, context?: {
        userId?: string;
        ip?: string;
        userAgent?: string;
    }): void;
    /**
     * Log authentication failure
     */
    logAuthFailure(email: string, reason: string, context?: any): void;
    /**
     * Log authorization failure
     */
    logAuthzFailure(userId: string, resource: string, action: string, context?: any): void;
    /**
     * Log suspicious activity
     */
    logSuspiciousActivity(description: string, details: any, context?: any): void;
    /**
     * Log potential key compromise
     */
    logKeyCompromise(keyType: string, details: any): void;
    /**
     * Log rate limit exceeded
     */
    logRateLimitExceeded(identifier: string, limit: number, current: number, context?: any): void;
    /**
     * Log invalid token usage
     */
    logInvalidToken(tokenType: string, reason: string, context?: any): void;
    /**
     * Log brute force attempt
     */
    logBruteForceAttempt(target: string, attemptCount: number, context?: any): void;
    /**
     * Get recent security events
     */
    getRecentEvents(limit?: number): SecurityEvent[];
    /**
     * Get events by type
     */
    getEventsByType(type: SecurityEventType, hours?: number): SecurityEvent[];
    /**
     * Get security statistics
     */
    getSecurityStats(hours?: number): any;
    /**
     * Add event to buffer
     */
    private addToBuffer;
    /**
     * Log event based on severity
     */
    private logEvent;
    /**
     * Check if alert thresholds are exceeded
     */
    private checkAlertThresholds;
    /**
     * Trigger security alert
     */
    private triggerAlert;
    /**
     * Send alert to external systems
     */
    private sendAlert;
    /**
     * Send to external monitoring systems
     */
    private sendToExternalMonitoring;
    /**
     * Clean up old events from buffer
     */
    private cleanupOldEvents;
}
export declare const securityMonitor: SecurityMonitor;
export default securityMonitor;
//# sourceMappingURL=securityMonitor.d.ts.map