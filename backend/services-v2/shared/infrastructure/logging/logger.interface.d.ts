/**
 * Logger Interface
 * Hospital Management System V2
 *
 * Standard logging interface for all services
 */
/**
 * Log Level
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';
/**
 * Log Metadata
 */
export interface LogMetadata {
    [key: string]: any;
}
/**
 * Logger Interface
 * Implement this interface to create custom loggers
 */
export interface ILogger {
    /**
     * Log debug message
     */
    debug(message: string, meta?: LogMetadata): void;
    /**
     * Log info message
     */
    info(message: string, meta?: LogMetadata): void;
    /**
     * Log warning message
     */
    warn(message: string, meta?: LogMetadata): void;
    /**
     * Log error message
     */
    error(message: string, meta?: LogMetadata): void;
    /**
     * Log fatal error message
     */
    fatal(message: string, meta?: LogMetadata): void;
    /**
     * Log with custom level
     */
    log(level: LogLevel, message: string, meta?: LogMetadata): void;
}
/**
 * Console Logger Implementation
 * Simple logger that outputs to console
 */
export declare class ConsoleLogger implements ILogger {
    private serviceName;
    constructor(serviceName?: string);
    debug(message: string, meta?: LogMetadata): void;
    info(message: string, meta?: LogMetadata): void;
    warn(message: string, meta?: LogMetadata): void;
    error(message: string, meta?: LogMetadata): void;
    fatal(message: string, meta?: LogMetadata): void;
    log(level: LogLevel, message: string, meta?: LogMetadata): void;
}
//# sourceMappingURL=logger.interface.d.ts.map