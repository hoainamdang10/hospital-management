/**
 * SupabaseOutboxRepository - Infrastructure Layer
 * Implements transactional outbox pattern for reliable event publishing
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Event-Driven Architecture
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { ILogger } from '@shared/application/services/logger.interface';
import { DomainEvent } from '@shared/domain/base/domain-event';

export enum OutboxEventStatus {
  PENDING = 'PENDING',
  PUBLISHED = 'PUBLISHED',
  FAILED = 'FAILED',
}

export interface OutboxEvent {
  id: string;
  event_id: string;
  event_type: string;
  aggregate_type: string;
  aggregate_id: string;
  payload: any;
  metadata: any;
  status: OutboxEventStatus;
  retry_count: number;
  max_retries: number;
  last_error?: string;
  created_at: string;
  published_at?: string;
  sequence_number: number;
  partition_key?: string;
}

export interface IOutboxRepository {
  saveEvents(events: DomainEvent[], transaction?: any): Promise<void>;
  getPendingEvents(batchSize?: number): Promise<OutboxEvent[]>;
  markAsPublished(eventIds: string[]): Promise<void>;
  markAsFailed(eventId: string, errorMessage: string): Promise<void>;
  moveToDeadLetterQueue(eventId: string, failureReason: string): Promise<void>;
  cleanupPublishedEvents(retentionDays?: number): Promise<number>;
}

export class SupabaseOutboxRepository implements IOutboxRepository {
  private readonly TABLE_NAME = 'outbox_events';
  private readonly DLQ_TABLE = 'outbox_dead_letter_queue';
  private readonly SCHEMA = 'patient_schema';
  private readonly networkRetryConfig = {
    maxAttempts: 3,
    baseDelayMs: 250,
    maxDelayMs: 2000,
  };

  constructor(
    private supabase: SupabaseClient,
    private logger: ILogger,
  ) {}

  /**
   * Save domain events to outbox table
   * CRITICAL: Must be called in same transaction as aggregate save
   */
  async saveEvents(events: DomainEvent[], transaction?: any): Promise<void> {
    if (events.length === 0) {
      return;
    }

    try {
      const outboxRecords = events.map((event) => ({
        event_id: event.eventId || event.aggregateId,
        event_type: event.eventType,
        aggregate_type: this.extractAggregateType(event.eventType),
        aggregate_id: event.aggregateId,
        payload: event.toJSON(),
        metadata: {
          occurredAt: event.occurredAt,
          version: (event as any).eventVersion || 1,
          correlationId: (event as any).correlationId,
        },
        status: OutboxEventStatus.PENDING,
        retry_count: 0,
        max_retries: 3,
        partition_key: event.aggregateId,
      }));

      const { error } = await this.executeWithNetworkResilience(
        async () =>
          await this.supabase
            .schema(this.SCHEMA)
            .from(this.TABLE_NAME)
            .insert(outboxRecords),
        'saveEvents.insert',
      );

      if (error) {
        this.logger.error('[OutboxRepository] Failed to save events', {
          error: this.extractErrorMessage(error),
          count: events.length,
        });
        throw new Error(
          `Failed to save outbox events: ${this.extractErrorMessage(error)}`,
        );
      }

      this.logger.debug('[OutboxRepository] Events saved to outbox', {
        count: events.length,
      });
    } catch (error) {
      this.logger.error('[OutboxRepository] Error saving events', {
        error: this.serializeError(error),
      });
      throw error;
    }
  }

  /**
   * Get pending events for publishing (batch processing)
   */
  async getPendingEvents(batchSize: number = 50): Promise<OutboxEvent[]> {
    try {
      const { data, error } = await this.executeWithNetworkResilience(
        async () =>
          await this.supabase
            .schema(this.SCHEMA)
            .from(this.TABLE_NAME)
            .select('*')
            .eq('status', OutboxEventStatus.PENDING)
            .order('created_at', { ascending: true })
            .limit(batchSize),
        'getPendingEvents.select',
      );

      if (error) {
        this.logger.error('[OutboxRepository] Failed to get pending events', {
          error: error.message,
        });
        throw new Error(`Failed to get pending events: ${error.message}`);
      }

      return (data || []) as OutboxEvent[];
    } catch (error) {
      this.logger.error('[OutboxRepository] Error getting pending events', {
        error: this.serializeError(error),
      });
      throw error;
    }
  }

  /**
   * Mark events as published
   */
  async markAsPublished(eventIds: string[]): Promise<void> {
    if (eventIds.length === 0) {
      return;
    }

    try {
      const { error } = await this.executeWithNetworkResilience(
        async () =>
          await this.supabase
            .schema(this.SCHEMA)
            .from(this.TABLE_NAME)
            .update({
              status: OutboxEventStatus.PUBLISHED,
              published_at: new Date().toISOString(),
            })
            .in('id', eventIds),
        'markAsPublished.update',
      );

      if (error) {
        this.logger.error('[OutboxRepository] Failed to mark as published', {
          error: error.message,
        });
        throw new Error(`Failed to mark events as published: ${error.message}`);
      }
    } catch (error) {
      this.logger.error('[OutboxRepository] Error marking as published', {
        error: this.serializeError(error),
      });
      throw error;
    }
  }

  /**
   * Mark single event as failed (with retry logic)
   */
  async markAsFailed(eventId: string, errorMessage: string): Promise<void> {
    try {
      const { data: event, error } = await this.executeWithNetworkResilience(
        async () =>
          await this.supabase
            .schema(this.SCHEMA)
            .from(this.TABLE_NAME)
            .select('*')
            .eq('id', eventId)
            .maybeSingle(),
        'markAsFailed.fetch',
      );

      if (error) {
        this.logger.error(
          '[OutboxRepository] Failed to load event to mark failed',
          {
            error: error.message,
            eventId,
          },
        );
        throw new Error(`Failed to load outbox event: ${error.message}`);
      }

      if (!event) {
        this.logger.warn(
          '[OutboxRepository] Event not found when marking as failed',
          {
            eventId,
          },
        );
        return;
      }

      const newRetryCount = (event.retry_count || 0) + 1;

      if (newRetryCount >= event.max_retries) {
        this.logger.warn(
          '[OutboxRepository] Max retries exceeded, moving to DLQ',
          {
            eventId,
            retryCount: newRetryCount,
          },
        );
        await this.moveToDeadLetterQueue(eventId, errorMessage);
        return;
      }

      const { error: updateError } = await this.executeWithNetworkResilience(
        async () =>
          await this.supabase
            .schema(this.SCHEMA)
            .from(this.TABLE_NAME)
            .update({
              status: OutboxEventStatus.FAILED,
              retry_count: newRetryCount,
              last_error: errorMessage,
            })
            .eq('id', eventId),
        'markAsFailed.update',
      );

      if (updateError) {
        this.logger.error('[OutboxRepository] Failed to mark as failed', {
          error: updateError.message,
          eventId,
        });
        throw new Error(
          `Failed to mark event as failed: ${updateError.message}`,
        );
      }

      this.logger.debug('[OutboxRepository] Event marked as failed', {
        eventId,
        retryCount: newRetryCount,
      });
    } catch (error) {
      this.logger.error('[OutboxRepository] Error marking as failed', {
        error: this.serializeError(error),
        eventId,
      });
      throw error;
    }
  }

  /**
   * Move permanently failed event to Dead Letter Queue
   */
  async moveToDeadLetterQueue(
    eventId: string,
    failureReason: string,
  ): Promise<void> {
    try {
      const { error } = await this.executeWithNetworkResilience(
        async () =>
          await this.supabase
            .schema(this.SCHEMA)
            .rpc('move_to_dead_letter_queue', {
              p_event_id: eventId,
              p_failure_reason: failureReason,
            }),
        'moveToDeadLetterQueue.rpc',
      );

      if (error) {
        this.logger.error('[OutboxRepository] Failed to move to DLQ', {
          error: error.message,
          eventId,
        });
        throw new Error(`Failed to move to DLQ: ${error.message}`);
      }

      this.logger.info('[OutboxRepository] Event moved to DLQ', {
        eventId,
        failureReason,
      });
    } catch (error) {
      this.logger.error('[OutboxRepository] Error moving to DLQ', {
        error: this.serializeError(error),
        eventId,
      });
      throw error;
    }
  }

  /**
   * Cleanup old published events (housekeeping)
   */
  async cleanupPublishedEvents(retentionDays: number = 30): Promise<number> {
    try {
      const { data, error } = await this.executeWithNetworkResilience(
        async () =>
          await this.supabase
            .schema(this.SCHEMA)
            .rpc('cleanup_old_published_events', {
              p_retention_days: retentionDays,
            }),
        'cleanupPublishedEvents.rpc',
      );

      if (error) {
        this.logger.error('[OutboxRepository] Failed to cleanup events', {
          error: error.message,
        });
        throw new Error(`Failed to cleanup events: ${error.message}`);
      }

      const deletedCount = data || 0;
      this.logger.info('[OutboxRepository] Cleaned up old events', {
        deletedCount,
        retentionDays,
      });

      return deletedCount;
    } catch (error) {
      this.logger.error('[OutboxRepository] Error cleaning up events', {
        error: this.serializeError(error),
      });
      throw error;
    }
  }

  /**
   * Execute Supabase call with transient network protection
   */
  private async executeWithNetworkResilience<T>(
    operation: () => Promise<T>,
    context: string,
    attempt: number = 1,
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (
        attempt >= this.networkRetryConfig.maxAttempts ||
        !this.isTransientNetworkError(error)
      ) {
        throw error;
      }

      const delayMs = Math.min(
        this.networkRetryConfig.baseDelayMs * Math.pow(2, attempt - 1),
        this.networkRetryConfig.maxDelayMs,
      );

      this.logger.warn(
        '[OutboxRepository] Transient Supabase error, retrying operation',
        {
          context,
          attempt,
          delayMs,
          error: this.serializeError(error),
        },
      );

      await this.delay(delayMs);
      return this.executeWithNetworkResilience(operation, context, attempt + 1);
    }
  }

  private isTransientNetworkError(error: unknown): boolean {
    if (!(error instanceof Error)) {
      return false;
    }
    const message = error.message?.toLowerCase() ?? '';
    return (
      message.includes('fetch failed') ||
      message.includes('network') ||
      message.includes('ecconnreset') ||
      message.includes('etimedout') ||
      message.includes('socket hang up') ||
      message.includes('dns')
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private serializeError(error: unknown): Record<string, any> | string {
    if (error instanceof Error) {
      return {
        message: error.message,
        stack: error.stack,
        cause:
          error instanceof Error && 'cause' in error
            ? (error as any).cause
            : undefined,
      };
    }
    return typeof error === 'string' ? error : JSON.stringify(error);
  }

  private extractErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    try {
      return JSON.stringify(error);
    } catch {
      return 'Unknown error';
    }
  }

  /**
   * Extract aggregate type from event type
   * Example: 'patient.patient_registered' -> 'Patient'
   */
  private extractAggregateType(eventType: string): string {
    const parts = eventType.split('.');
    if (parts.length >= 2) {
      // Capitalize first letter
      return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    }
    return 'Unknown';
  }
}
