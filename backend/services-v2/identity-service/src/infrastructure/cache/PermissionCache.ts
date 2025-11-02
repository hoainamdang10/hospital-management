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

import { createClient, RedisClientType } from 'redis';
import { UserId } from '../../domain/value-objects/UserId';
import { ILogger } from '../../application/services/ILogger';

interface CacheEntry {
  data: string[];
  timestamp: number;
}

interface CacheStats {
  l1Hits: number;
  l1Misses: number;
  l2Hits: number;
  l2Misses: number;
  invalidations: number;
}

export class PermissionCache {
  // L1 Cache: In-memory
  private memoryCache: Map<string, CacheEntry> = new Map();
  
  // L2 Cache: Redis
  private redisClient: RedisClientType;
  private redisPubSub: RedisClientType;
  
  // Cache configuration
  private readonly L1_TTL_MS = 60 * 1000; // 1 minute
  private readonly L2_TTL_SECONDS = 300; // 5 minutes
  private readonly MAX_L1_SIZE = 1000; // Max entries in L1
  
  // Statistics
  private stats: CacheStats = {
    l1Hits: 0,
    l1Misses: 0,
    l2Hits: 0,
    l2Misses: 0,
    invalidations: 0,
  };

  private logger: ILogger;

  constructor(
    redisUrl: string,
    logger: ILogger,
    clients?: {
      cacheClient?: RedisClientType;
      pubSubClient?: RedisClientType;
    }
  ) {
    this.logger = logger;
    
    // Create Redis client for caching
    this.redisClient = clients?.cacheClient ?? createClient({ url: redisUrl });

    // Create separate Redis client for Pub/Sub
    this.redisPubSub = clients?.pubSubClient ?? createClient({ url: redisUrl });
  }

  private hasConnected = false;

  /**
   * Initialize Redis connections
   */
  async connect(): Promise<void> {
    if (this.hasConnected) {
      return;
    }

    await this.redisClient.connect();
    await this.redisPubSub.connect();
    await this.setupInvalidationListener();
    this.hasConnected = true;
    this.logger.info('PermissionCache connected to Redis');
  }

  /**
   * Close Redis connections
   */
  async disconnect(): Promise<void> {
    if (!this.hasConnected) {
      return;
    }

    await this.redisClient.quit();
    await this.redisPubSub.quit();
    this.logger.info('PermissionCache disconnected from Redis');
    this.hasConnected = false;
  }

  /**
   * Setup Pub/Sub listener for cache invalidation
   */
  private async setupInvalidationListener(): Promise<void> {
    // Listen for user-specific invalidation
    await this.redisPubSub.subscribe('permission:invalidate', (message) => {
      try {
        const { userId, timestamp } = JSON.parse(message);

        // Clear L1 cache for this user
        this.memoryCache.delete(this.getCacheKey(userId));

        this.stats.invalidations++;

        this.logger.debug('PermissionCache L1 cache invalidated via Pub/Sub', {
          userId,
          timestamp
        });
      } catch (error) {
        this.logger.error('PermissionCache error processing invalidation message', {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // Listen for role-based invalidation
    await this.redisPubSub.subscribe('permission:invalidate:role', (message) => {
      try {
        const { roleType, timestamp } = JSON.parse(message);

        // Clear entire L1 cache since we don't know which users have this role
        this.memoryCache.clear();

        this.stats.invalidations++;

        this.logger.debug('PermissionCache L1 cache cleared for role via Pub/Sub', {
          roleType,
          timestamp
        });
      } catch (error) {
        this.logger.error('PermissionCache error processing role invalidation message', {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });
  }

  /**
   * Get permissions from cache
   * 
   * Checks L1 first, then L2, returns null if not found.
   */
  async get(userId: UserId): Promise<string[] | null> {
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
    } catch (error) {
      this.logger.error('PermissionCache error reading from L2 cache', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: userId.value
      });
    }

    this.stats.l2Misses++;
    return null;
  }

  /**
   * Set permissions in cache
   * 
   * Writes to both L1 and L2 caches.
   */
  async set(userId: UserId, permissions: string[]): Promise<void> {
    const key = this.getCacheKey(userId.value);

    // Set L1 (memory)
    this.setL1(key, permissions);

    // Set L2 (Redis)
    try {
      await this.redisClient.setEx(
        key,
        this.L2_TTL_SECONDS,
        JSON.stringify(permissions)
      );
    } catch (error) {
      this.logger.error('PermissionCache error writing to L2 cache', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: userId.value
      });
    }
  }

  /**
   * Invalidate cache for a user
   * 
   * Clears L1 and L2 caches, broadcasts to other instances via Pub/Sub.
   */
  async invalidate(userId: UserId): Promise<void> {
    const key = this.getCacheKey(userId.value);

    // Clear L1 (local)
    this.memoryCache.delete(key);

    // Clear L2 (Redis)
    try {
      await this.redisClient.del(key);
    } catch (error) {
      this.logger.error('PermissionCache error deleting from L2 cache', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: userId.value
      });
    }

    // Broadcast to other instances (Pub/Sub)
    try {
      await this.redisClient.publish(
        'permission:invalidate',
        JSON.stringify({
          userId: userId.value,
          timestamp: Date.now(),
        })
      );
    } catch (error) {
      this.logger.error('PermissionCache error publishing invalidation', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: userId.value
      });
    }

    this.stats.invalidations++;

    this.logger.debug('PermissionCache cache invalidated and broadcasted', {
      userId: userId.value
    });
  }

  /**
   * Invalidate cache for all users with a specific role
   * 
   * Use this when role permissions are changed.
   * 
   * IMPORTANT: We do NOT use redis.keys() here because it's a BLOCKING operation
   * that can freeze Redis for 100-500ms with 10,000+ keys in production.
   * Instead, we rely on Pub/Sub to broadcast invalidation to all instances,
   * and each instance clears its own L1 cache. L2 (Redis) entries will expire
   * naturally based on TTL (5 minutes).
   */
  async invalidateForRole(roleType: string): Promise<void> {
    try {
      // Clear L1 cache completely (local memory)
      this.memoryCache.clear();

      // Broadcast to other instances via Pub/Sub
      // Each instance will clear its own L1 cache when receiving this message
      await this.redisClient.publish(
        'permission:invalidate:role',
        JSON.stringify({
          roleType,
          timestamp: Date.now(),
        })
      );

      this.logger.info('PermissionCache cache invalidated for role via Pub/Sub', {
        roleType,
        note: 'L1 cleared, L2 will expire naturally (TTL: 5min)'
      });
    } catch (error) {
      this.logger.error('PermissionCache error invalidating for role', {
        error: error instanceof Error ? error.message : 'Unknown error',
        roleType
      });
    }
  }

  /**
   * Clear all caches
   * 
   * IMPORTANT: This method is for testing/development only.
   * In production, use invalidate() or invalidateForRole() instead.
   * We do NOT use redis.keys() to avoid blocking Redis in production.
   */
  async clear(): Promise<void> {
    // Clear L1 (local memory)
    this.memoryCache.clear();

    // NOTE: We do NOT clear L2 (Redis) here to avoid using redis.keys()
    // which is a BLOCKING operation. L2 entries will expire naturally
    // based on TTL (5 minutes). For immediate invalidation, use
    // invalidate(userId) or invalidateForRole(roleType) instead.

    this.logger.info('PermissionCache all caches cleared', {
      note: 'L1 cleared, L2 will expire naturally (TTL: 5min)'
    });
  }

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
  } {
    const totalRequests =
      this.stats.l1Hits +
      this.stats.l1Misses +
      this.stats.l2Hits +
      this.stats.l2Misses;

    const totalHits = this.stats.l1Hits + this.stats.l2Hits;
    const totalMisses = this.stats.l1Misses + this.stats.l2Misses;

    return {
      hitRate: totalRequests > 0 ? totalHits / totalRequests : 0,
      missRate: totalRequests > 0 ? totalMisses / totalRequests : 0,
      l1Size: this.memoryCache.size,
      l1HitRate:
        this.stats.l1Hits + this.stats.l1Misses > 0
          ? this.stats.l1Hits / (this.stats.l1Hits + this.stats.l1Misses)
          : 0,
      l2HitRate:
        this.stats.l2Hits + this.stats.l2Misses > 0
          ? this.stats.l2Hits / (this.stats.l2Hits + this.stats.l2Misses)
          : 0,
      invalidations: this.stats.invalidations,
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      l1Hits: 0,
      l1Misses: 0,
      l2Hits: 0,
      l2Misses: 0,
      invalidations: 0,
    };
  }

  // Private helper methods

  private getCacheKey(userId: string): string {
    return `permissions:${userId}`;
  }

  private setL1(key: string, data: string[]): void {
    // Evict oldest entry if cache is full
    if (this.memoryCache.size >= this.MAX_L1_SIZE) {
      const firstKey = this.memoryCache.keys().next().value as string | undefined;
      if (firstKey) {
        this.memoryCache.delete(firstKey);
      }
    }

    this.memoryCache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  private isExpired(entry: CacheEntry, ttlMs: number): boolean {
    return Date.now() - entry.timestamp > ttlMs;
  }
}
