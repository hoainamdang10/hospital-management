"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisClient = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
class RedisClient {
    constructor(logger, redisUrl) {
        this.isConnected = false;
        this.logger = logger;
        const connectionString = redisUrl || process.env.REDIS_URL || 'redis://localhost:6379';
        this.client = new ioredis_1.default(connectionString, {
            retryDelayOnFailover: 100,
            enableReadyCheck: true,
            maxRetriesPerRequest: 3,
            lazyConnect: true,
            reconnectOnError: (err) => {
                const targetError = 'READONLY';
                return err.message.includes(targetError);
            }
        });
        this.setupEventHandlers();
    }
    setupEventHandlers() {
        this.client.on('connect', () => {
            this.logger.info('Redis client connected');
            this.isConnected = true;
        });
        this.client.on('ready', () => {
            this.logger.info('Redis client ready');
        });
        this.client.on('error', (error) => {
            this.logger.error('Redis client error:', error);
            this.isConnected = false;
        });
        this.client.on('close', () => {
            this.logger.warn('Redis client connection closed');
            this.isConnected = false;
        });
        this.client.on('reconnecting', () => {
            this.logger.info('Redis client reconnecting...');
        });
    }
    async connect() {
        try {
            await this.client.connect();
            this.logger.info('Redis connection established');
        }
        catch (error) {
            this.logger.error('Failed to connect to Redis:', error);
            throw error;
        }
    }
    async disconnect() {
        try {
            await this.client.disconnect();
            this.logger.info('Redis connection closed');
        }
        catch (error) {
            this.logger.error('Error disconnecting from Redis:', error);
        }
    }
    isReady() {
        return this.isConnected && this.client.status === 'ready';
    }
    async get(key) {
        try {
            return await this.client.get(key);
        }
        catch (error) {
            this.logger.error(`Redis GET error for key ${key}:`, error);
            throw error;
        }
    }
    async set(key, value, ttlSeconds) {
        try {
            if (ttlSeconds) {
                await this.client.setex(key, ttlSeconds, value);
            }
            else {
                await this.client.set(key, value);
            }
        }
        catch (error) {
            this.logger.error(`Redis SET error for key ${key}:`, error);
            throw error;
        }
    }
    async del(key) {
        try {
            return await this.client.del(key);
        }
        catch (error) {
            this.logger.error(`Redis DEL error for key ${key}:`, error);
            throw error;
        }
    }
    async exists(key) {
        try {
            const result = await this.client.exists(key);
            return result === 1;
        }
        catch (error) {
            this.logger.error(`Redis EXISTS error for key ${key}:`, error);
            throw error;
        }
    }
    async keys(pattern) {
        try {
            return await this.client.keys(pattern);
        }
        catch (error) {
            this.logger.error(`Redis KEYS error for pattern ${pattern}:`, error);
            throw error;
        }
    }
    async expire(key, seconds) {
        try {
            const result = await this.client.expire(key, seconds);
            return result === 1;
        }
        catch (error) {
            this.logger.error(`Redis EXPIRE error for key ${key}:`, error);
            throw error;
        }
    }
    async hget(key, field) {
        try {
            return await this.client.hget(key, field);
        }
        catch (error) {
            this.logger.error(`Redis HGET error for key ${key}, field ${field}:`, error);
            throw error;
        }
    }
    async hset(key, field, value) {
        try {
            await this.client.hset(key, field, value);
        }
        catch (error) {
            this.logger.error(`Redis HSET error for key ${key}, field ${field}:`, error);
            throw error;
        }
    }
    async hgetall(key) {
        try {
            return await this.client.hgetall(key);
        }
        catch (error) {
            this.logger.error(`Redis HGETALL error for key ${key}:`, error);
            throw error;
        }
    }
    async lpush(key, ...values) {
        try {
            return await this.client.lpush(key, ...values);
        }
        catch (error) {
            this.logger.error(`Redis LPUSH error for key ${key}:`, error);
            throw error;
        }
    }
    async rpop(key) {
        try {
            return await this.client.rpop(key);
        }
        catch (error) {
            this.logger.error(`Redis RPOP error for key ${key}:`, error);
            throw error;
        }
    }
    async llen(key) {
        try {
            return await this.client.llen(key);
        }
        catch (error) {
            this.logger.error(`Redis LLEN error for key ${key}:`, error);
            throw error;
        }
    }
    async incr(key) {
        try {
            return await this.client.incr(key);
        }
        catch (error) {
            this.logger.error(`Redis INCR error for key ${key}:`, error);
            throw error;
        }
    }
    getClient() {
        return this.client;
    }
    async healthCheck() {
        const start = Date.now();
        try {
            await this.client.ping();
            const latency = Date.now() - start;
            return { status: 'healthy', latency };
        }
        catch (error) {
            const latency = Date.now() - start;
            this.logger.error('Redis health check failed:', error);
            return { status: 'unhealthy', latency };
        }
    }
}
exports.RedisClient = RedisClient;
//# sourceMappingURL=RedisClient.js.map