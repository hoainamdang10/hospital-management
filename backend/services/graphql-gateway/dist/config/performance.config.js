"use strict";
/**
 * Performance Configuration for GraphQL Gateway
 * Hospital Management System - Optimized for Vietnamese Healthcare
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.memoryConfig = exports.dbOptimization = exports.httpOptimization = exports.dataLoaderConfig = exports.performanceThresholds = exports.cacheStrategies = exports.performanceConfig = void 0;
exports.performanceConfig = {
    connectionPool: {
        maxConnections: 100,
        keepAlive: true,
        timeout: 30000,
    },
    cache: {
        redis: {
            enabled: true,
            ttl: {
                short: 5 * 60, // 5 minutes - Real-time data
                medium: 30 * 60, // 30 minutes - Semi-static data
                long: 2 * 60 * 60, // 2 hours - Static data
                static: 24 * 60 * 60, // 24 hours - Reference data
            },
        },
        memory: {
            enabled: true,
            maxSize: 100, // MB
        },
    },
    query: {
        maxComplexity: 1000,
        maxDepth: 10,
        timeout: 30000,
        batchSize: 100,
    },
    dataLoader: {
        batchScheduleFn: true,
        maxBatchSize: 100,
        cacheKeyFn: true,
    },
    http: {
        compression: true,
        http2: true,
        keepAlive: true,
    },
};
/**
 * Cache strategies for different data types
 */
exports.cacheStrategies = {
    // Real-time data - Short cache
    appointments: {
        ttl: exports.performanceConfig.cache.redis.ttl.short,
        strategy: 'cache-aside',
    },
    // Semi-static data - Medium cache
    doctors: {
        ttl: exports.performanceConfig.cache.redis.ttl.medium,
        strategy: 'write-through',
    },
    patients: {
        ttl: exports.performanceConfig.cache.redis.ttl.medium,
        strategy: 'write-through',
    },
    // Static reference data - Long cache
    departments: {
        ttl: exports.performanceConfig.cache.redis.ttl.static,
        strategy: 'write-behind',
    },
    specialties: {
        ttl: exports.performanceConfig.cache.redis.ttl.static,
        strategy: 'write-behind',
    },
    // Medical records - Sensitive data with shorter cache
    medicalRecords: {
        ttl: exports.performanceConfig.cache.redis.ttl.short,
        strategy: 'cache-aside',
        encryption: true,
    },
};
/**
 * Performance monitoring thresholds
 */
exports.performanceThresholds = {
    responseTime: {
        excellent: 100, // < 100ms
        good: 500, // < 500ms
        acceptable: 1000, // < 1s
        poor: 2000, // < 2s
    },
    cacheHitRate: {
        excellent: 0.9, // > 90%
        good: 0.8, // > 80%
        acceptable: 0.7, // > 70%
        poor: 0.5, // > 50%
    },
    queryComplexity: {
        low: 100,
        medium: 500,
        high: 800,
        critical: 1000,
    },
};
/**
 * DataLoader batch functions optimization
 */
exports.dataLoaderConfig = {
    // Batch multiple requests within 10ms
    batchScheduleFn: (callback) => {
        setTimeout(callback, 10);
    },
    // Custom cache key function for better cache hits
    cacheKeyFn: (key) => {
        if (typeof key === 'object') {
            return JSON.stringify(key);
        }
        return String(key);
    },
    // Maximum batch size to prevent memory issues
    maxBatchSize: 100,
};
/**
 * HTTP optimization settings
 */
exports.httpOptimization = {
    compression: {
        level: 6,
        threshold: 1024,
        filter: (req, res) => {
            // Don't compress responses with this request header
            if (req.headers['x-no-compression']) {
                return false;
            }
            // Fallback to standard filter function
            return true;
        },
    },
    cors: {
        origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
        credentials: true,
        optionsSuccessStatus: 200,
        maxAge: 86400, // 24 hours
    },
    helmet: {
        contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
        crossOriginEmbedderPolicy: false,
        hsts: {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true,
        },
    },
};
/**
 * Database query optimization
 */
exports.dbOptimization = {
    // Connection pool settings
    pool: {
        min: 2,
        max: 20,
        acquireTimeoutMillis: 30000,
        createTimeoutMillis: 30000,
        destroyTimeoutMillis: 5000,
        idleTimeoutMillis: 30000,
        reapIntervalMillis: 1000,
        createRetryIntervalMillis: 200,
    },
    // Query timeout
    timeout: 30000,
    // Batch query settings
    batch: {
        enabled: true,
        maxSize: 100,
        delay: 10, // ms
    },
};
/**
 * Memory management settings
 */
exports.memoryConfig = {
    // Garbage collection optimization
    gc: {
        // Force GC when memory usage exceeds threshold
        threshold: 0.8, // 80% of heap
        interval: 60000, // Check every minute
    },
    // Memory cache limits
    cache: {
        maxSize: 100 * 1024 * 1024, // 100MB
        maxAge: 30 * 60 * 1000, // 30 minutes
    },
    // Request size limits
    request: {
        maxSize: '10mb',
        maxFields: 1000,
        maxFiles: 10,
    },
};
//# sourceMappingURL=performance.config.js.map