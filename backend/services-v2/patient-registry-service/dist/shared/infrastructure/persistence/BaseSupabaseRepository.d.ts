/**
 * Base Supabase Repository - Infrastructure Layer
 * V2 Clean Architecture + DDD Implementation
 * Base class for all Supabase repositories with optimization and healthcare compliance
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, HIPAA, Vietnamese Healthcare Standards
 */
import { OptimizedSupabaseClient } from '../database/optimized-supabase-client';
import { AggregateRoot } from '../../domain/base/aggregate-root';
/**
 * Base Supabase Repository
 * Provides common database operations with optimization and error handling
 */
export declare abstract class BaseSupabaseRepository<T extends AggregateRoot<any>> {
    protected client: OptimizedSupabaseClient;
    protected tableName: string;
    protected schemaName: string;
    constructor(client: OptimizedSupabaseClient, tableName: string, schemaName?: string);
    /**
     * Save aggregate to database
     */
    protected saveAggregate(aggregate: T): Promise<void>;
    /**
     * Find aggregate by ID
     */
    protected findAggregateById(id: string): Promise<T | null>;
    /**
     * Find aggregates with filters
     */
    protected findAggregatesWithFilters(filters: {
        [key: string]: any;
    }, orderBy?: string, ascending?: boolean, limit?: number, offset?: number): Promise<T[]>;
    /**
     * Count aggregates with filters
     */
    protected countAggregatesWithFilters(filters: {
        [key: string]: any;
    }): Promise<number>;
    /**
     * Delete aggregate (soft delete)
     */
    protected deleteAggregate(id: string): Promise<void>;
    /**
     * Check if aggregate exists
     */
    protected aggregateExists(id: string): Promise<boolean>;
    /**
     * Save domain events
     */
    private saveDomainEvents;
    /**
     * Execute raw SQL query with parameters
     */
    protected executeRawQuery(query: string, params?: any[]): Promise<any>;
    /**
     * Convert domain aggregate to persistence format
     */
    protected abstract toPersistence(aggregate: T): any;
    /**
     * Convert persistence data to domain aggregate
     */
    protected abstract toDomain(data: any): T;
    /**
     * Get table name for this repository
     */
    protected getTableName(): string;
    /**
     * Get schema name for this repository
     */
    protected getSchemaName(): string;
}
//# sourceMappingURL=BaseSupabaseRepository.d.ts.map