"use strict";
/**
 * Health Check Middleware
 * Provides health check endpoint for service monitoring
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthCheckMiddleware = healthCheckMiddleware;
function healthCheckMiddleware(req, res, next) {
    if (req.path === '/health' || req.path === '/health/') {
        res.status(200).json({
            status: 'healthy',
            service: 'clinical-emr-service',
            version: '2.0.0',
            timestamp: new Date().toISOString()
        });
        return;
    }
    next();
}
//# sourceMappingURL=health-check.middleware.js.map