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
 * Logger metadata type
 * Can contain any serializable data for logging context
 */
export type LogMetadata = Record<string, unknown> | Error;

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
  debug(message: string, meta?: LogMetadata): void;

  /**
   * Log info message
   * @param message Log message
   * @param meta Optional metadata
   */
  info(message: string, meta?: LogMetadata): void;

  /**
   * Log warning message
   * @param message Log message
   * @param meta Optional metadata
   */
  warn(message: string, meta?: LogMetadata): void;

  /**
   * Log error message
   * @param message Log message
   * @param meta Optional metadata
   */
  error(message: string, meta?: LogMetadata): void;

  /**
   * Log fatal error message
   * @param message Log message
   * @param meta Optional metadata
   */
  fatal(message: string, meta?: LogMetadata): void;

  /**
   * Create child logger with additional context
   * Used for request-scoped logging with requestId
   * @param bindings Additional context to include in all logs
   */
  child?(bindings: Record<string, unknown>): ILogger;
}

