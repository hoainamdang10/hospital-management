/**
 * Logger implementation for Clinical EMR Service
 * Provides consistent logging across the service
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

class ConsoleLogger implements ILogger {
  private serviceName = 'clinical-emr-service';

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

export const logger: ILogger = new ConsoleLogger();

