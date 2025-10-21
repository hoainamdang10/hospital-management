/**
 * PerformanceMonitoringService - Infrastructure Layer
 * Performance monitoring and optimization for Clinical EMR Service
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Performance Optimization, HIPAA
 */
/**
 * Performance Metrics
 */
export interface PerformanceMetrics {
    timestamp: Date;
    operation: string;
    duration: number;
    success: boolean;
    recordCount?: number;
    memoryUsage?: {
        used: number;
        total: number;
        percentage: number;
    };
    databaseMetrics?: {
        queryTime: number;
        connectionPoolSize: number;
        activeConnections: number;
    };
    cacheMetrics?: {
        hitRate: number;
        missRate: number;
        size: number;
    };
    errorDetails?: {
        type: string;
        message: string;
        stack?: string;
    };
}
/**
 * Performance Thresholds
 */
export interface PerformanceThresholds {
    maxResponseTime: number;
    maxMemoryUsage: number;
    minCacheHitRate: number;
    maxDatabaseQueryTime: number;
    maxConcurrentOperations: number;
}
/**
 * Performance Alert
 */
export interface PerformanceAlert {
    id: string;
    timestamp: Date;
    severity: 'low' | 'medium' | 'high' | 'critical';
    type: 'response_time' | 'memory_usage' | 'cache_performance' | 'database_performance' | 'error_rate';
    message: string;
    metrics: PerformanceMetrics;
    threshold: number;
    actualValue: number;
    recommendations: string[];
}
/**
 * Performance Report
 */
export interface PerformanceReport {
    period: {
        start: Date;
        end: Date;
    };
    summary: {
        totalOperations: number;
        successRate: number;
        averageResponseTime: number;
        p95ResponseTime: number;
        p99ResponseTime: number;
        averageMemoryUsage: number;
        averageCacheHitRate: number;
        averageDatabaseQueryTime: number;
    };
    trends: {
        responseTimeTrend: 'improving' | 'stable' | 'degrading';
        memoryUsageTrend: 'improving' | 'stable' | 'degrading';
        cachePerformanceTrend: 'improving' | 'stable' | 'degrading';
    };
    alerts: PerformanceAlert[];
    recommendations: string[];
}
/**
 * Performance Monitoring Service
 */
export declare class PerformanceMonitoringService {
    private metrics;
    private alerts;
    private activeOperations;
    private readonly thresholds;
    /**
     * Start monitoring an operation
     */
    startOperation(operationId: string, operation: string): void;
    /**
     * End monitoring an operation
     */
    endOperation(operationId: string, success: boolean, recordCount?: number, errorDetails?: {
        type: string;
        message: string;
        stack?: string;
    }): PerformanceMetrics;
    /**
     * Get current performance metrics
     */
    getCurrentMetrics(): {
        activeOperations: number;
        averageResponseTime: number;
        successRate: number;
        memoryUsage: number;
        cacheHitRate: number;
        recentAlerts: number;
    };
    /**
     * Generate performance report
     */
    generateReport(periodMinutes?: number): PerformanceReport;
    /**
     * Get recent metrics
     */
    private getRecentMetrics;
    /**
     * Get current memory usage
     */
    private getMemoryUsage;
    /**
     * Get database metrics (placeholder - would integrate with actual DB monitoring)
     */
    private getDatabaseMetrics;
    /**
     * Get cache metrics (placeholder - would integrate with actual cache monitoring)
     */
    private getCacheMetrics;
    /**
     * Check performance thresholds and generate alerts
     */
    private checkPerformanceThresholds;
    /**
     * Calculate performance trends
     */
    private calculateTrends;
    /**
     * Get trend direction
     */
    private getTrend;
    /**
     * Generate performance recommendations
     */
    private generateRecommendations;
    /**
     * Clear old metrics and alerts
     */
    clearOldData(olderThanHours?: number): void;
    /**
     * Get all alerts
     */
    getAlerts(severity?: 'low' | 'medium' | 'high' | 'critical'): PerformanceAlert[];
    /**
     * Update performance thresholds
     */
    updateThresholds(newThresholds: Partial<PerformanceThresholds>): void;
    /**
     * Get current thresholds
     */
    getThresholds(): PerformanceThresholds;
}
//# sourceMappingURL=PerformanceMonitoringService.d.ts.map