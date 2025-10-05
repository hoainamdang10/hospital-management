/**
 * Logger Interface
 * Standard logging interface for all services
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
export type LogMetadata = Record<string, unknown>;
export interface ILogger {
    /**
     * Debug level logging (development only)
     */
    debug(message: string, meta?: LogMetadata): void;
    /**
     * Info level logging
     */
    info(message: string, meta?: LogMetadata): void;
    /**
     * Warning level logging
     */
    warn(message: string, meta?: LogMetadata): void;
    /**
     * Error level logging
     */
    error(message: string, meta?: LogMetadata): void;
    /**
     * Fatal level logging (critical errors)
     */
    fatal(message: string, meta?: LogMetadata): void;
}
/**
 * Console Logger Implementation
 * Simple logger for development/testing
 */
export declare class ConsoleLogger implements ILogger {
    private serviceName;
    constructor(serviceName?: string);
    debug(message: string, meta?: LogMetadata): void;
    info(message: string, meta?: LogMetadata): void;
    warn(message: string, meta?: LogMetadata): void;
    error(message: string, meta?: LogMetadata): void;
    fatal(message: string, meta?: LogMetadata): void;
}
//# sourceMappingURL=logger.interface.d.ts.map