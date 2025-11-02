/**
 * InboxService - Inbox Pattern Implementation
 * Provides idempotent event processing using database-backed inbox
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Event-Driven Architecture, Idempotency Pattern
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { ILogger } from '../../application/services/ILogger';

export interface ProcessEventResult {
  isNew: boolean;
  inboxId: string;
  status: string;
}

/**
 * InboxService - Manages event inbox for idempotent processing
 */
export class InboxService {
  constructor(
    private supabaseClient: SupabaseClient,
    private logger: ILogger
  ) {}

  /**
   * Check if event has already been processed (idempotency check)
   */
  async checkProcessed(eventId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabaseClient
        .schema('auth_schema')
        .from('event_inbox')
        .select('processed_at, status')
        .eq('event_id', eventId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return false; // Not found - event is new
        }
        throw new Error(`Failed to check event: ${error.message}`);
      }

      return data.status === 'PROCESSED' || data.processed_at !== null;
    } catch (error) {
      this.logger.error('Error checking if event processed', {
        eventId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Store event in inbox (atomically insert or detect duplicate)
   */
  async storeEvent(event: {
    eventId: string;
    eventType: string;
    aggregateId: string;
    aggregateType: string;
    payloadJson: any;
    sourceService?: string;
    routingKey?: string;
    occurredAt: Date;
  }): Promise<ProcessEventResult> {
    try {
      const { data, error } = await this.supabaseClient
        .schema('auth_schema')
        .from('event_inbox')
        .insert({
          event_id: event.eventId,
          event_type: event.eventType,
          aggregate_id: event.aggregateId,
          aggregate_type: event.aggregateType,
          payload_json: event.payloadJson,
          source_service: event.sourceService,
          routing_key: event.routingKey,
          occurred_at: event.occurredAt.toISOString(),
          status: 'PENDING',
          retry_count: 0
        })
        .select('inbox_id, status')
        .single();

      if (error) {
        if (error.code === '23505') {
          // Duplicate - fetch existing
          const { data: existing } = await this.supabaseClient
            .schema('auth_schema')
            .from('event_inbox')
            .select('inbox_id, status')
            .eq('event_id', event.eventId)
            .single();

          return {
            isNew: false,
            inboxId: existing!.inbox_id,
            status: existing!.status
          };
        }
        throw new Error(`Failed to store event: ${error.message}`);
      }

      return {
        isNew: true,
        inboxId: data.inbox_id,
        status: data.status
      };
    } catch (error) {
      this.logger.error('Error storing event', {
        eventId: event.eventId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Mark event as processed
   */
  async markProcessed(eventId: string): Promise<void> {
    const { error } = await this.supabaseClient
      .schema('auth_schema')
      .from('event_inbox')
      .update({
        status: 'PROCESSED',
        processed_at: new Date().toISOString()
      })
      .eq('event_id', eventId);

    if (error) {
      throw new Error(`Failed to mark processed: ${error.message}`);
    }
  }

  /**
   * Mark event as failed
   * Increments retry_count and stores error message
   */
  async markFailed(eventId: string, errorMessage: string): Promise<void> {
    // First, get current retry_count
    const { data: currentEvent, error: fetchError } = await this.supabaseClient
      .schema('auth_schema')
      .from('event_inbox')
      .select('retry_count')
      .eq('event_id', eventId)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch event for retry count: ${fetchError.message}`);
    }

    const currentRetryCount = currentEvent?.retry_count || 0;

    // Update status, error message, and increment retry_count
    const { error } = await this.supabaseClient
      .schema('auth_schema')
      .from('event_inbox')
      .update({
        status: 'FAILED',
        processing_error: errorMessage,
        retry_count: currentRetryCount + 1,
        updated_at: new Date().toISOString()
      })
      .eq('event_id', eventId);

    if (error) {
      throw new Error(`Failed to mark failed: ${error.message}`);
    }
  }
}
