/**
 * Logger Interface
 * Standard logging interface for all services
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
export interface ILogger {
    /**
     * Debug level logging (development only)
     */
    debug(message: string, meta?: any): void;
    /**
     * Info level logging
     */
    info(message: string, meta?: any): void;
    /**
     * Warning level logging
     */
    warn(message: string, meta?: any): void;
    /**
     * Error level logging
     */
    error(message: string, meta?: any): void;
    /**
     * Fatal level logging (critical errors)
     */
    fatal(message: string, meta?: any): void;
}
/**
 * Console Logger Implementation
 * Simple logger for development/testing
 */
export declare class ConsoleLogger implements ILogger {
    private serviceName;
    constructor(serviceName?: string);
    debug(message: string, meta?: any): void;
    info(message: string, meta?: any): void;
    warn(message: string, meta?: any): void;
    error(message: string, meta?: any): void;
    fatal(message: string, meta?: any): void;
}
//# sourceMappingURL=logger.interface.d.ts.map