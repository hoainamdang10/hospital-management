/**
 * Advanced Caching Service for GraphQL Gateway
 * Multi-layer caching with Redis, Memory, and Query-level optimization
 */
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
export declare class AdvancedCacheService {
    private redis;
    private memoryCache;
    private stats;
    private compressionEnabled;
    constructor();
    /**
     * Initialize Redis connection with clustering support
     */
    private initializeRedis;
    /**
     * Initialize memory cache
     */
    private initializeMemoryCache;
    /**
     * Initialize cache statistics
     */
    private initializeStats;
    /**
     * Generate cache key with namespace and hashing
     */
    private generateCacheKey;
    /**
     * Compress data if enabled
     */
    private compressData;
    /**
     * Decompress data if needed
     */
    private decompressData;
    /**
     * Get from cache with fallback strategy
     */
    get<T>(namespace: string, key: string, params?: any): Promise<T | null>;
    /**
     * Set cache with multiple layers and strategies
     */
    set<T>(namespace: string, key: string, value: T, options?: CacheOptions): Promise<void>;
    /**
     * Delete from cache
     */
    delete(namespace: string, key: string, params?: any): Promise<void>;
    /**
     * Invalidate cache by tags
     */
    invalidateByTags(tags: string[]): Promise<void>;
    /**
     * Add tags to cache key for invalidation
     */
    private addTags;
    /**
     * Get cache statistics
     */
    getStats(): CacheStats;
    /**
     * Clear all caches
     */
    clear(): Promise<void>;
    /**
     * Start periodic stats reporting
     */
    private startStatsReporting;
    /**
     * Health check
     */
    healthCheck(): Promise<boolean>;
    /**
     * Cleanup resources
     */
    cleanup(): Promise<void>;
}
export declare const advancedCacheService: AdvancedCacheService;
//# sourceMappingURL=advanced-cache.service.d.ts.map