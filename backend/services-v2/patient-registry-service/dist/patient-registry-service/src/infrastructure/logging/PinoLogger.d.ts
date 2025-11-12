/**
 * Pino Logger - HIPAA-Compliant Structured Logging for Patient Registry Service
 * Implements ILogger interface with Pino for structured logging with PHI/PII redaction
 *
 * Features:
 * - JSON structured logging for production
 * - Pretty printing for development
 * - PHI/PII redaction (HIPAA compliance)
 * - Log level configuration via LOG_LEVEL env var
 * - Request ID correlation
 * - Performance optimized
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance HIPAA-Compliant, Production-Ready
 */
import pino from 'pino';
import { ILogger, LogMetadata } from '../../../../shared/application/services/logger.interface';
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
 * Configures logger based on environment with HIPAA-compliant PHI/PII redaction
 */
export declare function createPinoLogger(config: PinoLoggerConfig): pino.Logger;
/**
 * Pino Logger Adapter
 * Adapts Pino logger to ILogger interface
 */
export declare class PinoLoggerAdapter implements ILogger {
    private pinoLogger;
    constructor(pinoLogger: pino.Logger);
    debug(message: string, meta?: LogMetadata): void;
    info(message: string, meta?: LogMetadata): void;
    warn(message: string, meta?: LogMetadata): void;
    error(message: string, meta?: LogMetadata): void;
    fatal(message: string, meta?: LogMetadata): void;
    /**
     * Create child logger with additional context
     * Useful for request-scoped logging with requestId
     */
    child(bindings: Record<string, unknown>): ILogger;
}
/**
 * Create Production Logger for Patient Registry Service
 * Factory function to create configured logger instance
 */
export declare function createProductionLogger(serviceName: string): ILogger;
/**
 * Export singleton logger instance
 * Can be imported directly for convenience
 */
export declare const logger: ILogger;
//# sourceMappingURL=PinoLogger.d.ts.map