/**
 * Shared Logger for V2 Services
 * Provides consistent logging across all services
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

export interface LogMetadata {
  [key: string]: any;
}

class ConsoleLogger {
  private serviceName: string;

  constructor(serviceName: string = 'hospital-service') {
    this.serviceName = serviceName;
  }

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

const logger = new ConsoleLogger();
export default logger;

