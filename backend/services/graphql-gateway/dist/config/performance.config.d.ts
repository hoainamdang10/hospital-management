/**
 * Performance Configuration for GraphQL Gateway
 * Hospital Management System - Optimized for Vietnamese Healthcare
 */
export interface PerformanceConfig {
    connectionPool: {
        maxConnections: number;
        keepAlive: boolean;
        timeout: number;
    };
    cache: {
        redis: {
            enabled: boolean;
            ttl: {
                short: number;
                medium: number;
                long: number;
                static: number;
            };
        };
        memory: {
            enabled: boolean;
            maxSize: number;
        };
    };
    query: {
        maxComplexity: number;
        maxDepth: number;
        timeout: number;
        batchSize: number;
    };
    dataLoader: {
        batchScheduleFn: boolean;
        maxBatchSize: number;
        cacheKeyFn: boolean;
    };
    http: {
        compression: boolean;
        http2: boolean;
        keepAlive: boolean;
    };
}
export declare const performanceConfig: PerformanceConfig;
/**
 * Cache strategies for different data types
 */
export declare const cacheStrategies: {
    appointments: {
        ttl: number;
        strategy: string;
    };
    doctors: {
        ttl: number;
        strategy: string;
    };
    patients: {
        ttl: number;
        strategy: string;
    };
    departments: {
        ttl: number;
        strategy: string;
    };
    specialties: {
        ttl: number;
        strategy: string;
    };
    medicalRecords: {
        ttl: number;
        strategy: string;
        encryption: boolean;
    };
};
/**
 * Performance monitoring thresholds
 */
export declare const performanceThresholds: {
    responseTime: {
        excellent: number;
        good: number;
        acceptable: number;
        poor: number;
    };
    cacheHitRate: {
        excellent: number;
        good: number;
        acceptable: number;
        poor: number;
    };
    queryComplexity: {
        low: number;
        medium: number;
        high: number;
        critical: number;
    };
};
/**
 * DataLoader batch functions optimization
 */
export declare const dataLoaderConfig: {
    batchScheduleFn: (callback: () => void) => void;
    cacheKeyFn: (key: any) => string;
    maxBatchSize: number;
};
/**
 * HTTP optimization settings
 */
export declare const httpOptimization: {
    compression: {
        level: number;
        threshold: number;
        filter: (req: any, res: any) => boolean;
    };
    cors: {
        origin: string[];
        credentials: boolean;
        optionsSuccessStatus: number;
        maxAge: number;
    };
    helmet: {
        contentSecurityPolicy: boolean | undefined;
        crossOriginEmbedderPolicy: boolean;
        hsts: {
            maxAge: number;
            includeSubDomains: boolean;
            preload: boolean;
        };
    };
};
/**
 * Database query optimization
 */
export declare const dbOptimization: {
    pool: {
        min: number;
        max: number;
        acquireTimeoutMillis: number;
        createTimeoutMillis: number;
        destroyTimeoutMillis: number;
        idleTimeoutMillis: number;
        reapIntervalMillis: number;
        createRetryIntervalMillis: number;
    };
    timeout: number;
    batch: {
        enabled: boolean;
        maxSize: number;
        delay: number;
    };
};
/**
 * Memory management settings
 */
export declare const memoryConfig: {
    gc: {
        threshold: number;
        interval: number;
    };
    cache: {
        maxSize: number;
        maxAge: number;
    };
    request: {
        maxSize: string;
        maxFields: number;
        maxFiles: number;
    };
};
//# sourceMappingURL=performance.config.d.ts.map