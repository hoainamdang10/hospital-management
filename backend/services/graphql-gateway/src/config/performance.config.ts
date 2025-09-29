/**
 * Performance Configuration for GraphQL Gateway
 * Hospital Management System - Optimized for Vietnamese Healthcare
 */

export interface PerformanceConfig {
  // Connection pooling
  connectionPool: {
    maxConnections: number;
    keepAlive: boolean;
    timeout: number;
  };
  
  // Caching configuration
  cache: {
    redis: {
      enabled: boolean;
      ttl: {
        short: number;    // 5 minutes
        medium: number;   // 30 minutes
        long: number;     // 2 hours
        static: number;   // 24 hours
      };
    };
    memory: {
      enabled: boolean;
      maxSize: number;
    };
  };
  
  // Query optimization
  query: {
    maxComplexity: number;
    maxDepth: number;
    timeout: number;
    batchSize: number;
  };
  
  // DataLoader configuration
  dataLoader: {
    batchScheduleFn: boolean;
    maxBatchSize: number;
    cacheKeyFn: boolean;
  };
  
  // HTTP/2 and compression
  http: {
    compression: boolean;
    http2: boolean;
    keepAlive: boolean;
  };
}

export const performanceConfig: PerformanceConfig = {
  connectionPool: {
    maxConnections: 100,
    keepAlive: true,
    timeout: 30000,
  },
  
  cache: {
    redis: {
      enabled: true,
      ttl: {
        short: 5 * 60,      // 5 minutes - Real-time data
        medium: 30 * 60,    // 30 minutes - Semi-static data
        long: 2 * 60 * 60,  // 2 hours - Static data
        static: 24 * 60 * 60, // 24 hours - Reference data
      },
    },
    memory: {
      enabled: true,
      maxSize: 100, // MB
    },
  },
  
  query: {
    maxComplexity: 1000,
    maxDepth: 10,
    timeout: 30000,
    batchSize: 100,
  },
  
  dataLoader: {
    batchScheduleFn: true,
    maxBatchSize: 100,
    cacheKeyFn: true,
  },
  
  http: {
    compression: true,
    http2: true,
    keepAlive: true,
  },
};

/**
 * Cache strategies for different data types
 */
export const cacheStrategies = {
  // Real-time data - Short cache
  appointments: {
    ttl: performanceConfig.cache.redis.ttl.short,
    strategy: 'cache-aside',
  },
  
  // Semi-static data - Medium cache
  doctors: {
    ttl: performanceConfig.cache.redis.ttl.medium,
    strategy: 'write-through',
  },
  
  patients: {
    ttl: performanceConfig.cache.redis.ttl.medium,
    strategy: 'write-through',
  },
  
  // Static reference data - Long cache
  departments: {
    ttl: performanceConfig.cache.redis.ttl.static,
    strategy: 'write-behind',
  },
  
  specialties: {
    ttl: performanceConfig.cache.redis.ttl.static,
    strategy: 'write-behind',
  },
  
  // Medical records - Sensitive data with shorter cache
  medicalRecords: {
    ttl: performanceConfig.cache.redis.ttl.short,
    strategy: 'cache-aside',
    encryption: true,
  },
};

/**
 * Performance monitoring thresholds
 */
export const performanceThresholds = {
  responseTime: {
    excellent: 100,   // < 100ms
    good: 500,        // < 500ms
    acceptable: 1000, // < 1s
    poor: 2000,       // < 2s
  },
  
  cacheHitRate: {
    excellent: 0.9,   // > 90%
    good: 0.8,        // > 80%
    acceptable: 0.7,  // > 70%
    poor: 0.5,        // > 50%
  },
  
  queryComplexity: {
    low: 100,
    medium: 500,
    high: 800,
    critical: 1000,
  },
};

/**
 * DataLoader batch functions optimization
 */
export const dataLoaderConfig = {
  // Batch multiple requests within 10ms
  batchScheduleFn: (callback: () => void) => {
    setTimeout(callback, 10);
  },
  
  // Custom cache key function for better cache hits
  cacheKeyFn: (key: any) => {
    if (typeof key === 'object') {
      return JSON.stringify(key);
    }
    return String(key);
  },
  
  // Maximum batch size to prevent memory issues
  maxBatchSize: 100,
};

/**
 * HTTP optimization settings
 */
export const httpOptimization = {
  compression: {
    level: 6,
    threshold: 1024,
    filter: (req: any, res: any) => {
      // Don't compress responses with this request header
      if (req.headers['x-no-compression']) {
        return false;
      }
      // Fallback to standard filter function
      return true;
    },
  },
  
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    credentials: true,
    optionsSuccessStatus: 200,
    maxAge: 86400, // 24 hours
  },
  
  helmet: {
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
    crossOriginEmbedderPolicy: false,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  },
};

/**
 * Database query optimization
 */
export const dbOptimization = {
  // Connection pool settings
  pool: {
    min: 2,
    max: 20,
    acquireTimeoutMillis: 30000,
    createTimeoutMillis: 30000,
    destroyTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 200,
  },
  
  // Query timeout
  timeout: 30000,
  
  // Batch query settings
  batch: {
    enabled: true,
    maxSize: 100,
    delay: 10, // ms
  },
};

/**
 * Memory management settings
 */
export const memoryConfig = {
  // Garbage collection optimization
  gc: {
    // Force GC when memory usage exceeds threshold
    threshold: 0.8, // 80% of heap
    interval: 60000, // Check every minute
  },
  
  // Memory cache limits
  cache: {
    maxSize: 100 * 1024 * 1024, // 100MB
    maxAge: 30 * 60 * 1000,     // 30 minutes
  },
  
  // Request size limits
  request: {
    maxSize: '10mb',
    maxFields: 1000,
    maxFiles: 10,
  },
};
