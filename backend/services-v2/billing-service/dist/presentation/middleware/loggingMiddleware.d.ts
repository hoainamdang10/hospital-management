/**
 * loggingMiddleware - Presentation Layer
 * Request/Response logging middleware for billing service
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Audit Logging, HIPAA Compliance, Security Monitoring
 */
import { Request, Response, NextFunction } from 'express';
export interface LogContext {
    requestId: string;
    correlationId: string;
    userId?: string;
    userRole?: string;
    ipAddress: string;
    userAgent: string;
    method: string;
    path: string;
    query: any;
    timestamp: string;
    responseTime?: number;
    statusCode?: number;
    errorCode?: string;
    errorMessage?: string;
}
/**
 * Enhanced request interface with logging context
 */
export interface LoggedRequest extends Request {
    logContext?: LogContext;
    startTime?: number;
}
/**
 * Redact sensitive information from objects
 */
declare const redactSensitiveData: (obj: any, depth?: number) => any;
/**
 * Create log context from request
 */
declare const createLogContext: (req: LoggedRequest) => LogContext;
/**
 * Check if path contains sensitive data
 */
declare const isSensitivePath: (path: string) => boolean;
/**
 * Format log message for different log levels
 */
declare const formatLogMessage: (level: "info" | "warn" | "error", message: string, context: LogContext, extra?: any) => string;
/**
 * Main logging middleware
 */
export declare const loggingMiddleware: (req: LoggedRequest, res: Response, next: NextFunction) => void;
/**
 * Error logging middleware
 */
export declare const errorLoggingMiddleware: (err: any, req: LoggedRequest, res: Response, next: NextFunction) => void;
/**
 * Audit logging for sensitive operations
 */
export declare const auditLog: (action: string, req: LoggedRequest, additionalData?: any) => void;
/**
 * Security event logging
 */
export declare const securityLog: (event: string, req: LoggedRequest, severity: "low" | "medium" | "high" | "critical", details?: any) => void;
/**
 * Performance logging
 */
export declare const performanceLog: (operation: string, duration: number, req: LoggedRequest, metadata?: any) => void;
export { redactSensitiveData, createLogContext, isSensitivePath, formatLogMessage, errorLoggingMiddleware, auditLog, securityLog, performanceLog };
//# sourceMappingURL=loggingMiddleware.d.ts.map