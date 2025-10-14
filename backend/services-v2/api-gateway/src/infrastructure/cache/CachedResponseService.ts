import { ILogger } from '@application/services/ILogger';

export interface CachedResponse {
  data: any;
  statusCode: number;
  timestamp: Date;
  ttl: number;
}

export interface CacheConfig {
  defaultTTL: number;
  maxCacheSize: number;
  enableFallback: boolean;
}

export class CachedResponseService {
  private cache: Map<string, CachedResponse> = new Map();
  private config: CacheConfig;

  constructor(
    config: Partial<CacheConfig>,
    private logger: ILogger
  ) {
    this.config = {
      defaultTTL: config.defaultTTL || 300000,
      maxCacheSize: config.maxCacheSize || 1000,
      enableFallback: config.enableFallback !== false
    };

    this.logger.info('CachedResponseService initialized', {
      defaultTTL: this.config.defaultTTL,
      maxCacheSize: this.config.maxCacheSize,
      enableFallback: this.config.enableFallback
    });
  }

  set(key: string, data: any, statusCode: number, ttl?: number): void {
    if (!this.config.enableFallback) {
      return;
    }

    if (this.cache.size >= this.config.maxCacheSize) {
      this.evictOldest();
    }

    const cachedResponse: CachedResponse = {
      data,
      statusCode,
      timestamp: new Date(),
      ttl: ttl || this.config.defaultTTL
    };

    this.cache.set(key, cachedResponse);

    this.logger.debug('Response cached', {
      key,
      statusCode,
      ttl: cachedResponse.ttl,
      cacheSize: this.cache.size
    });
  }

  get(key: string): CachedResponse | null {
    if (!this.config.enableFallback) {
      return null;
    }

    const cached = this.cache.get(key);

    if (!cached) {
      return null;
    }

    const age = Date.now() - cached.timestamp.getTime();

    if (age > cached.ttl) {
      this.cache.delete(key);
      this.logger.debug('Cached response expired', {
        key,
        age,
        ttl: cached.ttl
      });
      return null;
    }

    this.logger.debug('Cached response retrieved', {
      key,
      age,
      statusCode: cached.statusCode
    });

    return cached;
  }

  has(key: string): boolean {
    const cached = this.get(key);
    return cached !== null;
  }

  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.logger.debug('Cached response deleted', { key });
    }
    return deleted;
  }

  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    this.logger.info('Cache cleared', { previousSize: size });
  }

  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, value] of this.cache.entries()) {
      if (value.timestamp.getTime() < oldestTime) {
        oldestTime = value.timestamp.getTime();
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.logger.debug('Evicted oldest cache entry', {
        key: oldestKey,
        age: Date.now() - oldestTime
      });
    }
  }

  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    entries: Array<{
      key: string;
      age: number;
      statusCode: number;
    }>;
  } {
    const entries = Array.from(this.cache.entries()).map(([key, value]) => ({
      key,
      age: Date.now() - value.timestamp.getTime(),
      statusCode: value.statusCode
    }));

    return {
      size: this.cache.size,
      maxSize: this.config.maxCacheSize,
      hitRate: 0,
      entries
    };
  }

  generateCacheKey(serviceName: string, path: string, method: string): string {
    return `${serviceName}:${method}:${path}`;
  }

  createFallbackResponse(serviceName: string): any {
    return {
      success: false,
      error: `Service ${serviceName} is temporarily unavailable`,
      fallback: true,
      message: 'Using cached data or default response',
      timestamp: new Date().toISOString()
    };
  }

  createHealthCheckFallback(serviceName: string): any {
    return {
      status: 'degraded',
      service: serviceName,
      message: 'Service health check failed, using fallback',
      timestamp: new Date().toISOString()
    };
  }
}

