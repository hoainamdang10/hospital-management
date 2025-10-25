/**
 * Logger Factory
 * Creates and configures production-ready Pino logger
 * 
 * Features:
 * - Singleton pattern for consistent logging
 * - Environment-based log levels
 * - JSON output in production, pretty print in development
 * - Sensitive data redaction
 * - Request correlation with child loggers
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Production-Ready, HIPAA-Compliant
 */

import { ILogger } from '../application/services/ILogger';
import { createProductionLogger } from '../infrastructure/logging/PinoLogger';
import { AppConfig } from './config';

/**
 * Logger instance (singleton)
 */
let loggerInstance: ILogger | null = null;

/**
 * Create logger instance
 * Returns singleton instance if already created
 * 
 * @param config Application configuration
 * @returns ILogger instance
 */
export function createLogger(config: AppConfig): ILogger {
  if (loggerInstance) {
    return loggerInstance;
  }

  // Create Pino logger with service name
  loggerInstance = createProductionLogger(config.serviceName);

  loggerInstance.info('Logger initialized', {
    serviceName: config.serviceName,
    version: config.version,
    logLevel: config.logLevel,
    nodeEnv: config.nodeEnv
  });

  return loggerInstance;
}

/**
 * Get existing logger instance
 * Throws error if logger not initialized
 * 
 * @returns ILogger instance
 */
export function getLogger(): ILogger {
  if (!loggerInstance) {
    throw new Error('Logger not initialized. Call createLogger() first.');
  }
  return loggerInstance;
}

/**
 * Reset logger instance (for testing)
 */
export function resetLogger(): void {
  loggerInstance = null;
}
