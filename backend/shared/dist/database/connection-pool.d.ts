import { SupabaseClient } from "@supabase/supabase-js";
/**
 * Hospital Management System Database Connection Pool
 * Provides optimized database connections with healthcare-specific features
 */
interface PoolConfig {
    maxConnections: number;
    minConnections: number;
    acquireTimeoutMillis: number;
    idleTimeoutMillis: number;
    healthCheckInterval: number;
}
interface ConnectionMetrics {
    totalConnections: number;
    activeConnections: number;
    idleConnections: number;
    totalQueries: number;
    averageQueryTime: number;
    errorCount: number;
}
declare class DatabaseConnectionPool {
    private clients;
    private activeClients;
    private config;
    private metrics;
    private healthCheckTimer?;
    constructor(config?: Partial<PoolConfig>);
    private initializePool;
    private startHealthCheck;
    private performHealthCheck;
    private acquireConnection;
    private createNewConnection;
    private releaseConnection;
    executeQuery<T>(queryFn: (client: SupabaseClient) => Promise<T>): Promise<T>;
    executeFHIRValidation<T>(validationFn: (client: SupabaseClient) => Promise<T>): Promise<T>;
    executeDiagnosisOperation<T>(diagnosisFn: (client: SupabaseClient) => Promise<T>): Promise<T>;
    executeBulkOperation<T>(bulkFn: (client: SupabaseClient) => Promise<T>): Promise<T>;
    getMetrics(): ConnectionMetrics;
    close(): Promise<void>;
}
export declare const connectionPool: DatabaseConnectionPool;
export { DatabaseConnectionPool };
export type { PoolConfig, ConnectionMetrics };
//# sourceMappingURL=connection-pool.d.ts.map