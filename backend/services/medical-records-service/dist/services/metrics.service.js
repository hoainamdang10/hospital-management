"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.metricsService = exports.MetricsService = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
class MetricsService {
    constructor() {
        this.supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
        this.metrics = [];
        this.BATCH_SIZE = 100;
        this.FLUSH_INTERVAL = 30000; // 30 seconds
        // Auto-flush metrics periodically
        setInterval(() => {
            this.flushMetrics();
        }, this.FLUSH_INTERVAL);
        // Flush on process exit
        process.on("SIGINT", () => {
            this.flushMetrics();
            process.exit(0);
        });
    }
    // Record performance metrics
    recordPerformance(metric) {
        this.addMetric("medical_records.performance", metric.duration_ms, {
            operation: metric.operation,
            success: metric.success.toString(),
            user_id: metric.user_id || "unknown",
            resource_count: metric.resource_count?.toString() || "0",
            cache_hit: metric.cache_hit?.toString() || "false",
        });
    }
    // Record API usage metrics
    recordAPIUsage(endpoint, method, statusCode, responseTime) {
        this.addMetric("medical_records.api.requests", 1, {
            endpoint,
            method,
            status_code: statusCode.toString(),
            response_time_bucket: this.getResponseTimeBucket(responseTime),
        });
        this.addMetric("medical_records.api.response_time", responseTime, {
            endpoint,
            method,
            status_code: statusCode.toString(),
        });
    }
    // Record database metrics
    recordDatabaseOperation(operation, duration, success, recordCount) {
        this.addMetric("medical_records.database.duration", duration, {
            operation,
            success: success.toString(),
            record_count_bucket: recordCount
                ? this.getRecordCountBucket(recordCount)
                : "unknown",
        });
    }
    // Record cache metrics
    recordCacheOperation(operation, key_pattern) {
        this.addMetric("medical_records.cache.operations", 1, {
            operation,
            key_pattern,
        });
    }
    // Record business metrics
    recordBusinessMetric(metric_type, value, tags = {}) {
        this.addMetric(`medical_records.business.${metric_type}`, value, tags);
    }
    // Record security events
    recordSecurityEvent(event_type, severity, userId) {
        this.addMetric("medical_records.security.events", 1, {
            event_type,
            severity,
            user_id: userId || "unknown",
        });
    }
    // Record error metrics
    recordError(error_type, error_code, operation) {
        this.addMetric("medical_records.errors", 1, {
            error_type,
            error_code: error_code || "unknown",
            operation: operation || "unknown",
        });
    }
    // Helper method to add metrics
    addMetric(name, value, tags) {
        this.metrics.push({
            name,
            value,
            tags: {
                service: "medical-records-service",
                environment: process.env.NODE_ENV || "development",
                ...tags,
            },
            timestamp: new Date(),
        });
        // Auto-flush if batch is full
        if (this.metrics.length >= this.BATCH_SIZE) {
            this.flushMetrics();
        }
    }
    // Flush metrics to storage
    async flushMetrics() {
        if (this.metrics.length === 0)
            return;
        const metricsToFlush = [...this.metrics];
        this.metrics = [];
        try {
            // Insert metrics into database
            const { error } = await this.supabase.from("service_metrics").insert(metricsToFlush.map((metric) => ({
                service_name: "medical-records-service",
                operation: metric.name,
                duration_ms: metric.value,
                success: true,
                timestamp: metric.timestamp,
                metadata: metric.tags,
            })));
            if (error) {
                console.error("Failed to flush metrics:", error);
                // Re-add metrics back to queue on failure
                this.metrics.unshift(...metricsToFlush);
            }
        }
        catch (error) {
            console.error("Error flushing metrics:", error);
            // Re-add metrics back to queue on failure
            this.metrics.unshift(...metricsToFlush);
        }
    }
    // Health check method
    async healthCheck() {
        const health = {
            status: "healthy",
            metrics: {
                pending_metrics: this.metrics.length,
                last_flush: "recent",
            },
        };
        try {
            // Test database connection
            const { error } = await this.supabase
                .from("service_metrics")
                .select("*", { count: "exact", head: true })
                .limit(1);
            if (error) {
                health.status = "degraded";
                health.metrics = { ...health.metrics, database_error: error.message };
            }
        }
        catch (error) {
            health.status = "unhealthy";
            health.metrics = {
                ...health.metrics,
                error: "Database connection failed",
            };
        }
        return health;
    }
    // Get performance metrics
    async getPerformanceMetrics(timeWindow) {
        try {
            const { data, error } = await this.supabase
                .from("service_metrics")
                .select("*")
                .eq("service_name", "medical-records-service")
                .gte("timestamp", new Date(Date.now() - this.getTimeWindowMs(timeWindow)).toISOString())
                .order("timestamp", { ascending: false });
            if (error)
                throw error;
            return {
                total_requests: data?.length || 0,
                avg_response_time: data?.reduce((sum, m) => sum + m.duration_ms, 0) /
                    (data?.length || 1),
                success_rate: data?.filter((m) => m.success).length / (data?.length || 1),
                metrics: data || [],
            };
        }
        catch (error) {
            console.error("Error getting performance metrics:", error);
            return {
                total_requests: 0,
                avg_response_time: 0,
                success_rate: 1,
                metrics: [],
            };
        }
    }
    // Get metrics summary
    async getMetricsSummary(timeWindow) {
        try {
            const metrics = await this.getPerformanceMetrics(timeWindow);
            return {
                summary: {
                    total_operations: metrics.total_requests,
                    average_duration: metrics.avg_response_time,
                    success_rate: metrics.success_rate,
                    pending_metrics: this.metrics.length,
                },
                time_window: timeWindow,
            };
        }
        catch (error) {
            console.error("Error getting metrics summary:", error);
            return {
                summary: {
                    total_operations: 0,
                    average_duration: 0,
                    success_rate: 1,
                    pending_metrics: this.metrics.length,
                },
                time_window: timeWindow,
            };
        }
    }
    // Helper to convert time window string to milliseconds
    getTimeWindowMs(timeWindow) {
        const match = timeWindow.match(/(\d+)([hmsd])/);
        if (!match)
            return 3600000; // Default 1 hour
        const value = parseInt(match[1]);
        const unit = match[2];
        switch (unit) {
            case "s":
                return value * 1000;
            case "m":
                return value * 60 * 1000;
            case "h":
                return value * 60 * 60 * 1000;
            case "d":
                return value * 24 * 60 * 60 * 1000;
            default:
                return 3600000;
        }
    }
    // Utility methods
    getResponseTimeBucket(responseTime) {
        if (responseTime < 100)
            return "<100ms";
        if (responseTime < 500)
            return "100-500ms";
        if (responseTime < 1000)
            return "500ms-1s";
        if (responseTime < 5000)
            return "1-5s";
        return ">5s";
    }
    getRecordCountBucket(count) {
        if (count === 1)
            return "single";
        if (count <= 10)
            return "small";
        if (count <= 100)
            return "medium";
        if (count <= 1000)
            return "large";
        return "bulk";
    }
    getTimeFilter(timeRange) {
        const now = new Date();
        const ranges = {
            "5m": 5 * 60 * 1000,
            "15m": 15 * 60 * 1000,
            "1h": 60 * 60 * 1000,
            "6h": 6 * 60 * 60 * 1000,
            "24h": 24 * 60 * 60 * 1000,
            "7d": 7 * 24 * 60 * 60 * 1000,
        };
        const milliseconds = ranges[timeRange] || ranges["1h"];
        return new Date(now.getTime() - milliseconds).toISOString();
    }
    aggregateMetrics(metrics) {
        const aggregated = {};
        metrics.forEach((metric) => {
            const name = metric.metric_name;
            if (!aggregated[name]) {
                aggregated[name] = {
                    count: 0,
                    sum: 0,
                    min: Number.MAX_VALUE,
                    max: Number.MIN_VALUE,
                    avg: 0,
                };
            }
            aggregated[name].count++;
            aggregated[name].sum += metric.metric_value;
            aggregated[name].min = Math.min(aggregated[name].min, metric.metric_value);
            aggregated[name].max = Math.max(aggregated[name].max, metric.metric_value);
            aggregated[name].avg = aggregated[name].sum / aggregated[name].count;
        });
        return aggregated;
    }
    analyzePerformance(metrics) {
        const operations = {};
        metrics.forEach((metric) => {
            const operation = metric.tags?.operation || "unknown";
            if (!operations[operation]) {
                operations[operation] = [];
            }
            operations[operation].push(metric.metric_value);
        });
        const analysis = {};
        Object.entries(operations).forEach(([operation, times]) => {
            const sorted = times.sort((a, b) => a - b);
            analysis[operation] = {
                count: times.length,
                avg: times.reduce((a, b) => a + b, 0) / times.length,
                min: sorted[0],
                max: sorted[sorted.length - 1],
                p50: sorted[Math.floor(sorted.length * 0.5)],
                p95: sorted[Math.floor(sorted.length * 0.95)],
                p99: sorted[Math.floor(sorted.length * 0.99)],
            };
        });
        return analysis;
    }
}
exports.MetricsService = MetricsService;
exports.metricsService = new MetricsService();
//# sourceMappingURL=metrics.service.js.map