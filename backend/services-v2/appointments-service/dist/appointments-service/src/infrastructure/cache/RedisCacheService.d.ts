/**
 * Redis Cache Service - Infrastructure Layer
 * Provides caching layer for external service data
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Caching Patterns
 */
/**
 * Cache Options
 */
export interface CacheOptions {
    ttl?: number;
    prefix?: string;
}
/**
 * Redis Cache Service
 */
export declare class RedisCacheService {
    private client;
    private isConnected;
    constructor(redisUrl?: string);
    /**
     * Connect to Redis
     */
    connect(): Promise<void>;
    /**
     * Get value from cache
     */
    get<T>(key: string, options?: CacheOptions): Promise<T | null>;
    /**
     * Set value in cache
     */
    set<T>(key: string, value: T, options?: CacheOptions): Promise<boolean>;
    /**
     * Delete value from cache
     */
    delete(key: string, options?: CacheOptions): Promise<boolean>;
    /**
     * Delete multiple keys by pattern
     */
    deletePattern(pattern: string, options?: CacheOptions): Promise<number>;
    /**
     * Check if key exists
     */
    exists(key: string, options?: CacheOptions): Promise<boolean>;
    /**
     * Get or set pattern (cache-aside)
     */
    getOrSet<T>(key: string, fetchFn: () => Promise<T>, options?: CacheOptions): Promise<T | null>;
    /**
     * Flush all cache
     */
    flushAll(): Promise<boolean>;
    /**
     * Get cache statistics
     */
    getStats(): Promise<any>;
    /**
     * Disconnect from Redis
     */
    disconnect(): Promise<void>;
    /**
     * Setup event listeners
     */
    private setupEventListeners;
    /**
     * Check if connected
     */
    isReady(): boolean;
}
export declare const redisCacheService: RedisCacheService;
//# sourceMappingURL=RedisCacheService.d.ts.map