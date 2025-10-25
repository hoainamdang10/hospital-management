/**
 * Logger Interface - Shared Infrastructure
 * Defines the contract for logging across all services
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

export interface LogMetadata {
  [key: string]: any;
}

export interface ILogger {
  info(message: string, metadata?: LogMetadata): void;
  warn(message: string, metadata?: LogMetadata): void;
  error(message: string, metadata?: LogMetadata): void;
  debug(message: string, metadata?: LogMetadata): void;
}
