/**
 * Patient Cache with L1/L2 Strategy
 * L1: In-memory cache (fast, limited size)
 * L2: Redis cache (persistent, larger capacity)
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { createClient, RedisClientType } from 'redis';
import { PatientId } from '../../domain/value-objects/PatientId';

interface CacheEntry {
  data: any;
  timestamp: number;
}

interface CacheStats {
  l1Hits: number;
  l1Misses: number;
  l2Hits: number;
  l2Misses: number;
  invalidations: number;
}

/**
 * Patient Cache with L1 (memory) and L2 (Redis) caching
 */
export class PatientCache {
  private memoryCache: Map<string, CacheEntry> = new Map();
  private redisClient: RedisClientType;
  private redisPubSub: RedisClientType;

  private readonly L1_TTL_MS = 60 * 1000;
  private readonly L2_TTL_SECONDS = 300;
  private readonly MAX_L1_SIZE = 1000;

  private stats: CacheStats = {
    l1Hits: 0,
    l1Misses: 0,
    l2Hits: 0,
    l2Misses: 0,
    invalidations: 0
  };

  private hasConnected = false;

  constructor(redisUrl: string) {
    this.redisClient = createClient({ url: redisUrl });
    this.redisPubSub = createClient({ url: redisUrl });
  }

  /**
   * Connect to Redis
   */
  async connect(): Promise<void> {
    if (this.hasConnected) {
      console.log('[PatientCache] Already connected');
      return;
    }

    try {
      await this.redisClient.connect();
      await this.redisPubSub.connect();

      await this.redisPubSub.subscribe('patient:invalidate', (message) => {
        try {
          const { patientId } = JSON.parse(message);
          const key = this.getCacheKey(patientId);
          this.memoryCache.delete(key);
          console.log('[PatientCache] Invalidated L1 cache via Pub/Sub', { patientId });
        } catch (error) {
          console.error('[PatientCache] Error processing invalidation message', error);
        }
      });

      this.hasConnected = true;
      console.log('[PatientCache] Connected successfully');
    } catch (error) {
      console.error('[PatientCache] Connection failed', error);
      throw error;
    }
  }

  /**
   * Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    try {
      await this.redisPubSub.unsubscribe('patient:invalidate');
      await this.redisPubSub.quit();
      await this.redisClient.quit();
      this.hasConnected = false;
      console.log('[PatientCache] Disconnected successfully');
    } catch (error) {
      console.error('[PatientCache] Disconnect error', error);
    }
  }

  /**
   * Get cache key
   */
  private getCacheKey(patientId: string): string {
    return `patient:${patientId}`;
  }

  /**
   * Check if cache entry is expired
   */
  private isExpired(entry: CacheEntry, ttlMs: number): boolean {
    return Date.now() - entry.timestamp > ttlMs;
  }

  /**
   * Set L1 cache entry
   */
  private setL1(key: string, data: any): void {
    if (this.memoryCache.size >= this.MAX_L1_SIZE) {
      const firstKey = this.memoryCache.keys().next().value;
      if (firstKey) {
        this.memoryCache.delete(firstKey);
      }
    }

    this.memoryCache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Get patient from cache
   */
  async get(patientId: PatientId): Promise<any | null> {
    const key = this.getCacheKey(patientId.value);

    const l1Entry = this.memoryCache.get(key);
    if (l1Entry && !this.isExpired(l1Entry, this.L1_TTL_MS)) {
      this.stats.l1Hits++;
      return l1Entry.data;
    }

    this.stats.l1Misses++;

    try {
      const l2Data = await this.redisClient.get(key);
      if (l2Data) {
        const patient = JSON.parse(l2Data);
        this.setL1(key, patient);
        this.stats.l2Hits++;
        return patient;
      }
    } catch (error) {
      console.error('[PatientCache] Error reading from L2 cache', error);
    }

    this.stats.l2Misses++;
    return null;
  }

  /**
   * Get patient by BHYT number
   */
  async getByBHYT(bhytNumber: string): Promise<any | null> {
    const key = `patient:bhyt:${bhytNumber}`;

    const l1Entry = this.memoryCache.get(key);
    if (l1Entry && !this.isExpired(l1Entry, this.L1_TTL_MS)) {
      this.stats.l1Hits++;
      return l1Entry.data;
    }

    this.stats.l1Misses++;

    try {
      const l2Data = await this.redisClient.get(key);
      if (l2Data) {
        const patient = JSON.parse(l2Data);
        this.setL1(key, patient);
        this.stats.l2Hits++;
        return patient;
      }
    } catch (error) {
      console.error('[PatientCache] Error reading from L2 cache', error);
    }

    this.stats.l2Misses++;
    return null;
  }

  /**
   * Set patient in cache
   */
  async set(patientId: PatientId, patient: any): Promise<void> {
    const key = this.getCacheKey(patientId.value);

    this.setL1(key, patient);

    try {
      await this.redisClient.setEx(
        key,
        this.L2_TTL_SECONDS,
        JSON.stringify(patient)
      );
    } catch (error) {
      console.error('[PatientCache] Error writing to L2 cache', error);
    }
  }

  /**
   * Set patient by BHYT number
   */
  async setByBHYT(bhytNumber: string, patient: any): Promise<void> {
    const key = `patient:bhyt:${bhytNumber}`;

    this.setL1(key, patient);

    try {
      await this.redisClient.setEx(
        key,
        this.L2_TTL_SECONDS,
        JSON.stringify(patient)
      );
    } catch (error) {
      console.error('[PatientCache] Error writing to L2 cache', error);
    }
  }

  /**
   * Invalidate cache for a patient
   */
  async invalidate(patientId: PatientId): Promise<void> {
    const key = this.getCacheKey(patientId.value);

    this.memoryCache.delete(key);

    try {
      await this.redisClient.del(key);
    } catch (error) {
      console.error('[PatientCache] Error deleting from L2 cache', error);
    }

    try {
      await this.redisClient.publish(
        'patient:invalidate',
        JSON.stringify({
          patientId: patientId.value,
          timestamp: Date.now()
        })
      );
    } catch (error) {
      console.error('[PatientCache] Error publishing invalidation', error);
    }

    this.stats.invalidations++;
    console.log('[PatientCache] Cache invalidated and broadcasted', {
      patientId: patientId.value
    });
  }

  /**
   * Invalidate all patient caches
   */
  async invalidateAll(): Promise<void> {
    this.memoryCache.clear();

    try {
      const keys = await this.redisClient.keys('patient:*');
      if (keys.length > 0) {
        await this.redisClient.del(keys);
      }
    } catch (error) {
      console.error('[PatientCache] Error clearing L2 cache', error);
    }

    this.stats.invalidations++;
    console.log('[PatientCache] All caches invalidated');
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
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
      invalidations: 0
    };
  }
}

