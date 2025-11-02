/**
 * Structured Logger
 * Provides structured logging with correlation IDs
 * 
 * @author Hospital Management Team
 * @version 1.0.0
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
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
export class Logger {
  private serviceName: string;
  private minLevel: LogLevel;

  constructor(serviceName: string, minLevel: LogLevel = LogLevel.INFO) {
    this.serviceName = serviceName;
    this.minLevel = minLevel;
  }

  /**
   * Log debug message
   */
  debug(message: string, context?: LogContext, metadata?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context, metadata);
  }

  /**
   * Log info message
   */
  info(message: string, context?: LogContext, metadata?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context, metadata);
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: LogContext, metadata?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context, metadata);
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error, context?: LogContext, metadata?: Record<string, any>): void {
    const errorInfo = error ? {
      message: error.message,
      stack: error.stack,
      code: (error as any).code,
    } : undefined;

    this.log(LogLevel.ERROR, message, context, metadata, errorInfo);
  }

  /**
   * Core logging method
   */
  private log(
    level: LogLevel,
    message: string,
    context?: LogContext,
    metadata?: Record<string, any>,
    error?: { message: string; stack?: string; code?: string }
  ): void {
    // Check if we should log this level
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: context ? { ...context, service: this.serviceName } : { service: this.serviceName },
      metadata,
      error,
    };

    // Output to console (in production, this would go to a logging service)
    const output = JSON.stringify(entry);

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(output);
        break;
      case LogLevel.INFO:
        console.info(output);
        break;
      case LogLevel.WARN:
        console.warn(output);
        break;
      case LogLevel.ERROR:
        console.error(output);
        break;
    }
  }

  /**
   * Check if we should log this level
   */
  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    const currentLevelIndex = levels.indexOf(this.minLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  /**
   * Create child logger with additional context
   */
  child(context: LogContext): Logger {
    const childLogger = new Logger(this.serviceName, this.minLevel);
    // Store context for child logger
    (childLogger as any).defaultContext = context;
    return childLogger;
  }
}

/**
 * Create logger instance
 */
export function createLogger(serviceName: string, level?: string): Logger {
  const logLevel = level ? (level.toLowerCase() as LogLevel) : LogLevel.INFO;
  return new Logger(serviceName, logLevel);
}

/**
 * Generate correlation ID
 */
export function generateCorrelationId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

