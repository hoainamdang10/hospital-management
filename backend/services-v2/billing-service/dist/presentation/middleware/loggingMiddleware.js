"use strict";
/**
 * loggingMiddleware - Presentation Layer
 * Request/Response logging middleware for billing service
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Audit Logging, HIPAA Compliance, Security Monitoring
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatLogMessage = exports.isSensitivePath = exports.createLogContext = exports.redactSensitiveData = exports.performanceLog = exports.securityLog = exports.auditLog = exports.errorLoggingMiddleware = exports.loggingMiddleware = void 0;
const uuid_1 = require("uuid");
/**
 * Sensitive data patterns to redact from logs
 */
const SENSITIVE_PATTERNS = [
    /password/i,
    /token/i,
    /secret/i,
    /key/i,
    /authorization/i,
    /policyNumber/i,
    /cardNumber/i,
    /ssn/i,
    /nationalId/i,
    /phoneNumber/i,
    /email/i,
    /address/i,
    /dateOfBirth/i
];
/**
 * Paths that should not be logged in detail (sensitive endpoints)
 */
const SENSITIVE_PATHS = [
    '/api/v1/billing/payments',
    '/api/v1/billing/insurance/validate',
    '/api/v1/billing/insurance/claims'
];
/**
 * Redact sensitive information from objects
 */
const redactSensitiveData = (obj, depth = 0) => {
    if (depth > 5)
        return '[Max Depth Reached]'; // Prevent infinite recursion
    if (obj === null || obj === undefined)
        return obj;
    if (typeof obj === 'string') {
        // Redact potential sensitive strings
        if (obj.length > 50)
            return '[Long String Redacted]';
        return obj;
    }
    if (typeof obj !== 'object')
        return obj;
    if (Array.isArray(obj)) {
        return obj.map(item => redactSensitiveData(item, depth + 1));
    }
    const redacted = {};
    for (const [key, value] of Object.entries(obj)) {
        const isSensitive = SENSITIVE_PATTERNS.some(pattern => pattern.test(key));
        if (isSensitive) {
            redacted[key] = '[REDACTED]';
        }
        else if (typeof value === 'object') {
            redacted[key] = redactSensitiveData(value, depth + 1);
        }
        else {
            redacted[key] = value;
        }
    }
    return redacted;
};
exports.redactSensitiveData = redactSensitiveData;
/**
 * Create log context from request
 */
const createLogContext = (req) => {
    const user = req.user;
    return {
        requestId: (0, uuid_1.v4)(),
        correlationId: req.headers['x-correlation-id'] || (0, uuid_1.v4)(),
        userId: user?.id,
        userRole: user?.role,
        ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
        method: req.method,
        path: req.path,
        query: redactSensitiveData(req.query),
        timestamp: new Date().toISOString()
    };
};
exports.createLogContext = createLogContext;
/**
 * Check if path contains sensitive data
 */
const isSensitivePath = (path) => {
    return SENSITIVE_PATHS.some(sensitivePath => path.includes(sensitivePath));
};
exports.isSensitivePath = isSensitivePath;
/**
 * Format log message for different log levels
 */
const formatLogMessage = (level, message, context, extra) => {
    const logEntry = {
        level,
        message,
        context,
        service: 'billing-service',
        version: '2.0.0',
        environment: process.env.NODE_ENV || 'development',
        ...extra
    };
    return JSON.stringify(logEntry, null, process.env.NODE_ENV === 'development' ? 2 : 0);
};
exports.formatLogMessage = formatLogMessage;
/**
 * Main logging middleware
 */
const loggingMiddleware = (req, res, next) => {
    // Create log context
    const logContext = createLogContext(req);
    req.logContext = logContext;
    req.startTime = Date.now();
    // Add correlation ID to response headers
    res.setHeader('X-Correlation-ID', logContext.correlationId);
    res.setHeader('X-Request-ID', logContext.requestId);
    // Log incoming request
    const isSensitive = isSensitivePath(req.path);
    const requestLog = formatLogMessage('info', 'Incoming Request', logContext, {
        body: isSensitive ? '[SENSITIVE DATA REDACTED]' : redactSensitiveData(req.body),
        headers: redactSensitiveData(req.headers)
    });
    console.log(requestLog);
    // Capture response
    const originalSend = res.send;
    let responseBody;
    res.send = function (body) {
        responseBody = body;
        return originalSend.call(this, body);
    };
    // Log response when finished
    res.on('finish', () => {
        const responseTime = Date.now() - (req.startTime || Date.now());
        const responseContext = {
            ...logContext,
            responseTime,
            statusCode: res.statusCode
        };
        let logLevel = 'info';
        let message = 'Request Completed';
        if (res.statusCode >= 400 && res.statusCode < 500) {
            logLevel = 'warn';
            message = 'Client Error Response';
        }
        else if (res.statusCode >= 500) {
            logLevel = 'error';
            message = 'Server Error Response';
        }
        // Parse response body for error information
        let parsedResponse;
        try {
            parsedResponse = typeof responseBody === 'string' ? JSON.parse(responseBody) : responseBody;
            if (parsedResponse?.error) {
                responseContext.errorCode = parsedResponse.error.code;
                responseContext.errorMessage = parsedResponse.error.message;
            }
        }
        catch (e) {
            // Response body is not JSON, keep as is
            parsedResponse = responseBody;
        }
        const responseLog = formatLogMessage(logLevel, message, responseContext, {
            response: isSensitive ? '[SENSITIVE DATA REDACTED]' : redactSensitiveData(parsedResponse)
        });
        if (logLevel === 'error') {
            console.error(responseLog);
        }
        else if (logLevel === 'warn') {
            console.warn(responseLog);
        }
        else {
            console.log(responseLog);
        }
        // Log performance warning for slow requests
        if (responseTime > 5000) { // 5 seconds
            const performanceLog = formatLogMessage('warn', 'Slow Request Detected', responseContext, {
                threshold: '5000ms',
                actual: `${responseTime}ms`
            });
            console.warn(performanceLog);
        }
    });
    next();
};
exports.loggingMiddleware = loggingMiddleware;
/**
 * Error logging middleware
 */
const errorLoggingMiddleware = (err, req, res, next) => {
    const logContext = req.logContext || createLogContext(req);
    // Enhanced error context
    const errorContext = {
        ...logContext,
        responseTime: Date.now() - (req.startTime || Date.now()),
        statusCode: err.status || err.statusCode || 500,
        errorCode: err.code || 'INTERNAL_SERVER_ERROR',
        errorMessage: err.message || 'Unknown error occurred'
    };
    const errorLog = formatLogMessage('error', 'Unhandled Error', errorContext, {
        error: {
            name: err.name,
            message: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
            code: err.code,
            status: err.status || err.statusCode
        },
        request: {
            body: redactSensitiveData(req.body),
            params: req.params,
            query: redactSensitiveData(req.query)
        }
    });
    console.error(errorLog);
    // Send error response if not already sent
    if (!res.headersSent) {
        res.status(errorContext.statusCode).json({
            success: false,
            error: {
                code: errorContext.errorCode,
                message: process.env.NODE_ENV === 'development'
                    ? err.message
                    : 'Đã xảy ra lỗi hệ thống',
                requestId: errorContext.requestId,
                correlationId: errorContext.correlationId
            }
        });
    }
    next(err);
};
exports.errorLoggingMiddleware = errorLoggingMiddleware;
/**
 * Audit logging for sensitive operations
 */
const auditLog = (action, req, additionalData) => {
    const logContext = req.logContext || createLogContext(req);
    const user = req.user;
    const auditEntry = formatLogMessage('info', 'Audit Log', logContext, {
        auditType: 'SENSITIVE_OPERATION',
        action,
        actor: {
            userId: user?.id,
            userRole: user?.role,
            email: user?.email
        },
        resource: {
            path: req.path,
            method: req.method,
            params: req.params
        },
        additionalData: redactSensitiveData(additionalData),
        compliance: {
            hipaa: true,
            gdpr: true,
            vietnameseHealthcare: true
        }
    });
    console.log(auditEntry);
};
exports.auditLog = auditLog;
/**
 * Security event logging
 */
const securityLog = (event, req, severity, details) => {
    const logContext = req.logContext || createLogContext(req);
    const securityEntry = formatLogMessage('warn', 'Security Event', logContext, {
        securityEvent: event,
        severity,
        details: redactSensitiveData(details),
        threat: {
            ipAddress: logContext.ipAddress,
            userAgent: logContext.userAgent,
            timestamp: logContext.timestamp
        }
    });
    if (severity === 'critical' || severity === 'high') {
        console.error(securityEntry);
    }
    else {
        console.warn(securityEntry);
    }
};
exports.securityLog = securityLog;
/**
 * Performance logging
 */
const performanceLog = (operation, duration, req, metadata) => {
    const logContext = req.logContext || createLogContext(req);
    const performanceEntry = formatLogMessage('info', 'Performance Metric', logContext, {
        operation,
        duration: `${duration}ms`,
        metadata: redactSensitiveData(metadata),
        performance: {
            threshold: duration > 1000 ? 'SLOW' : 'NORMAL',
            category: operation
        }
    });
    console.log(performanceEntry);
};
exports.performanceLog = performanceLog;
//# sourceMappingURL=loggingMiddleware.js.map