/**
 * Structured Logger
 * Provides structured logging with correlation IDs
 *
 * @author Hospital Management Team
 * @version 1.0.0
 */
export declare enum LogLevel {
    DEBUG = "debug",
    INFO = "info",
    WARN = "warn",
    ERROR = "error"
}
export interface LogContext {
    correlationId?: string;
    userId?: string;
    tenantId?: string;
    requestId?: string;
    [key: string]: any;
}
export interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    context?: LogContext;
    error?: {
        message: string;
        stack?: string;
        code?: string;
    };
    metadata?: Record<string, any>;
}
/**
 * Structured Logger
 */
export declare class Logger {
    private serviceName;
    private minLevel;
    constructor(serviceName: string, minLevel?: LogLevel);
    /**
     * Log debug message
     */
    debug(message: string, context?: LogContext, metadata?: Record<string, any>): void;
    /**
     * Log info message
     */
    info(message: string, context?: LogContext, metadata?: Record<string, any>): void;
    /**
     * Log warning message
     */
    warn(message: string, context?: LogContext, metadata?: Record<string, any>): void;
    /**
     * Log error message
     */
    error(message: string, error?: Error, context?: LogContext, metadata?: Record<string, any>): void;
    /**
     * Core logging method
     */
    private log;
    /**
     * Check if we should log this level
     */
    private shouldLog;
    /**
     * Create child logger with additional context
     */
    child(context: LogContext): Logger;
}
/**
 * Create logger instance
 */
export declare function createLogger(serviceName: string, level?: string): Logger;
/**
 * Generate correlation ID
 */
export declare function generateCorrelationId(): string;
//# sourceMappingURL=Logger.d.ts.map