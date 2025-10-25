/**
 * Supabase Free Tier Optimization Configuration
 * Optimizes V2 system for Supabase free tier constraints
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Free Tier Optimization, Healthcare Standards
 */
export interface SupabaseOptimizationConfig {
    connectionPool: {
        maxConnections: number;
        minConnections: number;
        acquireTimeoutMs: number;
        idleTimeoutMs: number;
        connectionRetries: number;
    };
    queryOptimization: {
        maxQueryTimeMs: number;
        enableQueryCache: boolean;
        batchSize: number;
        enableCompression: boolean;
    };
    storageOptimization: {
        maxFileSize: number;
        enableCompression: boolean;
        externalStorageThreshold: number;
        cleanupInterval: number;
    };
    bandwidthOptimization: {
        enableGzipCompression: boolean;
        enableResponseCaching: boolean;
        maxResponseSize: number;
        enablePagination: boolean;
    };
    monitoring: {
        enableUsageTracking: boolean;
        alertThresholds: {
            storageUsage: number;
            bandwidthUsage: number;
            connectionUsage: number;
        };
    };
}
/**
 * Optimized configuration for Supabase Free Tier
 */
export declare const supabaseOptimizationConfig: SupabaseOptimizationConfig;
/**
 * Environment-specific overrides
 */
export declare const getOptimizedConfig: (env?: string) => SupabaseOptimizationConfig;
/**
 * Usage tracking utilities
 */
export interface UsageMetrics {
    storageUsed: number;
    bandwidthUsed: number;
    connectionsActive: number;
    queriesPerMinute: number;
    timestamp: Date;
}
export declare class SupabaseUsageTracker {
    private metrics;
    private config;
    constructor(config: SupabaseOptimizationConfig);
    /**
     * Track current usage metrics
     */
    trackUsage(): Promise<UsageMetrics>;
    /**
     * Check if usage exceeds thresholds
     */
    private checkThresholds;
    /**
     * Get storage usage (mock implementation)
     */
    private getStorageUsage;
    /**
     * Get bandwidth usage (mock implementation)
     */
    private getBandwidthUsage;
    /**
     * Get active connections (mock implementation)
     */
    private getActiveConnections;
    /**
     * Get queries per minute (mock implementation)
     */
    private getQueriesPerMinute;
    /**
     * Get usage summary
     */
    getUsageSummary(): {
        current: UsageMetrics | null;
        average: Partial<UsageMetrics>;
        peak: Partial<UsageMetrics>;
    };
}
/**
 * Export singleton instance
 */
export declare const usageTracker: SupabaseUsageTracker;
//# sourceMappingURL=supabase-optimization.config.d.ts.map