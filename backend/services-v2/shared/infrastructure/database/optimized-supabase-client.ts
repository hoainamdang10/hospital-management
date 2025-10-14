/**
 * Optimized Supabase Client for V2 System
 * Implements free tier optimizations and healthcare compliance
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Free Tier Optimization, HIPAA, Vietnamese Healthcare
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { supabaseOptimizationConfig, usageTracker } from './supabase-optimization.config';
import logger from '../../utils/logger';

export interface OptimizedSupabaseClientConfig {
  supabaseUrl: string;
  supabaseServiceKey: string;
  serviceName: string;
  schemaName: string;
  enableOptimizations: boolean;
}

export class OptimizedSupabaseClient {
  private client: SupabaseClient;
  private config: OptimizedSupabaseClientConfig;
  private queryCache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();
  private connectionCount = 0;
  private queryCount = 0;
  private lastQueryTime = Date.now();

  constructor(config: OptimizedSupabaseClientConfig) {
    this.config = config;
    this.client = this.createOptimizedClient();
    this.setupOptimizations();
  }

  /**
   * Create optimized Supabase client
   */
  private createOptimizedClient(): SupabaseClient {
    const optimizationConfig = supabaseOptimizationConfig;

    return createClient(this.config.supabaseUrl, this.config.supabaseServiceKey, {
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
  private setupOptimizations(): void {
    if (!this.config.enableOptimizations) return;

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
  async executeQuery<T>(
    queryFn: (client: SupabaseClient) => Promise<{ data: T | null; error: any }>,
    options: {
      cacheKey?: string;
      cacheTtl?: number;
      enableCache?: boolean;
      timeout?: number;
    } = {}
  ): Promise<{ data: T | null; error: any; fromCache?: boolean }> {
    const startTime = Date.now();
    this.queryCount++;

    try {
      // Check cache first
      if (options.enableCache && options.cacheKey) {
        const cached = this.getCachedResult<T>(options.cacheKey);
        if (cached) {
          logger.debug(`📖 Cache HIT: ${options.cacheKey}`, {
            service: this.config.serviceName,
            schema: this.config.schemaName,
          });
          return { ...cached, fromCache: true };
        }
      }

      // Execute query with timeout
      const timeout = options.timeout || supabaseOptimizationConfig.queryOptimization.maxQueryTimeMs;
      const queryPromise = queryFn(this.client);
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Query timeout')), timeout);
      });

      const result = await Promise.race([queryPromise, timeoutPromise]);
      const queryTime = Date.now() - startTime;

      // Cache successful results
      if (options.enableCache && options.cacheKey && result.data && !result.error) {
        this.setCachedResult(options.cacheKey, result, options.cacheTtl || 300000); // 5min default
      }

      // Log performance
      logger.debug(`🔍 Query executed`, {
        service: this.config.serviceName,
        schema: this.config.schemaName,
        queryTime,
        cached: false,
        error: !!result.error,
      });

      return result;
    } catch (error) {
      const queryTime = Date.now() - startTime;
      logger.error(`❌ Query failed`, {
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
  async executeBatch<T>(
    operations: Array<(client: SupabaseClient) => Promise<{ data: T | null; error: any }>>,
    options: {
      batchSize?: number;
      delayMs?: number;
    } = {}
  ): Promise<Array<{ data: T | null; error: any }>> {
    const batchSize = options.batchSize || supabaseOptimizationConfig.queryOptimization.batchSize;
    const delayMs = options.delayMs || 100;
    const results: Array<{ data: T | null; error: any }> = [];

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
  private getCachedResult<T>(cacheKey: string): { data: T | null; error: any } | null {
    const cached = this.queryCache.get(cacheKey);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > cached.ttl) {
      this.queryCache.delete(cacheKey);
      return null;
    }

    return cached.data;
  }

  /**
   * Set cached result
   */
  private setCachedResult(cacheKey: string, data: any, ttl: number): void {
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
  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, cached] of this.queryCache.entries()) {
      if (now - cached.timestamp > cached.ttl) {
        this.queryCache.delete(key);
      }
    }

    logger.debug(`🧹 Cache cleanup completed`, {
      service: this.config.serviceName,
      cacheSize: this.queryCache.size,
    });
  }

  /**
   * Track usage metrics
   */
  private async trackUsage(): Promise<void> {
    try {
      await usageTracker.trackUsage();
      
      // Reset query count for next interval
      this.queryCount = 0;
    } catch (error) {
      logger.error('Usage tracking failed:', error);
    }
  }

  /**
   * Get client statistics
   */
  getStats(): {
    connectionCount: number;
    queryCount: number;
    cacheSize: number;
    cacheHitRate: number;
  } {
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
  getRawClient(): SupabaseClient {
    return this.client;
  }

  /**
   * Proxy method for table access (for convenience)
   */
  from(table: string) {
    return this.client.from(table);
  }

  /**
   * Proxy method for RPC calls
   */
  rpc(fn: string, params?: any) {
    return this.client.rpc(fn, params);
  }

  /**
   * Proxy method for storage access
   */
  get storage() {
    return this.client.storage;
  }

  /**
   * Proxy method for auth access
   */
  get auth() {
    return this.client.auth;
  }

  /**
   * Close client and cleanup
   */
  async close(): Promise<void> {
    this.queryCache.clear();
    // Note: Supabase client doesn't have explicit close method
    logger.info(`🔌 Optimized Supabase client closed`, {
      service: this.config.serviceName,
      schema: this.config.schemaName,
    });
  }
}

/**
 * Factory function to create optimized clients
 */
export function createOptimizedSupabaseClient(config: OptimizedSupabaseClientConfig): OptimizedSupabaseClient {
  return new OptimizedSupabaseClient(config);
}

/**
 * Service-specific client factories
 */
export const createIdentityServiceClient = () => createOptimizedSupabaseClient({
  supabaseUrl: process.env.SUPABASE_URL!,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  serviceName: 'identity-service',
  schemaName: 'auth_schema',
  enableOptimizations: process.env.NODE_ENV !== 'test',
});

export const createPatientRegistryClient = () => createOptimizedSupabaseClient({
  supabaseUrl: process.env.SUPABASE_URL!,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  serviceName: 'patient-registry-service',
  schemaName: 'patient_schema',
  enableOptimizations: process.env.NODE_ENV !== 'test',
});

export const createProviderStaffClient = () => createOptimizedSupabaseClient({
  supabaseUrl: process.env.SUPABASE_URL!,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  serviceName: 'provider-staff-service',
  schemaName: 'doctor_schema',
  enableOptimizations: process.env.NODE_ENV !== 'test',
});

export const createSchedulingClient = () => createOptimizedSupabaseClient({
  supabaseUrl: process.env.SUPABASE_URL!,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  serviceName: 'scheduling-service',
  schemaName: 'appointment_schema',
  enableOptimizations: process.env.NODE_ENV !== 'test',
});

export const createClinicalEMRClient = () => createOptimizedSupabaseClient({
  supabaseUrl: process.env.SUPABASE_URL!,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  serviceName: 'clinical-emr-service',
  schemaName: 'medical_records_schema',
  enableOptimizations: process.env.NODE_ENV !== 'test',
});

export const createBillingClient = () => createOptimizedSupabaseClient({
  supabaseUrl: process.env.SUPABASE_URL!,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  serviceName: 'billing-service',
  schemaName: 'payment_schema',
  enableOptimizations: process.env.NODE_ENV !== 'test',
});

export const createNotificationsClient = () => createOptimizedSupabaseClient({
  supabaseUrl: process.env.SUPABASE_URL!,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  serviceName: 'notifications-service',
  schemaName: 'auth_schema', // Notifications use auth schema
  enableOptimizations: process.env.NODE_ENV !== 'test',
});
