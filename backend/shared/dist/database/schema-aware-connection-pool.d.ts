/**
 * Schema-Aware Connection Pool for Hospital Management System
 * Provides database connections with proper schema isolation
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance HIPAA, Microservices Architecture
 */
import { SupabaseClient } from "@supabase/supabase-js";
interface ConnectionPoolConfig {
    supabaseUrl: string;
    supabaseServiceKey: string;
    maxConnections: number;
    minConnections: number;
    acquireTimeoutMillis: number;
    idleTimeoutMillis: number;
    enableMetrics: boolean;
    enableFHIRValidation: boolean;
}
interface ConnectionMetrics {
    totalConnections: number;
    activeConnections: number;
    idleConnections: number;
    totalQueries: number;
    averageResponseTime: number;
    errorCount: number;
    schemaViolations: number;
}
/**
 * Schema-aware connection pool that ensures proper service isolation
 */
export declare class SchemaAwareConnectionPool {
    private connections;
    private config;
    private metrics;
    private isInitialized;
    constructor(config: ConnectionPoolConfig);
    /**
     * Initialize the connection pool
     */
    initialize(): Promise<void>;
    /**
     * Get a connection for a specific service
     */
    getConnection(serviceName: string): Promise<SupabaseClient<any, string, any>>;
    /**
     * Create a new connection for specific schema
     */
    private createConnection;
    /**
     * Create multiple connections for a schema
     */
    private createSchemaConnections;
    /**
     * Create a proxy client with validation
     */
    private createProxyClient;
    /**
     * Execute query with FHIR validation (for healthcare compliance)
     */
    executeFHIRValidation<T>(serviceName: string, queryFn: (client: SupabaseClient<any, string, any>) => Promise<T>): Promise<T>;
    /**
     * Get service name for schema (reverse lookup)
     */
    private getServiceNameForSchema;
    /**
     * Update connection metrics
     */
    private updateMetrics;
    /**
     * Get current pool metrics
     */
    getMetrics(): ConnectionMetrics;
    /**
     * Health check for the connection pool
     */
    healthCheck(): Promise<{
        status: string;
        metrics: ConnectionMetrics;
        details: any;
    }>;
    /**
     * Graceful shutdown
     */
    shutdown(): Promise<void>;
}
/**
 * Get or create the connection pool instance
 */
export declare function getConnectionPool(): SchemaAwareConnectionPool;
/**
 * Initialize the global connection pool
 */
export declare function initializeConnectionPool(): Promise<void>;
export default getConnectionPool;
//# sourceMappingURL=schema-aware-connection-pool.d.ts.map