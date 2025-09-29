/**
 * Advanced Caching Service for GraphQL Gateway
 * Multi-layer caching with Redis, Memory, and Query-level optimization
 */

import logger from "@hospital/shared/dist/utils/logger";
import { createHash } from "crypto";
import Redis from "ioredis";
import NodeCache from "node-cache";
import { cacheStrategies } from "../config/performance.config";

export interface CacheOptions {
  ttl?: number;
  strategy?: "cache-aside" | "write-through" | "write-behind";
  encryption?: boolean;
  compression?: boolean;
  tags?: string[];
}

export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  errors: number;
  hitRate: number;
  memoryUsage: number;
}

export class AdvancedCacheService {
  private redis: Redis | null = null;
  private memoryCache: NodeCache = new NodeCache({ stdTTL: 600 });
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    errors: 0,
    hitRate: 0,
    memoryUsage: 0,
  };
  private compressionEnabled: boolean;

  constructor() {
    this.initializeRedis();
    this.initializeMemoryCache();
    this.initializeStats();
    this.compressionEnabled = true;
    this.startStatsReporting();
  }

  /**
   * Initialize Redis connection with clustering support
   */
  private initializeRedis(): void {
    const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

    try {
      this.redis = new Redis(redisUrl, {
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
        logger.info("🔗 Redis connected successfully");
      });

      this.redis.on("error", (error: any) => {
        logger.error("❌ Redis connection error:", error);
      });

      this.redis.on("ready", () => {
        logger.info("✅ Redis ready for operations");
      });
    } catch (error) {
      logger.error("Failed to initialize Redis:", error);
      throw error;
    }
  }

  /**
   * Initialize memory cache
   */
  private initializeMemoryCache(): void {
    this.memoryCache = new NodeCache({
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
      } else {
        this.stats.misses++;
      }
    });

    this.memoryCache.on("del", (key, value) => {
      this.stats.deletes++;
    });

    logger.info("💾 Memory cache initialized");
  }

  /**
   * Initialize cache statistics
   */
  private initializeStats(): void {
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
  private generateCacheKey(
    namespace: string,
    key: string,
    params?: any
  ): string {
    let cacheKey = `hospital:${namespace}:${key}`;

    if (params) {
      const paramString = JSON.stringify(params);
      const hash = createHash("md5").update(paramString).digest("hex");
      cacheKey += `:${hash}`;
    }

    return cacheKey;
  }

  /**
   * Compress data if enabled
   */
  private async compressData(data: any): Promise<string> {
    if (!this.compressionEnabled) {
      return JSON.stringify(data);
    }

    try {
      const zlib = await import("zlib");
      const jsonString = JSON.stringify(data);
      const compressed = zlib.gzipSync(jsonString);
      return compressed.toString("base64");
    } catch (error) {
      logger.warn("Compression failed, storing uncompressed:", error);
      return JSON.stringify(data);
    }
  }

  /**
   * Decompress data if needed
   */
  private async decompressData(data: string): Promise<any> {
    if (!this.compressionEnabled) {
      return JSON.parse(data);
    }

    try {
      const zlib = await import("zlib");
      const buffer = Buffer.from(data, "base64");
      const decompressed = zlib.gunzipSync(buffer);
      return JSON.parse(decompressed.toString());
    } catch (error) {
      // Fallback to regular JSON parsing
      try {
        return JSON.parse(data);
      } catch (parseError) {
        logger.error("Failed to decompress and parse data:", error);
        return null;
      }
    }
  }

  /**
   * Get from cache with fallback strategy
   */
  async get<T>(
    namespace: string,
    key: string,
    params?: any
  ): Promise<T | null> {
    const cacheKey = this.generateCacheKey(namespace, key, params);

    try {
      // Try memory cache first (fastest)
      const memoryResult = this.memoryCache.get<string>(cacheKey);
      if (memoryResult) {
        this.stats.hits++;
        const data = await this.decompressData(memoryResult);
        logger.debug(`📖 Memory cache HIT: ${cacheKey}`);
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

        logger.debug(`📖 Redis cache HIT: ${cacheKey}`);
        return data;
      }

      this.stats.misses++;
      logger.debug(`❌ Cache MISS: ${cacheKey}`);
      return null;
    } catch (error) {
      logger.error(`Cache get error for ${cacheKey}:`, error);
      this.stats.misses++;
      return null;
    }
  }

  /**
   * Set cache with multiple layers and strategies
   */
  async set<T>(
    namespace: string,
    key: string,
    value: T,
    options: CacheOptions = {}
  ): Promise<void> {
    const cacheKey = this.generateCacheKey(namespace, key);
    const strategy = cacheStrategies[namespace as keyof typeof cacheStrategies];
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
          this.redis?.setex(cacheKey, ttl, compressed).catch((error: any) => {
            logger.error(`Write-behind cache error for ${cacheKey}:`, error);
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
      logger.debug(`📝 Cache SET: ${cacheKey} (TTL: ${ttl}s)`);
    } catch (error) {
      logger.error(`Cache set error for ${cacheKey}:`, error);
    }
  }

  /**
   * Delete from cache
   */
  async delete(namespace: string, key: string, params?: any): Promise<void> {
    const cacheKey = this.generateCacheKey(namespace, key, params);

    try {
      // Delete from both caches
      this.memoryCache.del(cacheKey);
      await this.redis?.del(cacheKey);

      this.stats.deletes++;
      logger.debug(`🗑️ Cache DELETE: ${cacheKey}`);
    } catch (error) {
      logger.error(`Cache delete error for ${cacheKey}:`, error);
    }
  }

  /**
   * Invalidate cache by tags
   */
  async invalidateByTags(tags: string[]): Promise<void> {
    try {
      for (const tag of tags) {
        const tagKey = `tag:${tag}`;
        const keys = await this.redis?.smembers(tagKey);

        if (keys && keys.length > 0) {
          // Delete from Redis
          await this.redis?.del(...keys);

          // Delete from memory cache
          keys.forEach((key: any) => this.memoryCache.del(key));

          // Clean up tag set
          await this.redis?.del(tagKey);

          logger.info(
            `🏷️ Invalidated ${keys.length} cache entries for tag: ${tag}`
          );
        }
      }
    } catch (error) {
      logger.error("Cache invalidation by tags error:", error);
    }
  }

  /**
   * Add tags to cache key for invalidation
   */
  private async addTags(cacheKey: string, tags: string[]): Promise<void> {
    try {
      for (const tag of tags) {
        const tagKey = `tag:${tag}`;
        await this.redis?.sadd(tagKey, cacheKey);
        await this.redis?.expire(tagKey, 86400); // Tags expire in 24 hours
      }
    } catch (error) {
      logger.error("Error adding cache tags:", error);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
    this.stats.memoryUsage = this.memoryCache.getStats().vsize;

    return { ...this.stats };
  }

  /**
   * Clear all caches
   */
  async clear(): Promise<void> {
    try {
      this.memoryCache.flushAll();
      await this.redis?.flushdb();
      this.initializeStats();
      logger.info("🧹 All caches cleared");
    } catch (error) {
      logger.error("Error clearing caches:", error);
    }
  }

  /**
   * Start periodic stats reporting
   */
  private startStatsReporting(): void {
    setInterval(() => {
      const stats = this.getStats();

      logger.info("📊 Cache Performance:", {
        hitRate: `${stats.hitRate.toFixed(2)}%`,
        hits: stats.hits,
        misses: stats.misses,
        memoryUsage: `${(stats.memoryUsage / 1024 / 1024).toFixed(2)}MB`,
      });

      // Alert on low hit rate
      if (stats.hitRate < 70 && stats.hits + stats.misses > 100) {
        logger.warn("⚠️ Low cache hit rate detected:", {
          hitRate: `${stats.hitRate.toFixed(2)}%`,
          recommendation: "Consider adjusting TTL or cache strategy",
        });
      }
    }, 300000); // Report every 5 minutes
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.redis?.ping();
      return true;
    } catch (error) {
      logger.error("Cache health check failed:", error);
      return false;
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    try {
      this.memoryCache.close();
      await this.redis?.quit();
      logger.info("🧹 Cache service cleaned up");
    } catch (error) {
      logger.error("Error during cache cleanup:", error);
    }
  }
}

// Singleton instance
export const advancedCacheService = new AdvancedCacheService();
