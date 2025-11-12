/**
 * Redis Cache Service for Patient Registry
 * Provides caching functionality using Redis for improved performance
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { ILogger } from '@shared/application/services/logger.interface';
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
 * Redis Cache Service for Patient Registry Service
 * Implements caching with TTL, invalidation, and pattern-based deletion
 */
export declare class RedisCacheService {
    private logger;
    private client;
    private keyPrefix;
    private isConnected;
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
     * Get full key with prefix
     */
    private getFullKey;
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
     * Delete multiple keys matching a pattern
     */
    deletePattern(pattern: string): Promise<number>;
    /**
     * Check if key exists
     */
    exists(key: string): Promise<boolean>;
    /**
     * Update hit rate
     */
    private updateHitRate;
    /**
     * Get cache statistics
     */
    getStats(): CacheStats;
    /**
     * Reset statistics
     */
    resetStats(): void;
    /**
     * Check if connected
     */
    isReady(): boolean;
}
//# sourceMappingURL=RedisCacheService.d.ts.map