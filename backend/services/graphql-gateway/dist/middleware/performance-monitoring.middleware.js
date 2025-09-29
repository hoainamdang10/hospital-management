"use strict";
/**
 * Performance Monitoring Middleware for GraphQL Gateway
 * Comprehensive metrics collection and performance tracking
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.performanceMonitoringPlugin = exports.performanceMonitoringService = exports.PerformanceMonitoringService = void 0;
exports.trackCacheHit = trackCacheHit;
exports.trackCacheMiss = trackCacheMiss;
exports.trackDatabaseQuery = trackDatabaseQuery;
exports.trackDataLoaderBatch = trackDataLoaderBatch;
exports.trackDataLoaderCacheHit = trackDataLoaderCacheHit;
exports.getPrometheusMetrics = getPrometheusMetrics;
exports.getHealthStatus = getHealthStatus;
const logger_1 = __importDefault(require("@hospital/shared/dist/utils/logger"));
const prom_client_1 = require("prom-client");
// Enable default metrics collection
(0, prom_client_1.collectDefaultMetrics)({ register: prom_client_1.register });
// Custom metrics
const httpRequestsTotal = new prom_client_1.Counter({
    name: "graphql_requests_total",
    help: "Total number of GraphQL requests",
    labelNames: ["operation_type", "operation_name", "status", "user_role"],
    registers: [prom_client_1.register],
});
const httpRequestDuration = new prom_client_1.Histogram({
    name: "graphql_request_duration_seconds",
    help: "Duration of GraphQL requests in seconds",
    labelNames: ["operation_type", "operation_name", "user_role"],
    buckets: [0.1, 0.3, 0.5, 0.7, 1, 2, 3, 5, 7, 10],
    registers: [prom_client_1.register],
});
const queryComplexity = new prom_client_1.Histogram({
    name: "graphql_query_complexity",
    help: "GraphQL query complexity score",
    labelNames: ["operation_name", "user_role"],
    buckets: [10, 50, 100, 200, 500, 800, 1000, 1500, 2000],
    registers: [prom_client_1.register],
});
const activeConnections = new prom_client_1.Gauge({
    name: "graphql_active_connections",
    help: "Number of active GraphQL connections",
    registers: [prom_client_1.register],
});
const cacheHits = new prom_client_1.Counter({
    name: "cache_hits_total",
    help: "Total number of cache hits",
    labelNames: ["cache_type", "service"],
    registers: [prom_client_1.register],
});
const cacheMisses = new prom_client_1.Counter({
    name: "cache_misses_total",
    help: "Total number of cache misses",
    labelNames: ["cache_type", "service"],
    registers: [prom_client_1.register],
});
const databaseQueries = new prom_client_1.Counter({
    name: "database_queries_total",
    help: "Total number of database queries",
    labelNames: ["service", "operation"],
    registers: [prom_client_1.register],
});
const databaseQueryDuration = new prom_client_1.Histogram({
    name: "database_query_duration_seconds",
    help: "Duration of database queries in seconds",
    labelNames: ["service", "operation"],
    buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
    registers: [prom_client_1.register],
});
const errorsByType = new prom_client_1.Counter({
    name: "graphql_errors_total",
    help: "Total number of GraphQL errors by type",
    labelNames: ["error_type", "operation_name", "user_role"],
    registers: [prom_client_1.register],
});
const dataLoaderBatches = new prom_client_1.Counter({
    name: "dataloader_batches_total",
    help: "Total number of DataLoader batches",
    labelNames: ["loader_name"],
    registers: [prom_client_1.register],
});
const dataLoaderCacheHits = new prom_client_1.Counter({
    name: "dataloader_cache_hits_total",
    help: "Total number of DataLoader cache hits",
    labelNames: ["loader_name"],
    registers: [prom_client_1.register],
});
// Performance thresholds
const PERFORMANCE_THRESHOLDS = {
    SLOW_QUERY: 1000, // 1 second
    HIGH_COMPLEXITY: 800,
    MEMORY_WARNING: 500 * 1024 * 1024, // 500MB
    ERROR_RATE_WARNING: 0.05, // 5%
};
class PerformanceMonitoringService {
    constructor() {
        this.requestCount = 0;
        this.totalResponseTime = 0;
        this.errorCount = 0;
        this.startTime = Date.now();
    }
    /**
     * Get current performance metrics
     */
    getMetrics() {
        const memoryUsage = process.memoryUsage();
        return {
            requestCount: this.requestCount,
            averageResponseTime: this.requestCount > 0 ? this.totalResponseTime / this.requestCount : 0,
            errorRate: this.requestCount > 0 ? this.errorCount / this.requestCount : 0,
            cacheHitRate: this.calculateCacheHitRate(),
            activeConnections: this.getActiveConnections(),
            memoryUsage: memoryUsage.heapUsed,
        };
    }
    /**
     * Calculate cache hit rate
     */
    calculateCacheHitRate() {
        // This would be calculated from actual cache metrics
        // For now, return a placeholder
        return 0.85; // 85% hit rate
    }
    /**
     * Get active connections count
     */
    getActiveConnections() {
        // This would be tracked from actual connection pool
        return 0;
    }
    /**
     * Record request metrics
     */
    recordRequest(duration, hasError) {
        this.requestCount++;
        this.totalResponseTime += duration;
        if (hasError) {
            this.errorCount++;
        }
    }
    /**
     * Check if performance is degraded
     */
    isPerformanceDegraded() {
        const metrics = this.getMetrics();
        return (metrics.averageResponseTime > PERFORMANCE_THRESHOLDS.SLOW_QUERY ||
            metrics.errorRate > PERFORMANCE_THRESHOLDS.ERROR_RATE_WARNING ||
            metrics.memoryUsage > PERFORMANCE_THRESHOLDS.MEMORY_WARNING);
    }
}
exports.PerformanceMonitoringService = PerformanceMonitoringService;
// Singleton instance
exports.performanceMonitoringService = new PerformanceMonitoringService();
/**
 * Apollo Server Performance Monitoring Plugin
 */
exports.performanceMonitoringPlugin = {
    async requestDidStart() {
        const startTime = Date.now();
        let operationType = "unknown";
        let operationName = "unknown";
        let userRole = "anonymous";
        return {
            async didResolveOperation(requestContext) {
                const { request, contextValue } = requestContext;
                // Extract operation details
                const operation = requestContext.document?.definitions[0];
                if (operation && operation.kind === "OperationDefinition") {
                    operationType = operation.operation;
                    operationName = operation.name?.value || "anonymous";
                }
                userRole = contextValue.user?.role || "anonymous";
                // Track active connections
                activeConnections.inc();
                logger_1.default.debug("📊 GraphQL operation started:", {
                    operationType,
                    operationName,
                    userRole,
                    requestId: contextValue.requestId,
                });
            },
            async didEncounterErrors(requestContext) {
                const { errors } = requestContext;
                errors?.forEach((error) => {
                    // Categorize error types
                    let errorType = "unknown";
                    if (error.message.includes("Authentication")) {
                        errorType = "authentication";
                    }
                    else if (error.message.includes("Authorization")) {
                        errorType = "authorization";
                    }
                    else if (error.message.includes("Validation")) {
                        errorType = "validation";
                    }
                    else if (error.message.includes("Network")) {
                        errorType = "network";
                    }
                    else {
                        errorType = "internal";
                    }
                    errorsByType.inc({
                        error_type: errorType,
                        operation_name: operationName,
                        user_role: userRole,
                    });
                    logger_1.default.error("❌ GraphQL error:", {
                        errorType,
                        operationName,
                        userRole,
                        message: error.message,
                        path: error.path,
                    });
                });
            },
            async willSendResponse(requestContext) {
                const duration = (Date.now() - startTime) / 1000;
                const hasErrors = requestContext.errors && requestContext.errors.length > 0;
                const status = hasErrors ? "error" : "success";
                // Record metrics
                httpRequestsTotal.inc({
                    operation_type: operationType,
                    operation_name: operationName,
                    status,
                    user_role: userRole,
                });
                httpRequestDuration.observe({
                    operation_type: operationType,
                    operation_name: operationName,
                    user_role: userRole,
                }, duration);
                // Track query complexity if available
                const complexity = requestContext.contextValue.queryComplexity;
                if (complexity) {
                    queryComplexity.observe({
                        operation_name: operationName,
                        user_role: userRole,
                    }, complexity);
                    // Alert on high complexity
                    if (complexity > PERFORMANCE_THRESHOLDS.HIGH_COMPLEXITY) {
                        logger_1.default.warn("⚠️ High complexity query:", {
                            operationName,
                            complexity,
                            threshold: PERFORMANCE_THRESHOLDS.HIGH_COMPLEXITY,
                            userRole,
                        });
                    }
                }
                // Decrease active connections
                activeConnections.dec();
                // Record in performance service
                exports.performanceMonitoringService.recordRequest(duration * 1000, hasErrors || false);
                // Log slow queries
                if (duration > PERFORMANCE_THRESHOLDS.SLOW_QUERY / 1000) {
                    logger_1.default.warn("🐌 Slow GraphQL query:", {
                        operationName,
                        operationType,
                        duration: `${duration.toFixed(3)}s`,
                        userRole,
                        threshold: `${PERFORMANCE_THRESHOLDS.SLOW_QUERY / 1000}s`,
                    });
                }
                // Add performance headers
                if (requestContext.response.http) {
                    requestContext.response.http.headers.set("X-Response-Time", `${duration.toFixed(3)}s`);
                    requestContext.response.http.headers.set("X-Query-Complexity", String(complexity || 0));
                    requestContext.response.http.headers.set("X-Cache-Status", "MISS"); // Would be dynamic
                }
                logger_1.default.debug("✅ GraphQL operation completed:", {
                    operationName,
                    operationType,
                    duration: `${duration.toFixed(3)}s`,
                    status,
                    userRole,
                });
            },
        };
    },
};
/**
 * Cache metrics tracking
 */
function trackCacheHit(cacheType, service) {
    cacheHits.inc({ cache_type: cacheType, service });
}
function trackCacheMiss(cacheType, service) {
    cacheMisses.inc({ cache_type: cacheType, service });
}
/**
 * Database metrics tracking
 */
function trackDatabaseQuery(service, operation, duration) {
    databaseQueries.inc({ service, operation });
    databaseQueryDuration.observe({ service, operation }, duration / 1000);
}
/**
 * DataLoader metrics tracking
 */
function trackDataLoaderBatch(loaderName) {
    dataLoaderBatches.inc({ loader_name: loaderName });
}
function trackDataLoaderCacheHit(loaderName) {
    dataLoaderCacheHits.inc({ loader_name: loaderName });
}
/**
 * Get Prometheus metrics
 */
async function getPrometheusMetrics() {
    return prom_client_1.register.metrics();
}
/**
 * Health check with performance data
 */
function getHealthStatus() {
    const metrics = exports.performanceMonitoringService.getMetrics();
    const isHealthy = !exports.performanceMonitoringService.isPerformanceDegraded();
    return {
        status: isHealthy ? "healthy" : "degraded",
        timestamp: new Date().toISOString(),
        metrics: {
            requestCount: metrics.requestCount,
            averageResponseTime: `${metrics.averageResponseTime.toFixed(2)}ms`,
            errorRate: `${(metrics.errorRate * 100).toFixed(2)}%`,
            cacheHitRate: `${(metrics.cacheHitRate * 100).toFixed(2)}%`,
            memoryUsage: `${(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB`,
            activeConnections: metrics.activeConnections,
        },
        thresholds: {
            slowQuery: `${PERFORMANCE_THRESHOLDS.SLOW_QUERY}ms`,
            highComplexity: PERFORMANCE_THRESHOLDS.HIGH_COMPLEXITY,
            memoryWarning: `${PERFORMANCE_THRESHOLDS.MEMORY_WARNING / 1024 / 1024}MB`,
            errorRateWarning: `${PERFORMANCE_THRESHOLDS.ERROR_RATE_WARNING * 100}%`,
        },
    };
}
//# sourceMappingURL=performance-monitoring.middleware.js.map