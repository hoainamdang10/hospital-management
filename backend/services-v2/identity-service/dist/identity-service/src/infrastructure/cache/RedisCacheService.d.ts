/**
 * Redis Cache Service
 * Provides caching functionality using Redis for improved performance
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { ILogger } from '../../application/services/ILogger';
export interface CacheOptions {
    ttl?: number;
    prefix?: string;
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
export declare class RedisCacheService {
    private logger;
    private client;
    private isConnected;
    private readonly keyPrefix;
    private stats;
    constructor(redisUrl: string, logger: ILogger, keyPrefix?: string);
    /**
     * Setup Redis event handlers
     */
    private setupEventHandlers;
    /**
     * Connect to Redis
     */
    connect(): Promise<void>;
    /**
     * Disconnect from Redis
     */
    disconnect(): Promise<void>;
    /**
     * Get value from cache
     */
    get<T>(key: string): Promise<T | null>;
    /**
     * Set value in cache with TTL
     */
    set<T>(key: string, value: T, options?: CacheOptions): Promise<boolean>;
    /**
     * Delete value from cache
     */
    delete(key: string): Promise<boolean>;
    /**
     * Delete multiple keys by pattern
     */
    deletePattern(pattern: string): Promise<number>;
    /**
     * Check if key exists
     */
    exists(key: string): Promise<boolean>;
    /**
     * Get TTL for key
     */
    getTTL(key: string): Promise<number>;
    /**
     * Clear all cache entries with prefix
     */
    clear(): Promise<number>;
    /**
     * Get cache statistics
     */
    getStats(): CacheStats;
    /**
     * Reset cache statistics
     */
    resetStats(): void;
    /**
     * Check if Redis is connected
     */
    isReady(): boolean;
    /**
     * Get full key with prefix
     */
    private getFullKey;
    /**
     * Update hit rate
     */
    private updateHitRate;
}
//# sourceMappingURL=RedisCacheService.d.ts.map