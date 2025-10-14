"use strict";
/**
 * Patient Cache with L1/L2 Strategy
 * L1: In-memory cache (fast, limited size)
 * L2: Redis cache (persistent, larger capacity)
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatientCache = void 0;
const redis_1 = require("redis");
/**
 * Patient Cache with L1 (memory) and L2 (Redis) caching
 */
class PatientCache {
    constructor(redisUrl) {
        this.memoryCache = new Map();
        this.L1_TTL_MS = 60 * 1000;
        this.L2_TTL_SECONDS = 300;
        this.MAX_L1_SIZE = 1000;
        this.stats = {
            l1Hits: 0,
            l1Misses: 0,
            l2Hits: 0,
            l2Misses: 0,
            invalidations: 0
        };
        this.hasConnected = false;
        this.redisClient = (0, redis_1.createClient)({ url: redisUrl });
        this.redisPubSub = (0, redis_1.createClient)({ url: redisUrl });
    }
    /**
     * Connect to Redis
     */
    async connect() {
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
                }
                catch (error) {
                    console.error('[PatientCache] Error processing invalidation message', error);
                }
            });
            this.hasConnected = true;
            console.log('[PatientCache] Connected successfully');
        }
        catch (error) {
            console.error('[PatientCache] Connection failed', error);
            throw error;
        }
    }
    /**
     * Disconnect from Redis
     */
    async disconnect() {
        try {
            await this.redisPubSub.unsubscribe('patient:invalidate');
            await this.redisPubSub.quit();
            await this.redisClient.quit();
            this.hasConnected = false;
            console.log('[PatientCache] Disconnected successfully');
        }
        catch (error) {
            console.error('[PatientCache] Disconnect error', error);
        }
    }
    /**
     * Get cache key
     */
    getCacheKey(patientId) {
        return `patient:${patientId}`;
    }
    /**
     * Check if cache entry is expired
     */
    isExpired(entry, ttlMs) {
        return Date.now() - entry.timestamp > ttlMs;
    }
    /**
     * Set L1 cache entry
     */
    setL1(key, data) {
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
    async get(patientId) {
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
        }
        catch (error) {
            console.error('[PatientCache] Error reading from L2 cache', error);
        }
        this.stats.l2Misses++;
        return null;
    }
    /**
     * Get patient by BHYT number
     */
    async getByBHYT(bhytNumber) {
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
        }
        catch (error) {
            console.error('[PatientCache] Error reading from L2 cache', error);
        }
        this.stats.l2Misses++;
        return null;
    }
    /**
     * Set patient in cache
     */
    async set(patientId, patient) {
        const key = this.getCacheKey(patientId.value);
        this.setL1(key, patient);
        try {
            await this.redisClient.setEx(key, this.L2_TTL_SECONDS, JSON.stringify(patient));
        }
        catch (error) {
            console.error('[PatientCache] Error writing to L2 cache', error);
        }
    }
    /**
     * Set patient by BHYT number
     */
    async setByBHYT(bhytNumber, patient) {
        const key = `patient:bhyt:${bhytNumber}`;
        this.setL1(key, patient);
        try {
            await this.redisClient.setEx(key, this.L2_TTL_SECONDS, JSON.stringify(patient));
        }
        catch (error) {
            console.error('[PatientCache] Error writing to L2 cache', error);
        }
    }
    /**
     * Invalidate cache for a patient
     */
    async invalidate(patientId) {
        const key = this.getCacheKey(patientId.value);
        this.memoryCache.delete(key);
        try {
            await this.redisClient.del(key);
        }
        catch (error) {
            console.error('[PatientCache] Error deleting from L2 cache', error);
        }
        try {
            await this.redisClient.publish('patient:invalidate', JSON.stringify({
                patientId: patientId.value,
                timestamp: Date.now()
            }));
        }
        catch (error) {
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
    async invalidateAll() {
        this.memoryCache.clear();
        try {
            const keys = await this.redisClient.keys('patient:*');
            if (keys.length > 0) {
                await this.redisClient.del(keys);
            }
        }
        catch (error) {
            console.error('[PatientCache] Error clearing L2 cache', error);
        }
        this.stats.invalidations++;
        console.log('[PatientCache] All caches invalidated');
    }
    /**
     * Get cache statistics
     */
    getStats() {
        return { ...this.stats };
    }
    /**
     * Reset statistics
     */
    resetStats() {
        this.stats = {
            l1Hits: 0,
            l1Misses: 0,
            l2Hits: 0,
            l2Misses: 0,
            invalidations: 0
        };
    }
}
exports.PatientCache = PatientCache;
//# sourceMappingURL=PatientCache.js.map