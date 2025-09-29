"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheService = exports.CacheService = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
class CacheService {
    constructor() {
        this.TTL = {
            PATIENT_RECORDS: 300, // 5 minutes
            DOCTOR_RECORDS: 600, // 10 minutes
            STATISTICS: 1800, // 30 minutes
            SEARCH_RESULTS: 120, // 2 minutes
        };
        this.redis = new ioredis_1.default({
            host: process.env.REDIS_HOST || "localhost",
            port: parseInt(process.env.REDIS_PORT || "6379"),
            db: 1, // Use separate DB for medical records
            maxRetriesPerRequest: 3,
            lazyConnect: true,
        });
        this.redis.on("error", (error) => {
            console.error("Redis connection error:", error);
        });
    }
    // Patient records caching
    async getPatientRecords(patientId) {
        try {
            const cached = await this.redis.get(`patient_records:${patientId}`);
            return cached ? JSON.parse(cached) : null;
        }
        catch (error) {
            console.error("Cache get error:", error);
            return null;
        }
    }
    async setPatientRecords(patientId, records) {
        try {
            await this.redis.setex(`patient_records:${patientId}`, this.TTL.PATIENT_RECORDS, JSON.stringify(records));
        }
        catch (error) {
            console.error("Cache set error:", error);
        }
    }
    // Doctor records caching
    async getDoctorRecords(doctorId, page = 1) {
        try {
            const cached = await this.redis.get(`doctor_records:${doctorId}:${page}`);
            return cached ? JSON.parse(cached) : null;
        }
        catch (error) {
            console.error("Cache get error:", error);
            return null;
        }
    }
    async setDoctorRecords(doctorId, page, records) {
        try {
            await this.redis.setex(`doctor_records:${doctorId}:${page}`, this.TTL.DOCTOR_RECORDS, JSON.stringify(records));
        }
        catch (error) {
            console.error("Cache set error:", error);
        }
    }
    // Search results caching
    async getSearchResults(query, filters) {
        try {
            const key = `search:${this.hashQuery(query, filters)}`;
            const cached = await this.redis.get(key);
            return cached ? JSON.parse(cached) : null;
        }
        catch (error) {
            console.error("Cache get error:", error);
            return null;
        }
    }
    async setSearchResults(query, filters, results) {
        try {
            const key = `search:${this.hashQuery(query, filters)}`;
            await this.redis.setex(key, this.TTL.SEARCH_RESULTS, JSON.stringify(results));
        }
        catch (error) {
            console.error("Cache set error:", error);
        }
    }
    // Statistics caching
    async getStatistics(type, period) {
        try {
            const cached = await this.redis.get(`stats:${type}:${period}`);
            return cached ? JSON.parse(cached) : null;
        }
        catch (error) {
            console.error("Cache get error:", error);
            return null;
        }
    }
    async setStatistics(type, period, stats) {
        try {
            await this.redis.setex(`stats:${type}:${period}`, this.TTL.STATISTICS, JSON.stringify(stats));
        }
        catch (error) {
            console.error("Cache set error:", error);
        }
    }
    // Cache invalidation
    async invalidatePatientCache(patientId) {
        try {
            const pattern = `patient_records:${patientId}*`;
            const keys = await this.redis.keys(pattern);
            if (keys.length > 0) {
                await this.redis.del(...keys);
            }
        }
        catch (error) {
            console.error("Cache invalidation error:", error);
        }
    }
    async invalidateDoctorCache(doctorId) {
        try {
            const pattern = `doctor_records:${doctorId}*`;
            const keys = await this.redis.keys(pattern);
            if (keys.length > 0) {
                await this.redis.del(...keys);
            }
        }
        catch (error) {
            console.error("Cache invalidation error:", error);
        }
    }
    async invalidateSearchCache() {
        try {
            const pattern = "search:*";
            const keys = await this.redis.keys(pattern);
            if (keys.length > 0) {
                await this.redis.del(...keys);
            }
        }
        catch (error) {
            console.error("Cache invalidation error:", error);
        }
    }
    // Utility methods
    hashQuery(query, filters) {
        const crypto = require("crypto");
        const data = JSON.stringify({ query, filters });
        return crypto.createHash("md5").update(data).digest("hex");
    }
    async healthCheck() {
        try {
            const result = await this.redis.ping();
            return result === "PONG";
        }
        catch (error) {
            return false;
        }
    }
    async getStats() {
        try {
            const info = await this.redis.info("memory");
            const keyspace = await this.redis.info("keyspace");
            return {
                connected: true,
                memory_usage: this.parseMemoryUsage(info),
                key_count: this.parseKeyCount(keyspace),
                hit_rate: await this.getHitRate(),
            };
        }
        catch (error) {
            return { connected: false, error: error.message };
        }
    }
    parseMemoryUsage(info) {
        const match = info.match(/used_memory_human:([^\r\n]+)/);
        return match ? match[1] : "unknown";
    }
    parseKeyCount(keyspace) {
        const match = keyspace.match(/keys=(\d+)/);
        return match ? parseInt(match[1]) : 0;
    }
    async getHitRate() {
        try {
            const stats = await this.redis.info("stats");
            const hitsMatch = stats.match(/keyspace_hits:(\d+)/);
            const missesMatch = stats.match(/keyspace_misses:(\d+)/);
            if (hitsMatch && missesMatch) {
                const hits = parseInt(hitsMatch[1]);
                const misses = parseInt(missesMatch[1]);
                const total = hits + misses;
                return total > 0 ? Math.round((hits / total) * 100) : 0;
            }
            return 0;
        }
        catch (error) {
            return 0;
        }
    }
}
exports.CacheService = CacheService;
exports.cacheService = new CacheService();
//# sourceMappingURL=cache.service.js.map