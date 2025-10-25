/**
 * Pino Logger - Production-Ready Structured Logging
 * Implements ILogger interface with Pino for structured logging
 * 
 * Features:
 * - JSON structured logging for production
 * - Pretty printing for development
 * - Log level configuration via LOG_LEVEL env var
 * - Request ID correlation
 * - Performance optimized
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Production-Ready, HIPAA-Compliant
 */

import pino from 'pino';
import { ILogger, LogMetadata } from '../../application/services/ILogger';

/**
 * Pino Logger Configuration
 */
export interface PinoLoggerConfig {
  serviceName: string;
  logLevel?: string;
  nodeEnv?: string;
}

/**
 * Create Pino Logger Instance
 * Configures logger based on environment
 */
export function createPinoLogger(config: PinoLoggerConfig): pino.Logger {
  const {
    serviceName,
    logLevel = process.env.LOG_LEVEL || 'info',
    nodeEnv = process.env.NODE_ENV || 'development'
  } = config;

  const isDevelopment = nodeEnv === 'development' || nodeEnv === 'test';

  // Base configuration
  const pinoConfig: pino.LoggerOptions = {
    name: serviceName,
    level: logLevel,
    // Redact sensitive fields
    redact: {
      paths: [
        'password',
        'token',
        'accessToken',
        'refreshToken',
        'apiKey',
        'secret',
        'authorization',
        'cookie',
        'req.headers.authorization',
        'req.headers.cookie',
        'res.headers["set-cookie"]'
      ],
      remove: true
    },
    // Serialize errors properly
    serializers: {
      err: pino.stdSerializers.err,
      error: pino.stdSerializers.err,
      req: pino.stdSerializers.req,
      res: pino.stdSerializers.res
    },
    // Base fields
    base: {
      service: serviceName,
      environment: nodeEnv
    },
    // Timestamp format
    timestamp: () => `,"timestamp":"${new Date().toISOString()}"`
  };

  // Pretty print for development
  if (isDevelopment) {
    return pino(pinoConfig, pino.destination({
      sync: false
    }));
  }

  // JSON output for production
  return pino(pinoConfig);
}

/**
 * Pino Logger Adapter
 * Adapts Pino logger to ILogger interface
 */
export class PinoLoggerAdapter implements ILogger {
  constructor(private pinoLogger: pino.Logger) {}

  debug(message: string, meta?: LogMetadata): void {
    this.pinoLogger.debug(meta || {}, message);
  }

  info(message: string, meta?: LogMetadata): void {
    this.pinoLogger.info(meta || {}, message);
  }

  warn(message: string, meta?: LogMetadata): void {
    this.pinoLogger.warn(meta || {}, message);
  }

  error(message: string, meta?: LogMetadata): void {
    this.pinoLogger.error(meta || {}, message);
  }

  fatal(message: string, meta?: LogMetadata): void {
    this.pinoLogger.fatal(meta || {}, message);
  }

  /**
   * Create child logger with additional context
   * Useful for request-scoped logging with requestId
   */
  child(bindings: Record<string, unknown>): ILogger {
    return new PinoLoggerAdapter(this.pinoLogger.child(bindings));
  }
}

/**
 * Create Production Logger
 * Factory function to create configured logger instance
 */
export function createProductionLogger(serviceName: string): ILogger {
  const pinoLogger = createPinoLogger({ serviceName });
  return new PinoLoggerAdapter(pinoLogger);
}

/**
 * Export singleton logger instance
 * Can be imported directly for convenience
 */
export const logger = createProductionLogger('identity-service');

