"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = exports.LogLevel = void 0;
const winston_1 = __importDefault(require("winston"));
const uuid_1 = require("uuid");
var LogLevel;
(function (LogLevel) {
    LogLevel["ERROR"] = "error";
    LogLevel["WARN"] = "warn";
    LogLevel["INFO"] = "info";
    LogLevel["DEBUG"] = "debug";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
class Logger {
    constructor() {
        this.defaultContext = {};
        const logLevel = process.env.LOG_LEVEL || 'info';
        const nodeEnv = process.env.NODE_ENV || 'development';
        this.logger = winston_1.default.createLogger({
            level: logLevel,
            format: winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json()),
            defaultMeta: {
                service: 'scheduler-service',
                environment: nodeEnv,
                version: '1.0.0'
            },
            transports: [
                // Console transport
                new winston_1.default.transports.Console({
                    format: nodeEnv === 'development'
                        ? winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.simple())
                        : winston_1.default.format.json()
                })
            ]
        });
        // Add file transport in production
        if (nodeEnv === 'production') {
            this.logger.add(new winston_1.default.transports.File({
                filename: 'logs/error.log',
                level: 'error',
                maxsize: 10485760, // 10MB
                maxFiles: 5
            }));
            this.logger.add(new winston_1.default.transports.File({
                filename: 'logs/combined.log',
                maxsize: 10485760, // 10MB
                maxFiles: 10
            }));
        }
    }
    static getInstance() {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }
    setDefaultContext(context) {
        this.defaultContext = { ...this.defaultContext, ...context };
    }
    generateCorrelationId() {
        return (0, uuid_1.v4)();
    }
    info(message, context) {
        this.log(LogLevel.INFO, message, context);
    }
    warn(message, context) {
        this.log(LogLevel.WARN, message, context);
    }
    error(message, error, context) {
        const errorContext = error
            ? {
                ...context,
                error: {
                    message: error.message,
                    stack: error.stack,
                    name: error.name
                }
            }
            : context;
        this.log(LogLevel.ERROR, message, errorContext);
    }
    debug(message, context) {
        this.log(LogLevel.DEBUG, message, context);
    }
    log(level, message, context) {
        const mergedContext = {
            ...this.defaultContext,
            ...context,
            timestamp: new Date().toISOString()
        };
        this.logger.log(level, message, mergedContext);
    }
    // Structured logging helpers
    logWorkerPoll(workerId, duration, runsAcquired, context) {
        this.info('Worker poll completed', {
            ...context,
            workerId,
            duration,
            runsAcquired,
            event: 'worker.poll.completed'
        });
    }
    logWorkerRunStart(workerId, runId, scheduleId, context) {
        this.info('Worker run started', {
            ...context,
            workerId,
            runId,
            scheduleId,
            event: 'worker.run.started'
        });
    }
    logWorkerRunComplete(workerId, runId, scheduleId, duration, status, context) {
        this.info('Worker run completed', {
            ...context,
            workerId,
            runId,
            scheduleId,
            duration,
            status,
            event: 'worker.run.completed'
        });
    }
    logWorkerRunFailed(workerId, runId, scheduleId, error, context) {
        this.error('Worker run failed', error, {
            ...context,
            workerId,
            runId,
            scheduleId,
            event: 'worker.run.failed'
        });
    }
    logApiRequest(method, path, statusCode, duration, context) {
        this.info('API request completed', {
            ...context,
            method,
            path,
            statusCode,
            duration,
            event: 'api.request.completed'
        });
    }
    logApiError(method, path, error, context) {
        this.error('API request failed', error, {
            ...context,
            method,
            path,
            event: 'api.request.failed'
        });
    }
    logDatabaseQuery(operation, table, duration, context) {
        this.debug('Database query executed', {
            ...context,
            operation,
            table,
            duration,
            event: 'database.query.executed'
        });
    }
    logDatabaseError(operation, table, error, context) {
        this.error('Database query failed', error, {
            ...context,
            operation,
            table,
            event: 'database.query.failed'
        });
    }
    logCleanupOperation(operationType, deletedCount, duration, context) {
        this.info('Cleanup operation completed', {
            ...context,
            operationType,
            deletedCount,
            duration,
            event: 'cleanup.operation.completed'
        });
    }
    logMaterialization(schedulesProcessed, runsCreated, duration, context) {
        this.info('Materialization cycle completed', {
            ...context,
            schedulesProcessed,
            runsCreated,
            duration,
            event: 'materialization.cycle.completed'
        });
    }
}
exports.Logger = Logger;
//# sourceMappingURL=Logger.js.map