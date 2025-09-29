export declare const CACHE_KEYS: {
    DOCTOR_PROFILE: string;
    DOCTOR_STATS: string;
    DOCTOR_REVIEWS: string;
    DOCTOR_SCHEDULE: string;
    DOCTOR_AVAILABILITY: string;
    DOCTOR_DASHBOARD: string;
    PATIENT_PROFILE: string;
    PATIENT_APPOINTMENTS: string;
    PATIENT_MEDICAL_RECORDS: string;
    APPOINTMENT_DETAILS: string;
    APPOINTMENT_SLOTS: string;
    APPOINTMENT_QUEUE: string;
    DEPARTMENT_INFO: string;
    DEPARTMENT_DOCTORS: string;
    DEPARTMENT_STATS: string;
    SYSTEM_CONFIG: string;
    API_RESPONSES: string;
};
declare class CacheService {
    private shortTermCache;
    private mediumTermCache;
    private longTermCache;
    private staticCache;
    private isInitialized;
    constructor();
    /**
     * Initialize cache service with event listeners
     */
    initialize(): Promise<void>;
    /**
     * Setup event listeners for cache monitoring
     */
    private setupEventListeners;
    /**
     * Get cache instance by type
     */
    private getCacheByType;
    /**
     * Set cache value with automatic type selection based on key
     */
    set(key: string, value: any, ttl?: number): Promise<boolean>;
    /**
     * Get cache value
     */
    get<T = any>(key: string): Promise<T | undefined>;
    /**
     * Delete cache value
     */
    del(key: string): Promise<number>;
    /**
     * Check if key exists in cache
     */
    has(key: string): Promise<boolean>;
    /**
     * Get or set cache value (cache-aside pattern)
     */
    getOrSet<T = any>(key: string, fetchFunction: () => Promise<T>, ttl?: number): Promise<T | undefined>;
    /**
     * Invalidate cache by pattern
     */
    invalidatePattern(pattern: string): Promise<number>;
    /**
     * Get cache statistics
     */
    getStats(): any;
    /**
     * Clear all caches
     */
    clearAll(): Promise<void>;
    /**
     * Determine cache type based on key prefix
     */
    private determineCacheType;
    /**
     * Check if service is ready
     */
    isReady(): boolean;
    /**
     * Cleanup resources
     */
    cleanup(): Promise<void>;
}
export declare const cacheService: CacheService;
export default cacheService;
//# sourceMappingURL=cache.service.d.ts.map