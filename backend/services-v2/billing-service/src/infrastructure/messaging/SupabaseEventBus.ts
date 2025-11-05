/**
 * SupabaseEventBus - Event Bus Implementation
 * Uses Supabase Realtime for event publishing/subscribing
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { OptimizedSupabaseClient } from '../../../../shared/infrastructure/database/optimized-supabase-client';
import { ILogger } from '../../../../shared/infrastructure/logging/logger.interface';

export interface DomainEvent {
  eventId: string;
  eventType: string;
  aggregateId: string;
  aggregateType: string;
  payload: any;
  occurredAt: Date;
  version: number;
}

export interface IEventBus {
  publish(event: DomainEvent): Promise<void>;
  publishBatch(events: DomainEvent[]): Promise<void>;
  subscribe(eventType: string, handler: (event: DomainEvent) => Promise<void>): void;
}

export class SupabaseEventBus implements IEventBus {
  private handlers: Map<string, Array<(event: DomainEvent) => Promise<void>>> = new Map();
  
  constructor(
    private readonly supabaseClient: OptimizedSupabaseClient,
    private readonly logger: ILogger,
    private readonly schema: string = 'payment_schema'
  ) {}

  /**
   * Publish a single domain event to outbox
   */
  async publish(event: DomainEvent): Promise<void> {
    try {
      const client = await this.supabaseClient.getConnection();
      
      const { error } = await client
        .schema(this.schema)
        .from('outbox_events')
        .insert({
          event_id: event.eventId,
          event_type: event.eventType,
          aggregate_id: event.aggregateId,
          aggregate_type: event.aggregateType,
          payload: event.payload,
          occurred_at: event.occurredAt.toISOString(),
          status: 'PENDING',
          version: event.version,
          retry_count: 0
        });

      if (error) {
        this.logger.error('Failed to publish event to outbox', { error, event });
        throw new Error(`Failed to publish event: ${error.message}`);
      }

      this.logger.info('Event published to outbox', {
        eventId: event.eventId,
        eventType: event.eventType
      });
    } catch (error) {
      this.logger.error('Error publishing event', { error, event });
      throw error;
    }
  }

  /**
   * Publish multiple events in batch
   */
  async publishBatch(events: DomainEvent[]): Promise<void> {
    try {
      const client = await this.supabaseClient.getConnection();
      
      const records = events.map(event => ({
        event_id: event.eventId,
        event_type: event.eventType,
        aggregate_id: event.aggregateId,
        aggregate_type: event.aggregateType,
        payload: event.payload,
        occurred_at: event.occurredAt.toISOString(),
        status: 'PENDING',
        version: event.version,
        retry_count: 0
      }));

      const { error } = await client
        .schema(this.schema)
        .from('outbox_events')
        .insert(records);

      if (error) {
        this.logger.error('Failed to publish batch events', { error, count: events.length });
        throw new Error(`Failed to publish batch events: ${error.message}`);
      }

      this.logger.info('Batch events published to outbox', { count: events.length });
    } catch (error) {
      this.logger.error('Error publishing batch events', { error });
      throw error;
    }
  }

  /**
   * Subscribe to event type (in-memory handler registration)
   */
  subscribe(eventType: string, handler: (event: DomainEvent) => Promise<void>): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler);
    
    this.logger.info('Event handler registered', { eventType });
  }

  /**
   * Dispatch event to registered handlers (called by outbox worker)
   */
  async dispatch(event: DomainEvent): Promise<void> {
    const handlers = this.handlers.get(event.eventType) || [];
    
    for (const handler of handlers) {
      try {
        await handler(event);
      } catch (error) {
        this.logger.error('Error in event handler', {
          eventType: event.eventType,
          eventId: event.eventId,
          error
        });
        throw error;
      }
    }
  }
}

