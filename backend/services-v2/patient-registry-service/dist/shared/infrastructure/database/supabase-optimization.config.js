"use strict";
/**
 * Supabase Free Tier Optimization Configuration
 * Optimizes V2 system for Supabase free tier constraints
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Free Tier Optimization, Healthcare Standards
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.usageTracker = exports.SupabaseUsageTracker = exports.getOptimizedConfig = exports.supabaseOptimizationConfig = void 0;
/**
 * Optimized configuration for Supabase Free Tier
 */
exports.supabaseOptimizationConfig = {
    // =====================================================
    // CONNECTION POOL OPTIMIZATION
    // =====================================================
    connectionPool: {
        maxConnections: 15, // Well below 60 limit
        minConnections: 3, // Minimal idle connections
        acquireTimeoutMs: 10000, // 10s timeout
        idleTimeoutMs: 300000, // 5min idle timeout
        connectionRetries: 3, // Retry failed connections
    },
    // =====================================================
    // QUERY PERFORMANCE OPTIMIZATION
    // =====================================================
    queryOptimization: {
        maxQueryTimeMs: 5000, // 5s max query time
        enableQueryCache: true, // Enable Redis caching
        batchSize: 50, // Batch operations
        enableCompression: true, // Compress large responses
    },
    // =====================================================
    // STORAGE OPTIMIZATION
    // =====================================================
    storageOptimization: {
        maxFileSize: 5 * 1024 * 1024, // 5MB max file
        enableCompression: true, // Compress files
        externalStorageThreshold: 1024 * 1024, // 1MB threshold
        cleanupInterval: 24 * 60 * 60 * 1000, // Daily cleanup
    },
    // =====================================================
    // BANDWIDTH OPTIMIZATION
    // =====================================================
    bandwidthOptimization: {
        enableGzipCompression: true, // Compress responses
        enableResponseCaching: true, // Cache responses
        maxResponseSize: 1024 * 1024, // 1MB max response
        enablePagination: true, // Always paginate
    },
    // =====================================================
    // MONITORING & ALERTS
    // =====================================================
    monitoring: {
        enableUsageTracking: true,
        alertThresholds: {
            storageUsage: 0.8, // Alert at 80% (400MB)
            bandwidthUsage: 0.8, // Alert at 80% (1.6GB)
            connectionUsage: 0.7, // Alert at 70% (42 connections)
        },
    },
};
/**
 * Environment-specific overrides
 */
const getOptimizedConfig = (env = 'development') => {
    const baseConfig = { ...exports.supabaseOptimizationConfig };
    switch (env) {
        case 'production':
            return {
                ...baseConfig,
                connectionPool: {
                    ...baseConfig.connectionPool,
                    maxConnections: 20, // Higher for production
                    minConnections: 5,
                },
                queryOptimization: {
                    ...baseConfig.queryOptimization,
                    maxQueryTimeMs: 3000, // Stricter in production
                },
            };
        case 'development':
            return {
                ...baseConfig,
                connectionPool: {
                    ...baseConfig.connectionPool,
                    maxConnections: 10, // Lower for development
                    minConnections: 2,
                },
                monitoring: {
                    ...baseConfig.monitoring,
                    enableUsageTracking: false, // Disable in dev
                },
            };
        case 'test':
            return {
                ...baseConfig,
                connectionPool: {
                    ...baseConfig.connectionPool,
                    maxConnections: 5, // Minimal for testing
                    minConnections: 1,
                },
                queryOptimization: {
                    ...baseConfig.queryOptimization,
                    enableQueryCache: false, // No cache in tests
                },
            };
        default:
            return baseConfig;
    }
};
exports.getOptimizedConfig = getOptimizedConfig;
class SupabaseUsageTracker {
    constructor(config) {
        this.metrics = [];
        this.config = config;
    }
    /**
     * Track current usage metrics
     */
    async trackUsage() {
        const metrics = {
            storageUsed: await this.getStorageUsage(),
            bandwidthUsed: await this.getBandwidthUsage(),
            connectionsActive: await this.getActiveConnections(),
            queriesPerMinute: await this.getQueriesPerMinute(),
            timestamp: new Date(),
        };
        this.metrics.push(metrics);
        this.checkThresholds(metrics);
        return metrics;
    }
    /**
     * Check if usage exceeds thresholds
     */
    checkThresholds(metrics) {
        const thresholds = this.config.monitoring.alertThresholds;
        if (metrics.storageUsed / (500 * 1024 * 1024) > thresholds.storageUsage) {
            console.warn(` Storage usage alert: ${(metrics.storageUsed / 1024 / 1024).toFixed(2)}MB`);
        }
        if (metrics.bandwidthUsed / (2 * 1024 * 1024 * 1024) > thresholds.bandwidthUsage) {
            console.warn(` Bandwidth usage alert: ${(metrics.bandwidthUsed / 1024 / 1024).toFixed(2)}MB`);
        }
        if (metrics.connectionsActive / 60 > thresholds.connectionUsage) {
            console.warn(` Connection usage alert: ${metrics.connectionsActive} active connections`);
        }
    }
    /**
     * Get storage usage (mock implementation)
     */
    async getStorageUsage() {
        // TODO: Implement actual storage usage tracking
        return 0;
    }
    /**
     * Get bandwidth usage (mock implementation)
     */
    async getBandwidthUsage() {
        // TODO: Implement actual bandwidth usage tracking
        return 0;
    }
    /**
     * Get active connections (mock implementation)
     */
    async getActiveConnections() {
        // TODO: Implement actual connection tracking
        return 0;
    }
    /**
     * Get queries per minute (mock implementation)
     */
    async getQueriesPerMinute() {
        // TODO: Implement actual query rate tracking
        return 0;
    }
    /**
     * Get usage summary
     */
    getUsageSummary() {
        if (this.metrics.length === 0) {
            return { current: null, average: {}, peak: {} };
        }
        const current = this.metrics[this.metrics.length - 1];
        const average = {
            storageUsed: this.metrics.reduce((sum, m) => sum + m.storageUsed, 0) / this.metrics.length,
            bandwidthUsed: this.metrics.reduce((sum, m) => sum + m.bandwidthUsed, 0) / this.metrics.length,
            connectionsActive: this.metrics.reduce((sum, m) => sum + m.connectionsActive, 0) / this.metrics.length,
            queriesPerMinute: this.metrics.reduce((sum, m) => sum + m.queriesPerMinute, 0) / this.metrics.length,
        };
        const peak = {
            storageUsed: Math.max(...this.metrics.map(m => m.storageUsed)),
            bandwidthUsed: Math.max(...this.metrics.map(m => m.bandwidthUsed)),
            connectionsActive: Math.max(...this.metrics.map(m => m.connectionsActive)),
            queriesPerMinute: Math.max(...this.metrics.map(m => m.queriesPerMinute)),
        };
        return { current, average, peak };
    }
}
exports.SupabaseUsageTracker = SupabaseUsageTracker;
/**
 * Export singleton instance
 */
exports.usageTracker = new SupabaseUsageTracker(exports.supabaseOptimizationConfig);
//# sourceMappingURL=supabase-optimization.config.js.map