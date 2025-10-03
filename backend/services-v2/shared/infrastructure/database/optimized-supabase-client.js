"use strict";
/**
 * Optimized Supabase Client for V2 System
 * Implements free tier optimizations and healthcare compliance
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Free Tier Optimization, HIPAA, Vietnamese Healthcare
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNotificationsClient = exports.createBillingClient = exports.createClinicalEMRClient = exports.createSchedulingClient = exports.createProviderStaffClient = exports.createPatientRegistryClient = exports.createIdentityServiceClient = exports.OptimizedSupabaseClient = void 0;
exports.createOptimizedSupabaseClient = createOptimizedSupabaseClient;
const supabase_js_1 = require("@supabase/supabase-js");
const supabase_optimization_config_1 = require("./supabase-optimization.config");
const logger_1 = __importDefault(require("../../utils/logger"));
class OptimizedSupabaseClient {
    constructor(config) {
        this.queryCache = new Map();
        this.connectionCount = 0;
        this.queryCount = 0;
        this.lastQueryTime = Date.now();
        this.config = config;
        this.client = this.createOptimizedClient();
        this.setupOptimizations();
    }
    /**
     * Create optimized Supabase client
     */
    createOptimizedClient() {
        const optimizationConfig = supabase_optimization_config_1.supabaseOptimizationConfig;
        return (0, supabase_js_1.createClient)(this.config.supabaseUrl, this.config.supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
            db: {
                schema: this.config.schemaName,
            },
            global: {
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'X-Service-Name': this.config.serviceName,
                    'X-Schema-Name': this.config.schemaName,
                    'X-Client-Version': '2.0.0-optimized',
                    'Accept-Encoding': 'gzip, deflate, br',
                },
            },
            realtime: {
                params: {
                    eventsPerSecond: 10, // Limit real-time events
                },
            },
        });
    }
    /**
     * Setup optimization features
     */
    setupOptimizations() {
        if (!this.config.enableOptimizations)
            return;
        // Setup query cache cleanup
        setInterval(() => {
            this.cleanupCache();
        }, 5 * 60 * 1000); // Every 5 minutes
        // Setup usage tracking
        setInterval(() => {
            this.trackUsage();
        }, 60 * 1000); // Every minute
    }
    /**
     * Execute optimized query with caching
     */
    async executeQuery(queryFn, options = {}) {
        const startTime = Date.now();
        this.queryCount++;
        try {
            // Check cache first
            if (options.enableCache && options.cacheKey) {
                const cached = this.getCachedResult(options.cacheKey);
                if (cached) {
                    logger_1.default.debug(`📖 Cache HIT: ${options.cacheKey}`, {
                        service: this.config.serviceName,
                        schema: this.config.schemaName,
                    });
                    return { ...cached, fromCache: true };
                }
            }
            // Execute query with timeout
            const timeout = options.timeout || supabase_optimization_config_1.supabaseOptimizationConfig.queryOptimization.maxQueryTimeMs;
            const queryPromise = queryFn(this.client);
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Query timeout')), timeout);
            });
            const result = await Promise.race([queryPromise, timeoutPromise]);
            const queryTime = Date.now() - startTime;
            // Cache successful results
            if (options.enableCache && options.cacheKey && result.data && !result.error) {
                this.setCachedResult(options.cacheKey, result, options.cacheTtl || 300000); // 5min default
            }
            // Log performance
            logger_1.default.debug(`🔍 Query executed`, {
                service: this.config.serviceName,
                schema: this.config.schemaName,
                queryTime,
                cached: false,
                error: !!result.error,
            });
            return result;
        }
        catch (error) {
            const queryTime = Date.now() - startTime;
            logger_1.default.error(`❌ Query failed`, {
                service: this.config.serviceName,
                schema: this.config.schemaName,
                queryTime,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return {
                data: null,
                error: error instanceof Error ? error : new Error('Unknown query error'),
            };
        }
    }
    /**
     * Execute batch operations
     */
    async executeBatch(operations, options = {}) {
        const batchSize = options.batchSize || supabase_optimization_config_1.supabaseOptimizationConfig.queryOptimization.batchSize;
        const delayMs = options.delayMs || 100;
        const results = [];
        for (let i = 0; i < operations.length; i += batchSize) {
            const batch = operations.slice(i, i + batchSize);
            const batchPromises = batch.map(op => this.executeQuery(op));
            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults);
            // Add delay between batches to avoid rate limiting
            if (i + batchSize < operations.length && delayMs > 0) {
                await new Promise(resolve => setTimeout(resolve, delayMs));
            }
        }
        return results;
    }
    /**
     * Get cached result
     */
    getCachedResult(cacheKey) {
        const cached = this.queryCache.get(cacheKey);
        if (!cached)
            return null;
        if (Date.now() - cached.timestamp > cached.ttl) {
            this.queryCache.delete(cacheKey);
            return null;
        }
        return cached.data;
    }
    /**
     * Set cached result
     */
    setCachedResult(cacheKey, data, ttl) {
        // Limit cache size
        if (this.queryCache.size > 1000) {
            const oldestKey = this.queryCache.keys().next().value;
            this.queryCache.delete(oldestKey);
        }
        this.queryCache.set(cacheKey, {
            data,
            timestamp: Date.now(),
            ttl,
        });
    }
    /**
     * Cleanup expired cache entries
     */
    cleanupCache() {
        const now = Date.now();
        for (const [key, cached] of this.queryCache.entries()) {
            if (now - cached.timestamp > cached.ttl) {
                this.queryCache.delete(key);
            }
        }
        logger_1.default.debug(`🧹 Cache cleanup completed`, {
            service: this.config.serviceName,
            cacheSize: this.queryCache.size,
        });
    }
    /**
     * Track usage metrics
     */
    async trackUsage() {
        try {
            await supabase_optimization_config_1.usageTracker.trackUsage();
            // Reset query count for next interval
            this.queryCount = 0;
        }
        catch (error) {
            logger_1.default.error('Usage tracking failed:', error);
        }
    }
    /**
     * Get client statistics
     */
    getStats() {
        return {
            connectionCount: this.connectionCount,
            queryCount: this.queryCount,
            cacheSize: this.queryCache.size,
            cacheHitRate: 0, // TODO: Implement cache hit rate tracking
        };
    }
    /**
     * Get raw Supabase client (use sparingly)
     */
    getRawClient() {
        return this.client;
    }
    /**
     * Close client and cleanup
     */
    async close() {
        this.queryCache.clear();
        // Note: Supabase client doesn't have explicit close method
        logger_1.default.info(`🔌 Optimized Supabase client closed`, {
            service: this.config.serviceName,
            schema: this.config.schemaName,
        });
    }
}
exports.OptimizedSupabaseClient = OptimizedSupabaseClient;
/**
 * Factory function to create optimized clients
 */
function createOptimizedSupabaseClient(config) {
    return new OptimizedSupabaseClient(config);
}
/**
 * Service-specific client factories
 */
const createIdentityServiceClient = () => createOptimizedSupabaseClient({
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    serviceName: 'identity-service',
    schemaName: 'auth_schema',
    enableOptimizations: process.env.NODE_ENV !== 'test',
});
exports.createIdentityServiceClient = createIdentityServiceClient;
const createPatientRegistryClient = () => createOptimizedSupabaseClient({
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    serviceName: 'patient-registry-service',
    schemaName: 'patient_schema',
    enableOptimizations: process.env.NODE_ENV !== 'test',
});
exports.createPatientRegistryClient = createPatientRegistryClient;
const createProviderStaffClient = () => createOptimizedSupabaseClient({
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    serviceName: 'provider-staff-service',
    schemaName: 'doctor_schema',
    enableOptimizations: process.env.NODE_ENV !== 'test',
});
exports.createProviderStaffClient = createProviderStaffClient;
const createSchedulingClient = () => createOptimizedSupabaseClient({
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    serviceName: 'scheduling-service',
    schemaName: 'appointment_schema',
    enableOptimizations: process.env.NODE_ENV !== 'test',
});
exports.createSchedulingClient = createSchedulingClient;
const createClinicalEMRClient = () => createOptimizedSupabaseClient({
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    serviceName: 'clinical-emr-service',
    schemaName: 'medical_records_schema',
    enableOptimizations: process.env.NODE_ENV !== 'test',
});
exports.createClinicalEMRClient = createClinicalEMRClient;
const createBillingClient = () => createOptimizedSupabaseClient({
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    serviceName: 'billing-service',
    schemaName: 'payment_schema',
    enableOptimizations: process.env.NODE_ENV !== 'test',
});
exports.createBillingClient = createBillingClient;
const createNotificationsClient = () => createOptimizedSupabaseClient({
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    serviceName: 'notifications-service',
    schemaName: 'auth_schema', // Notifications use auth schema
    enableOptimizations: process.env.NODE_ENV !== 'test',
});
exports.createNotificationsClient = createNotificationsClient;
//# sourceMappingURL=optimized-supabase-client.js.map