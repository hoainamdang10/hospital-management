/**
 * BillingEventPublisher - Infrastructure Layer
 * Infrastructure implementation of domain event publisher for billing service
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Event-Driven Architecture, RabbitMQ Integration
 */

import { IDomainEvent } from '../../../../shared/domain/events/IDomainEvent';
import { IDomainEventPublisher } from '../../../../shared/domain/events/IDomainEventPublisher';

export interface EventPublisherConfig {
  rabbitmqUrl: string;
  exchangeName: string;
  routingKeyPrefix: string;
  retryAttempts: number;
  retryDelay: number;
  enableDeadLetterQueue: boolean;
  eventStore?: {
    enabled: boolean;
    tableName: string;
  };
}

export interface PublishedEvent {
  eventId: string;
  eventName: string;
  aggregateId: string;
  aggregateType: string;
  eventVersion: number;
  eventData: any;
  occurredAt: string;
  publishedAt: string;
  routingKey: string;
  correlationId?: string;
  causationId?: string;
}

/**
 * BillingEventPublisher
 * Infrastructure implementation for publishing billing domain events
 */
export class BillingEventPublisher implements IDomainEventPublisher {
  private readonly config: EventPublisherConfig;
  private connection: any; // RabbitMQ connection
  private channel: any; // RabbitMQ channel
  private isConnected: boolean = false;
  private eventStore: Map<string, PublishedEvent> = new Map();

  constructor(config: EventPublisherConfig) {
    this.config = config;
  }

  /**
   * Initialize connection to message broker
   */
  async initialize(): Promise<void> {
    try {
      // In a real implementation, this would connect to RabbitMQ
      // For now, we'll simulate the connection
      console.log('Initializing BillingEventPublisher...');
      
      // Simulate RabbitMQ connection
      await this.connectToRabbitMQ();
      await this.setupExchangeAndQueues();
      
      this.isConnected = true;
      console.log('BillingEventPublisher initialized successfully');

    } catch (error) {
      console.error('Failed to initialize BillingEventPublisher:', error);
      throw error;
    }
  }

  /**
   * Publish domain event
   */
  async publish(event: IDomainEvent): Promise<void> {
    try {
      if (!this.isConnected) {
        await this.initialize();
      }

      // Create published event
      const publishedEvent = this.createPublishedEvent(event);

      // Store event if event store is enabled
      if (this.config.eventStore?.enabled) {
        await this.storeEvent(publishedEvent);
      }

      // Publish to message broker
      await this.publishToMessageBroker(publishedEvent);

      // Log successful publication
      console.log(`Published event: ${event.getEventName()} for aggregate: ${event.getAggregateType()}/${event.aggregateId}`);

    } catch (error) {
      console.error('Failed to publish event:', error);
      
      // Implement retry logic
      await this.retryPublish(event, 1);
    }
  }

  /**
   * Publish multiple events in batch
   */
  async publishBatch(events: IDomainEvent[]): Promise<void> {
    try {
      if (!this.isConnected) {
        await this.initialize();
      }

      const publishedEvents = events.map(event => this.createPublishedEvent(event));

      // Store events if event store is enabled
      if (this.config.eventStore?.enabled) {
        await Promise.all(publishedEvents.map(event => this.storeEvent(event)));
      }

      // Publish all events
      await Promise.all(publishedEvents.map(event => this.publishToMessageBroker(event)));

      console.log(`Published batch of ${events.length} events`);

    } catch (error) {
      console.error('Failed to publish event batch:', error);
      throw error;
    }
  }

  /**
   * Get published events for aggregate
   */
  async getEventsForAggregate(aggregateId: string): Promise<PublishedEvent[]> {
    const events: PublishedEvent[] = [];
    
    for (const [eventId, event] of this.eventStore) {
      if (event.aggregateId === aggregateId) {
        events.push(event);
      }
    }

    return events.sort((a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime());
  }

  /**
   * Get events by type
   */
  async getEventsByType(eventName: string): Promise<PublishedEvent[]> {
    const events: PublishedEvent[] = [];
    
    for (const [eventId, event] of this.eventStore) {
      if (event.eventName === eventName) {
        events.push(event);
      }
    }

    return events.sort((a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime());
  }

  /**
   * Get events in date range
   */
  async getEventsInDateRange(startDate: Date, endDate: Date): Promise<PublishedEvent[]> {
    const events: PublishedEvent[] = [];
    
    for (const [eventId, event] of this.eventStore) {
      const eventDate = new Date(event.occurredAt);
      if (eventDate >= startDate && eventDate <= endDate) {
        events.push(event);
      }
    }

    return events.sort((a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime());
  }

  /**
   * Close connection
   */
  async close(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      
      if (this.connection) {
        await this.connection.close();
      }

      this.isConnected = false;
      console.log('BillingEventPublisher connection closed');

    } catch (error) {
      console.error('Error closing BillingEventPublisher connection:', error);
    }
  }

  /**
   * Connect to RabbitMQ
   */
  private async connectToRabbitMQ(): Promise<void> {
    // In a real implementation, this would use amqplib
    // const amqp = require('amqplib');
    // this.connection = await amqp.connect(this.config.rabbitmqUrl);
    // this.channel = await this.connection.createChannel();
    
    // For now, simulate connection
    console.log(`Connecting to RabbitMQ at ${this.config.rabbitmqUrl}`);
    this.connection = { isConnected: true };
    this.channel = { isReady: true };
  }

  /**
   * Setup exchange and queues
   */
  private async setupExchangeAndQueues(): Promise<void> {
    // In a real implementation, this would setup RabbitMQ topology
    // await this.channel.assertExchange(this.config.exchangeName, 'topic', { durable: true });
    
    // Setup dead letter queue if enabled
    if (this.config.enableDeadLetterQueue) {
      // await this.channel.assertQueue(`${this.config.exchangeName}.dlq`, { durable: true });
    }

    console.log(`Setup exchange: ${this.config.exchangeName}`);
  }

  /**
   * Create published event from domain event
   */
  private createPublishedEvent(event: IDomainEvent): PublishedEvent {
    const routingKey = `${this.config.routingKeyPrefix}.${event.getAggregateType().toLowerCase()}.${event.getEventName().toLowerCase()}`;
    
    return {
      eventId: event.eventId,
      eventName: event.getEventName(),
      aggregateId: event.aggregateId,
      aggregateType: event.getAggregateType(),
      eventVersion: event.eventVersion,
      eventData: event.getEventData(),
      occurredAt: event.occurredAt.toISOString(),
      publishedAt: new Date().toISOString(),
      routingKey,
      correlationId: this.generateCorrelationId(),
      causationId: event.eventId
    };
  }

  /**
   * Store event in event store
   */
  private async storeEvent(event: PublishedEvent): Promise<void> {
    // In a real implementation, this would store in database
    // For now, store in memory
    this.eventStore.set(event.eventId, event);
    
    console.log(`Stored event ${event.eventId} in event store`);
  }

  /**
   * Publish event to message broker
   */
  private async publishToMessageBroker(event: PublishedEvent): Promise<void> {
    // In a real implementation, this would publish to RabbitMQ
    // const message = Buffer.from(JSON.stringify(event));
    // const options = {
    //   persistent: true,
    //   correlationId: event.correlationId,
    //   timestamp: Date.now(),
    //   headers: {
    //     eventName: event.eventName,
    //     aggregateType: event.aggregateType,
    //     eventVersion: event.eventVersion
    //   }
    // };
    
    // await this.channel.publish(
    //   this.config.exchangeName,
    //   event.routingKey,
    //   message,
    //   options
    // );

    // For now, simulate publishing
    console.log(`Publishing event to ${event.routingKey}:`, {
      eventId: event.eventId,
      eventName: event.eventName,
      aggregateId: event.aggregateId,
      aggregateType: event.aggregateType
    });
  }

  /**
   * Retry publishing event
   */
  private async retryPublish(event: IDomainEvent, attempt: number): Promise<void> {
    if (attempt > this.config.retryAttempts) {
      console.error(`Failed to publish event after ${this.config.retryAttempts} attempts:`, event.getEventName());
      
      // Send to dead letter queue if enabled
      if (this.config.enableDeadLetterQueue) {
        await this.sendToDeadLetterQueue(event, `Max retry attempts exceeded: ${attempt - 1}`);
      }
      
      throw new Error(`Failed to publish event after ${this.config.retryAttempts} attempts`);
    }

    console.log(`Retrying event publication (attempt ${attempt}/${this.config.retryAttempts}):`, event.getEventName());
    
    // Wait before retry
    await this.delay(this.config.retryDelay * attempt);

    try {
      await this.publish(event);
    } catch (error) {
      await this.retryPublish(event, attempt + 1);
    }
  }

  /**
   * Send event to dead letter queue
   */
  private async sendToDeadLetterQueue(event: IDomainEvent, reason: string): Promise<void> {
    const dlqEvent = {
      ...this.createPublishedEvent(event),
      failureReason: reason,
      failedAt: new Date().toISOString()
    };

    // In a real implementation, this would send to DLQ
    console.log(`Sending event to dead letter queue:`, {
      eventId: dlqEvent.eventId,
      reason: reason
    });
  }

  /**
   * Generate correlation ID
   */
  private generateCorrelationId(): string {
    return `billing-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{
    isHealthy: boolean;
    connectionStatus: string;
    lastEventPublished?: string;
    eventStoreSize: number;
  }> {
    return {
      isHealthy: this.isConnected,
      connectionStatus: this.isConnected ? 'connected' : 'disconnected',
      lastEventPublished: this.getLastEventPublished(),
      eventStoreSize: this.eventStore.size
    };
  }

  /**
   * Get last event published timestamp
   */
  private getLastEventPublished(): string | undefined {
    let lastEvent: PublishedEvent | undefined;
    
    for (const event of this.eventStore.values()) {
      if (!lastEvent || new Date(event.publishedAt) > new Date(lastEvent.publishedAt)) {
        lastEvent = event;
      }
    }

    return lastEvent?.publishedAt;
  }

  /**
   * Get event statistics
   */
  async getEventStatistics(): Promise<{
    totalEvents: number;
    eventsByType: Record<string, number>;
    eventsByAggregate: Record<string, number>;
    eventsToday: number;
    eventsThisWeek: number;
    eventsThisMonth: number;
  }> {
    const stats = {
      totalEvents: this.eventStore.size,
      eventsByType: {} as Record<string, number>,
      eventsByAggregate: {} as Record<string, number>,
      eventsToday: 0,
      eventsThisWeek: 0,
      eventsThisMonth: 0
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    for (const event of this.eventStore.values()) {
      // Count by type
      stats.eventsByType[event.eventName] = (stats.eventsByType[event.eventName] || 0) + 1;
      
      // Count by aggregate
      stats.eventsByAggregate[event.aggregateType] = (stats.eventsByAggregate[event.aggregateType] || 0) + 1;
      
      // Count by time period
      const eventDate = new Date(event.occurredAt);
      if (eventDate >= today) {
        stats.eventsToday++;
      }
      if (eventDate >= weekAgo) {
        stats.eventsThisWeek++;
      }
      if (eventDate >= monthAgo) {
        stats.eventsThisMonth++;
      }
    }

    return stats;
  }
}
