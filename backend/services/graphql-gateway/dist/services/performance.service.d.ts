interface PerformanceMetrics {
    timestamp: string;
    requestCount: number;
    averageResponseTime: number;
    errorRate: number;
    memoryUsage: NodeJS.MemoryUsage;
    cpuUsage: number;
    activeConnections: number;
    cacheHitRate: number;
    dataLoaderStats: {
        batchCount: number;
        averageBatchSize: number;
        cacheHitRate: number;
    };
    subscriptionStats: {
        activeSubscriptions: number;
        messagesPerSecond: number;
        connectionCount: number;
    };
}
interface RequestMetrics {
    startTime: number;
    endTime?: number;
    duration?: number;
    query?: string;
    variables?: any;
    operationName?: string;
    success: boolean;
    errorMessage?: string;
    cacheHit?: boolean;
    dataLoaderUsed?: boolean;
}
declare class PerformanceService {
    private metrics;
    private requestHistory;
    private maxHistorySize;
    private metricsInterval;
    private isInitialized;
    private requestCount;
    private errorCount;
    private totalResponseTime;
    private cacheHits;
    private cacheMisses;
    private dataLoaderBatches;
    private dataLoaderCacheHits;
    private dataLoaderCacheMisses;
    private activeSubscriptions;
    private subscriptionMessages;
    private connectionCount;
    constructor();
    /**
     * Initialize performance service
     */
    initialize(): Promise<void>;
    /**
     * Initialize metrics object
     */
    private initializeMetrics;
    /**
     * Start metrics collection interval
     */
    private startMetricsCollection;
    /**
     * Update performance metrics
     */
    private updateMetrics;
    /**
     * Get CPU usage (simplified)
     */
    private getCpuUsage;
    /**
     * Track GraphQL request start
     */
    trackRequestStart(query?: string, variables?: any, operationName?: string): string;
    /**
     * Track GraphQL request end
     */
    trackRequestEnd(requestId: string, success: boolean, errorMessage?: string): void;
    /**
     * Track cache hit/miss
     */
    trackCacheHit(hit: boolean): void;
    /**
     * Track DataLoader usage
     */
    trackDataLoaderBatch(batchSize: number): void;
    /**
     * Track DataLoader cache hit/miss
     */
    trackDataLoaderCache(hit: boolean): void;
    /**
     * Track subscription events
     */
    trackSubscriptionEvent(event: 'connect' | 'disconnect' | 'message'): void;
    /**
     * Get current metrics
     */
    getMetrics(): PerformanceMetrics;
    /**
     * Get request history
     */
    getRequestHistory(limit?: number): RequestMetrics[];
    /**
     * Get performance summary
     */
    getPerformanceSummary(): any;
    /**
     * Log performance metrics
     */
    private logMetrics;
    /**
     * Reset metrics
     */
    resetMetrics(): void;
    /**
     * Check if service is ready
     */
    isReady(): boolean;
    /**
     * Cleanup resources
     */
    cleanup(): Promise<void>;
}
export declare const performanceService: PerformanceService;
export default performanceService;
//# sourceMappingURL=performance.service.d.ts.map