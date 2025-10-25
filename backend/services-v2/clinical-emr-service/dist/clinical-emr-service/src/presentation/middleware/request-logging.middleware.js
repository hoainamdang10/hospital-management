"use strict";
/**
 * Request Logging Middleware
 * Logs incoming requests for debugging and auditing
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLoggingMiddleware = requestLoggingMiddleware;
function requestLoggingMiddleware(req, res, next) {
    const start = Date.now();
    // Log request
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    // Log response when finished
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} ${res.statusCode} - ${duration}ms`);
    });
    next();
}
//# sourceMappingURL=request-logging.middleware.js.map