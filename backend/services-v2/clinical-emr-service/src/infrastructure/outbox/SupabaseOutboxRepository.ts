/**
 * Supabase Outbox Repository - Infrastructure Layer
 * Implements Transactional Outbox Pattern using Supabase
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Transactional Outbox Pattern, HIPAA, Audit Trail
 */

import { injectable, inject } from 'inversify';
import { SupabaseClient } from '@supabase/supabase-js';
import { DomainEvent } from '@shared/domain/events/domain-events';
import { 
  IOutboxRepository, 
  OutboxEvent, 
  OutboxEventStatus,
  DeadLetterEvent 
} from '../../domain/repositories/IOutboxRepository';
import { ILogger } from '@shared/infrastructure/logging/logger.interface';

@injectable()
export class SupabaseOutboxRepository implements IOutboxRepository {
  private readonly TABLE_NAME = 'outbox_events';
  private readonly DLQ_TABLE = 'outbox_dead_letter_queue';
  private readonly SCHEMA = 'clinical_schema';

  constructor(
    @inject('SupabaseClient') private supabase: SupabaseClient,
    @inject('Logger') private logger: ILogger
  ) {}

  /**
   * Save domain events to outbox table
   * CRITICAL: Must be called in same transaction as aggregate save
   */
  async saveEvents(events: DomainEvent[], transaction?: any): Promise<void> {
    if (events.length === 0) return;

    try {
      const outboxRecords = events.map((event, index) => ({
        event_id: event.eventId || event.aggregateId, // Use eventId or fallback
        event_type: event.eventType,
        aggregate_type: this.extractAggregateType(event.eventType),
        aggregate_id: event.aggregateId,
        payload: event,
        metadata: {
          occurredAt: event.occurredAt,
          version: event.version || 1,
          correlationId: (event as any).correlationId,
        },
        status: OutboxEventStatus.PENDING,
        retry_count: 0,
        max_retries: 3,
        partition_key: event.aggregateId, // Partition by aggregate
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
        .from(this.TABLE_NAME)
        .select('*')
        .eq('status', OutboxEventStatus.PENDING)
        .order('sequence_number', { ascending: true })
        .limit(batchSize);

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
      const { error } = await this.supabase
        .schema(this.SCHEMA)
        .from(this.TABLE_NAME)
        .update({
          status: OutboxEventStatus.PUBLISHED,
          published_at: new Date().toISOString(),
        })
        .in('event_id', eventIds);

      if (error) {
        this.logger.error('[OutboxRepository] Failed to mark as published', { error, count: eventIds.length });
        throw new Error(`Failed to mark events as published: ${error.message}`);
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
      // Get current retry count
      const { data: current, error: fetchError } = await this.supabase
        .schema(this.SCHEMA)
        .from(this.TABLE_NAME)
        .select('retry_count, max_retries')
        .eq('event_id', eventId)
        .single();

      if (fetchError || !current) {
        throw new Error(`Failed to fetch event: ${fetchError?.message}`);
      }

      const newRetryCount = current.retry_count + 1;

      // Update status
      const { error: updateError } = await this.supabase
        .schema(this.SCHEMA)
        .from(this.TABLE_NAME)
        .update({
          status: OutboxEventStatus.FAILED,
          retry_count: newRetryCount,
          error_message: errorMessage,
        })
        .eq('event_id', eventId);

      if (updateError) {
        throw new Error(`Failed to update event: ${updateError.message}`);
      }

      // If max retries exceeded, move to DLQ
      if (newRetryCount >= current.max_retries) {
        await this.moveToDeadLetterQueue(eventId, `Max retries (${current.max_retries}) exceeded`);
      }

      this.logger.warn('[OutboxRepository] Marked event as failed', { 
        eventId, 
        retryCount: newRetryCount,
        maxRetries: current.max_retries 
      });
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
  async resolveDeadLetterEvent(eventId: string, resolvedBy: string, notes: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .schema(this.SCHEMA)
        .from(this.DLQ_TABLE)
        .update({
          resolved: true,
          resolved_at: new Date().toISOString(),
          resolved_by: resolvedBy,
          resolution_notes: notes,
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

  // =====================================================
  // PRIVATE HELPERS
  // =====================================================

  private mapToOutboxEvent(row: any): OutboxEvent {
    return {
      id: row.id,
      eventId: row.event_id,
      eventType: row.event_type,
      aggregateType: row.aggregate_type,
      aggregateId: row.aggregate_id,
      payload: row.payload,
      metadata: row.metadata,
      createdAt: new Date(row.created_at),
      publishedAt: row.published_at ? new Date(row.published_at) : undefined,
      status: row.status as OutboxEventStatus,
      retryCount: row.retry_count,
      maxRetries: row.max_retries,
      errorMessage: row.error_message,
      sequenceNumber: row.sequence_number,
      partitionKey: row.partition_key,
    };
  }

  private mapToDeadLetterEvent(row: any): DeadLetterEvent {
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
  }

  private extractAggregateType(eventType: string): string {
    // Extract aggregate type from event type
    // Example: "medical-record.created" -> "MedicalRecord"
    const parts = eventType.split('.');
    if (parts.length > 0) {
      return parts[0]
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join('');
    }
    return 'Unknown';
  }
}
