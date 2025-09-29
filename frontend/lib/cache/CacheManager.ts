import React from 'react';
import { toast } from 'sonner';

export interface CacheItem<T = any> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  key: string;
}

export interface CacheOptions {
  ttl?: number; // Default TTL in milliseconds
  maxSize?: number; // Maximum number of items in cache
  storage?: 'memory' | 'localStorage' | 'sessionStorage';
  prefix?: string; // Prefix for storage keys
}

export class CacheManager {
  private cache = new Map<string, CacheItem>();
  private options: Required<CacheOptions>;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(options: CacheOptions = {}) {
    this.options = {
      ttl: 5 * 60 * 1000, // 5 minutes default
      maxSize: 100,
      storage: 'memory',
      prefix: 'hospital_cache_',
      ...options
    };

    // Start cleanup interval for memory cache
    if (this.options.storage === 'memory') {
      this.startCleanupInterval();
    }

    // Load existing cache from storage
    this.loadFromStorage();
  }

  /**
   * Set an item in the cache
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.options.ttl,
      key
    };

    if (this.options.storage === 'memory') {
      // Check cache size limit
      if (this.cache.size >= this.options.maxSize) {
        this.evictOldest();
      }
      this.cache.set(key, item);
    } else {
      this.setInStorage(key, item);
    }
  }

  /**
   * Get an item from the cache
   */
  get<T>(key: string): T | null {
    let item: CacheItem<T> | null = null;

    if (this.options.storage === 'memory') {
      item = this.cache.get(key) as CacheItem<T> || null;
    } else {
      item = this.getFromStorage<T>(key);
    }

    if (!item) {
      return null;
    }

    // Check if item has expired
    if (this.isExpired(item)) {
      this.delete(key);
      return null;
    }

    return item.data;
  }

  /**
   * Delete an item from the cache
   */
  delete(key: string): boolean {
    if (this.options.storage === 'memory') {
      return this.cache.delete(key);
    } else {
      return this.deleteFromStorage(key);
    }
  }

  /**
   * Clear all items from the cache
   */
  clear(): void {
    if (this.options.storage === 'memory') {
      this.cache.clear();
    } else {
      this.clearStorage();
    }
  }

  /**
   * Check if a key exists in the cache and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const keys = this.getAllKeys();
    const expired = keys.filter(key => {
      const item = this.options.storage === 'memory' 
        ? this.cache.get(key)
        : this.getFromStorage(key);
      return item && this.isExpired(item);
    });

    return {
      totalItems: keys.length,
      expiredItems: expired.length,
      activeItems: keys.length - expired.length,
      cacheHitRate: this.getCacheHitRate(),
      storage: this.options.storage,
      maxSize: this.options.maxSize
    };
  }

  /**
   * Memoize a function with caching
   */
  memoize<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    keyGenerator?: (...args: Parameters<T>) => string,
    ttl?: number
  ): T {
    return (async (...args: Parameters<T>) => {
      const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
      
      // Try to get from cache first
      const cached = this.get(key);
      if (cached !== null) {
        return cached;
      }

      // Execute function and cache result
      try {
        const result = await fn(...args);
        this.set(key, result, ttl);
        return result;
      } catch (error) {
        // Don't cache errors
        throw error;
      }
    }) as T;
  }

  /**
   * Invalidate cache entries by pattern
   */
  invalidatePattern(pattern: string | RegExp): number {
    const keys = this.getAllKeys();
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    let deletedCount = 0;

    keys.forEach(key => {
      if (regex.test(key)) {
        this.delete(key);
        deletedCount++;
      }
    });

    return deletedCount;
  }

  /**
   * Preload data into cache
   */
  async preload<T>(
    key: string,
    dataLoader: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    try {
      const data = await dataLoader();
      this.set(key, data, ttl);
      return data;
    } catch (error) {
      console.error(`Failed to preload cache for key: ${key}`, error);
      throw error;
    }
  }

  /**
   * Refresh cache entry
   */
  async refresh<T>(
    key: string,
    dataLoader: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    this.delete(key);
    return this.preload(key, dataLoader, ttl);
  }

  // Private methods
  private isExpired(item: CacheItem): boolean {
    return Date.now() - item.timestamp > item.ttl;
  }

  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTimestamp = Date.now();

    for (const [key, item] of this.cache) {
      if (item.timestamp < oldestTimestamp) {
        oldestTimestamp = item.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000); // Cleanup every minute
  }

  private cleanup(): void {
    const expiredKeys: string[] = [];
    
    for (const [key, item] of this.cache) {
      if (this.isExpired(item)) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.cache.delete(key));
  }

  private getAllKeys(): string[] {
    if (this.options.storage === 'memory') {
      return Array.from(this.cache.keys());
    } else {
      const storage = this.getStorageObject();
      const keys: string[] = [];
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (key && key.startsWith(this.options.prefix)) {
          keys.push(key.replace(this.options.prefix, ''));
        }
      }
      return keys;
    }
  }

  private getStorageObject(): Storage {
    return this.options.storage === 'localStorage' ? localStorage : sessionStorage;
  }

  private setInStorage<T>(key: string, item: CacheItem<T>): void {
    try {
      const storage = this.getStorageObject();
      storage.setItem(this.options.prefix + key, JSON.stringify(item));
    } catch (error) {
      console.warn('Failed to set cache item in storage:', error);
    }
  }

  private getFromStorage<T>(key: string): CacheItem<T> | null {
    try {
      const storage = this.getStorageObject();
      const item = storage.getItem(this.options.prefix + key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.warn('Failed to get cache item from storage:', error);
      return null;
    }
  }

  private deleteFromStorage(key: string): boolean {
    try {
      const storage = this.getStorageObject();
      storage.removeItem(this.options.prefix + key);
      return true;
    } catch (error) {
      console.warn('Failed to delete cache item from storage:', error);
      return false;
    }
  }

  private clearStorage(): void {
    try {
      const storage = this.getStorageObject();
      const keysToDelete: string[] = [];
      
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (key && key.startsWith(this.options.prefix)) {
          keysToDelete.push(key);
        }
      }
      
      keysToDelete.forEach(key => storage.removeItem(key));
    } catch (error) {
      console.warn('Failed to clear cache from storage:', error);
    }
  }

  private loadFromStorage(): void {
    if (this.options.storage === 'memory') return;

    try {
      const keys = this.getAllKeys();
      keys.forEach(key => {
        const item = this.getFromStorage(key);
        if (item && !this.isExpired(item)) {
          // Item is still valid, keep it
        } else if (item) {
          // Item is expired, remove it
          this.deleteFromStorage(key);
        }
      });
    } catch (error) {
      console.warn('Failed to load cache from storage:', error);
    }
  }

  private cacheHits = 0;
  private cacheMisses = 0;

  private getCacheHitRate(): number {
    const total = this.cacheHits + this.cacheMisses;
    return total === 0 ? 0 : this.cacheHits / total;
  }

  /**
   * Destroy the cache manager and cleanup resources
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clear();
  }
}

// Global cache instances
export const memoryCache = new CacheManager({ storage: 'memory', ttl: 5 * 60 * 1000 });
export const persistentCache = new CacheManager({ storage: 'localStorage', ttl: 30 * 60 * 1000 });
export const sessionCache = new CacheManager({ storage: 'sessionStorage', ttl: 60 * 60 * 1000 });

// Cache decorators for API functions
export function cached(ttl?: number, keyGenerator?: (...args: any[]) => string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = memoryCache.memoize(originalMethod, keyGenerator, ttl);
    
    return descriptor;
  };
}

// React hook for cache management
export function useCache(cacheManager: CacheManager = memoryCache) {
  const [stats, setStats] = React.useState(cacheManager.getStats());

  const refreshStats = React.useCallback(() => {
    setStats(cacheManager.getStats());
  }, [cacheManager]);

  React.useEffect(() => {
    const interval = setInterval(refreshStats, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, [refreshStats]);

  return {
    stats,
    refreshStats,
    clear: () => {
      cacheManager.clear();
      refreshStats();
      toast.success('Cache cleared successfully');
    },
    invalidatePattern: (pattern: string | RegExp) => {
      const deletedCount = cacheManager.invalidatePattern(pattern);
      refreshStats();
      toast.success(`Invalidated ${deletedCount} cache entries`);
    }
  };
}
