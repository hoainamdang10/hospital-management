"use strict";
// ============================================================================
// CONNECTION POOL HEALTH MIDDLEWARE
// Database connection pool monitoring and health check middleware
// ============================================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createConnectionPoolHealthCheck = createConnectionPoolHealthCheck;
exports.createConnectionPoolMetrics = createConnectionPoolMetrics;
exports.createConnectionPoolStressTest = createConnectionPoolStressTest;
exports.connectionPoolMonitoring = connectionPoolMonitoring;
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * Create connection pool health check endpoint
 */
function createConnectionPoolHealthCheck(serviceName) {
    return async (req, res) => {
        const startTime = Date.now();
        try {
            logger_1.default.info(`[${serviceName}] Performing connection pool health check`);
            // Mock connection pool stats (replace with actual implementation)
            const stats = {
                total_connections: 10,
                active_connections: 3,
                idle_connections: 7,
                waiting_requests: 0,
                max_connections: 20,
                min_connections: 5,
                connection_timeout: 30000,
                idle_timeout: 600000,
                uptime: Date.now() - (24 * 60 * 60 * 1000), // 24 hours
                last_check: new Date().toISOString()
            };
            const responseTime = Date.now() - startTime;
            // Determine health status
            let status = 'healthy';
            const warnings = [];
            const errors = [];
            // Check for degraded performance
            if (stats.active_connections / stats.max_connections > 0.8) {
                status = 'degraded';
                warnings.push('High connection usage (>80%)');
            }
            if (stats.waiting_requests > 0) {
                status = 'degraded';
                warnings.push(`${stats.waiting_requests} requests waiting for connections`);
            }
            // Check for unhealthy conditions
            if (stats.active_connections >= stats.max_connections) {
                status = 'unhealthy';
                errors.push('Connection pool exhausted');
            }
            if (responseTime > 5000) {
                status = 'unhealthy';
                errors.push('Health check response time too high');
            }
            const healthCheck = {
                service: serviceName,
                status,
                timestamp: new Date().toISOString(),
                response_time: responseTime,
                stats,
                ...(warnings.length > 0 && { warnings }),
                ...(errors.length > 0 && { errors })
            };
            const httpStatus = status === 'healthy' ? 200 : status === 'degraded' ? 200 : 503;
            res.status(httpStatus).json({
                success: status !== 'unhealthy',
                data: healthCheck
            });
        }
        catch (error) {
            logger_1.default.error(`[${serviceName}] Connection pool health check failed:`, error);
            const responseTime = Date.now() - startTime;
            res.status(503).json({
                success: false,
                data: {
                    service: serviceName,
                    status: 'unhealthy',
                    timestamp: new Date().toISOString(),
                    response_time: responseTime,
                    errors: [error instanceof Error ? error.message : 'Unknown error']
                }
            });
        }
    };
}
/**
 * Create connection pool metrics endpoint
 */
function createConnectionPoolMetrics(serviceName) {
    return async (req, res) => {
        try {
            logger_1.default.info(`[${serviceName}] Collecting connection pool metrics`);
            // Mock metrics (replace with actual implementation)
            const metrics = {
                service: serviceName,
                timestamp: new Date().toISOString(),
                connections: {
                    total: 10,
                    active: 3,
                    idle: 7,
                    waiting: 0
                },
                performance: {
                    avg_response_time: 45.2,
                    queries_per_second: 125.8,
                    error_rate: 0.02
                },
                health_score: 95.5
            };
            res.json({
                success: true,
                data: metrics
            });
        }
        catch (error) {
            logger_1.default.error(`[${serviceName}] Failed to collect connection pool metrics:`, error);
            res.status(500).json({
                success: false,
                error: {
                    message: 'Failed to collect metrics',
                    details: error instanceof Error ? error.message : 'Unknown error'
                }
            });
        }
    };
}
/**
 * Create connection pool stress test endpoint
 */
function createConnectionPoolStressTest(serviceName) {
    return async (req, res) => {
        try {
            logger_1.default.info(`[${serviceName}] Starting connection pool stress test`);
            const { duration = 30, concurrency = 10 } = req.query;
            const testDuration = Math.min(Number(duration), 300); // Max 5 minutes
            const testConcurrency = Math.min(Number(concurrency), 50); // Max 50 concurrent
            // Mock stress test results (replace with actual implementation)
            const stressTestResults = {
                service: serviceName,
                test_config: {
                    duration: testDuration,
                    concurrency: testConcurrency
                },
                results: {
                    total_requests: testDuration * testConcurrency,
                    successful_requests: Math.floor(testDuration * testConcurrency * 0.98),
                    failed_requests: Math.floor(testDuration * testConcurrency * 0.02),
                    avg_response_time: 52.3,
                    min_response_time: 12.1,
                    max_response_time: 234.7,
                    requests_per_second: testConcurrency * 0.95,
                    error_rate: 0.02
                },
                connection_pool_impact: {
                    max_connections_used: Math.min(testConcurrency + 2, 20),
                    max_waiting_requests: Math.max(0, testConcurrency - 15),
                    pool_exhausted: testConcurrency > 20,
                    performance_degradation: testConcurrency > 15 ? 'moderate' : 'minimal'
                },
                timestamp: new Date().toISOString()
            };
            res.json({
                success: true,
                data: stressTestResults
            });
        }
        catch (error) {
            logger_1.default.error(`[${serviceName}] Connection pool stress test failed:`, error);
            res.status(500).json({
                success: false,
                error: {
                    message: 'Stress test failed',
                    details: error instanceof Error ? error.message : 'Unknown error'
                }
            });
        }
    };
}
/**
 * Connection pool monitoring middleware
 */
function connectionPoolMonitoring(serviceName) {
    return (req, res, next) => {
        const startTime = Date.now();
        // Add connection pool info to request
        req.connectionPool = {
            service: serviceName,
            request_start: startTime
        };
        // Monitor response
        res.on('finish', () => {
            const responseTime = Date.now() - startTime;
            if (responseTime > 1000) {
                logger_1.default.warn(`[${serviceName}] Slow database query detected:`, {
                    path: req.path,
                    method: req.method,
                    response_time: responseTime,
                    status_code: res.statusCode
                });
            }
        });
        next();
    };
}
//# sourceMappingURL=connection-pool-health.js.map