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
import { DomainEvent } from '../../domain/base/domain-event';

/**
 * Base Supabase Repository
 * Provides common database operations with optimization and error handling
 */
export abstract class BaseSupabaseRepository<T extends AggregateRoot<any>> {
  protected client: OptimizedSupabaseClient;
  protected tableName: string;
  protected schemaName: string;

  constructor(
    client: OptimizedSupabaseClient,
    tableName: string,
    schemaName: string = 'public'
  ) {
    this.client = client;
    this.tableName = tableName;
    this.schemaName = schemaName;
  }

  /**
   * Save aggregate to database
   */
  protected async saveAggregate(aggregate: T): Promise<void> {
    try {
      const persistenceData = this.toPersistence(aggregate);
      
      // Check if aggregate exists
      const existing = await this.client.query()
        .from(this.tableName)
        .select('id')
        .eq('id', aggregate.id)
        .single();

      if (existing.data) {
        // Update existing
        const { error } = await this.client.query()
          .from(this.tableName)
          .update({
            ...persistenceData,
            updated_at: new Date().toISOString(),
            version: aggregate.version
          })
          .eq('id', aggregate.id)
          .eq('version', aggregate.version - 1); // Optimistic concurrency

        if (error) {
          if (error.code === 'PGRST116') {
            throw new Error('Aggregate đã được cập nhật bởi người khác (Optimistic Concurrency Conflict)');
          }
          throw new Error(`Lỗi cập nhật database: ${error.message}`);
        }
      } else {
        // Insert new
        const { error } = await this.client.query()
          .from(this.tableName)
          .insert({
            ...persistenceData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            version: aggregate.version
          });

        if (error) {
          throw new Error(`Lỗi thêm mới database: ${error.message}`);
        }
      }

      // Save domain events if any
      await this.saveDomainEvents(aggregate);

    } catch (error) {
      throw new Error(`Lỗi lưu aggregate: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find aggregate by ID
   */
  protected async findAggregateById(id: string): Promise<T | null> {
    try {
      const { data, error } = await this.client.query()
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        throw new Error(`Lỗi truy vấn database: ${error.message}`);
      }

      if (!data) {
        return null;
      }

      return this.toDomain(data);

    } catch (error) {
      throw new Error(`Lỗi tìm aggregate: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find aggregates with filters
   */
  protected async findAggregatesWithFilters(
    filters: { [key: string]: any },
    orderBy?: string,
    ascending: boolean = true,
    limit?: number,
    offset?: number
  ): Promise<T[]> {
    try {
      let query = this.client.query()
        .from(this.tableName)
        .select('*');

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            query = query.in(key, value);
          } else {
            query = query.eq(key, value);
          }
        }
      });

      // Apply ordering
      if (orderBy) {
        query = query.order(orderBy, { ascending });
      }

      // Apply pagination
      if (limit) {
        query = query.limit(limit);
      }
      if (offset) {
        query = query.range(offset, offset + (limit || 100) - 1);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Lỗi truy vấn database: ${error.message}`);
      }

      if (!data || data.length === 0) {
        return [];
      }

      return data.map(item => this.toDomain(item));

    } catch (error) {
      throw new Error(`Lỗi tìm aggregates: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Count aggregates with filters
   */
  protected async countAggregatesWithFilters(filters: { [key: string]: any }): Promise<number> {
    try {
      let query = this.client.query()
        .from(this.tableName)
        .select('*', { count: 'exact', head: true });

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            query = query.in(key, value);
          } else {
            query = query.eq(key, value);
          }
        }
      });

      const { count, error } = await query;

      if (error) {
        throw new Error(`Lỗi đếm database: ${error.message}`);
      }

      return count || 0;

    } catch (error) {
      throw new Error(`Lỗi đếm aggregates: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete aggregate (soft delete)
   */
  protected async deleteAggregate(id: string): Promise<void> {
    try {
      const { error } = await this.client.query()
        .from(this.tableName)
        .update({
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        throw new Error(`Lỗi xóa database: ${error.message}`);
      }

    } catch (error) {
      throw new Error(`Lỗi xóa aggregate: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if aggregate exists
   */
  protected async aggregateExists(id: string): Promise<boolean> {
    try {
      const { data, error } = await this.client.query()
        .from(this.tableName)
        .select('id')
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Lỗi kiểm tra tồn tại: ${error.message}`);
      }

      return !!data;

    } catch (error) {
      throw new Error(`Lỗi kiểm tra aggregate: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Save domain events
   */
  private async saveDomainEvents(aggregate: T): Promise<void> {
    const events = aggregate.getUncommittedEvents();
    if (events.length === 0) return;

    try {
      const eventData = events.map(event => ({
        id: event.eventId,
        aggregate_id: aggregate.id,
        aggregate_type: aggregate.constructor.name,
        event_type: event.eventType,
        event_data: JSON.stringify(event),
        occurred_at: event.occurredAt.toISOString(),
        version: event.version,
        created_at: new Date().toISOString()
      }));

      const { error } = await this.client.query()
        .from('domain_events')
        .insert(eventData);

      if (error) {
        throw new Error(`Lỗi lưu domain events: ${error.message}`);
      }

    } catch (error) {
      // Log error but don't fail the main operation
      console.error('Failed to save domain events:', error);
    }
  }

  /**
   * Execute raw SQL query with parameters
   */
  protected async executeRawQuery(
    query: string,
    params: any[] = []
  ): Promise<any> {
    try {
      const { data, error } = await this.client.rpc('execute_sql', {
        query_text: query,
        query_params: params
      });

      if (error) {
        throw new Error(`Lỗi thực thi SQL: ${error.message}`);
      }

      return data;

    } catch (error) {
      throw new Error(`Lỗi raw query: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

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
  protected getTableName(): string {
    return this.tableName;
  }

  /**
   * Get schema name for this repository
   */
  protected getSchemaName(): string {
    return this.schemaName;
  }
}
