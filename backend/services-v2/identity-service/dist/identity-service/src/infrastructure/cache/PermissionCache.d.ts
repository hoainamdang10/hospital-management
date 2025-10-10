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
import { RedisClientType } from 'redis';
import { UserId } from '../../domain/value-objects/UserId';
export declare class PermissionCache {
    private memoryCache;
    private redisClient;
    private redisPubSub;
    private readonly L1_TTL_MS;
    private readonly L2_TTL_SECONDS;
    private readonly MAX_L1_SIZE;
    private stats;
    constructor(redisUrl: string, clients?: {
        cacheClient?: RedisClientType;
        pubSubClient?: RedisClientType;
    });
    private hasConnected;
    /**
     * Initialize Redis connections
     */
    connect(): Promise<void>;
    /**
     * Close Redis connections
     */
    disconnect(): Promise<void>;
    /**
     * Setup Pub/Sub listener for cache invalidation
     */
    private setupInvalidationListener;
    /**
     * Get permissions from cache
     *
     * Checks L1 first, then L2, returns null if not found.
     */
    get(userId: UserId): Promise<string[] | null>;
    /**
     * Set permissions in cache
     *
     * Writes to both L1 and L2 caches.
     */
    set(userId: UserId, permissions: string[]): Promise<void>;
    /**
     * Invalidate cache for a user
     *
     * Clears L1 and L2 caches, broadcasts to other instances via Pub/Sub.
     */
    invalidate(userId: UserId): Promise<void>;
    /**
     * Invalidate cache for all users with a specific role
     *
     * Use this when role permissions are changed.
     */
    invalidateForRole(roleType: string): Promise<void>;
    /**
     * Clear all caches
     */
    clear(): Promise<void>;
    /**
     * Get cache statistics
     */
    getStats(): {
        hitRate: number;
        missRate: number;
        l1Size: number;
        l1HitRate: number;
        l2HitRate: number;
        invalidations: number;
    };
    /**
     * Reset statistics
     */
    resetStats(): void;
    private getCacheKey;
    private setL1;
    private isExpired;
}
//# sourceMappingURL=PermissionCache.d.ts.map