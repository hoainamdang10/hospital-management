"use strict";
/**
 * Redis Cache Service - Infrastructure Layer
 * Provides caching layer for external service data
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Caching Patterns
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisCacheService = exports.RedisCacheService = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
/**
 * Default Cache Options
 */
const DEFAULT_TTL = 300;
const DEFAULT_PREFIX = 'scheduling:';
/**
 * Redis Cache Service
 */
class RedisCacheService {
    constructor(redisUrl) {
        this.isConnected = false;
        const url = redisUrl || process.env.REDIS_URL || 'redis://localhost:6379';
        this.client = new ioredis_1.default(url, {
            retryStrategy: (times) => {
                const delay = Math.min(times * 50, 2000);
                return delay;
            },
            maxRetriesPerRequest: 3,
            enableReadyCheck: true,
            lazyConnect: true
        });
        this.setupEventListeners();
    }
    /**
     * Connect to Redis
     */
    async connect() {
        try {
            await this.client.connect();
            this.isConnected = true;
            console.log('[Redis] Connected successfully');
        }
        catch (error) {
            console.error('[Redis] Connection failed:', error);
            this.isConnected = false;
        }
    }
    /**
     * Get value from cache
     */
    async get(key, options = {}) {
        if (!this.isConnected) {
            console.warn('[Redis] Not connected - skipping cache get');
            return null;
        }
        try {
            const prefix = options.prefix || DEFAULT_PREFIX;
            const fullKey = `${prefix}${key}`;
            const value = await this.client.get(fullKey);
            if (!value) {
                return null;
            }
            return JSON.parse(value);
        }
        catch (error) {
            console.error(`[Redis] Get error for key ${key}:`, error);
            return null;
        }
    }
    /**
     * Set value in cache
     */
    async set(key, value, options = {}) {
        if (!this.isConnected) {
            console.warn('[Redis] Not connected - skipping cache set');
            return false;
        }
        try {
            const prefix = options.prefix || DEFAULT_PREFIX;
            const ttl = options.ttl || DEFAULT_TTL;
            const fullKey = `${prefix}${key}`;
            const serialized = JSON.stringify(value);
            await this.client.setex(fullKey, ttl, serialized);
            return true;
        }
        catch (error) {
            console.error(`[Redis] Set error for key ${key}:`, error);
            return false;
        }
    }
    /**
     * Delete value from cache
     */
    async delete(key, options = {}) {
        if (!this.isConnected) {
            console.warn('[Redis] Not connected - skipping cache delete');
            return false;
        }
        try {
            const prefix = options.prefix || DEFAULT_PREFIX;
            const fullKey = `${prefix}${key}`;
            await this.client.del(fullKey);
            return true;
        }
        catch (error) {
            console.error(`[Redis] Delete error for key ${key}:`, error);
            return false;
        }
    }
    /**
     * Delete multiple keys by pattern
     */
    async deletePattern(pattern, options = {}) {
        if (!this.isConnected) {
            console.warn('[Redis] Not connected - skipping cache delete pattern');
            return 0;
        }
        try {
            const prefix = options.prefix || DEFAULT_PREFIX;
            const fullPattern = `${prefix}${pattern}`;
            const keys = await this.client.keys(fullPattern);
            if (keys.length === 0) {
                return 0;
            }
            await this.client.del(...keys);
            return keys.length;
        }
        catch (error) {
            console.error(`[Redis] Delete pattern error for ${pattern}:`, error);
            return 0;
        }
    }
    /**
     * Check if key exists
     */
    async exists(key, options = {}) {
        if (!this.isConnected) {
            return false;
        }
        try {
            const prefix = options.prefix || DEFAULT_PREFIX;
            const fullKey = `${prefix}${key}`;
            const result = await this.client.exists(fullKey);
            return result === 1;
        }
        catch (error) {
            console.error(`[Redis] Exists error for key ${key}:`, error);
            return false;
        }
    }
    /**
     * Get or set pattern (cache-aside)
     */
    async getOrSet(key, fetchFn, options = {}) {
        const cached = await this.get(key, options);
        if (cached !== null) {
            console.debug(`[Redis] Cache hit for key: ${key}`);
            return cached;
        }
        console.debug(`[Redis] Cache miss for key: ${key}`);
        try {
            const value = await fetchFn();
            await this.set(key, value, options);
            return value;
        }
        catch (error) {
            console.error(`[Redis] GetOrSet error for key ${key}:`, error);
            return null;
        }
    }
    /**
     * Flush all cache
     */
    async flushAll() {
        if (!this.isConnected) {
            console.warn('[Redis] Not connected - skipping flush');
            return false;
        }
        try {
            await this.client.flushall();
            console.log('[Redis] Cache flushed');
            return true;
        }
        catch (error) {
            console.error('[Redis] Flush error:', error);
            return false;
        }
    }
    /**
     * Get cache statistics
     */
    async getStats() {
        if (!this.isConnected) {
            return { connected: false };
        }
        try {
            const info = await this.client.info('stats');
            return {
                connected: true,
                info
            };
        }
        catch (error) {
            console.error('[Redis] Stats error:', error);
            return { connected: false, error };
        }
    }
    /**
     * Disconnect from Redis
     */
    async disconnect() {
        try {
            await this.client.quit();
            this.isConnected = false;
            console.log('[Redis] Disconnected');
        }
        catch (error) {
            console.error('[Redis] Disconnect error:', error);
        }
    }
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        this.client.on('connect', () => {
            console.log('[Redis] Connecting...');
        });
        this.client.on('ready', () => {
            this.isConnected = true;
            console.log('[Redis] Ready');
        });
        this.client.on('error', (error) => {
            console.error('[Redis] Error:', error.message);
            this.isConnected = false;
        });
        this.client.on('close', () => {
            console.log('[Redis] Connection closed');
            this.isConnected = false;
        });
        this.client.on('reconnecting', () => {
            console.log('[Redis] Reconnecting...');
        });
    }
    /**
     * Check if connected
     */
    isReady() {
        return this.isConnected;
    }
}
exports.RedisCacheService = RedisCacheService;
exports.redisCacheService = new RedisCacheService();
//# sourceMappingURL=RedisCacheService.js.map