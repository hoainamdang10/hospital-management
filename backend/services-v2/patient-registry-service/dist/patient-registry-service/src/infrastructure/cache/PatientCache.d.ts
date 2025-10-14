/**
 * Patient Cache with L1/L2 Strategy
 * L1: In-memory cache (fast, limited size)
 * L2: Redis cache (persistent, larger capacity)
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { PatientId } from '../../domain/value-objects/PatientId';
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
export declare class PatientCache {
    private memoryCache;
    private redisClient;
    private redisPubSub;
    private readonly L1_TTL_MS;
    private readonly L2_TTL_SECONDS;
    private readonly MAX_L1_SIZE;
    private stats;
    private hasConnected;
    constructor(redisUrl: string);
    /**
     * Connect to Redis
     */
    connect(): Promise<void>;
    /**
     * Disconnect from Redis
     */
    disconnect(): Promise<void>;
    /**
     * Get cache key
     */
    private getCacheKey;
    /**
     * Check if cache entry is expired
     */
    private isExpired;
    /**
     * Set L1 cache entry
     */
    private setL1;
    /**
     * Get patient from cache
     */
    get(patientId: PatientId): Promise<any | null>;
    /**
     * Get patient by BHYT number
     */
    getByBHYT(bhytNumber: string): Promise<any | null>;
    /**
     * Set patient in cache
     */
    set(patientId: PatientId, patient: any): Promise<void>;
    /**
     * Set patient by BHYT number
     */
    setByBHYT(bhytNumber: string, patient: any): Promise<void>;
    /**
     * Invalidate cache for a patient
     */
    invalidate(patientId: PatientId): Promise<void>;
    /**
     * Invalidate all patient caches
     */
    invalidateAll(): Promise<void>;
    /**
     * Get cache statistics
     */
    getStats(): CacheStats;
    /**
     * Reset statistics
     */
    resetStats(): void;
}
export {};
//# sourceMappingURL=PatientCache.d.ts.map