interface PerformanceMetric {
    operation: string;
    duration_ms: number;
    success: boolean;
    user_id?: string;
    resource_count?: number;
    cache_hit?: boolean;
}
export declare class MetricsService {
    private supabase;
    private metrics;
    private readonly BATCH_SIZE;
    private readonly FLUSH_INTERVAL;
    constructor();
    recordPerformance(metric: PerformanceMetric): void;
    recordAPIUsage(endpoint: string, method: string, statusCode: number, responseTime: number): void;
    recordDatabaseOperation(operation: string, duration: number, success: boolean, recordCount?: number): void;
    recordCacheOperation(operation: "hit" | "miss" | "set" | "invalidate", key_pattern: string): void;
    recordBusinessMetric(metric_type: string, value: number, tags?: {
        [key: string]: string;
    }): void;
    recordSecurityEvent(event_type: string, severity: "low" | "medium" | "high" | "critical", userId?: string): void;
    recordError(error_type: string, error_code?: string, operation?: string): void;
    private addMetric;
    private flushMetrics;
    healthCheck(): Promise<any>;
    getPerformanceMetrics(timeWindow: string): Promise<any>;
    getMetricsSummary(timeWindow: string): Promise<any>;
    private getTimeWindowMs;
    private getResponseTimeBucket;
    private getRecordCountBucket;
    private getTimeFilter;
    private aggregateMetrics;
    private analyzePerformance;
}
export declare const metricsService: MetricsService;
export {};
//# sourceMappingURL=metrics.service.d.ts.map