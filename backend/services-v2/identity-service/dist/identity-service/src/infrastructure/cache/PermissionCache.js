"use strict";
/**
 * PermissionCache
 *
 * Multi-level caching for permissions with Pub/Sub invalidation.
 *
 * Architecture:
 * - L1 Cache: In-memory Map (fast, short TTL)
 * - L2 Cache: Redis (persistent, longer TTL)
 * - Pub/Sub: Redis Pub/Sub for cache invalidation across instances
 *
 * Features:
 * - Fast permission lookups (< 1ms for L1 hits)
 * - Distributed cache invalidation
 * - Cache statistics tracking
 * - Automatic TTL management
 *
 * @author Hospital Management Team
 * @version 3.0.0 - Pure RBAC
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionCache = void 0;
const redis_1 = require("redis");
class PermissionCache {
    constructor(redisUrl) {
        // L1 Cache: In-memory
        this.memoryCache = new Map();
        // Cache configuration
        this.L1_TTL_MS = 60 * 1000; // 1 minute
        this.L2_TTL_SECONDS = 300; // 5 minutes
        this.MAX_L1_SIZE = 1000; // Max entries in L1
        // Statistics
        this.stats = {
            l1Hits: 0,
            l1Misses: 0,
            l2Hits: 0,
            l2Misses: 0,
            invalidations: 0,
        };
        // Create Redis client for caching
        this.redisClient = (0, redis_1.createClient)({ url: redisUrl });
        // Create separate Redis client for Pub/Sub
        this.redisPubSub = (0, redis_1.createClient)({ url: redisUrl });
        this.setupInvalidationListener();
    }
    /**
     * Initialize Redis connections
     */
    async connect() {
        await this.redisClient.connect();
        await this.redisPubSub.connect();
        console.log('[PermissionCache] Connected to Redis');
    }
    /**
     * Close Redis connections
     */
    async disconnect() {
        await this.redisClient.quit();
        await this.redisPubSub.quit();
        console.log('[PermissionCache] Disconnected from Redis');
    }
    /**
     * Setup Pub/Sub listener for cache invalidation
     */
    setupInvalidationListener() {
        this.redisPubSub.subscribe('permission:invalidate', (message) => {
            try {
                const { userId, timestamp } = JSON.parse(message);
                // Clear L1 cache for this user
                this.memoryCache.delete(this.getCacheKey(userId));
                this.stats.invalidations++;
                console.log('[PermissionCache] L1 cache invalidated via Pub/Sub', {
                    userId,
                    timestamp,
                });
            }
            catch (error) {
                console.error('[PermissionCache] Error processing invalidation message', error);
            }
        });
    }
    /**
     * Get permissions from cache
     *
     * Checks L1 first, then L2, returns null if not found.
     */
    async get(userId) {
        const key = this.getCacheKey(userId.value);
        // Check L1 (memory)
        const l1Entry = this.memoryCache.get(key);
        if (l1Entry && !this.isExpired(l1Entry, this.L1_TTL_MS)) {
            this.stats.l1Hits++;
            return l1Entry.data;
        }
        this.stats.l1Misses++;
        // Check L2 (Redis)
        try {
            const l2Data = await this.redisClient.get(key);
            if (l2Data) {
                const permissions = JSON.parse(l2Data);
                // Populate L1 cache
                this.setL1(key, permissions);
                this.stats.l2Hits++;
                return permissions;
            }
        }
        catch (error) {
            console.error('[PermissionCache] Error reading from L2 cache', error);
        }
        this.stats.l2Misses++;
        return null;
    }
    /**
     * Set permissions in cache
     *
     * Writes to both L1 and L2 caches.
     */
    async set(userId, permissions) {
        const key = this.getCacheKey(userId.value);
        // Set L1 (memory)
        this.setL1(key, permissions);
        // Set L2 (Redis)
        try {
            await this.redisClient.setEx(key, this.L2_TTL_SECONDS, JSON.stringify(permissions));
        }
        catch (error) {
            console.error('[PermissionCache] Error writing to L2 cache', error);
        }
    }
    /**
     * Invalidate cache for a user
     *
     * Clears L1 and L2 caches, broadcasts to other instances via Pub/Sub.
     */
    async invalidate(userId) {
        const key = this.getCacheKey(userId.value);
        // Clear L1 (local)
        this.memoryCache.delete(key);
        // Clear L2 (Redis)
        try {
            await this.redisClient.del(key);
        }
        catch (error) {
            console.error('[PermissionCache] Error deleting from L2 cache', error);
        }
        // Broadcast to other instances (Pub/Sub)
        try {
            await this.redisClient.publish('permission:invalidate', JSON.stringify({
                userId: userId.value,
                timestamp: Date.now(),
            }));
        }
        catch (error) {
            console.error('[PermissionCache] Error publishing invalidation', error);
        }
        this.stats.invalidations++;
        console.log('[PermissionCache] Cache invalidated and broadcasted', {
            userId: userId.value,
        });
    }
    /**
     * Invalidate cache for all users with a specific role
     *
     * Use this when role permissions are changed.
     */
    async invalidateForRole(roleType) {
        // Get all keys matching pattern
        try {
            const pattern = 'permissions:*';
            const keys = await this.redisClient.keys(pattern);
            // Delete all matching keys
            if (keys.length > 0) {
                await this.redisClient.del(keys);
            }
            // Clear L1 cache completely
            this.memoryCache.clear();
            // Broadcast to other instances
            await this.redisClient.publish('permission:invalidate:role', JSON.stringify({
                roleType,
                timestamp: Date.now(),
            }));
            console.log('[PermissionCache] Cache invalidated for role', {
                roleType,
                keysDeleted: keys.length,
            });
        }
        catch (error) {
            console.error('[PermissionCache] Error invalidating for role', error);
        }
    }
    /**
     * Clear all caches
     */
    async clear() {
        // Clear L1
        this.memoryCache.clear();
        // Clear L2
        try {
            const pattern = 'permissions:*';
            const keys = await this.redisClient.keys(pattern);
            if (keys.length > 0) {
                await this.redisClient.del(keys);
            }
        }
        catch (error) {
            console.error('[PermissionCache] Error clearing L2 cache', error);
        }
        console.log('[PermissionCache] All caches cleared');
    }
    /**
     * Get cache statistics
     */
    getStats() {
        const totalRequests = this.stats.l1Hits +
            this.stats.l1Misses +
            this.stats.l2Hits +
            this.stats.l2Misses;
        const totalHits = this.stats.l1Hits + this.stats.l2Hits;
        const totalMisses = this.stats.l1Misses + this.stats.l2Misses;
        return {
            hitRate: totalRequests > 0 ? totalHits / totalRequests : 0,
            missRate: totalRequests > 0 ? totalMisses / totalRequests : 0,
            l1Size: this.memoryCache.size,
            l1HitRate: this.stats.l1Hits + this.stats.l1Misses > 0
                ? this.stats.l1Hits / (this.stats.l1Hits + this.stats.l1Misses)
                : 0,
            l2HitRate: this.stats.l2Hits + this.stats.l2Misses > 0
                ? this.stats.l2Hits / (this.stats.l2Hits + this.stats.l2Misses)
                : 0,
            invalidations: this.stats.invalidations,
        };
    }
    /**
     * Reset statistics
     */
    resetStats() {
        this.stats = {
            l1Hits: 0,
            l1Misses: 0,
            l2Hits: 0,
            l2Misses: 0,
            invalidations: 0,
        };
    }
    // Private helper methods
    getCacheKey(userId) {
        return `permissions:${userId}`;
    }
    setL1(key, data) {
        // Evict oldest entry if cache is full
        if (this.memoryCache.size >= this.MAX_L1_SIZE) {
            const firstKey = this.memoryCache.keys().next().value;
            if (firstKey) {
                this.memoryCache.delete(firstKey);
            }
        }
        this.memoryCache.set(key, {
            data,
            timestamp: Date.now(),
        });
    }
    isExpired(entry, ttlMs) {
        return Date.now() - entry.timestamp > ttlMs;
    }
}
exports.PermissionCache = PermissionCache;
//# sourceMappingURL=PermissionCache.js.map