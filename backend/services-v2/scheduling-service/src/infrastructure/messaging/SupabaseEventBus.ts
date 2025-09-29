/**
 * Supabase Event Bus - Infrastructure Layer
 * V2 Clean Architecture + DDD + Event-Driven Implementation
 * Implements event publishing and handling with Supabase
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture
 */

import { OptimizedSupabaseClient } from '../../../shared/infrastructure/database/optimized-supabase-client';
import { IEventBus, IEventHandler } from '../../application/interfaces/IEventBus';
import { DomainEvent } from '../../../shared/domain/base/domain-event';

/**
 * Supabase Event Bus
 * Implements event publishing and subscription using Supabase as event store
 */
export class SupabaseEventBus implements IEventBus {
  private handlers: Map<string, IEventHandler<any>[]> = new Map();
  private eventHistory: Map<string, DomainEvent[]> = new Map();

  constructor(private readonly client: OptimizedSupabaseClient) {}

  /**
   * Publish a domain event
   */
  async publish(event: DomainEvent): Promise<void> {
    try {
      // Store event in database
      await this.storeEvent(event);

      // Add to in-memory history
      this.addToHistory(event);

      // Notify handlers
      await this.notifyHandlers(event);

    } catch (error) {
      throw new Error(`Lỗi publish event: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Publish multiple domain events
   */
  async publishAll(events: DomainEvent[]): Promise<void> {
    try {
      // Store all events in database (batch operation)
      await this.storeEvents(events);

      // Add to in-memory history
      events.forEach(event => this.addToHistory(event));

      // Notify handlers for each event
      for (const event of events) {
        await this.notifyHandlers(event);
      }

    } catch (error) {
      throw new Error(`Lỗi publish events: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Subscribe to an event type
   */
  subscribe<T extends DomainEvent>(
    eventType: string,
    handler: IEventHandler<T>
  ): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }

    const handlers = this.handlers.get(eventType)!;
    handlers.push(handler);

    // Sort by priority if handler has priority
    handlers.sort((a, b) => {
      const aPriority = (a as any).getPriority?.() || 0;
      const bPriority = (b as any).getPriority?.() || 0;
      return bPriority - aPriority; // Higher priority first
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
      }
    }
  }

  /**
   * Get event history for debugging/audit
   */
  async getEventHistory(aggregateId: string): Promise<DomainEvent[]> {
    try {
      // Try in-memory first
      const memoryHistory = this.eventHistory.get(aggregateId);
      if (memoryHistory && memoryHistory.length > 0) {
        return memoryHistory;
      }

      // Fallback to database
      const { data, error } = await this.client.query()
        .from('domain_events')
        .select('*')
        .eq('aggregate_id', aggregateId)
        .order('occurred_at', { ascending: true });

      if (error) {
        throw new Error(`Lỗi lấy event history: ${error.message}`);
      }

      const events = (data || []).map(eventData => this.deserializeEvent(eventData));
      
      // Cache in memory
      this.eventHistory.set(aggregateId, events);
      
      return events;

    } catch (error) {
      throw new Error(`Lỗi get event history: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Clear event history (for testing)
   */
  async clearEventHistory(): Promise<void> {
    this.eventHistory.clear();
    
    // Optionally clear database (be careful in production)
    if (process.env.NODE_ENV === 'test') {
      await this.client.query()
        .from('domain_events')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    }
  }

  /**
   * Store single event in database
   */
  private async storeEvent(event: DomainEvent): Promise<void> {
    const eventData = {
      id: event.eventId,
      aggregate_id: event.aggregateId,
      aggregate_type: event.aggregateType,
      event_type: event.eventType,
      event_data: JSON.stringify(event),
      occurred_at: event.occurredAt.toISOString(),
      version: event.version,
      created_at: new Date().toISOString()
    };

    const { error } = await this.client.query()
      .from('domain_events')
      .insert(eventData);

    if (error) {
      throw new Error(`Lỗi store event: ${error.message}`);
    }
  }

  /**
   * Store multiple events in database (batch operation)
   */
  private async storeEvents(events: DomainEvent[]): Promise<void> {
    if (events.length === 0) return;

    const eventsData = events.map(event => ({
      id: event.eventId,
      aggregate_id: event.aggregateId,
      aggregate_type: event.aggregateType,
      event_type: event.eventType,
      event_data: JSON.stringify(event),
      occurred_at: event.occurredAt.toISOString(),
      version: event.version,
      created_at: new Date().toISOString()
    }));

    const { error } = await this.client.query()
      .from('domain_events')
      .insert(eventsData);

    if (error) {
      throw new Error(`Lỗi store events: ${error.message}`);
    }
  }

  /**
   * Add event to in-memory history
   */
  private addToHistory(event: DomainEvent): void {
    const aggregateId = event.aggregateId;
    
    if (!this.eventHistory.has(aggregateId)) {
      this.eventHistory.set(aggregateId, []);
    }

    const history = this.eventHistory.get(aggregateId)!;
    history.push(event);

    // Keep only last 100 events per aggregate in memory
    if (history.length > 100) {
      history.shift();
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
        // Log error but don't fail the entire event publishing
        console.error(`Error in event handler ${handler.getHandlerName()}:`, error);
        
        // In production, you might want to:
        // 1. Send to dead letter queue
        // 2. Retry with exponential backoff
        // 3. Alert monitoring systems
      }
    }
  }

  /**
   * Deserialize event from database format
   */
  private deserializeEvent(eventData: any): DomainEvent {
    try {
      const parsedData = JSON.parse(eventData.event_data);
      
      // Reconstruct the domain event
      // This is a simplified version - in production you'd have proper event factories
      return {
        eventId: eventData.id,
        aggregateId: eventData.aggregate_id,
        aggregateType: eventData.aggregate_type,
        eventType: eventData.event_type,
        occurredAt: new Date(eventData.occurred_at),
        version: eventData.version,
        ...parsedData
      } as DomainEvent;

    } catch (error) {
      throw new Error(`Lỗi deserialize event: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get event bus statistics
   */
  async getStatistics(): Promise<{
    totalEvents: number;
    eventsByType: { [eventType: string]: number };
    handlersByEventType: { [eventType: string]: string[] };
  }> {
    try {
      // Get total events from database
      const { count, error } = await this.client.query()
        .from('domain_events')
        .select('*', { count: 'exact', head: true });

      if (error) {
        throw new Error(`Lỗi get statistics: ${error.message}`);
      }

      // Get events by type
      const { data: eventTypeData, error: eventTypeError } = await this.client.query()
        .from('domain_events')
        .select('event_type')
        .order('event_type');

      if (eventTypeError) {
        throw new Error(`Lỗi get event types: ${eventTypeError.message}`);
      }

      const eventsByType: { [eventType: string]: number } = {};
      (eventTypeData || []).forEach(item => {
        eventsByType[item.event_type] = (eventsByType[item.event_type] || 0) + 1;
      });

      // Get handlers by event type
      const handlersByEventType: { [eventType: string]: string[] } = {};
      this.handlers.forEach((handlers, eventType) => {
        handlersByEventType[eventType] = handlers.map(h => h.getHandlerName());
      });

      return {
        totalEvents: count || 0,
        eventsByType,
        handlersByEventType
      };

    } catch (error) {
      throw new Error(`Lỗi get statistics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
