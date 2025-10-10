/**
 * Redis Cache Service
 * Provides caching functionality using Redis for improved performance
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { createClient, RedisClientType } from 'redis';
import { ILogger } from '../../application/services/ILogger';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string; // Key prefix
}

export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  errors: number;
  hitRate: number;
}

/**
 * Redis Cache Service for Identity Service
 * Implements caching with TTL, invalidation, and pattern-based deletion
 */
export class RedisCacheService {
  private client: RedisClientType;
  private isConnected: boolean = false;
  private readonly keyPrefix: string;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    errors: 0,
    hitRate: 0
  };

  constructor(
    redisUrl: string,
    private logger: ILogger,
    keyPrefix: string = 'identity:'
  ) {
    this.keyPrefix = keyPrefix;
    this.client = createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            this.logger.error('Redis reconnection failed after 10 attempts');
            return new Error('Redis reconnection failed');
          }
          return Math.min(retries * 100, 3000);
        }
      }
    });

    this.setupEventHandlers();
  }

  /**
   * Setup Redis event handlers
   */
  private setupEventHandlers(): void {
    this.client.on('connect', () => {
      this.logger.info('Redis client connecting...');
    });

    this.client.on('ready', () => {
      this.isConnected = true;
      this.logger.info('Redis client connected and ready');
    });

    this.client.on('error', (error) => {
      this.stats.errors++;
      this.logger.error('Redis client error', { error: error.message });
    });

    this.client.on('end', () => {
      this.isConnected = false;
      this.logger.warn('Redis client connection closed');
    });

    this.client.on('reconnecting', () => {
      this.logger.info('Redis client reconnecting...');
    });
  }

  /**
   * Connect to Redis
   */
  async connect(): Promise<void> {
    try {
      if (!this.isConnected) {
        await this.client.connect();
        this.logger.info('Redis cache service connected');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to connect to Redis', { error: errorMessage });
      throw error;
    }
  }

  /**
   * Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    try {
      if (this.isConnected) {
        await this.client.quit();
        this.isConnected = false;
        this.logger.info('Redis cache service disconnected');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to disconnect from Redis', { error: errorMessage });
    }
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.isConnected) {
      this.logger.warn('Redis not connected, skipping cache get');
      return null;
    }

    try {
      const fullKey = this.getFullKey(key);
      const value = await this.client.get(fullKey);

      if (value) {
        this.stats.hits++;
        this.updateHitRate();
        return JSON.parse(value) as T;
      }

      this.stats.misses++;
      this.updateHitRate();
      return null;
    } catch (error) {
      this.stats.errors++;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Redis get error', { key, error: errorMessage });
      return null;
    }
  }

  /**
   * Set value in cache with TTL
   */
  async set<T>(key: string, value: T, options?: CacheOptions): Promise<boolean> {
    if (!this.isConnected) {
      this.logger.warn('Redis not connected, skipping cache set');
      return false;
    }

    try {
      const fullKey = this.getFullKey(key);
      const serialized = JSON.stringify(value);
      const ttl = options?.ttl || 300; // Default 5 minutes

      await this.client.setEx(fullKey, ttl, serialized);
      this.stats.sets++;
      return true;
    } catch (error) {
      this.stats.errors++;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Redis set error', { key, error: errorMessage });
      return false;
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<boolean> {
    if (!this.isConnected) {
      this.logger.warn('Redis not connected, skipping cache delete');
      return false;
    }

    try {
      const fullKey = this.getFullKey(key);
      const result = await this.client.del(fullKey);
      this.stats.deletes++;
      return result > 0;
    } catch (error) {
      this.stats.errors++;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Redis delete error', { key, error: errorMessage });
      return false;
    }
  }

  /**
   * Delete multiple keys by pattern
   */
  async deletePattern(pattern: string): Promise<number> {
    if (!this.isConnected) {
      this.logger.warn('Redis not connected, skipping pattern delete');
      return 0;
    }

    try {
      const fullPattern = this.getFullKey(pattern);
      const keys = await this.client.keys(fullPattern);

      if (keys.length === 0) {
        return 0;
      }

      // node-redis del() accepts multiple keys as separate arguments
      // Use Promise.all to delete keys in batches
      let deletedCount = 0;
      for (const key of keys) {
        const result = await this.client.del(key);
        deletedCount += result;
      }

      this.stats.deletes += deletedCount;
      return deletedCount;
    } catch (error) {
      this.stats.errors++;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Redis pattern delete error', { pattern, error: errorMessage });
      return 0;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    if (!this.isConnected) {
      return false;
    }

    try {
      const fullKey = this.getFullKey(key);
      const result = await this.client.exists(fullKey);
      return result === 1;
    } catch (error) {
      this.stats.errors++;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Redis exists error', { key, error: errorMessage });
      return false;
    }
  }

  /**
   * Get TTL for key
   */
  async getTTL(key: string): Promise<number> {
    if (!this.isConnected) {
      return -1;
    }

    try {
      const fullKey = this.getFullKey(key);
      return await this.client.ttl(fullKey);
    } catch (error) {
      this.stats.errors++;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Redis TTL error', { key, error: errorMessage });
      return -1;
    }
  }

  /**
   * Clear all cache entries with prefix
   */
  async clear(): Promise<number> {
    return await this.deletePattern('*');
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Reset cache statistics
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
      hitRate: 0
    };
  }

  /**
   * Check if Redis is connected
   */
  isReady(): boolean {
    return this.isConnected;
  }

  /**
   * Get full key with prefix
   */
  private getFullKey(key: string): string {
    return `${this.keyPrefix}${key}`;
  }

  /**
   * Update hit rate
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }
}

