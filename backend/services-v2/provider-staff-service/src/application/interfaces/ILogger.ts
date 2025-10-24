/**
 * ILogger Interface - Application Layer
 * V2 Clean Architecture + DDD Implementation
 * Logger interface for provider-staff-service
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Production-Ready Logging
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogMetadata {
  [key: string]: any;
}

export interface ILogger {
  debug(message: string, meta?: LogMetadata): void;
  info(message: string, meta?: LogMetadata): void;
  warn(message: string, meta?: LogMetadata): void;
  error(message: string, meta?: LogMetadata): void;
  fatal(message: string, meta?: LogMetadata): void;
  log(level: LogLevel, message: string, meta?: LogMetadata): void;
}

