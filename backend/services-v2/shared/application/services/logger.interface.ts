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
export class ConsoleLogger implements ILogger {
  constructor(private serviceName: string = 'service') {}

  debug(message: string, meta: LogMetadata = {}): void {
    console.log(`[DEBUG] [${this.serviceName}] ${new Date().toISOString()} - ${message}`, Object.keys(meta).length ? meta : '');
  }

  info(message: string, meta: LogMetadata = {}): void {
    console.log(`[INFO] [${this.serviceName}] ${new Date().toISOString()} - ${message}`, Object.keys(meta).length ? meta : '');
  }

  warn(message: string, meta: LogMetadata = {}): void {
    console.warn(`[WARN] [${this.serviceName}] ${new Date().toISOString()} - ${message}`, Object.keys(meta).length ? meta : '');
  }

  error(message: string, meta: LogMetadata = {}): void {
    console.error(`[ERROR] [${this.serviceName}] ${new Date().toISOString()} - ${message}`, Object.keys(meta).length ? meta : '');
  }

  fatal(message: string, meta: LogMetadata = {}): void {
    console.error(`[FATAL] [${this.serviceName}] ${new Date().toISOString()} - ${message}`, Object.keys(meta).length ? meta : '');
  }
}
