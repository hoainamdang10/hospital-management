"use strict";
/**
 * Advanced Caching Service for GraphQL Gateway
 * Multi-layer caching with Redis, Memory, and Query-level optimization
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.advancedCacheService = exports.AdvancedCacheService = void 0;
const logger_1 = __importDefault(require("@hospital/shared/dist/utils/logger"));
const crypto_1 = require("crypto");
const ioredis_1 = __importDefault(require("ioredis"));
const node_cache_1 = __importDefault(require("node-cache"));
const performance_config_1 = require("../config/performance.config");
class AdvancedCacheService {
    constructor() {
        this.redis = null;
        this.memoryCache = new node_cache_1.default({ stdTTL: 600 });
        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0,
            errors: 0,
            hitRate: 0,
            memoryUsage: 0,
        };
        this.initializeRedis();
        this.initializeMemoryCache();
        this.initializeStats();
        this.compressionEnabled = true;
        this.startStatsReporting();
    }
    /**
     * Initialize Redis connection with clustering support
     */
    initializeRedis() {
        const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
        try {
            this.redis = new ioredis_1.default(redisUrl, {
                enableReadyCheck: true,
                maxRetriesPerRequest: 3,
                lazyConnect: true,
                keepAlive: 30000,
                // Connection pooling
                family: 4,
                connectTimeout: 10000,
                commandTimeout: 5000,
            });
            this.redis.on("connect", () => {
                logger_1.default.info("🔗 Redis connected successfully");
            });
            this.redis.on("error", (error) => {
                logger_1.default.error("❌ Redis connection error:", error);
            });
            this.redis.on("ready", () => {
                logger_1.default.info("✅ Redis ready for operations");
            });
        }
        catch (error) {
            logger_1.default.error("Failed to initialize Redis:", error);
            throw error;
        }
    }
    /**
     * Initialize memory cache
     */
    initializeMemoryCache() {
        this.memoryCache = new node_cache_1.default({
            stdTTL: 600, // 10 minutes default
            checkperiod: 120, // Check for expired keys every 2 minutes
            useClones: false, // Better performance
            maxKeys: 10000, // Limit memory usage
        });
        this.memoryCache.on("set", (key, value) => {
            this.stats.sets++;
        });
        this.memoryCache.on("get", (key, value) => {
            if (value !== undefined) {
                this.stats.hits++;
            }
            else {
                this.stats.misses++;
            }
        });
        this.memoryCache.on("del", (key, value) => {
            this.stats.deletes++;
        });
        logger_1.default.info("💾 Memory cache initialized");
    }
    /**
     * Initialize cache statistics
     */
    initializeStats() {
        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0,
            errors: 0,
            hitRate: 0,
            memoryUsage: 0,
        };
    }
    /**
     * Generate cache key with namespace and hashing
     */
    generateCacheKey(namespace, key, params) {
        let cacheKey = `hospital:${namespace}:${key}`;
        if (params) {
            const paramString = JSON.stringify(params);
            const hash = (0, crypto_1.createHash)("md5").update(paramString).digest("hex");
            cacheKey += `:${hash}`;
        }
        return cacheKey;
    }
    /**
     * Compress data if enabled
     */
    async compressData(data) {
        if (!this.compressionEnabled) {
            return JSON.stringify(data);
        }
        try {
            const zlib = await Promise.resolve().then(() => __importStar(require("zlib")));
            const jsonString = JSON.stringify(data);
            const compressed = zlib.gzipSync(jsonString);
            return compressed.toString("base64");
        }
        catch (error) {
            logger_1.default.warn("Compression failed, storing uncompressed:", error);
            return JSON.stringify(data);
        }
    }
    /**
     * Decompress data if needed
     */
    async decompressData(data) {
        if (!this.compressionEnabled) {
            return JSON.parse(data);
        }
        try {
            const zlib = await Promise.resolve().then(() => __importStar(require("zlib")));
            const buffer = Buffer.from(data, "base64");
            const decompressed = zlib.gunzipSync(buffer);
            return JSON.parse(decompressed.toString());
        }
        catch (error) {
            // Fallback to regular JSON parsing
            try {
                return JSON.parse(data);
            }
            catch (parseError) {
                logger_1.default.error("Failed to decompress and parse data:", error);
                return null;
            }
        }
    }
    /**
     * Get from cache with fallback strategy
     */
    async get(namespace, key, params) {
        const cacheKey = this.generateCacheKey(namespace, key, params);
        try {
            // Try memory cache first (fastest)
            const memoryResult = this.memoryCache.get(cacheKey);
            if (memoryResult) {
                this.stats.hits++;
                const data = await this.decompressData(memoryResult);
                logger_1.default.debug(`📖 Memory cache HIT: ${cacheKey}`);
                return data;
            }
            // Try Redis cache (slower but persistent)
            const redisResult = await this.redis?.get(cacheKey);
            if (redisResult) {
                this.stats.hits++;
                const data = await this.decompressData(redisResult);
                // Store in memory cache for faster future access
                const compressed = await this.compressData(data);
                this.memoryCache.set(cacheKey, compressed, 300); // 5 minutes in memory
                logger_1.default.debug(`📖 Redis cache HIT: ${cacheKey}`);
                return data;
            }
            this.stats.misses++;
            logger_1.default.debug(`❌ Cache MISS: ${cacheKey}`);
            return null;
        }
        catch (error) {
            logger_1.default.error(`Cache get error for ${cacheKey}:`, error);
            this.stats.misses++;
            return null;
        }
    }
    /**
     * Set cache with multiple layers and strategies
     */
    async set(namespace, key, value, options = {}) {
        const cacheKey = this.generateCacheKey(namespace, key);
        const strategy = performance_config_1.cacheStrategies[namespace];
        const ttl = options.ttl || strategy?.ttl || 300;
        try {
            const compressed = await this.compressData(value);
            // Always store in memory cache for fast access
            this.memoryCache.set(cacheKey, compressed, Math.min(ttl, 600)); // Max 10 min in memory
            // Store in Redis based on strategy
            switch (options.strategy || strategy?.strategy || "cache-aside") {
                case "write-through":
                    await this.redis?.setex(cacheKey, ttl, compressed);
                    break;
                case "write-behind":
                    // Async write to Redis (fire and forget)
                    this.redis?.setex(cacheKey, ttl, compressed).catch((error) => {
                        logger_1.default.error(`Write-behind cache error for ${cacheKey}:`, error);
                    });
                    break;
                default: // cache-aside
                    await this.redis?.setex(cacheKey, ttl, compressed);
            }
            // Add tags for cache invalidation
            if (options.tags) {
                await this.addTags(cacheKey, options.tags);
            }
            this.stats.sets++;
            logger_1.default.debug(`📝 Cache SET: ${cacheKey} (TTL: ${ttl}s)`);
        }
        catch (error) {
            logger_1.default.error(`Cache set error for ${cacheKey}:`, error);
        }
    }
    /**
     * Delete from cache
     */
    async delete(namespace, key, params) {
        const cacheKey = this.generateCacheKey(namespace, key, params);
        try {
            // Delete from both caches
            this.memoryCache.del(cacheKey);
            await this.redis?.del(cacheKey);
            this.stats.deletes++;
            logger_1.default.debug(`🗑️ Cache DELETE: ${cacheKey}`);
        }
        catch (error) {
            logger_1.default.error(`Cache delete error for ${cacheKey}:`, error);
        }
    }
    /**
     * Invalidate cache by tags
     */
    async invalidateByTags(tags) {
        try {
            for (const tag of tags) {
                const tagKey = `tag:${tag}`;
                const keys = await this.redis?.smembers(tagKey);
                if (keys && keys.length > 0) {
                    // Delete from Redis
                    await this.redis?.del(...keys);
                    // Delete from memory cache
                    keys.forEach((key) => this.memoryCache.del(key));
                    // Clean up tag set
                    await this.redis?.del(tagKey);
                    logger_1.default.info(`🏷️ Invalidated ${keys.length} cache entries for tag: ${tag}`);
                }
            }
        }
        catch (error) {
            logger_1.default.error("Cache invalidation by tags error:", error);
        }
    }
    /**
     * Add tags to cache key for invalidation
     */
    async addTags(cacheKey, tags) {
        try {
            for (const tag of tags) {
                const tagKey = `tag:${tag}`;
                await this.redis?.sadd(tagKey, cacheKey);
                await this.redis?.expire(tagKey, 86400); // Tags expire in 24 hours
            }
        }
        catch (error) {
            logger_1.default.error("Error adding cache tags:", error);
        }
    }
    /**
     * Get cache statistics
     */
    getStats() {
        const total = this.stats.hits + this.stats.misses;
        this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
        this.stats.memoryUsage = this.memoryCache.getStats().vsize;
        return { ...this.stats };
    }
    /**
     * Clear all caches
     */
    async clear() {
        try {
            this.memoryCache.flushAll();
            await this.redis?.flushdb();
            this.initializeStats();
            logger_1.default.info("🧹 All caches cleared");
        }
        catch (error) {
            logger_1.default.error("Error clearing caches:", error);
        }
    }
    /**
     * Start periodic stats reporting
     */
    startStatsReporting() {
        setInterval(() => {
            const stats = this.getStats();
            logger_1.default.info("📊 Cache Performance:", {
                hitRate: `${stats.hitRate.toFixed(2)}%`,
                hits: stats.hits,
                misses: stats.misses,
                memoryUsage: `${(stats.memoryUsage / 1024 / 1024).toFixed(2)}MB`,
            });
            // Alert on low hit rate
            if (stats.hitRate < 70 && stats.hits + stats.misses > 100) {
                logger_1.default.warn("⚠️ Low cache hit rate detected:", {
                    hitRate: `${stats.hitRate.toFixed(2)}%`,
                    recommendation: "Consider adjusting TTL or cache strategy",
                });
            }
        }, 300000); // Report every 5 minutes
    }
    /**
     * Health check
     */
    async healthCheck() {
        try {
            await this.redis?.ping();
            return true;
        }
        catch (error) {
            logger_1.default.error("Cache health check failed:", error);
            return false;
        }
    }
    /**
     * Cleanup resources
     */
    async cleanup() {
        try {
            this.memoryCache.close();
            await this.redis?.quit();
            logger_1.default.info("🧹 Cache service cleaned up");
        }
        catch (error) {
            logger_1.default.error("Error during cache cleanup:", error);
        }
    }
}
exports.AdvancedCacheService = AdvancedCacheService;
// Singleton instance
exports.advancedCacheService = new AdvancedCacheService();
//# sourceMappingURL=advanced-cache.service.js.map