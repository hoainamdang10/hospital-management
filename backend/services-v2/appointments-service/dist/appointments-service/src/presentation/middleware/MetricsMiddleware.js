"use strict";
/**
 * Metrics Middleware
 * Collects metrics from HTTP requests
 *
 * @author Hospital Management Team
 * @version 1.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.metricsMiddleware = metricsMiddleware;
exports.createMetricsHandler = createMetricsHandler;
/**
 * Metrics collection middleware
 */
function metricsMiddleware(metricsService) {
    return (req, res, next) => {
        const startTime = Date.now();
        // Capture response
        res.on('finish', () => {
            const responseTime = Date.now() - startTime;
            const endpoint = `${req.method} ${req.route?.path || req.path}`;
            metricsService.recordRequest(res.statusCode, endpoint, responseTime);
        });
        next();
    };
}
/**
 * Metrics endpoint handler
 */
function createMetricsHandler(metricsService) {
    return (req, res) => {
        const format = req.query.format;
        if (format === 'prometheus') {
            // Prometheus format
            res.setHeader('Content-Type', 'text/plain; version=0.0.4');
            res.send(metricsService.getPrometheusMetrics());
        }
        else {
            // JSON format
            res.json(metricsService.getMetrics());
        }
    };
}
//# sourceMappingURL=MetricsMiddleware.js.map