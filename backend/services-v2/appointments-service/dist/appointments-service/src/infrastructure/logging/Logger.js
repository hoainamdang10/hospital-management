"use strict";
/**
 * Structured Logger
 * Provides structured logging with correlation IDs
 *
 * @author Hospital Management Team
 * @version 1.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = exports.LogLevel = void 0;
exports.createLogger = createLogger;
exports.generateCorrelationId = generateCorrelationId;
var LogLevel;
(function (LogLevel) {
    LogLevel["DEBUG"] = "debug";
    LogLevel["INFO"] = "info";
    LogLevel["WARN"] = "warn";
    LogLevel["ERROR"] = "error";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
/**
 * Structured Logger
 */
class Logger {
    constructor(serviceName, minLevel = LogLevel.INFO) {
        this.serviceName = serviceName;
        this.minLevel = minLevel;
    }
    /**
     * Log debug message
     */
    debug(message, context, metadata) {
        this.log(LogLevel.DEBUG, message, context, metadata);
    }
    /**
     * Log info message
     */
    info(message, context, metadata) {
        this.log(LogLevel.INFO, message, context, metadata);
    }
    /**
     * Log warning message
     */
    warn(message, context, metadata) {
        this.log(LogLevel.WARN, message, context, metadata);
    }
    /**
     * Log error message
     */
    error(message, error, context, metadata) {
        const errorInfo = error ? {
            message: error.message,
            stack: error.stack,
            code: error.code,
        } : undefined;
        this.log(LogLevel.ERROR, message, context, metadata, errorInfo);
    }
    /**
     * Core logging method
     */
    log(level, message, context, metadata, error) {
        // Check if we should log this level
        if (!this.shouldLog(level)) {
            return;
        }
        const entry = {
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
    shouldLog(level) {
        const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
        const currentLevelIndex = levels.indexOf(this.minLevel);
        const messageLevelIndex = levels.indexOf(level);
        return messageLevelIndex >= currentLevelIndex;
    }
    /**
     * Create child logger with additional context
     */
    child(context) {
        const childLogger = new Logger(this.serviceName, this.minLevel);
        // Store context for child logger
        childLogger.defaultContext = context;
        return childLogger;
    }
}
exports.Logger = Logger;
/**
 * Create logger instance
 */
function createLogger(serviceName, level) {
    const logLevel = level ? level.toLowerCase() : LogLevel.INFO;
    return new Logger(serviceName, logLevel);
}
/**
 * Generate correlation ID
 */
function generateCorrelationId() {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}
//# sourceMappingURL=Logger.js.map