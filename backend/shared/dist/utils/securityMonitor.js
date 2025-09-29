"use strict";
/**
 * Security Monitor - Real-time Security Event Monitoring
 * Hospital Management System
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.securityMonitor = exports.SecurityMonitor = exports.SecuritySeverity = exports.SecurityEventType = void 0;
const logger_1 = __importDefault(require("./logger"));
var SecurityEventType;
(function (SecurityEventType) {
    SecurityEventType["AUTHENTICATION_FAILURE"] = "auth_failure";
    SecurityEventType["AUTHORIZATION_FAILURE"] = "authz_failure";
    SecurityEventType["SUSPICIOUS_ACTIVITY"] = "suspicious_activity";
    SecurityEventType["KEY_COMPROMISE"] = "key_compromise";
    SecurityEventType["RATE_LIMIT_EXCEEDED"] = "rate_limit_exceeded";
    SecurityEventType["INVALID_TOKEN"] = "invalid_token";
    SecurityEventType["BRUTE_FORCE_ATTEMPT"] = "brute_force_attempt";
    SecurityEventType["DATA_ACCESS_VIOLATION"] = "data_access_violation";
    SecurityEventType["CONFIGURATION_ERROR"] = "config_error";
    SecurityEventType["SECURITY_SCAN_DETECTED"] = "security_scan_detected";
})(SecurityEventType || (exports.SecurityEventType = SecurityEventType = {}));
var SecuritySeverity;
(function (SecuritySeverity) {
    SecuritySeverity["LOW"] = "low";
    SecuritySeverity["MEDIUM"] = "medium";
    SecuritySeverity["HIGH"] = "high";
    SecuritySeverity["CRITICAL"] = "critical";
})(SecuritySeverity || (exports.SecuritySeverity = SecuritySeverity = {}));
class SecurityMonitor {
    constructor() {
        this.eventBuffer = [];
        this.MAX_BUFFER_SIZE = 1000;
        this.ALERT_THRESHOLDS = {
            [SecurityEventType.AUTHENTICATION_FAILURE]: 5, // 5 failures in window
            [SecurityEventType.AUTHORIZATION_FAILURE]: 10, // 10 authz failures in window
            [SecurityEventType.SUSPICIOUS_ACTIVITY]: 3, // 3 suspicious activities
            [SecurityEventType.KEY_COMPROMISE]: 1,
            [SecurityEventType.RATE_LIMIT_EXCEEDED]: 3,
            [SecurityEventType.INVALID_TOKEN]: 5, // 5 invalid tokens
            [SecurityEventType.BRUTE_FORCE_ATTEMPT]: 1,
            [SecurityEventType.DATA_ACCESS_VIOLATION]: 2, // 2 data access violations
            [SecurityEventType.CONFIGURATION_ERROR]: 5, // 5 config errors
            [SecurityEventType.SECURITY_SCAN_DETECTED]: 1, // 1 security scan
        };
        // Start periodic cleanup
        setInterval(() => this.cleanupOldEvents(), 60000); // Every minute
    }
    static getInstance() {
        if (!SecurityMonitor.instance) {
            SecurityMonitor.instance = new SecurityMonitor();
        }
        return SecurityMonitor.instance;
    }
    /**
     * Log a security event
     */
    logSecurityEvent(type, severity, message, details = {}, context) {
        const event = {
            type,
            severity,
            message,
            details,
            timestamp: new Date(),
            service: process.env.SERVICE_NAME || "unknown",
            userId: context?.userId,
            ip: context?.ip,
            userAgent: context?.userAgent,
        };
        // Add to buffer
        this.addToBuffer(event);
        // Log based on severity
        this.logEvent(event);
        // Check for alerts
        this.checkAlertThresholds(type);
        // Send to external monitoring if configured
        this.sendToExternalMonitoring(event);
    }
    /**
     * Log authentication failure
     */
    logAuthFailure(email, reason, context) {
        this.logSecurityEvent(SecurityEventType.AUTHENTICATION_FAILURE, SecuritySeverity.MEDIUM, `Authentication failed for ${email}`, { email, reason, ...context });
    }
    /**
     * Log authorization failure
     */
    logAuthzFailure(userId, resource, action, context) {
        this.logSecurityEvent(SecurityEventType.AUTHORIZATION_FAILURE, SecuritySeverity.MEDIUM, `Authorization failed: User ${userId} attempted ${action} on ${resource}`, { userId, resource, action, ...context });
    }
    /**
     * Log suspicious activity
     */
    logSuspiciousActivity(description, details, context) {
        this.logSecurityEvent(SecurityEventType.SUSPICIOUS_ACTIVITY, SecuritySeverity.HIGH, `Suspicious activity detected: ${description}`, { ...details, ...context });
    }
    /**
     * Log potential key compromise
     */
    logKeyCompromise(keyType, details) {
        this.logSecurityEvent(SecurityEventType.KEY_COMPROMISE, SecuritySeverity.CRITICAL, `Potential key compromise detected: ${keyType}`, { keyType, ...details });
    }
    /**
     * Log rate limit exceeded
     */
    logRateLimitExceeded(identifier, limit, current, context) {
        this.logSecurityEvent(SecurityEventType.RATE_LIMIT_EXCEEDED, SecuritySeverity.MEDIUM, `Rate limit exceeded for ${identifier}`, { identifier, limit, current, ...context });
    }
    /**
     * Log invalid token usage
     */
    logInvalidToken(tokenType, reason, context) {
        this.logSecurityEvent(SecurityEventType.INVALID_TOKEN, SecuritySeverity.MEDIUM, `Invalid ${tokenType} token: ${reason}`, { tokenType, reason, ...context });
    }
    /**
     * Log brute force attempt
     */
    logBruteForceAttempt(target, attemptCount, context) {
        this.logSecurityEvent(SecurityEventType.BRUTE_FORCE_ATTEMPT, SecuritySeverity.HIGH, `Brute force attempt detected against ${target}`, { target, attemptCount, ...context });
    }
    /**
     * Get recent security events
     */
    getRecentEvents(limit = 100) {
        return this.eventBuffer
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, limit);
    }
    /**
     * Get events by type
     */
    getEventsByType(type, hours = 24) {
        const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
        return this.eventBuffer.filter((event) => event.type === type && event.timestamp > cutoff);
    }
    /**
     * Get security statistics
     */
    getSecurityStats(hours = 24) {
        const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
        const recentEvents = this.eventBuffer.filter((event) => event.timestamp > cutoff);
        const stats = {
            totalEvents: recentEvents.length,
            eventsByType: {},
            eventsBySeverity: {},
            topTargets: {},
            timeRange: { start: cutoff, end: new Date() },
        };
        recentEvents.forEach((event) => {
            // Count by type
            stats.eventsByType[event.type] =
                (stats.eventsByType[event.type] || 0) + 1;
            // Count by severity
            stats.eventsBySeverity[event.severity] =
                (stats.eventsBySeverity[event.severity] || 0) + 1;
            // Count targets (IP addresses, user IDs, etc.)
            const target = event.ip || event.userId || "unknown";
            stats.topTargets[target] = (stats.topTargets[target] || 0) + 1;
        });
        return stats;
    }
    /**
     * Add event to buffer
     */
    addToBuffer(event) {
        this.eventBuffer.push(event);
        // Keep buffer size manageable
        if (this.eventBuffer.length > this.MAX_BUFFER_SIZE) {
            this.eventBuffer = this.eventBuffer.slice(-this.MAX_BUFFER_SIZE);
        }
    }
    /**
     * Log event based on severity
     */
    logEvent(event) {
        const logData = {
            type: event.type,
            severity: event.severity,
            service: event.service,
            userId: event.userId,
            ip: event.ip,
            details: event.details,
        };
        switch (event.severity) {
            case SecuritySeverity.CRITICAL:
                logger_1.default.error(`🚨 CRITICAL SECURITY EVENT: ${event.message}`, logData);
                break;
            case SecuritySeverity.HIGH:
                logger_1.default.error(`🔴 HIGH SECURITY EVENT: ${event.message}`, logData);
                break;
            case SecuritySeverity.MEDIUM:
                logger_1.default.warn(`🟡 MEDIUM SECURITY EVENT: ${event.message}`, logData);
                break;
            case SecuritySeverity.LOW:
                logger_1.default.info(`🟢 LOW SECURITY EVENT: ${event.message}`, logData);
                break;
        }
    }
    /**
     * Check if alert thresholds are exceeded
     */
    checkAlertThresholds(type) {
        const threshold = this.ALERT_THRESHOLDS[type];
        if (!threshold)
            return;
        const recentEvents = this.getEventsByType(type, 1); // Last hour
        if (recentEvents.length >= threshold) {
            this.triggerAlert(type, recentEvents.length, threshold);
        }
    }
    /**
     * Trigger security alert
     */
    triggerAlert(type, count, threshold) {
        const alertMessage = `🚨 SECURITY ALERT: ${type} threshold exceeded (${count}/${threshold})`;
        logger_1.default.error(alertMessage, {
            eventType: type,
            count,
            threshold,
            timeWindow: "1 hour",
        });
        // Here you could integrate with external alerting systems
        // - Slack notifications
        // - Email alerts
        // - PagerDuty
        // - Discord webhooks
        this.sendAlert(alertMessage, { type, count, threshold });
    }
    /**
     * Send alert to external systems
     */
    async sendAlert(message, details) {
        // Implementation for external alerting
        // This is where you'd integrate with your alerting systems
        if (process.env.NODE_ENV === "production") {
            // Example: Send to Slack, Discord, email, etc.
            logger_1.default.info("📢 Alert would be sent to external systems", {
                message,
                details,
            });
        }
    }
    /**
     * Send to external monitoring systems
     */
    sendToExternalMonitoring(event) {
        // Integration with external monitoring systems
        // - Sentry
        // - DataDog
        // - New Relic
        // - Custom monitoring endpoints
        if (process.env.SENTRY_DSN &&
            event.severity === SecuritySeverity.CRITICAL) {
            // Example Sentry integration
            logger_1.default.info("📊 Event would be sent to Sentry", { event });
        }
    }
    /**
     * Clean up old events from buffer
     */
    cleanupOldEvents() {
        const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours
        this.eventBuffer = this.eventBuffer.filter((event) => event.timestamp > cutoff);
    }
}
exports.SecurityMonitor = SecurityMonitor;
// Export singleton instance
exports.securityMonitor = SecurityMonitor.getInstance();
exports.default = exports.securityMonitor;
//# sourceMappingURL=securityMonitor.js.map