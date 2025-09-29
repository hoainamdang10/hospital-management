"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.performanceService = void 0;
const logger_1 = __importDefault(require("@hospital/shared/dist/utils/logger"));
class PerformanceService {
    constructor() {
        this.requestHistory = [];
        this.maxHistorySize = 1000;
        this.metricsInterval = null;
        this.isInitialized = false;
        // Performance counters
        this.requestCount = 0;
        this.errorCount = 0;
        this.totalResponseTime = 0;
        this.cacheHits = 0;
        this.cacheMisses = 0;
        this.dataLoaderBatches = 0;
        this.dataLoaderCacheHits = 0;
        this.dataLoaderCacheMisses = 0;
        this.activeSubscriptions = 0;
        this.subscriptionMessages = 0;
        this.connectionCount = 0;
        this.metrics = this.initializeMetrics();
    }
    /**
     * Initialize performance service
     */
    async initialize() {
        try {
            logger_1.default.info('🔄 Initializing Performance Service...');
            // Start metrics collection interval
            this.startMetricsCollection();
            this.isInitialized = true;
            logger_1.default.info('✅ Performance Service initialized successfully');
        }
        catch (error) {
            logger_1.default.error('❌ Failed to initialize Performance Service:', error);
            throw error;
        }
    }
    /**
     * Initialize metrics object
     */
    initializeMetrics() {
        return {
            timestamp: new Date().toISOString(),
            requestCount: 0,
            averageResponseTime: 0,
            errorRate: 0,
            memoryUsage: process.memoryUsage(),
            cpuUsage: 0,
            activeConnections: 0,
            cacheHitRate: 0,
            dataLoaderStats: {
                batchCount: 0,
                averageBatchSize: 0,
                cacheHitRate: 0
            },
            subscriptionStats: {
                activeSubscriptions: 0,
                messagesPerSecond: 0,
                connectionCount: 0
            }
        };
    }
    /**
     * Start metrics collection interval
     */
    startMetricsCollection() {
        this.metricsInterval = setInterval(() => {
            this.updateMetrics();
        }, 10000); // Update every 10 seconds
    }
    /**
     * Update performance metrics
     */
    updateMetrics() {
        try {
            this.metrics = {
                timestamp: new Date().toISOString(),
                requestCount: this.requestCount,
                averageResponseTime: this.requestCount > 0 ? this.totalResponseTime / this.requestCount : 0,
                errorRate: this.requestCount > 0 ? (this.errorCount / this.requestCount) * 100 : 0,
                memoryUsage: process.memoryUsage(),
                cpuUsage: this.getCpuUsage(),
                activeConnections: this.connectionCount,
                cacheHitRate: (this.cacheHits + this.cacheMisses) > 0 ?
                    (this.cacheHits / (this.cacheHits + this.cacheMisses)) * 100 : 0,
                dataLoaderStats: {
                    batchCount: this.dataLoaderBatches,
                    averageBatchSize: this.dataLoaderBatches > 0 ? this.requestCount / this.dataLoaderBatches : 0,
                    cacheHitRate: (this.dataLoaderCacheHits + this.dataLoaderCacheMisses) > 0 ?
                        (this.dataLoaderCacheHits / (this.dataLoaderCacheHits + this.dataLoaderCacheMisses)) * 100 : 0
                },
                subscriptionStats: {
                    activeSubscriptions: this.activeSubscriptions,
                    messagesPerSecond: this.subscriptionMessages / 10, // Messages per second over last 10 seconds
                    connectionCount: this.connectionCount
                }
            };
            // Reset per-interval counters
            this.subscriptionMessages = 0;
            // Log metrics periodically
            if (this.requestCount % 100 === 0 && this.requestCount > 0) {
                this.logMetrics();
            }
        }
        catch (error) {
            logger_1.default.error('❌ Error updating metrics:', error);
        }
    }
    /**
     * Get CPU usage (simplified)
     */
    getCpuUsage() {
        const usage = process.cpuUsage();
        return (usage.user + usage.system) / 1000000; // Convert to seconds
    }
    /**
     * Track GraphQL request start
     */
    trackRequestStart(query, variables, operationName) {
        const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const requestMetrics = {
            startTime: Date.now(),
            query,
            variables,
            operationName,
            success: false
        };
        this.requestHistory.push(requestMetrics);
        // Keep history size manageable
        if (this.requestHistory.length > this.maxHistorySize) {
            this.requestHistory.shift();
        }
        this.requestCount++;
        return requestId;
    }
    /**
     * Track GraphQL request end
     */
    trackRequestEnd(requestId, success, errorMessage) {
        const request = this.requestHistory[this.requestHistory.length - 1];
        if (request) {
            request.endTime = Date.now();
            request.duration = request.endTime - request.startTime;
            request.success = success;
            request.errorMessage = errorMessage;
            this.totalResponseTime += request.duration;
            if (!success) {
                this.errorCount++;
            }
        }
    }
    /**
     * Track cache hit/miss
     */
    trackCacheHit(hit) {
        if (hit) {
            this.cacheHits++;
        }
        else {
            this.cacheMisses++;
        }
    }
    /**
     * Track DataLoader usage
     */
    trackDataLoaderBatch(batchSize) {
        this.dataLoaderBatches++;
    }
    /**
     * Track DataLoader cache hit/miss
     */
    trackDataLoaderCache(hit) {
        if (hit) {
            this.dataLoaderCacheHits++;
        }
        else {
            this.dataLoaderCacheMisses++;
        }
    }
    /**
     * Track subscription events
     */
    trackSubscriptionEvent(event) {
        switch (event) {
            case 'connect':
                this.activeSubscriptions++;
                this.connectionCount++;
                break;
            case 'disconnect':
                this.activeSubscriptions--;
                break;
            case 'message':
                this.subscriptionMessages++;
                break;
        }
    }
    /**
     * Get current metrics
     */
    getMetrics() {
        return { ...this.metrics };
    }
    /**
     * Get request history
     */
    getRequestHistory(limit = 100) {
        return this.requestHistory.slice(-limit);
    }
    /**
     * Get performance summary
     */
    getPerformanceSummary() {
        const recentRequests = this.getRequestHistory(100);
        const successfulRequests = recentRequests.filter(r => r.success);
        const failedRequests = recentRequests.filter(r => !r.success);
        return {
            overview: {
                totalRequests: this.requestCount,
                successRate: this.requestCount > 0 ? ((this.requestCount - this.errorCount) / this.requestCount) * 100 : 0,
                averageResponseTime: this.metrics.averageResponseTime,
                cacheHitRate: this.metrics.cacheHitRate
            },
            recent: {
                last100Requests: recentRequests.length,
                successfulRequests: successfulRequests.length,
                failedRequests: failedRequests.length,
                averageResponseTime: successfulRequests.length > 0 ?
                    successfulRequests.reduce((sum, r) => sum + (r.duration || 0), 0) / successfulRequests.length : 0
            },
            dataLoader: this.metrics.dataLoaderStats,
            subscriptions: this.metrics.subscriptionStats,
            system: {
                memoryUsage: this.metrics.memoryUsage,
                cpuUsage: this.metrics.cpuUsage,
                uptime: process.uptime()
            }
        };
    }
    /**
     * Log performance metrics
     */
    logMetrics() {
        const summary = this.getPerformanceSummary();
        logger_1.default.info('📊 Performance Metrics:', {
            requests: summary.overview.totalRequests,
            successRate: `${summary.overview.successRate.toFixed(2)}%`,
            avgResponseTime: `${summary.overview.averageResponseTime.toFixed(2)}ms`,
            cacheHitRate: `${summary.overview.cacheHitRate.toFixed(2)}%`,
            memoryMB: Math.round(summary.system.memoryUsage.heapUsed / 1024 / 1024),
            activeSubscriptions: summary.subscriptions.activeSubscriptions
        });
    }
    /**
     * Reset metrics
     */
    resetMetrics() {
        this.requestCount = 0;
        this.errorCount = 0;
        this.totalResponseTime = 0;
        this.cacheHits = 0;
        this.cacheMisses = 0;
        this.dataLoaderBatches = 0;
        this.dataLoaderCacheHits = 0;
        this.dataLoaderCacheMisses = 0;
        this.requestHistory = [];
        this.metrics = this.initializeMetrics();
        logger_1.default.info('🔄 Performance metrics reset');
    }
    /**
     * Check if service is ready
     */
    isReady() {
        return this.isInitialized;
    }
    /**
     * Cleanup resources
     */
    async cleanup() {
        try {
            logger_1.default.info('🧹 Cleaning up Performance Service...');
            if (this.metricsInterval) {
                clearInterval(this.metricsInterval);
                this.metricsInterval = null;
            }
            this.isInitialized = false;
            logger_1.default.info('✅ Performance Service cleanup completed');
        }
        catch (error) {
            logger_1.default.error('❌ Failed to cleanup Performance Service:', error);
        }
    }
}
// Export singleton instance
exports.performanceService = new PerformanceService();
exports.default = exports.performanceService;
//# sourceMappingURL=performance.service.js.map