/**
 * OutboxService - Outbox Pattern Implementation
 * Provides reliable event publishing using database-backed outbox
 * 
 * Pattern: Outbox Pattern (Transactional Outbox)
 * 
 * How it works:
 * 1. Domain events are stored in event_outbox table atomically with business data
 * 2. Background job polls the outbox table for PENDING events
 * 3. Events are published to RabbitMQ
 * 4. Once published, events are marked as PUBLISHED
 * 5. If publishing fails, events are retried with exponential backoff
 * 6. After max retries, events are marked as FAILED and moved to DLQ
 * 
 * Guarantees: At-least-once delivery (exactly-once with idempotency)
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Event-Driven Architecture, Outbox Pattern
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { ILogger } from '../../application/services/ILogger';
import { DomainEvent } from '@shared/domain/base/domain-event';

export interface OutboxEvent {
  outboxId: string;
  eventId: string;
  eventType: string;
  aggregateId: string;
  aggregateType: string;
  payload: Record<string, unknown>;
  routingKey?: string;
  occurredAt: Date;
  status: 'PENDING' | 'PUBLISHING' | 'PUBLISHED' | 'FAILED';
  publishAttempts: number;
  publishingError?: string;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * OutboxService - Manages event outbox for reliable publishing
 */
export class OutboxService {
  private readonly MAX_RETRIES = 3;
  private readonly BATCH_SIZE = 100;

  constructor(
    private supabaseClient: SupabaseClient,
    private logger: ILogger
  ) {}

  /**
   * Store event in outbox (atomically with business transaction)
   * 
   * This should be called within the same transaction as business data changes
   * to ensure consistency: either both succeed or both fail
   */
  async storeEvent(event: DomainEvent, routingKey?: string): Promise<OutboxEvent> {
    try {
      const eventId = event.eventId || crypto.randomUUID();

      const { data, error } = await this.supabaseClient
        .schema('auth_schema')
        .from('event_outbox')
        .insert({
          event_id: eventId,
          event_type: event.constructor.name,
          aggregate_id: event.aggregateId,
          aggregate_type: 'User', // TODO: Make this dynamic from event
          payload: event as unknown as Record<string, unknown>,
          routing_key: routingKey,
          occurred_at: event.occurredAt.toISOString(),
          status: 'PENDING',
          publish_attempts: 0
        })
        .select('*')
        .single();

      if (error) {
        this.logger.error('Failed to store event in outbox', {
          eventId,
          eventType: event.constructor.name,
          error: error.message
        });
        throw new Error(`Failed to store event in outbox: ${error.message}`);
      }

      this.logger.debug('Event stored in outbox', {
        outboxId: data.outbox_id,
        eventId: data.event_id,
        eventType: data.event_type
      });

      return this.mapToOutboxEvent(data);
    } catch (error) {
      this.logger.error('Error storing event in outbox', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Get pending events from outbox for publishing
   */
  async getPendingEvents(limit: number = this.BATCH_SIZE): Promise<OutboxEvent[]> {
    try {
      const { data, error } = await this.supabaseClient
        .schema('auth_schema')
        .from('event_outbox')
        .select('*')
        .eq('status', 'PENDING')
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) {
        this.logger.error('Failed to fetch pending events', {
          error: error.message
        });
        throw new Error(`Failed to fetch pending events: ${error.message}`);
      }

      return (data || []).map(row => this.mapToOutboxEvent(row));
    } catch (error) {
      this.logger.error('Error fetching pending events', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Mark event as publishing (lock for processing)
   */
  async markAsPublishing(outboxId: string): Promise<void> {
    try {
      const { error } = await this.supabaseClient
        .schema('auth_schema')
        .from('event_outbox')
        .update({
          status: 'PUBLISHING',
          updated_at: new Date().toISOString()
        })
        .eq('outbox_id', outboxId);

      if (error) {
        throw new Error(`Failed to mark event as publishing: ${error.message}`);
      }

      this.logger.debug('Event marked as publishing', { outboxId });
    } catch (error) {
      this.logger.error('Error marking event as publishing', {
        outboxId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Mark event as published (success)
   */
  async markAsPublished(outboxId: string): Promise<void> {
    try {
      const { error } = await this.supabaseClient
        .schema('auth_schema')
        .from('event_outbox')
        .update({
          status: 'PUBLISHED',
          published_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('outbox_id', outboxId);

      if (error) {
        throw new Error(`Failed to mark event as published: ${error.message}`);
      }

      this.logger.info('Event published successfully', { outboxId });
    } catch (error) {
      this.logger.error('Error marking event as published', {
        outboxId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Mark event as failed (with error message and retry count)
   */
  async markAsFailed(outboxId: string, errorMessage: string): Promise<void> {
    try {
      // Get current retry count
      const { data: currentEvent, error: fetchError } = await this.supabaseClient
        .schema('auth_schema')
        .from('event_outbox')
        .select('publish_attempts')
        .eq('outbox_id', outboxId)
        .single();

      if (fetchError) {
        throw new Error(`Failed to fetch event: ${fetchError.message}`);
      }

      const newRetryCount = (currentEvent?.publish_attempts || 0) + 1;
      const shouldFail = newRetryCount >= this.MAX_RETRIES;

      const { error: updateError } = await this.supabaseClient
        .schema('auth_schema')
        .from('event_outbox')
        .update({
          status: shouldFail ? 'FAILED' : 'PENDING',
          publish_attempts: newRetryCount,
          publishing_error: errorMessage,
          updated_at: new Date().toISOString()
        })
        .eq('outbox_id', outboxId);

      if (updateError) {
        throw new Error(`Failed to mark event as failed: ${updateError.message}`);
      }

      if (shouldFail) {
        this.logger.warn('Event marked as FAILED after max retries', {
          outboxId,
          retryCount: newRetryCount,
          error: errorMessage
        });
      } else {
        this.logger.warn('Event marked for retry', {
          outboxId,
          retryCount: newRetryCount,
          error: errorMessage
        });
      }
    } catch (error) {
      this.logger.error('Error marking event as failed', {
        outboxId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Get failed events (for monitoring and manual retry)
   */
  async getFailedEvents(limit: number = 100): Promise<OutboxEvent[]> {
    try {
      const { data, error } = await this.supabaseClient
        .schema('auth_schema')
        .from('event_outbox')
        .select('*')
        .eq('status', 'FAILED')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(`Failed to fetch failed events: ${error.message}`);
      }

      return (data || []).map(row => this.mapToOutboxEvent(row));
    } catch (error) {
      this.logger.error('Error fetching failed events', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Get outbox statistics
   */
  async getStats(): Promise<{
    pending: number;
    publishing: number;
    published: number;
    failed: number;
    total: number;
  }> {
    try {
      const { data, error } = await this.supabaseClient
        .schema('auth_schema')
        .from('event_outbox')
        .select('status', { count: 'exact' });

      if (error) {
        throw new Error(`Failed to fetch outbox stats: ${error.message}`);
      }

      const stats = {
        pending: 0,
        publishing: 0,
        published: 0,
        failed: 0,
        total: data?.length || 0
      };

      (data || []).forEach(row => {
        if (row.status === 'PENDING') stats.pending++;
        else if (row.status === 'PUBLISHING') stats.publishing++;
        else if (row.status === 'PUBLISHED') stats.published++;
        else if (row.status === 'FAILED') stats.failed++;
      });

      return stats;
    } catch (error) {
      this.logger.error('Error fetching outbox stats', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Map database row to OutboxEvent
   */
  private mapToOutboxEvent(row: Record<string, unknown>): OutboxEvent {
    return {
      outboxId: row.outbox_id as string,
      eventId: row.event_id as string,
      eventType: row.event_type as string,
      aggregateId: row.aggregate_id as string,
      aggregateType: row.aggregate_type as string,
      payload: row.payload as Record<string, unknown>,
      routingKey: row.routing_key as string | undefined,
      occurredAt: new Date(row.occurred_at as string),
      status: row.status as 'PENDING' | 'PUBLISHING' | 'PUBLISHED' | 'FAILED',
      publishAttempts: row.publish_attempts as number,
      publishingError: row.publishing_error as string | undefined,
      publishedAt: row.published_at ? new Date(row.published_at as string) : undefined,
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string)
    };
  }
}
