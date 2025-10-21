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
export class ConsoleLogger implements ILogger {
  constructor(private serviceName: string = 'Unknown') {}

  debug(message: string, meta?: LogMetadata): void {
    this.log('debug', message, meta);
  }

  info(message: string, meta?: LogMetadata): void {
    this.log('info', message, meta);
  }

  warn(message: string, meta?: LogMetadata): void {
    this.log('warn', message, meta);
  }

  error(message: string, meta?: LogMetadata): void {
    this.log('error', message, meta);
  }

  fatal(message: string, meta?: LogMetadata): void {
    this.log('fatal', message, meta);
  }

  log(level: LogLevel, message: string, meta?: LogMetadata): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${this.serviceName}] [${level.toUpperCase()}] ${message}`;
    
    const consoleMethod = level === 'fatal' || level === 'error' ? 'error' : 
                          level === 'warn' ? 'warn' : 
                          level === 'debug' ? 'debug' : 'log';
    
    if (meta && Object.keys(meta).length > 0) {
      console[consoleMethod](logMessage, meta);
    } else {
      console[consoleMethod](logMessage);
    }
  }
}

