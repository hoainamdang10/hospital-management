import Redis from "ioredis";

export class CacheService {
  private redis: Redis;
  private readonly TTL = {
    PATIENT_RECORDS: 300, // 5 minutes
    DOCTOR_RECORDS: 600, // 10 minutes
    STATISTICS: 1800, // 30 minutes
    SEARCH_RESULTS: 120, // 2 minutes
  };

  constructor() {
    this.redis = new Redis({
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
  async getPatientRecords(patientId: string): Promise<any[] | null> {
    try {
      const cached = await this.redis.get(`patient_records:${patientId}`);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error("Cache get error:", error);
      return null;
    }
  }

  async setPatientRecords(patientId: string, records: any[]): Promise<void> {
    try {
      await this.redis.setex(
        `patient_records:${patientId}`,
        this.TTL.PATIENT_RECORDS,
        JSON.stringify(records)
      );
    } catch (error) {
      console.error("Cache set error:", error);
    }
  }

  // Doctor records caching
  async getDoctorRecords(
    doctorId: string,
    page: number = 1
  ): Promise<any[] | null> {
    try {
      const cached = await this.redis.get(`doctor_records:${doctorId}:${page}`);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error("Cache get error:", error);
      return null;
    }
  }

  async setDoctorRecords(
    doctorId: string,
    page: number,
    records: any[]
  ): Promise<void> {
    try {
      await this.redis.setex(
        `doctor_records:${doctorId}:${page}`,
        this.TTL.DOCTOR_RECORDS,
        JSON.stringify(records)
      );
    } catch (error) {
      console.error("Cache set error:", error);
    }
  }

  // Search results caching
  async getSearchResults(query: string, filters: any): Promise<any[] | null> {
    try {
      const key = `search:${this.hashQuery(query, filters)}`;
      const cached = await this.redis.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error("Cache get error:", error);
      return null;
    }
  }

  async setSearchResults(
    query: string,
    filters: any,
    results: any[]
  ): Promise<void> {
    try {
      const key = `search:${this.hashQuery(query, filters)}`;
      await this.redis.setex(
        key,
        this.TTL.SEARCH_RESULTS,
        JSON.stringify(results)
      );
    } catch (error) {
      console.error("Cache set error:", error);
    }
  }

  // Statistics caching
  async getStatistics(type: string, period: string): Promise<any | null> {
    try {
      const cached = await this.redis.get(`stats:${type}:${period}`);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error("Cache get error:", error);
      return null;
    }
  }

  async setStatistics(type: string, period: string, stats: any): Promise<void> {
    try {
      await this.redis.setex(
        `stats:${type}:${period}`,
        this.TTL.STATISTICS,
        JSON.stringify(stats)
      );
    } catch (error) {
      console.error("Cache set error:", error);
    }
  }

  // Cache invalidation
  async invalidatePatientCache(patientId: string): Promise<void> {
    try {
      const pattern = `patient_records:${patientId}*`;
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      console.error("Cache invalidation error:", error);
    }
  }

  async invalidateDoctorCache(doctorId: string): Promise<void> {
    try {
      const pattern = `doctor_records:${doctorId}*`;
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      console.error("Cache invalidation error:", error);
    }
  }

  async invalidateSearchCache(): Promise<void> {
    try {
      const pattern = "search:*";
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      console.error("Cache invalidation error:", error);
    }
  }

  // Utility methods
  private hashQuery(query: string, filters: any): string {
    const crypto = require("crypto");
    const data = JSON.stringify({ query, filters });
    return crypto.createHash("md5").update(data).digest("hex");
  }

  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.redis.ping();
      return result === "PONG";
    } catch (error) {
      return false;
    }
  }

  async getStats(): Promise<any> {
    try {
      const info = await this.redis.info("memory");
      const keyspace = await this.redis.info("keyspace");

      return {
        connected: true,
        memory_usage: this.parseMemoryUsage(info),
        key_count: this.parseKeyCount(keyspace),
        hit_rate: await this.getHitRate(),
      };
    } catch (error) {
      return { connected: false, error: (error as any).message };
    }
  }

  private parseMemoryUsage(info: string): string {
    const match = info.match(/used_memory_human:([^\r\n]+)/);
    return match ? match[1] : "unknown";
  }

  private parseKeyCount(keyspace: string): number {
    const match = keyspace.match(/keys=(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  private async getHitRate(): Promise<number> {
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
    } catch (error) {
      return 0;
    }
  }
}

export const cacheService = new CacheService();
