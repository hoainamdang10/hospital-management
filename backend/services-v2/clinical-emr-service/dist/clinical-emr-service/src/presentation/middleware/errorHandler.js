"use strict";
/**
 * Error Handling Middleware
 * Centralized error handling for Express
 *
 * @compliance Clean Architecture, Express, HIPAA
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
exports.errorHandlingMiddleware = errorHandler;
exports.notFoundHandler = notFoundHandler;
function errorHandler(error, req, res, next) {
    // Log error (exclude sensitive data)
    console.error('API Error:', {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString(),
    });
    // Determine status code
    const statusCode = error.statusCode || 500;
    // Build error response
    const errorResponse = {
        success: false,
        error: {
            message: error.message || 'Internal Server Error',
            code: error.code || 'INTERNAL_ERROR',
        },
    };
    // Add details in development
    if (process.env.NODE_ENV === 'development' && error.details) {
        errorResponse.error.details = error.details;
    }
    // Add stack trace in development
    if (process.env.NODE_ENV === 'development' && error.stack) {
        errorResponse.error.stack = error.stack.split('\n');
    }
    res.status(statusCode).json(errorResponse);
}
function notFoundHandler(req, res) {
    res.status(404).json({
        success: false,
        error: {
            message: `Endpoint ${req.method} ${req.path} not found`,
            code: 'NOT_FOUND',
        },
    });
}
//# sourceMappingURL=errorHandler.js.map