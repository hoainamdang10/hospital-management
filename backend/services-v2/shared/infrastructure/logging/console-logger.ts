/**
 * Console Logger Implementation - Shared Infrastructure
 * Standard console-based logger for all services
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { ILogger, LogMetadata } from './logger.interface';

export class ConsoleLogger implements ILogger {
  constructor(private serviceName: string = 'hospital-service') {}

  info(message: string, metadata?: LogMetadata): void {
    console.log(`[${this.serviceName}] INFO:`, message, metadata || '');
  }

  warn(message: string, metadata?: LogMetadata): void {
    console.warn(`[${this.serviceName}] WARN:`, message, metadata || '');
  }

  error(message: string, metadata?: LogMetadata): void {
    console.error(`[${this.serviceName}] ERROR:`, message, metadata || '');
  }

  debug(message: string, metadata?: LogMetadata): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[${this.serviceName}] DEBUG:`, message, metadata || '');
    }
  }
}

