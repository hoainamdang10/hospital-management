/**
 * Metrics Service
 * Collects and exposes application metrics
 *
 * @author Hospital Management Team
 * @version 1.0.0
 */
export interface Metrics {
    requests: {
        total: number;
        success: number;
        errors: number;
        byStatus: Record<number, number>;
        byEndpoint: Record<string, number>;
    };
    performance: {
        averageResponseTime: number;
        p50ResponseTime: number;
        p95ResponseTime: number;
        p99ResponseTime: number;
        slowRequests: number;
    };
    business: {
        appointmentsScheduled: number;
        appointmentsCancelled: number;
        appointmentsCompleted: number;
        appointmentsNoShow: number;
    };
    system: {
        uptime: number;
        memoryUsage: NodeJS.MemoryUsage;
        cpuUsage: NodeJS.CpuUsage;
    };
    events: {
        published: number;
        consumed: number;
        failed: number;
    };
    cache: {
        hits: number;
        misses: number;
        hitRate: number;
    };
}
/**
 * Metrics Service
 */
export declare class MetricsService {
    private startTime;
    private responseTimes;
    private maxResponseTimeSamples;
    private totalRequests;
    private successRequests;
    private errorRequests;
    private requestsByStatus;
    private requestsByEndpoint;
    private appointmentsScheduled;
    private appointmentsCancelled;
    private appointmentsCompleted;
    private appointmentsNoShow;
    private eventsPublished;
    private eventsConsumed;
    private eventsFailed;
    private cacheHits;
    private cacheMisses;
    constructor();
    /**
     * Record HTTP request
     */
    recordRequest(statusCode: number, endpoint: string, responseTime: number): void;
    /**
     * Record response time
     */
    private recordResponseTime;
    /**
     * Record appointment scheduled
     */
    recordAppointmentScheduled(): void;
    /**
     * Record appointment cancelled
     */
    recordAppointmentCancelled(): void;
    /**
     * Record appointment completed
     */
    recordAppointmentCompleted(): void;
    /**
     * Record appointment no-show
     */
    recordAppointmentNoShow(): void;
    /**
     * Record event published
     */
    recordEventPublished(): void;
    /**
     * Record event consumed
     */
    recordEventConsumed(): void;
    /**
     * Record event failed
     */
    recordEventFailed(): void;
    /**
     * Record cache hit
     */
    recordCacheHit(): void;
    /**
     * Record cache miss
     */
    recordCacheMiss(): void;
    /**
     * Get all metrics
     */
    getMetrics(): Metrics;
    /**
     * Get percentile value
     */
    private getPercentile;
    /**
     * Reset metrics
     */
    reset(): void;
    /**
     * Get Prometheus-compatible metrics
     */
    getPrometheusMetrics(): string;
}
//# sourceMappingURL=MetricsService.d.ts.map