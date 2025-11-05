/**
 * Supabase Outbox Repository - Infrastructure Layer
 * Implements Transactional Outbox Pattern using Supabase
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Transactional Outbox Pattern, HIPAA, Audit Trail
 */

import { SupabaseClient } from '@supabase/supabase-js';
import {
  IOutboxRepository,
  OutboxEvent,
  OutboxEventStatus,
  DeadLetterEvent
} from '../../domain/repositories/IOutboxRepository';
import { DomainEvent } from '../../../../shared/domain/base/domain-event';
import { ILogger } from '../../../../shared/infrastructure/logging/logger.interface';

export class SupabaseOutboxRepository implements IOutboxRepository {
  private readonly TABLE_NAME = 'outbox';
  private readonly DLQ_TABLE = 'outbox_dead_letter_queue';
  private readonly SCHEMA = 'billing_schema';

  constructor(
    private supabase: SupabaseClient,
    private logger: ILogger
  ) {}

  /**
   * Save domain events to outbox table
   * CRITICAL: Must be called in same transaction as aggregate save
   */
  async saveEvents(events: DomainEvent[], transaction?: any): Promise<void> {
    if (events.length === 0) return;

    try {
      const outboxRecords = events.map((event) => ({
        aggregate_id: event.aggregateId,
        aggregate_type: event.getAggregateType(),
        event_type: event.eventType,
        payload: event.getEventData(),
        correlation_id: (event as any).correlationId,
        user_id: (event as any).userId,
        retry_count: 0,
        max_retries: 3,
      }));

      const { error } = await this.supabase
        .schema(this.SCHEMA)
        .from(this.TABLE_NAME)
        .insert(outboxRecords);

      if (error) {
        this.logger.error('[OutboxRepository] Failed to save events', { error, count: events.length });
        throw new Error(`Failed to save outbox events: ${error.message}`);
      }

      this.logger.debug('[OutboxRepository] Saved events to outbox', { count: events.length });
    } catch (error) {
      this.logger.error('[OutboxRepository] Error saving events', { error });
      throw error;
    }
  }

  /**
   * Get pending events for publishing (batch processing)
   */
  async getPendingEvents(batchSize: number = 100): Promise<OutboxEvent[]> {
    try {
      const { data, error } = await this.supabase
        .schema(this.SCHEMA)
        .rpc('get_pending_outbox_events', {
          batch_size: batchSize
        });

      if (error) {
        this.logger.error('[OutboxRepository] Failed to get pending events', { error });
        throw new Error(`Failed to get pending events: ${error.message}`);
      }

      return (data || []).map(this.mapToOutboxEvent);
    } catch (error) {
      this.logger.error('[OutboxRepository] Error getting pending events', { error });
      throw error;
    }
  }

  /**
   * Mark events as successfully published
   */
  async markAsPublished(eventIds: string[]): Promise<void> {
    if (eventIds.length === 0) return;

    try {
      for (const eventId of eventIds) {
        const { error } = await this.supabase
          .schema(this.SCHEMA)
          .rpc('mark_outbox_processed', {
            event_id: eventId
          });

        if (error) {
          this.logger.error('[OutboxRepository] Failed to mark as published', { error, eventId });
          throw new Error(`Failed to mark event as published: ${error.message}`);
        }
      }

      this.logger.debug('[OutboxRepository] Marked events as published', { count: eventIds.length });
    } catch (error) {
      this.logger.error('[OutboxRepository] Error marking as published', { error });
      throw error;
    }
  }

  /**
   * Mark event as failed and increment retry count
   */
  async markAsFailed(eventId: string, errorMessage: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .schema(this.SCHEMA)
        .rpc('increment_outbox_retry', {
          event_id: eventId,
          error_msg: errorMessage
        });

      if (error) {
        this.logger.error('[OutboxRepository] Failed to increment retry', { error, eventId });
        throw new Error(`Failed to increment retry: ${error.message}`);
      }

      this.logger.warn('[OutboxRepository] Marked event as failed', { eventId });
    } catch (error) {
      this.logger.error('[OutboxRepository] Error marking as failed', { error, eventId });
      throw error;
    }
  }

  /**
   * Move permanently failed event to Dead Letter Queue
   */
  async moveToDeadLetterQueue(eventId: string, failureReason: string): Promise<void> {
    try {
      // Use stored procedure for atomic move
      const { error } = await this.supabase
        .schema(this.SCHEMA)
        .rpc('move_to_dead_letter_queue', {
          p_event_id: eventId,
          p_failure_reason: failureReason,
        });

      if (error) {
        this.logger.error('[OutboxRepository] Failed to move to DLQ', { error, eventId });
        throw new Error(`Failed to move to DLQ: ${error.message}`);
      }

      this.logger.warn('[OutboxRepository] Moved event to DLQ', { eventId, failureReason });
    } catch (error) {
      this.logger.error('[OutboxRepository] Error moving to DLQ', { error });
      throw error;
    }
  }

  /**
   * Get events ready for retry (failed but retryable)
   */
  async getRetryableEvents(batchSize: number = 50): Promise<OutboxEvent[]> {
    try {
      const { data, error } = await this.supabase
        .schema(this.SCHEMA)
        .from(this.TABLE_NAME)
        .select('*')
        .eq('status', OutboxEventStatus.FAILED)
        .lt('retry_count', 3) // Only get events under max retries
        .order('sequence_number', { ascending: true })
        .limit(batchSize);

      if (error) {
        this.logger.error('[OutboxRepository] Failed to get retryable events', { error });
        throw new Error(`Failed to get retryable events: ${error.message}`);
      }

      return (data || []).map(this.mapToOutboxEvent);
    } catch (error) {
      this.logger.error('[OutboxRepository] Error getting retryable events', { error });
      throw error;
    }
  }

  /**
   * Cleanup old published events (housekeeping)
   */
  async cleanupPublishedEvents(retentionDays: number = 30): Promise<number> {
    try {
      const { data, error } = await this.supabase
        .schema(this.SCHEMA)
        .rpc('cleanup_old_published_events', {
          p_retention_days: retentionDays,
        });

      if (error) {
        this.logger.error('[OutboxRepository] Failed to cleanup events', { error });
        throw new Error(`Failed to cleanup events: ${error.message}`);
      }

      const deletedCount = data || 0;
      this.logger.info('[OutboxRepository] Cleaned up old events', { deletedCount, retentionDays });
      
      return deletedCount;
    } catch (error) {
      this.logger.error('[OutboxRepository] Error cleaning up events', { error });
      throw error;
    }
  }

  /**
   * Get dead letter queue events
   */
  async getDeadLetterEvents(limit: number = 100): Promise<DeadLetterEvent[]> {
    try {
      const { data, error } = await this.supabase
        .schema(this.SCHEMA)
        .from(this.DLQ_TABLE)
        .select('*')
        .eq('resolved', false)
        .order('moved_to_dlq_at', { ascending: false })
        .limit(limit);

      if (error) {
        this.logger.error('[OutboxRepository] Failed to get DLQ events', { error });
        throw new Error(`Failed to get DLQ events: ${error.message}`);
      }

      return (data || []).map(this.mapToDeadLetterEvent);
    } catch (error) {
      this.logger.error('[OutboxRepository] Error getting DLQ events', { error });
      throw error;
    }
  }

  /**
   * Mark dead letter event as resolved
   */
  async resolveDeadLetterEvent(eventId: string, resolvedBy: string, resolutionNotes?: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .schema(this.SCHEMA)
        .from(this.DLQ_TABLE)
        .update({
          resolved: true,
          resolved_at: new Date().toISOString(),
          resolved_by: resolvedBy,
          resolution_notes: resolutionNotes,
        })
        .eq('original_event_id', eventId);

      if (error) {
        this.logger.error('[OutboxRepository] Failed to resolve DLQ event', { error, eventId });
        throw new Error(`Failed to resolve DLQ event: ${error.message}`);
      }

      this.logger.info('[OutboxRepository] Resolved DLQ event', { eventId, resolvedBy });
    } catch (error) {
      this.logger.error('[OutboxRepository] Error resolving DLQ event', { error });
      throw error;
    }
  }

  /**
   * Get retryable events (failed but still within retry limit)
   */
  async getRetryableEvents(batchSize: number): Promise<OutboxEvent[]> {
    try {
      const { data, error } = await this.supabase
        .schema(this.SCHEMA)
        .rpc('get_retryable_outbox_events', {
          batch_size: batchSize
        });

      if (error) {
        this.logger.error('[OutboxRepository] Failed to get retryable events', { error });
        throw new Error(`Failed to get retryable events: ${error.message}`);
      }

      return (data || []).map(this.mapToOutboxEvent);
    } catch (error) {
      this.logger.error('[OutboxRepository] Error getting retryable events', { error });
      throw error;
    }
  }

  /**
   * Cleanup old published events
   */
  async cleanupPublishedEvents(retentionDays: number): Promise<number> {
    try {
      const { data, error } = await this.supabase
        .schema(this.SCHEMA)
        .rpc('cleanup_old_outbox_events', {
          retention_days: retentionDays
        });

      if (error) {
        this.logger.error('[OutboxRepository] Failed to cleanup events', { error });
        throw new Error(`Failed to cleanup events: ${error.message}`);
      }

      const deletedCount = data || 0;
      this.logger.info('[OutboxRepository] Cleaned up old events', { deletedCount, retentionDays });
      return deletedCount;
    } catch (error) {
      this.logger.error('[OutboxRepository] Error cleaning up events', { error });
      throw error;
    }
  }

  /**
   * Get outbox statistics
   */
  async getStatistics(): Promise<{
    pending: number;
    published: number;
    failed: number;
    deadLetter: number;
  }> {
    try {
      const { count: pending } = await this.supabase
        .schema(this.SCHEMA)
        .from(this.TABLE_NAME)
        .select('*', { count: 'exact', head: true })
        .is('processed_at', null);

      const { count: published } = await this.supabase
        .schema(this.SCHEMA)
        .from(this.TABLE_NAME)
        .select('*', { count: 'exact', head: true })
        .not('processed_at', 'is', null);

      const { count: failed } = await this.supabase
        .schema(this.SCHEMA)
        .from(this.TABLE_NAME)
        .select('*', { count: 'exact', head: true })
        .is('processed_at', null)
        .gt('retry_count', 0);

      const { count: deadLetter } = await this.supabase
        .schema(this.SCHEMA)
        .from(this.DLQ_TABLE)
        .select('*', { count: 'exact', head: true });

      return {
        pending: pending || 0,
        published: published || 0,
        failed: failed || 0,
        deadLetter: deadLetter || 0,
      };
    } catch (error) {
      this.logger.error('[OutboxRepository] Error getting statistics', { error });
      throw error;
    }
  }

  // =====================================================
  // PRIVATE HELPERS
  // =====================================================

  private mapToOutboxEvent = (row: any): OutboxEvent => {
    return {
      id: row.id,
      eventId: row.id, // Use id as eventId
      eventType: row.event_type,
      aggregateType: row.aggregate_type,
      aggregateId: row.aggregate_id,
      payload: row.payload,
      metadata: {
        correlationId: row.correlation_id,
        userId: row.user_id,
      },
      createdAt: new Date(row.created_at || row.occurred_at),
      publishedAt: row.processed_at ? new Date(row.processed_at) : undefined,
      status: row.processed_at ? OutboxEventStatus.PUBLISHED : OutboxEventStatus.PENDING,
      retryCount: row.retry_count || 0,
      maxRetries: row.max_retries || 3,
      errorMessage: row.error_message,
      sequenceNumber: undefined,
      partitionKey: undefined,
    };
  };

  private mapToDeadLetterEvent = (row: any): DeadLetterEvent => {
    return {
      id: row.id,
      originalEventId: row.original_event_id,
      eventType: row.event_type,
      aggregateType: row.aggregate_type,
      aggregateId: row.aggregate_id,
      payload: row.payload,
      metadata: row.metadata,
      failureReason: row.failure_reason,
      finalErrorMessage: row.final_error_message,
      totalRetryAttempts: row.total_retry_attempts,
      firstAttemptedAt: new Date(row.first_attempted_at),
      movedToDlqAt: new Date(row.moved_to_dlq_at),
      resolved: row.resolved,
      resolvedAt: row.resolved_at ? new Date(row.resolved_at) : undefined,
      resolvedBy: row.resolved_by,
      resolutionNotes: row.resolution_notes,
    };
  };
}
