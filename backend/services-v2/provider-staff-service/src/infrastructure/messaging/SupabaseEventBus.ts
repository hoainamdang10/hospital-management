/**
 * Supabase Event Bus - Infrastructure Layer
 * V2 Clean Architecture + DDD + Event-Driven Implementation
 * Implements event publishing and handling with Supabase
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { IEventBus } from '@shared/events/event-bus.interface';
import { DomainEvent } from '@shared/domain/base/domain-event';
import { ILogger } from '@shared/infrastructure/logging/logger.interface';
import { CircuitBreakerFactory } from '../resilience/CircuitBreaker';

export interface IEventHandler<T extends DomainEvent> {
  handle(event: T): Promise<void>;
  canHandle(event: DomainEvent): boolean;
  getHandlerName(): string;
}

/**
 * Supabase Event Bus
 * Implements event publishing and subscription using Supabase as event store
 * Uses Circuit Breaker pattern for resilience
 */
export class SupabaseEventBus implements IEventBus {
  private handlers: Map<string, IEventHandler<any>[]> = new Map();
  private eventHistory: Map<string, DomainEvent[]> = new Map();
  private readonly supabaseClient: SupabaseClient;
  private readonly logger: ILogger;
  private readonly circuitBreaker = CircuitBreakerFactory.getBreaker('event-bus');

  constructor(
    supabaseUrl: string,
    supabaseKey: string,
    logger: ILogger,
    schema: string = 'provider_schema'
  ) {
    this.supabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      db: { schema },
      global: { headers: { 'X-Client-Info': 'provider-staff-service-eventbus' } }
    }) as any;

    this.logger = logger;
  }

  /**
   * Connect to event bus (no-op for Supabase)
   */
  public async connect(): Promise<void> {
    this.logger.info('SupabaseEventBus connected (using Supabase as event store)');
  }

  /**
   * Disconnect from event bus (no-op for Supabase)
   */
  public async disconnect(): Promise<void> {
    this.logger.info('SupabaseEventBus disconnected');
  }

  /**
   * Publish a domain event
   */
  async publish(event: DomainEvent): Promise<void> {
    try {
      this.logger.info('Publishing domain event', {
        eventType: event.eventType,
        aggregateId: event.aggregateId,
        eventId: event.eventId
      });

      await this.storeEvent(event);
      this.addToHistory(event);
      await this.notifyHandlers(event);

      this.logger.info('Domain event published successfully', {
        eventType: event.eventType,
        eventId: event.eventId
      });

    } catch (error) {
      this.logger.error('Error publishing event', {
        eventType: event.eventType,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new Error(`Loi publish event: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Publish multiple domain events
   */
  async publishAll(events: DomainEvent[]): Promise<void> {
    try {
      this.logger.info('Publishing multiple domain events', {
        count: events.length
      });

      await this.storeEvents(events);
      events.forEach(event => this.addToHistory(event));

      for (const event of events) {
        await this.notifyHandlers(event);
      }

      this.logger.info('All domain events published successfully', {
        count: events.length
      });

    } catch (error) {
      this.logger.error('Error publishing events', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new Error(`Loi publish events: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Subscribe to an event type
   */
  async subscribe<T extends DomainEvent>(
    eventType: string,
    handler: IEventHandler<T>,
    _queueName?: string
  ): Promise<void> {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }

    const handlers = this.handlers.get(eventType)!;
    handlers.push(handler);

    handlers.sort((a, b) => {
      const aPriority = (a as any).getPriority?.() || 0;
      const bPriority = (b as any).getPriority?.() || 0;
      return bPriority - aPriority;
    });

    this.logger.info('Event handler subscribed', {
      eventType,
      handlerName: handler.getHandlerName()
    });
  }

  /**
   * Unsubscribe from an event type
   */
  unsubscribe(eventType: string, handler: IEventHandler<any>): void {
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
        this.logger.info('Event handler unsubscribed', {
          eventType,
          handlerName: handler.getHandlerName()
        });
      }
    }
  }

  /**
   * Get event history for debugging/audit
   */
  async getEventHistory(aggregateId: string): Promise<DomainEvent[]> {
    return await this.circuitBreaker.execute(
      async () => {
        try {
          const memoryHistory = this.eventHistory.get(aggregateId);
          if (memoryHistory && memoryHistory.length > 0) {
            return memoryHistory;
          }

          const { data, error } = await this.supabaseClient
            .from('domain_events')
            .select('*')
            .eq('aggregate_id', aggregateId)
            .order('occurred_at', { ascending: true });

          if (error) {
            throw new Error(`Loi lay event history: ${error.message}`);
          }

          const events = (data || []).map(eventData => this.deserializeEvent(eventData));
          this.eventHistory.set(aggregateId, events);

          return events;

        } catch (error) {
          this.logger.error('Error getting event history', {
            aggregateId,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          throw error;
        }
      },
      async () => {
        this.logger.warn('Circuit breaker fallback for getEventHistory', { aggregateId });
        return [];
      }
    );
  }

  /**
   * Clear event history (for testing)
   */
  async clearEventHistory(): Promise<void> {
    this.eventHistory.clear();
    this.logger.info('Event history cleared');
  }

  /**
   * Store event in database
   */
  private async storeEvent(event: DomainEvent): Promise<void> {
    return await this.circuitBreaker.execute(
      async () => {
        const eventData = this.serializeEvent(event);

        const { error } = await this.supabaseClient
          .from('domain_events')
          .insert(eventData);

        if (error) {
          throw new Error(`Loi luu event: ${error.message}`);
        }
      },
      async () => {
        this.logger.error('Circuit breaker fallback for storeEvent - event not stored', {
          eventId: event.eventId,
          eventType: event.eventType
        });
        // Don't throw - allow event to be processed in memory even if storage fails
      }
    );
  }

  /**
   * Store multiple events in database
   */
  private async storeEvents(events: DomainEvent[]): Promise<void> {
    return await this.circuitBreaker.execute(
      async () => {
        const eventsData = events.map(event => this.serializeEvent(event));

        const { error } = await this.supabaseClient
          .from('domain_events')
          .insert(eventsData);

        if (error) {
          throw new Error(`Loi luu events: ${error.message}`);
        }
      },
      async () => {
        this.logger.error('Circuit breaker fallback for storeEvents - events not stored', {
          count: events.length
        });
        // Don't throw - allow events to be processed in memory even if storage fails
      }
    );
  }

  /**
   * Add event to in-memory history
   */
  private addToHistory(event: DomainEvent): void {
    const history = this.eventHistory.get(event.aggregateId) || [];
    history.push(event);
    this.eventHistory.set(event.aggregateId, history);

    if (history.length > 1000) {
      this.eventHistory.set(event.aggregateId, history.slice(-1000));
    }
  }

  /**
   * Notify all handlers for an event
   */
  private async notifyHandlers(event: DomainEvent): Promise<void> {
    const handlers = this.handlers.get(event.eventType) || [];

    for (const handler of handlers) {
      try {
        if (handler.canHandle(event)) {
          await handler.handle(event);
        }
      } catch (error) {
        this.logger.error('Error in event handler', {
          handlerName: handler.getHandlerName(),
          eventType: event.eventType,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }

  /**
   * Serialize event for storage
   */
  private serializeEvent(event: DomainEvent): any {
    return {
      event_id: event.eventId,
      event_type: event.eventType,
      aggregate_id: event.aggregateId,
      aggregate_type: event.aggregateType,
      occurred_at: (event as any).timestamp ? new Date((event as any).timestamp).toISOString() : new Date().toISOString(),
      event_data: JSON.stringify(event),
      metadata: event.metadata || {}
    };
  }

  /**
   * Deserialize event from storage
   */
  private deserializeEvent(eventData: any): DomainEvent {
    const parsedData = JSON.parse(eventData.event_data);
    return {
      ...parsedData,
      timestamp: new Date(parsedData.timestamp)
    };
  }
}

