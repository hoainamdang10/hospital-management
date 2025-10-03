/**
 * ILogger - Application Service Interface
 * V2 Clean Architecture + DDD Implementation
 * Defines contract for logging operations
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, HIPAA
 */
/**
 * Logger Interface
 * Abstracts logging implementation from application logic
 */
export interface ILogger {
    /**
     * Log debug message
     * @param message Log message
     * @param meta Optional metadata
     */
    debug(message: string, meta?: any): void;
    /**
     * Log info message
     * @param message Log message
     * @param meta Optional metadata
     */
    info(message: string, meta?: any): void;
    /**
     * Log warning message
     * @param message Log message
     * @param meta Optional metadata
     */
    warn(message: string, meta?: any): void;
    /**
     * Log error message
     * @param message Log message
     * @param meta Optional metadata
     */
    error(message: string, meta?: any): void;
    /**
     * Log fatal error message
     * @param message Log message
     * @param meta Optional metadata
     */
    fatal(message: string, meta?: any): void;
}
//# sourceMappingURL=ILogger.d.ts.map