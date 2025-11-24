"use strict";
/**
 * Metrics Service
 * Collects and exposes application metrics
 *
 * @author Hospital Management Team
 * @version 1.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricsService = void 0;
/**
 * Metrics Service
 */
class MetricsService {
    constructor() {
        this.responseTimes = [];
        this.maxResponseTimeSamples = 1000;
        // Request metrics
        this.totalRequests = 0;
        this.successRequests = 0;
        this.errorRequests = 0;
        this.requestsByStatus = new Map();
        this.requestsByEndpoint = new Map();
        // Business metrics
        this.appointmentsScheduled = 0;
        this.appointmentsCancelled = 0;
        this.appointmentsCompleted = 0;
        this.appointmentsNoShow = 0;
        // Event metrics
        this.eventsPublished = 0;
        this.eventsConsumed = 0;
        this.eventsFailed = 0;
        // Cache metrics
        this.cacheHits = 0;
        this.cacheMisses = 0;
        this.startTime = Date.now();
    }
    /**
     * Record HTTP request
     */
    recordRequest(statusCode, endpoint, responseTime) {
        this.totalRequests++;
        if (statusCode >= 200 && statusCode < 300) {
            this.successRequests++;
        }
        else if (statusCode >= 400) {
            this.errorRequests++;
        }
        // Record by status
        const count = this.requestsByStatus.get(statusCode) || 0;
        this.requestsByStatus.set(statusCode, count + 1);
        // Record by endpoint
        const endpointCount = this.requestsByEndpoint.get(endpoint) || 0;
        this.requestsByEndpoint.set(endpoint, endpointCount + 1);
        // Record response time
        this.recordResponseTime(responseTime);
    }
    /**
     * Record response time
     */
    recordResponseTime(time) {
        this.responseTimes.push(time);
        // Keep only last N samples
        if (this.responseTimes.length > this.maxResponseTimeSamples) {
            this.responseTimes.shift();
        }
    }
    /**
     * Record appointment scheduled
     */
    recordAppointmentScheduled() {
        this.appointmentsScheduled++;
    }
    /**
     * Record appointment cancelled
     */
    recordAppointmentCancelled() {
        this.appointmentsCancelled++;
    }
    /**
     * Record appointment completed
     */
    recordAppointmentCompleted() {
        this.appointmentsCompleted++;
    }
    /**
     * Record appointment no-show
     */
    recordAppointmentNoShow() {
        this.appointmentsNoShow++;
    }
    /**
     * Record event published
     */
    recordEventPublished() {
        this.eventsPublished++;
    }
    /**
     * Record event consumed
     */
    recordEventConsumed() {
        this.eventsConsumed++;
    }
    /**
     * Record event failed
     */
    recordEventFailed() {
        this.eventsFailed++;
    }
    /**
     * Record cache hit
     */
    recordCacheHit() {
        this.cacheHits++;
    }
    /**
     * Record cache miss
     */
    recordCacheMiss() {
        this.cacheMisses++;
    }
    /**
     * Get all metrics
     */
    getMetrics() {
        const sortedTimes = [...this.responseTimes].sort((a, b) => a - b);
        const avgResponseTime = sortedTimes.length > 0
            ? sortedTimes.reduce((sum, time) => sum + time, 0) / sortedTimes.length
            : 0;
        const p50 = this.getPercentile(sortedTimes, 50);
        const p95 = this.getPercentile(sortedTimes, 95);
        const p99 = this.getPercentile(sortedTimes, 99);
        const slowRequests = this.responseTimes.filter(time => time > 1000).length;
        const totalCacheRequests = this.cacheHits + this.cacheMisses;
        const hitRate = totalCacheRequests > 0 ? this.cacheHits / totalCacheRequests : 0;
        return {
            requests: {
                total: this.totalRequests,
                success: this.successRequests,
                errors: this.errorRequests,
                byStatus: Object.fromEntries(this.requestsByStatus),
                byEndpoint: Object.fromEntries(this.requestsByEndpoint),
            },
            performance: {
                averageResponseTime: Math.round(avgResponseTime),
                p50ResponseTime: Math.round(p50),
                p95ResponseTime: Math.round(p95),
                p99ResponseTime: Math.round(p99),
                slowRequests,
            },
            business: {
                appointmentsScheduled: this.appointmentsScheduled,
                appointmentsCancelled: this.appointmentsCancelled,
                appointmentsCompleted: this.appointmentsCompleted,
                appointmentsNoShow: this.appointmentsNoShow,
            },
            system: {
                uptime: Math.floor((Date.now() - this.startTime) / 1000),
                memoryUsage: process.memoryUsage(),
                cpuUsage: process.cpuUsage(),
            },
            events: {
                published: this.eventsPublished,
                consumed: this.eventsConsumed,
                failed: this.eventsFailed,
            },
            cache: {
                hits: this.cacheHits,
                misses: this.cacheMisses,
                hitRate: Math.round(hitRate * 100) / 100,
            },
        };
    }
    /**
     * Get percentile value
     */
    getPercentile(sortedArray, percentile) {
        if (sortedArray.length === 0)
            return 0;
        const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
        return sortedArray[Math.max(0, index)];
    }
    /**
     * Reset metrics
     */
    reset() {
        this.totalRequests = 0;
        this.successRequests = 0;
        this.errorRequests = 0;
        this.requestsByStatus.clear();
        this.requestsByEndpoint.clear();
        this.responseTimes = [];
        this.appointmentsScheduled = 0;
        this.appointmentsCancelled = 0;
        this.appointmentsCompleted = 0;
        this.appointmentsNoShow = 0;
        this.eventsPublished = 0;
        this.eventsConsumed = 0;
        this.eventsFailed = 0;
        this.cacheHits = 0;
        this.cacheMisses = 0;
    }
    /**
     * Get Prometheus-compatible metrics
     */
    getPrometheusMetrics() {
        const metrics = this.getMetrics();
        const lines = [];
        // Request metrics
        lines.push('# HELP http_requests_total Total number of HTTP requests');
        lines.push('# TYPE http_requests_total counter');
        lines.push(`http_requests_total ${metrics.requests.total}`);
        lines.push('# HELP http_requests_success Total number of successful HTTP requests');
        lines.push('# TYPE http_requests_success counter');
        lines.push(`http_requests_success ${metrics.requests.success}`);
        lines.push('# HELP http_requests_errors Total number of failed HTTP requests');
        lines.push('# TYPE http_requests_errors counter');
        lines.push(`http_requests_errors ${metrics.requests.errors}`);
        // Performance metrics
        lines.push('# HELP http_response_time_avg Average response time in milliseconds');
        lines.push('# TYPE http_response_time_avg gauge');
        lines.push(`http_response_time_avg ${metrics.performance.averageResponseTime}`);
        lines.push('# HELP http_response_time_p95 95th percentile response time in milliseconds');
        lines.push('# TYPE http_response_time_p95 gauge');
        lines.push(`http_response_time_p95 ${metrics.performance.p95ResponseTime}`);
        // Business metrics
        lines.push('# HELP appointments_scheduled_total Total appointments scheduled');
        lines.push('# TYPE appointments_scheduled_total counter');
        lines.push(`appointments_scheduled_total ${metrics.business.appointmentsScheduled}`);
        lines.push('# HELP appointments_cancelled_total Total appointments cancelled');
        lines.push('# TYPE appointments_cancelled_total counter');
        lines.push(`appointments_cancelled_total ${metrics.business.appointmentsCancelled}`);
        // System metrics
        lines.push('# HELP process_uptime_seconds Process uptime in seconds');
        lines.push('# TYPE process_uptime_seconds gauge');
        lines.push(`process_uptime_seconds ${metrics.system.uptime}`);
        return lines.join('\n');
    }
}
exports.MetricsService = MetricsService;
//# sourceMappingURL=MetricsService.js.map