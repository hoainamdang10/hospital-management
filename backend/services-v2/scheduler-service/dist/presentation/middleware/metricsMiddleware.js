"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.metricsMiddleware = metricsMiddleware;
const MetricsCollector_1 = require("../../infrastructure/observability/MetricsCollector");
const Logger_1 = require("../../infrastructure/observability/Logger");
const metrics = MetricsCollector_1.MetricsCollector.getInstance();
const logger = Logger_1.Logger.getInstance();
function metricsMiddleware(req, res, next) {
    const startTime = Date.now();
    const correlationId = logger.generateCorrelationId();
    // Set correlation ID in request
    req.correlationId = correlationId;
    // Set correlation ID in response headers
    res.setHeader('X-Correlation-ID', correlationId);
    // Capture response finish event
    res.on('finish', () => {
        const duration = (Date.now() - startTime) / 1000; // Convert to seconds
        const route = req.route?.path || req.path;
        const method = req.method;
        const statusCode = res.statusCode;
        // Record metrics
        metrics.apiRequestDuration.observe({ method, route, status_code: statusCode.toString() }, duration);
        metrics.apiRequestTotal.inc({
            method,
            route,
            status_code: statusCode.toString()
        });
        // Log request
        logger.logApiRequest(method, route, statusCode, duration, {
            correlationId,
            userAgent: req.get('user-agent'),
            ip: req.ip
        });
        // Record errors
        if (statusCode >= 400) {
            const errorType = statusCode >= 500 ? 'server_error' : 'client_error';
            metrics.apiRequestErrors.inc({
                method,
                route,
                error_type: errorType
            });
        }
    });
    next();
}
//# sourceMappingURL=metricsMiddleware.js.map