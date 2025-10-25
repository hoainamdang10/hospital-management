/**
 * ICacheService - Application Service Interface
 * V2 Clean Architecture + DDD Implementation
 * Defines contract for caching operations
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD
 */

/**
 * Cache Service Interface
 * Abstracts caching implementation from application logic
 */
export interface ICacheService {
  /**
   * Get value from cache
   * @param key Cache key
   * @returns Cached value or null if not found
   */
  get(key: string): Promise<string | null>;

  /**
   * Set value in cache
   * @param key Cache key
   * @param value Value to cache (can be any type, will be serialized)
   * @param options Cache options (ttl, prefix, etc.)
   * @returns Success status
   */
  set<T>(key: string, value: T, options?: { ttl?: number; prefix?: string }): Promise<boolean>;

  /**
   * Delete value from cache
   * @param key Cache key
   * @returns Success status
   */
  delete(key: string): Promise<boolean>;

  /**
   * Check if key exists in cache
   * @param key Cache key
   * @returns True if key exists
   */
  exists(key: string): Promise<boolean>;

  /**
   * Clear all cache entries (use with caution)
   * @returns Number of keys deleted
   */
  clear?(): Promise<number>;

  /**
   * Get multiple values from cache
   * @param keys Array of cache keys
   * @returns Array of cached values (null for missing keys)
   */
  mget?(keys: string[]): Promise<(string | null)[]>;

  /**
   * Set multiple values in cache
   * @param entries Array of key-value pairs
   * @param ttl Time to live in seconds (optional)
   */
  mset?(entries: Array<{ key: string; value: string }>, ttl?: number): Promise<void>;

  /**
   * Increment numeric value in cache
   * @param key Cache key
   * @param increment Amount to increment (default: 1)
   * @returns New value after increment
   */
  increment?(key: string, increment?: number): Promise<number>;

  /**
   * Set expiration time for a key
   * @param key Cache key
   * @param ttl Time to live in seconds
   */
  expire?(key: string, ttl: number): Promise<void>;

  /**
   * Get remaining time to live for a key
   * @param key Cache key
   * @returns Remaining TTL in seconds, -1 if no expiration, -2 if key doesn't exist
   */
  ttl?(key: string): Promise<number>;
}

