/**
 * Base Repository Pattern with Schema Validation
 * Enforces microservices architecture compliance and data boundaries
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance HIPAA, Microservices Architecture, FHIR
 */
import { SupabaseClient } from "@supabase/supabase-js";
export interface RepositoryConfig {
    serviceName: string;
    schemaName: string;
    enableFHIRValidation: boolean;
    enableAuditLogging: boolean;
    enablePerformanceMonitoring: boolean;
}
export interface QueryMetrics {
    queryType: string;
    tableName: string;
    executionTime: number;
    recordsAffected: number;
    cacheHit?: boolean;
}
export interface AuditLogEntry {
    serviceName: string;
    operation: string;
    tableName: string;
    recordId?: string;
    userId?: string;
    timestamp: Date;
    ipAddress?: string;
    userAgent?: string;
    dataAccessed?: string[];
    complianceFlags?: string[];
}
/**
 * Abstract base repository class that enforces architecture compliance
 */
export declare abstract class BaseRepository<T> {
    protected config: RepositoryConfig;
    protected connectionPool: import("../database/schema-aware-connection-pool").SchemaAwareConnectionPool;
    protected allowedTables: string[];
    constructor(config: RepositoryConfig);
    /**
     * Validate that the service is properly configured
     */
    private validateServiceConfiguration;
    /**
     * Validate table access before executing queries
     */
    protected validateTableAccess(tableName: string): void;
    /**
     * Get a schema-aware database connection
     */
    protected getConnection(): Promise<SupabaseClient<any, string, any>>;
    /**
     * Execute query with full compliance validation
     */
    protected executeQuery<R>(tableName: string, queryFn: (client: SupabaseClient<any, string, any>) => Promise<R>, options: {
        operation: string;
        recordId?: string;
        userId?: string;
        auditData?: string[];
    }): Promise<R>;
    /**
     * Execute FHIR-compliant query for healthcare data
     */
    protected executeFHIRQuery<R>(tableName: string, queryFn: (client: SupabaseClient<any, string, any>) => Promise<R>, fhirContext: {
        resourceType: string;
        patientId?: string;
        providerId?: string;
        accessReason: string;
    }): Promise<R>;
    /**
     * Validate healthcare data access for HIPAA compliance
     */
    private validateHealthcareDataAccess;
    /**
     * Record query performance metrics
     */
    private recordQueryMetrics;
    /**
     * Audit data access for compliance
     */
    private auditDataAccess;
    /**
     * Audit security violations
     */
    private auditSecurityViolation;
    /**
     * Generate compliance flags based on operation and table
     */
    private generateComplianceFlags;
    /**
     * Extract record count from query result
     */
    private extractRecordCount;
    /**
     * Abstract methods that must be implemented by concrete repositories
     */
    abstract findById(id: string): Promise<T | null>;
    abstract findAll(limit?: number, offset?: number): Promise<T[]>;
    abstract create(entity: Partial<T>): Promise<T>;
    abstract update(id: string, entity: Partial<T>): Promise<T | null>;
    abstract delete(id: string): Promise<boolean>;
    /**
     * Health check for repository
     */
    healthCheck(): Promise<{
        status: string;
        serviceName: string;
        schemaName: string;
        allowedTables: string[];
        connectionPool: any;
    }>;
}
export default BaseRepository;
//# sourceMappingURL=base-repository.d.ts.map