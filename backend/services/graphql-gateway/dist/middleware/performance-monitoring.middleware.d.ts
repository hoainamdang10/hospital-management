/**
 * Performance Monitoring Middleware for GraphQL Gateway
 * Comprehensive metrics collection and performance tracking
 */
import { ApolloServerPlugin } from "@apollo/server";
import { GraphQLContext } from "../context";
export interface PerformanceMetrics {
    requestCount: number;
    averageResponseTime: number;
    errorRate: number;
    cacheHitRate: number;
    activeConnections: number;
    memoryUsage: number;
}
export declare class PerformanceMonitoringService {
    private requestCount;
    private totalResponseTime;
    private errorCount;
    private startTime;
    /**
     * Get current performance metrics
     */
    getMetrics(): PerformanceMetrics;
    /**
     * Calculate cache hit rate
     */
    private calculateCacheHitRate;
    /**
     * Get active connections count
     */
    private getActiveConnections;
    /**
     * Record request metrics
     */
    recordRequest(duration: number, hasError: boolean): void;
    /**
     * Check if performance is degraded
     */
    isPerformanceDegraded(): boolean;
}
export declare const performanceMonitoringService: PerformanceMonitoringService;
/**
 * Apollo Server Performance Monitoring Plugin
 */
export declare const performanceMonitoringPlugin: ApolloServerPlugin<GraphQLContext>;
/**
 * Cache metrics tracking
 */
export declare function trackCacheHit(cacheType: string, service: string): void;
export declare function trackCacheMiss(cacheType: string, service: string): void;
/**
 * Database metrics tracking
 */
export declare function trackDatabaseQuery(service: string, operation: string, duration: number): void;
/**
 * DataLoader metrics tracking
 */
export declare function trackDataLoaderBatch(loaderName: string): void;
export declare function trackDataLoaderCacheHit(loaderName: string): void;
/**
 * Get Prometheus metrics
 */
export declare function getPrometheusMetrics(): Promise<string>;
/**
 * Health check with performance data
 */
export declare function getHealthStatus(): any;
//# sourceMappingURL=performance-monitoring.middleware.d.ts.map