/**
 * Optimized Supabase Client for V2 System
 * Implements free tier optimizations and healthcare compliance
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Free Tier Optimization, HIPAA, Vietnamese Healthcare
 */
import { SupabaseClient } from '@supabase/supabase-js';
export interface OptimizedSupabaseClientConfig {
    supabaseUrl: string;
    supabaseServiceKey: string;
    serviceName: string;
    schemaName: string;
    enableOptimizations: boolean;
}
export declare class OptimizedSupabaseClient {
    private client;
    private config;
    private queryCache;
    private connectionCount;
    private queryCount;
    private lastQueryTime;
    constructor(config: OptimizedSupabaseClientConfig);
    /**
     * Create optimized Supabase client
     */
    private createOptimizedClient;
    /**
     * Setup optimization features
     */
    private setupOptimizations;
    /**
     * Execute optimized query with caching
     */
    executeQuery<T>(queryFn: (client: SupabaseClient) => Promise<{
        data: T | null;
        error: any;
    }>, options?: {
        cacheKey?: string;
        cacheTtl?: number;
        enableCache?: boolean;
        timeout?: number;
    }): Promise<{
        data: T | null;
        error: any;
        fromCache?: boolean;
    }>;
    /**
     * Execute batch operations
     */
    executeBatch<T>(operations: Array<(client: SupabaseClient) => Promise<{
        data: T | null;
        error: any;
    }>>, options?: {
        batchSize?: number;
        delayMs?: number;
    }): Promise<Array<{
        data: T | null;
        error: any;
    }>>;
    /**
     * Get cached result
     */
    private getCachedResult;
    /**
     * Set cached result
     */
    private setCachedResult;
    /**
     * Cleanup expired cache entries
     */
    private cleanupCache;
    /**
     * Track usage metrics
     */
    private trackUsage;
    /**
     * Get client statistics
     */
    getStats(): {
        connectionCount: number;
        queryCount: number;
        cacheSize: number;
        cacheHitRate: number;
    };
    /**
     * Get raw Supabase client (use sparingly)
     */
    getRawClient(): SupabaseClient;
    /**
     * Proxy method for table access (for convenience)
     */
    from(table: string): import("@supabase/postgrest-js").PostgrestQueryBuilder<any, any, any, string, unknown>;
    /**
     * Proxy method for RPC calls
     */
    rpc(fn: string, params?: any): import("@supabase/postgrest-js").PostgrestFilterBuilder<any, any, any, any, string, null, "RPC">;
    /**
     * Proxy method for storage access
     */
    get storage(): import("@supabase/storage-js").StorageClient;
    /**
     * Proxy method for auth access
     */
    get auth(): import("@supabase/supabase-js/dist/module/lib/SupabaseAuthClient").SupabaseAuthClient;
    /**
     * Close client and cleanup
     */
    close(): Promise<void>;
}
/**
 * Factory function to create optimized clients
 */
export declare function createOptimizedSupabaseClient(config: OptimizedSupabaseClientConfig): OptimizedSupabaseClient;
/**
 * Service-specific client factories
 */
export declare const createIdentityServiceClient: () => OptimizedSupabaseClient;
export declare const createPatientRegistryClient: () => OptimizedSupabaseClient;
export declare const createProviderStaffClient: () => OptimizedSupabaseClient;
export declare const createSchedulingClient: () => OptimizedSupabaseClient;
export declare const createClinicalEMRClient: () => OptimizedSupabaseClient;
export declare const createBillingClient: () => OptimizedSupabaseClient;
export declare const createNotificationsClient: () => OptimizedSupabaseClient;
//# sourceMappingURL=optimized-supabase-client.d.ts.map