"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logMetric = exports.logEvent = exports.logRequest = exports.logError = exports.logWithContext = exports.stream = void 0;
const winston_1 = __importDefault(require("winston"));
const { combine, timestamp, errors, json, colorize, simple } = winston_1.default.format;
// Define log levels
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};
// Define colors for each level
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white',
};
// Tell winston that you want to link the colors
winston_1.default.addColors(colors);
// Define which level to log based on environment
const level = () => {
    const env = process.env.NODE_ENV || 'development';
    const isDevelopment = env === 'development';
    return isDevelopment ? 'debug' : 'warn';
};
// Define different formats for different environments
const developmentFormat = combine(colorize({ all: true }), timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }), errors({ stack: true }), simple());
const productionFormat = combine(timestamp(), errors({ stack: true }), json());
// Define transports
const transports = [
    // Console transport
    new winston_1.default.transports.Console({
        format: process.env.NODE_ENV === 'production' ? productionFormat : developmentFormat,
    }),
];
// Add file transports in production
if (process.env.NODE_ENV === 'production') {
    transports.push(new winston_1.default.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        format: productionFormat,
    }), new winston_1.default.transports.File({
        filename: 'logs/combined.log',
        format: productionFormat,
    }));
}
// Create the logger
const logger = winston_1.default.createLogger({
    level: level(),
    levels,
    transports,
    // Handle uncaught exceptions
    exceptionHandlers: [
        new winston_1.default.transports.File({ filename: 'logs/exceptions.log' }),
    ],
    // Handle unhandled promise rejections
    rejectionHandlers: [
        new winston_1.default.transports.File({ filename: 'logs/rejections.log' }),
    ],
});
// Create a stream object for Morgan HTTP logger
exports.stream = {
    write: (message) => {
        logger.http(message.trim());
    },
};
// Helper functions for structured logging
const logWithContext = (level, message, context = {}) => {
    logger.log(level, message, {
        service: process.env.SERVICE_NAME || 'unknown',
        timestamp: new Date().toISOString(),
        ...context,
    });
};
exports.logWithContext = logWithContext;
const logError = (error, context = {}) => {
    logger.error(error.message, {
        service: process.env.SERVICE_NAME || 'unknown',
        timestamp: new Date().toISOString(),
        stack: error.stack,
        ...context,
    });
};
exports.logError = logError;
const logRequest = (req, res, responseTime) => {
    logger.http('HTTP Request', {
        service: process.env.SERVICE_NAME || 'unknown',
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        responseTime: `${responseTime}ms`,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        userId: req.user?.id,
    });
};
exports.logRequest = logRequest;
const logEvent = (eventType, data = {}) => {
    logger.info('Event', {
        service: process.env.SERVICE_NAME || 'unknown',
        eventType,
        timestamp: new Date().toISOString(),
        ...data,
    });
};
exports.logEvent = logEvent;
const logMetric = (metricName, value, tags = {}) => {
    logger.info('Metric', {
        service: process.env.SERVICE_NAME || 'unknown',
        metricName,
        value,
        timestamp: new Date().toISOString(),
        ...tags,
    });
};
exports.logMetric = logMetric;
exports.default = logger;
//# sourceMappingURL=logger.js.map