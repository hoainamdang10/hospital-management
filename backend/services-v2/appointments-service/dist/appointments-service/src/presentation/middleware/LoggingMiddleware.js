"use strict";
/**
 * Logging Middleware
 * Adds correlation IDs and structured logging to requests
 *
 * @author Hospital Management Team
 * @version 1.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLoggingMiddleware = requestLoggingMiddleware;
exports.errorLoggingMiddleware = errorLoggingMiddleware;
exports.performanceLoggingMiddleware = performanceLoggingMiddleware;
const Logger_1 = require("../../infrastructure/logging/Logger");
/**
 * Request logging middleware
 */
function requestLoggingMiddleware(logger) {
    return (req, res, next) => {
        // Generate or extract correlation ID
        const correlationId = req.headers['x-correlation-id'] || (0, Logger_1.generateCorrelationId)();
        req.correlationId = correlationId;
        // Add correlation ID to response headers
        res.setHeader('X-Correlation-ID', correlationId);
        // Create child logger with correlation ID
        const context = {
            correlationId,
            requestId: correlationId,
            method: req.method,
            path: req.path,
            ip: req.ip,
        };
        // Extract user ID from auth header if available
        const authHeader = req.headers.authorization;
        if (authHeader) {
            try {
                // In a real implementation, decode JWT to get user ID
                // For now, just log that auth is present
                context.authenticated = true;
            }
            catch (error) {
                // Invalid token
            }
        }
        req.logger = logger.child(context);
        // Log request
        req.logger.info('Incoming request', context, {
            headers: sanitizeHeaders(req.headers),
            query: req.query,
            body: sanitizeBody(req.body),
        });
        // Capture response
        const startTime = Date.now();
        const originalSend = res.send;
        res.send = function (data) {
            const duration = Date.now() - startTime;
            // Log response
            req.logger?.info('Outgoing response', context, {
                statusCode: res.statusCode,
                duration,
                contentLength: res.get('content-length'),
            });
            return originalSend.call(this, data);
        };
        next();
    };
}
/**
 * Error logging middleware
 */
function errorLoggingMiddleware(logger) {
    return (err, req, res, next) => {
        const context = {
            correlationId: req.correlationId,
            method: req.method,
            path: req.path,
            ip: req.ip,
        };
        // Log error
        logger.error('Request error', err, context, {
            headers: sanitizeHeaders(req.headers),
            query: req.query,
            body: sanitizeBody(req.body),
        });
        next(err);
    };
}
/**
 * Sanitize headers (remove sensitive data)
 */
function sanitizeHeaders(headers) {
    const sanitized = { ...headers };
    // Remove sensitive headers
    const sensitiveHeaders = [
        'authorization',
        'cookie',
        'x-api-key',
        'x-auth-token',
    ];
    for (const header of sensitiveHeaders) {
        if (sanitized[header]) {
            sanitized[header] = '***';
        }
    }
    return sanitized;
}
/**
 * Sanitize request body (remove sensitive data)
 */
function sanitizeBody(body) {
    if (!body || typeof body !== 'object') {
        return body;
    }
    const sanitized = { ...body };
    // Remove sensitive fields
    const sensitiveFields = [
        'password',
        'token',
        'secret',
        'apiKey',
        'creditCard',
        'ssn',
    ];
    for (const field of sensitiveFields) {
        if (sanitized[field]) {
            sanitized[field] = '***';
        }
    }
    return sanitized;
}
/**
 * Performance logging middleware
 */
function performanceLoggingMiddleware(logger, thresholdMs = 1000) {
    return (req, res, next) => {
        const startTime = Date.now();
        res.on('finish', () => {
            const duration = Date.now() - startTime;
            // Log slow requests
            if (duration > thresholdMs) {
                const context = {
                    correlationId: req.correlationId,
                    method: req.method,
                    path: req.path,
                };
                logger.warn('Slow request detected', context, {
                    duration,
                    threshold: thresholdMs,
                    statusCode: res.statusCode,
                });
            }
        });
        next();
    };
}
//# sourceMappingURL=LoggingMiddleware.js.map