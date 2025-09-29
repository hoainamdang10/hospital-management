"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheService = exports.CACHE_KEYS = void 0;
const node_cache_1 = __importDefault(require("node-cache"));
const logger_1 = __importDefault(require("@hospital/shared/dist/utils/logger"));
// Cache categories with different TTL settings
const CACHE_CONFIGS = {
    // Short-term cache for frequently changing data
    SHORT_TERM: {
        stdTTL: 60, // 1 minute
        checkperiod: 30,
        useClones: false,
        deleteOnExpire: true,
        maxKeys: 1000
    },
    // Medium-term cache for moderately changing data
    MEDIUM_TERM: {
        stdTTL: 300, // 5 minutes
        checkperiod: 120,
        useClones: false,
        deleteOnExpire: true,
        maxKeys: 2000
    },
    // Long-term cache for rarely changing data
    LONG_TERM: {
        stdTTL: 1800, // 30 minutes
        checkperiod: 600,
        useClones: false,
        deleteOnExpire: true,
        maxKeys: 500
    },
    // Static cache for data that rarely changes
    STATIC: {
        stdTTL: 3600, // 1 hour
        checkperiod: 1800,
        useClones: false,
        deleteOnExpire: true,
        maxKeys: 200
    }
};
// Cache key prefixes
exports.CACHE_KEYS = {
    // Doctor-related caches
    DOCTOR_PROFILE: 'doctor:profile',
    DOCTOR_STATS: 'doctor:stats',
    DOCTOR_REVIEWS: 'doctor:reviews',
    DOCTOR_SCHEDULE: 'doctor:schedule',
    DOCTOR_AVAILABILITY: 'doctor:availability',
    DOCTOR_DASHBOARD: 'doctor:dashboard',
    // Patient-related caches
    PATIENT_PROFILE: 'patient:profile',
    PATIENT_APPOINTMENTS: 'patient:appointments',
    PATIENT_MEDICAL_RECORDS: 'patient:medical_records',
    // Appointment-related caches
    APPOINTMENT_DETAILS: 'appointment:details',
    APPOINTMENT_SLOTS: 'appointment:slots',
    APPOINTMENT_QUEUE: 'appointment:queue',
    // Department-related caches
    DEPARTMENT_INFO: 'department:info',
    DEPARTMENT_DOCTORS: 'department:doctors',
    DEPARTMENT_STATS: 'department:stats',
    // System-related caches
    SYSTEM_CONFIG: 'system:config',
    API_RESPONSES: 'api:responses'
};
class CacheService {
    constructor() {
        this.isInitialized = false;
        this.shortTermCache = new node_cache_1.default(CACHE_CONFIGS.SHORT_TERM);
        this.mediumTermCache = new node_cache_1.default(CACHE_CONFIGS.MEDIUM_TERM);
        this.longTermCache = new node_cache_1.default(CACHE_CONFIGS.LONG_TERM);
        this.staticCache = new node_cache_1.default(CACHE_CONFIGS.STATIC);
    }
    /**
     * Initialize cache service with event listeners
     */
    async initialize() {
        try {
            logger_1.default.info('🔄 Initializing Cache Service...');
            // Setup cache event listeners
            this.setupEventListeners();
            this.isInitialized = true;
            logger_1.default.info('✅ Cache Service initialized successfully');
        }
        catch (error) {
            logger_1.default.error('❌ Failed to initialize Cache Service:', error);
            throw error;
        }
    }
    /**
     * Setup event listeners for cache monitoring
     */
    setupEventListeners() {
        const caches = [
            { name: 'short-term', cache: this.shortTermCache },
            { name: 'medium-term', cache: this.mediumTermCache },
            { name: 'long-term', cache: this.longTermCache },
            { name: 'static', cache: this.staticCache }
        ];
        caches.forEach(({ name, cache }) => {
            cache.on('set', (key, value) => {
                logger_1.default.debug(`📝 Cache SET [${name}]: ${key}`);
            });
            cache.on('get', (key, value) => {
                logger_1.default.debug(`📖 Cache GET [${name}]: ${key}`);
            });
            cache.on('del', (key, value) => {
                logger_1.default.debug(`🗑️ Cache DEL [${name}]: ${key}`);
            });
            cache.on('expired', (key, value) => {
                logger_1.default.debug(`⏰ Cache EXPIRED [${name}]: ${key}`);
            });
        });
    }
    /**
     * Get cache instance by type
     */
    getCacheByType(type) {
        switch (type) {
            case 'short': return this.shortTermCache;
            case 'medium': return this.mediumTermCache;
            case 'long': return this.longTermCache;
            case 'static': return this.staticCache;
            default: return this.shortTermCache;
        }
    }
    /**
     * Set cache value with automatic type selection based on key
     */
    async set(key, value, ttl) {
        try {
            const cacheType = this.determineCacheType(key);
            const cache = this.getCacheByType(cacheType);
            const success = cache.set(key, value, ttl || 300);
            if (success) {
                logger_1.default.debug(`✅ Cached [${cacheType}]: ${key}`);
            }
            else {
                logger_1.default.warn(`❌ Failed to cache [${cacheType}]: ${key}`);
            }
            return success;
        }
        catch (error) {
            logger_1.default.error('❌ Cache set error:', error);
            return false;
        }
    }
    /**
     * Get cache value
     */
    async get(key) {
        try {
            const cacheType = this.determineCacheType(key);
            const cache = this.getCacheByType(cacheType);
            const value = cache.get(key);
            if (value !== undefined) {
                logger_1.default.debug(`🎯 Cache HIT [${cacheType}]: ${key}`);
            }
            else {
                logger_1.default.debug(`❌ Cache MISS [${cacheType}]: ${key}`);
            }
            return value;
        }
        catch (error) {
            logger_1.default.error('❌ Cache get error:', error);
            return undefined;
        }
    }
    /**
     * Delete cache value
     */
    async del(key) {
        try {
            const cacheType = this.determineCacheType(key);
            const cache = this.getCacheByType(cacheType);
            const deletedCount = cache.del(key);
            if (deletedCount > 0) {
                logger_1.default.debug(`🗑️ Cache deleted [${cacheType}]: ${key}`);
            }
            return deletedCount;
        }
        catch (error) {
            logger_1.default.error('❌ Cache delete error:', error);
            return 0;
        }
    }
    /**
     * Check if key exists in cache
     */
    async has(key) {
        try {
            const cacheType = this.determineCacheType(key);
            const cache = this.getCacheByType(cacheType);
            return cache.has(key);
        }
        catch (error) {
            logger_1.default.error('❌ Cache has error:', error);
            return false;
        }
    }
    /**
     * Get or set cache value (cache-aside pattern)
     */
    async getOrSet(key, fetchFunction, ttl) {
        try {
            // Try to get from cache first
            let value = await this.get(key);
            if (value !== undefined) {
                return value;
            }
            // If not in cache, fetch the value
            value = await fetchFunction();
            if (value !== undefined) {
                // Store in cache
                await this.set(key, value, ttl);
            }
            return value;
        }
        catch (error) {
            logger_1.default.error('❌ Cache getOrSet error:', error);
            return undefined;
        }
    }
    /**
     * Invalidate cache by pattern
     */
    async invalidatePattern(pattern) {
        try {
            let totalDeleted = 0;
            const caches = [
                { name: 'short-term', cache: this.shortTermCache },
                { name: 'medium-term', cache: this.mediumTermCache },
                { name: 'long-term', cache: this.longTermCache },
                { name: 'static', cache: this.staticCache }
            ];
            for (const { name, cache } of caches) {
                const keys = cache.keys();
                const matchingKeys = keys.filter(key => key.includes(pattern));
                if (matchingKeys.length > 0) {
                    const deleted = cache.del(matchingKeys);
                    totalDeleted += deleted;
                    logger_1.default.info(`🧹 Invalidated ${deleted} keys matching "${pattern}" in ${name} cache`);
                }
            }
            return totalDeleted;
        }
        catch (error) {
            logger_1.default.error('❌ Cache invalidate pattern error:', error);
            return 0;
        }
    }
    /**
     * Get cache statistics
     */
    getStats() {
        return {
            shortTerm: this.shortTermCache.getStats(),
            mediumTerm: this.mediumTermCache.getStats(),
            longTerm: this.longTermCache.getStats(),
            static: this.staticCache.getStats()
        };
    }
    /**
     * Clear all caches
     */
    async clearAll() {
        try {
            this.shortTermCache.flushAll();
            this.mediumTermCache.flushAll();
            this.longTermCache.flushAll();
            this.staticCache.flushAll();
            logger_1.default.info('🧹 All caches cleared');
        }
        catch (error) {
            logger_1.default.error('❌ Cache clear all error:', error);
        }
    }
    /**
     * Determine cache type based on key prefix
     */
    determineCacheType(key) {
        // Short-term cache for frequently changing data
        if (key.includes('queue') || key.includes('availability') || key.includes('status')) {
            return 'short';
        }
        // Medium-term cache for moderately changing data
        if (key.includes('appointments') || key.includes('schedule') || key.includes('dashboard')) {
            return 'medium';
        }
        // Long-term cache for rarely changing data
        if (key.includes('profile') || key.includes('reviews') || key.includes('stats')) {
            return 'long';
        }
        // Static cache for configuration and rarely changing data
        if (key.includes('config') || key.includes('department:info')) {
            return 'static';
        }
        // Default to medium-term
        return 'medium';
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
            logger_1.default.info('🧹 Cleaning up Cache Service...');
            this.shortTermCache.close();
            this.mediumTermCache.close();
            this.longTermCache.close();
            this.staticCache.close();
            this.isInitialized = false;
            logger_1.default.info('✅ Cache Service cleanup completed');
        }
        catch (error) {
            logger_1.default.error('❌ Failed to cleanup Cache Service:', error);
        }
    }
}
// Export singleton instance
exports.cacheService = new CacheService();
exports.default = exports.cacheService;
//# sourceMappingURL=cache.service.js.map