"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.disconnectRedis = exports.getRedisClient = exports.connectRedis = void 0;
const redis_1 = require("redis");
// Simple console logger for Docker build
const logger = {
    info: (message, meta) => console.log(`[INFO] ${message}`, meta || ''),
    error: (message, meta) => console.error(`[ERROR] ${message}`, meta || ''),
    warn: (message, meta) => console.warn(`[WARN] ${message}`, meta || ''),
    debug: (message, meta) => console.debug(`[DEBUG] ${message}`, meta || ''),
    http: (message, meta) => console.log(`[HTTP] ${message}`, meta || '')
};
let redisClient;
const connectRedis = async () => {
    try {
        redisClient = (0, redis_1.createClient)({
            url: process.env.REDIS_URL || 'redis://localhost:6379',
        });
        redisClient.on('error', (err) => {
            logger.error('Redis Client Error', { error: err.message });
        });
        redisClient.on('connect', () => {
            logger.info('Redis Client Connected');
        });
        redisClient.on('ready', () => {
            logger.info('Redis Client Ready');
        });
        redisClient.on('end', () => {
            logger.info('Redis Client Disconnected');
        });
        await redisClient.connect();
        // Test the connection
        await redisClient.ping();
        logger.info('Redis connected successfully');
    }
    catch (error) {
        logger.error('Redis connection failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        // Don't throw error, just log it - Redis is optional for API Gateway
    }
};
exports.connectRedis = connectRedis;
const getRedisClient = () => {
    return redisClient || null;
};
exports.getRedisClient = getRedisClient;
const disconnectRedis = async () => {
    if (redisClient) {
        await redisClient.quit();
        logger.info('Redis disconnected');
    }
};
exports.disconnectRedis = disconnectRedis;
