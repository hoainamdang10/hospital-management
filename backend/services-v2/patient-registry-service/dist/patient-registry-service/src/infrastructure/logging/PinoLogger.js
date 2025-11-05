"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.PinoLoggerAdapter = void 0;
exports.createPinoLogger = createPinoLogger;
exports.createProductionLogger = createProductionLogger;
const pino_1 = __importDefault(require("pino"));
/**
 * Create Pino Logger Instance
 * Configures logger based on environment with HIPAA-compliant PHI/PII redaction
 */
function createPinoLogger(config) {
    const { serviceName, logLevel = process.env.LOG_LEVEL || 'info', nodeEnv = process.env.NODE_ENV || 'development' } = config;
    const isDevelopment = nodeEnv === 'development' || nodeEnv === 'test';
    // Base configuration
    const pinoConfig = {
        name: serviceName,
        level: logLevel,
        // Redact sensitive fields (HIPAA compliance - PHI/PII protection)
        redact: {
            paths: [
                // Authentication & Authorization
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
                'res.headers["set-cookie"]',
                // PHI/PII - Personal Information
                'nationalId',
                'phoneNumber',
                'email',
                'address',
                'dateOfBirth',
                'bhytNumber',
                'bhtnNumber',
                'insuranceNumber',
                // Request/Response PHI
                'req.body.personalInfo',
                'req.body.contactInfo',
                'req.body.nationalId',
                'req.body.phoneNumber',
                'req.body.email',
                'req.body.address',
                'req.body.dateOfBirth',
                'req.params.patientId',
                'req.query.nationalId',
                'req.query.phoneNumber',
                'req.query.email',
                // Medical Information
                'medicalHistory',
                'diagnosis',
                'prescription',
                'testResults',
                'vitalSigns',
                // Insurance Information
                'req.body.insuranceInfo',
                'insuranceInfo.policyNumber',
                'insuranceInfo.bhytNumber',
                'insuranceInfo.bhtnNumber'
            ],
            remove: true // Remove instead of mask for HIPAA compliance
        },
        // Serialize errors properly
        serializers: {
            err: pino_1.default.stdSerializers.err,
            error: pino_1.default.stdSerializers.err,
            req: pino_1.default.stdSerializers.req,
            res: pino_1.default.stdSerializers.res
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
        return (0, pino_1.default)(pinoConfig, pino_1.default.destination({
            sync: false
        }));
    }
    // JSON output for production
    return (0, pino_1.default)(pinoConfig);
}
/**
 * Pino Logger Adapter
 * Adapts Pino logger to ILogger interface
 */
class PinoLoggerAdapter {
    constructor(pinoLogger) {
        this.pinoLogger = pinoLogger;
    }
    debug(message, meta) {
        this.pinoLogger.debug(meta || {}, message);
    }
    info(message, meta) {
        this.pinoLogger.info(meta || {}, message);
    }
    warn(message, meta) {
        this.pinoLogger.warn(meta || {}, message);
    }
    error(message, meta) {
        this.pinoLogger.error(meta || {}, message);
    }
    fatal(message, meta) {
        this.pinoLogger.fatal(meta || {}, message);
    }
    /**
     * Create child logger with additional context
     * Useful for request-scoped logging with requestId
     */
    child(bindings) {
        return new PinoLoggerAdapter(this.pinoLogger.child(bindings));
    }
}
exports.PinoLoggerAdapter = PinoLoggerAdapter;
/**
 * Create Production Logger for Patient Registry Service
 * Factory function to create configured logger instance
 */
function createProductionLogger(serviceName) {
    const pinoLogger = createPinoLogger({ serviceName });
    return new PinoLoggerAdapter(pinoLogger);
}
/**
 * Export singleton logger instance
 * Can be imported directly for convenience
 */
exports.logger = createProductionLogger('patient-registry-service');
//# sourceMappingURL=PinoLogger.js.map