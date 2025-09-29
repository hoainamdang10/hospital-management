"use strict";
/**
 * Shared Metrics Module for Hospital Management System
 * Provides Prometheus metrics collection for all microservices
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = exports.resetMetrics = exports.getMetricsHandler = exports.trackDatabaseQuery = exports.metricsMiddleware = exports.errorsTotal = exports.queueJobDuration = exports.queueJobsTotal = exports.cacheMissesTotal = exports.cacheHitsTotal = exports.activeSessionsTotal = exports.authAttemptsTotal = exports.appointmentsActive = exports.appointmentsTotal = exports.doctorsTotal = exports.patientsTotal = exports.databaseQueriesTotal = exports.databaseQueryDuration = exports.databaseConnectionsActive = exports.httpRequestDuration = exports.httpRequestsTotal = void 0;
const prom_client_1 = require("prom-client");
Object.defineProperty(exports, "register", { enumerable: true, get: function () { return prom_client_1.register; } });
// Collect default metrics (CPU, memory, etc.)
(0, prom_client_1.collectDefaultMetrics)({
    prefix: 'hospital_',
    gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5],
});
// HTTP Request metrics
exports.httpRequestsTotal = new prom_client_1.Counter({
    name: 'hospital_http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code', 'service'],
});
exports.httpRequestDuration = new prom_client_1.Histogram({
    name: 'hospital_http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code', 'service'],
    buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
});
// Database metrics
exports.databaseConnectionsActive = new prom_client_1.Gauge({
    name: 'hospital_database_connections_active',
    help: 'Number of active database connections',
    labelNames: ['service', 'database'],
});
exports.databaseQueryDuration = new prom_client_1.Histogram({
    name: 'hospital_database_query_duration_seconds',
    help: 'Duration of database queries in seconds',
    labelNames: ['service', 'operation', 'table'],
    buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
});
exports.databaseQueriesTotal = new prom_client_1.Counter({
    name: 'hospital_database_queries_total',
    help: 'Total number of database queries',
    labelNames: ['service', 'operation', 'table', 'status'],
});
// Business metrics
exports.patientsTotal = new prom_client_1.Gauge({
    name: 'hospital_patients_total',
    help: 'Total number of patients in the system',
    labelNames: ['status'],
});
exports.doctorsTotal = new prom_client_1.Gauge({
    name: 'hospital_doctors_total',
    help: 'Total number of doctors in the system',
    labelNames: ['status', 'specialty'],
});
exports.appointmentsTotal = new prom_client_1.Counter({
    name: 'hospital_appointments_total',
    help: 'Total number of appointments',
    labelNames: ['status', 'type'],
});
exports.appointmentsActive = new prom_client_1.Gauge({
    name: 'hospital_appointments_active',
    help: 'Number of active appointments',
    labelNames: ['status'],
});
// Authentication metrics
exports.authAttemptsTotal = new prom_client_1.Counter({
    name: 'hospital_auth_attempts_total',
    help: 'Total number of authentication attempts',
    labelNames: ['method', 'status', 'role'],
});
exports.activeSessionsTotal = new prom_client_1.Gauge({
    name: 'hospital_active_sessions_total',
    help: 'Number of active user sessions',
    labelNames: ['role'],
});
// Cache metrics
exports.cacheHitsTotal = new prom_client_1.Counter({
    name: 'hospital_cache_hits_total',
    help: 'Total number of cache hits',
    labelNames: ['service', 'cache_type'],
});
exports.cacheMissesTotal = new prom_client_1.Counter({
    name: 'hospital_cache_misses_total',
    help: 'Total number of cache misses',
    labelNames: ['service', 'cache_type'],
});
// Queue metrics
exports.queueJobsTotal = new prom_client_1.Counter({
    name: 'hospital_queue_jobs_total',
    help: 'Total number of queue jobs',
    labelNames: ['service', 'queue_name', 'status'],
});
exports.queueJobDuration = new prom_client_1.Histogram({
    name: 'hospital_queue_job_duration_seconds',
    help: 'Duration of queue job processing in seconds',
    labelNames: ['service', 'queue_name'],
    buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60],
});
// Error metrics
exports.errorsTotal = new prom_client_1.Counter({
    name: 'hospital_errors_total',
    help: 'Total number of errors',
    labelNames: ['service', 'error_type', 'severity'],
});
/**
 * Middleware to collect HTTP metrics
 */
const metricsMiddleware = (serviceName) => {
    return (req, res, next) => {
        const start = Date.now();
        res.on('finish', () => {
            const duration = (Date.now() - start) / 1000;
            const route = req.route?.path || req.path || 'unknown';
            exports.httpRequestsTotal.inc({
                method: req.method,
                route,
                status_code: res.statusCode,
                service: serviceName,
            });
            exports.httpRequestDuration.observe({
                method: req.method,
                route,
                status_code: res.statusCode,
                service: serviceName,
            }, duration);
        });
        next();
    };
};
exports.metricsMiddleware = metricsMiddleware;
/**
 * Database query metrics wrapper
 */
const trackDatabaseQuery = async (serviceName, operation, table, queryFn) => {
    const start = Date.now();
    let status = 'success';
    try {
        const result = await queryFn();
        return result;
    }
    catch (error) {
        status = 'error';
        throw error;
    }
    finally {
        const duration = (Date.now() - start) / 1000;
        exports.databaseQueryDuration.observe({ service: serviceName, operation, table }, duration);
        exports.databaseQueriesTotal.inc({
            service: serviceName,
            operation,
            table,
            status,
        });
    }
};
exports.trackDatabaseQuery = trackDatabaseQuery;
/**
 * Get metrics endpoint handler
 */
const getMetricsHandler = async (req, res) => {
    try {
        res.set('Content-Type', prom_client_1.register.contentType);
        res.end(await prom_client_1.register.metrics());
    }
    catch (error) {
        res.status(500).end(error);
    }
};
exports.getMetricsHandler = getMetricsHandler;
/**
 * Reset all metrics (useful for testing)
 */
const resetMetrics = () => {
    prom_client_1.register.resetMetrics();
};
exports.resetMetrics = resetMetrics;
//# sourceMappingURL=metrics.js.map