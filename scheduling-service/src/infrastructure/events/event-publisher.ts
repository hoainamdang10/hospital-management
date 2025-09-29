/**
 * Event Publisher Implementation - Infrastructure Layer
 * Event publishing infrastructure with RabbitMQ and in-memory implementations
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Event-Driven Architecture, Inter-Service Communication, Healthcare Integration
 */

import { IEventPublisher } from '../../../shared/domain/events/event-publisher.interface';
import { DomainEvent } from '../../../shared/domain/events/domain-event';
import { ILogger } from '../../../shared/infrastructure/logging/logger.interface';

export interface EventPublisherConfig {
  type: 'rabbitmq' | 'in-memory' | 'hybrid';
  rabbitmq?: {
    connectionUrl: string;
    exchange: string;
    exchangeType: string;
    durable: boolean;
    autoDelete: boolean;
  };
  inMemory?: {
    maxEvents: number;
    retentionTime: number; // milliseconds
  };
  retryConfig?: {
    maxRetries: number;
    baseDelay: number;
    maxDelay: number;
  };
}

export interface EventSubscriber {
  eventType: string;
  handler: (event: DomainEvent<any>) => Promise<void>;
}

/**
 * RabbitMQ Event Publisher
 * Publishes events to RabbitMQ for inter-service communication
 */
export class RabbitMQEventPublisher implements IEventPublisher {
  private connection: any = null;
  private channel: any = null;
  private readonly config: EventPublisherConfig;
  private readonly logger: ILogger;
  private isConnected: boolean = false;

  constructor(config: EventPublisherConfig, logger: ILogger) {
    this.config = config;
    this.logger = logger;
  }

  async initialize(): Promise<void> {
    try {
      // Note: In real implementation, would use amqplib
      // const amqp = require('amqplib');
      // this.connection = await amqp.connect(this.config.rabbitmq!.connectionUrl);
      // this.channel = await this.connection.createChannel();

      // Mock implementation for demonstration
      this.isConnected = true;

      this.logger.info('RabbitMQ Event Publisher initialized', {
        exchange: this.config.rabbitmq?.exchange,
        exchangeType: this.config.rabbitmq?.exchangeType
      });

    } catch (error) {
      this.logger.error('Failed to initialize RabbitMQ Event Publisher', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  async publish<T>(event: DomainEvent<T>): Promise<void> {
    if (!this.isConnected) {
      throw new Error('RabbitMQ Event Publisher not initialized');
    }

    try {
      const routingKey = this.getRoutingKey(event);
      const message = this.serializeEvent(event);

      this.logger.info('Publishing event to RabbitMQ', {
        eventType: event.eventType,
        eventId: event.eventId,
        routingKey,
        timestamp: event.timestamp
      });

      // Mock RabbitMQ publish
      // await this.channel.publish(
      //   this.config.rabbitmq!.exchange,
      //   routingKey,
      //   Buffer.from(message),
      //   {
      //     persistent: true,
      //     messageId: event.eventId,
      //     timestamp: event.timestamp.getTime(),
      //     type: event.eventType,
      //     headers: {
      //       'x-service-name': 'scheduling-service',
      //       'x-event-version': '2.0.0',
      //       'x-correlation-id': event.correlationId
      //     }
      //   }
      // );

      // Simulate successful publish
      await this.simulatePublish(event, routingKey, message);

      this.logger.info('Event published successfully to RabbitMQ', {
        eventType: event.eventType,
        eventId: event.eventId,
        routingKey
      });

    } catch (error) {
      this.logger.error('Failed to publish event to RabbitMQ', {
        eventType: event.eventType,
        eventId: event.eventId,
        error: error.message,
        stack: error.stack
      });

      throw error;
    }
  }

  async publishBatch<T>(events: DomainEvent<T>[]): Promise<void> {
    if (!this.isConnected) {
      throw new Error('RabbitMQ Event Publisher not initialized');
    }

    try {
      this.logger.info('Publishing batch of events to RabbitMQ', {
        eventCount: events.length
      });

      for (const event of events) {
        await this.publish(event);
      }

      this.logger.info('Batch of events published successfully to RabbitMQ', {
        eventCount: events.length
      });

    } catch (error) {
      this.logger.error('Failed to publish batch of events to RabbitMQ', {
        eventCount: events.length,
        error: error.message
      });

      throw error;
    }
  }

  async close(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      this.isConnected = false;

      this.logger.info('RabbitMQ Event Publisher closed');

    } catch (error) {
      this.logger.error('Error closing RabbitMQ Event Publisher', {
        error: error.message
      });
    }
  }

  private getRoutingKey<T>(event: DomainEvent<T>): string {
    // Create routing key based on event type and domain
    const parts = event.eventType.split('.');
    if (parts.length >= 2) {
      return `${parts[0]}.${parts[1]}`; // e.g., "appointment.scheduled"
    }
    return event.eventType;
  }

  private serializeEvent<T>(event: DomainEvent<T>): string {
    return JSON.stringify({
      eventId: event.eventId,
      eventType: event.eventType,
      aggregateId: event.aggregateId,
      aggregateType: event.aggregateType,
      data: event.data,
      timestamp: event.timestamp.toISOString(),
      version: event.version,
      correlationId: event.correlationId,
      causationId: event.causationId,
      metadata: event.metadata
    });
  }

  private async simulatePublish<T>(event: DomainEvent<T>, routingKey: string, message: string): Promise<void> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100));

    // Simulate occasional failures for testing
    if (Math.random() < 0.05) { // 5% failure rate
      throw new Error('Simulated RabbitMQ publish failure');
    }

    this.logger.debug('Simulated RabbitMQ publish', {
      eventType: event.eventType,
      routingKey,
      messageSize: message.length
    });
  }
}

/**
 * In-Memory Event Publisher
 * Publishes events to in-memory subscribers for testing and development
 */
export class InMemoryEventPublisher implements IEventPublisher {
  private readonly subscribers: Map<string, EventSubscriber[]> = new Map();
  private readonly eventHistory: DomainEvent<any>[] = [];
  private readonly config: EventPublisherConfig;
  private readonly logger: ILogger;

  constructor(config: EventPublisherConfig, logger: ILogger) {
    this.config = config;
    this.logger = logger;
  }

  async initialize(): Promise<void> {
    this.logger.info('In-Memory Event Publisher initialized', {
      maxEvents: this.config.inMemory?.maxEvents,
      retentionTime: this.config.inMemory?.retentionTime
    });

    // Start cleanup timer
    if (this.config.inMemory?.retentionTime) {
      setInterval(() => {
        this.cleanupOldEvents();
      }, this.config.inMemory.retentionTime / 10);
    }
  }

  async publish<T>(event: DomainEvent<T>): Promise<void> {
    try {
      this.logger.info('Publishing event in-memory', {
        eventType: event.eventType,
        eventId: event.eventId,
        subscriberCount: this.subscribers.get(event.eventType)?.length || 0
      });

      // Add to history
      this.eventHistory.push(event);
      this.trimEventHistory();

      // Notify subscribers
      const subscribers = this.subscribers.get(event.eventType) || [];
      const promises = subscribers.map(subscriber => 
        this.notifySubscriber(subscriber, event)
      );

      await Promise.allSettled(promises);

      this.logger.info('Event published successfully in-memory', {
        eventType: event.eventType,
        eventId: event.eventId,
        notifiedSubscribers: subscribers.length
      });

    } catch (error) {
      this.logger.error('Failed to publish event in-memory', {
        eventType: event.eventType,
        eventId: event.eventId,
        error: error.message
      });

      throw error;
    }
  }

  async publishBatch<T>(events: DomainEvent<T>[]): Promise<void> {
    try {
      this.logger.info('Publishing batch of events in-memory', {
        eventCount: events.length
      });

      for (const event of events) {
        await this.publish(event);
      }

      this.logger.info('Batch of events published successfully in-memory', {
        eventCount: events.length
      });

    } catch (error) {
      this.logger.error('Failed to publish batch of events in-memory', {
        eventCount: events.length,
        error: error.message
      });

      throw error;
    }
  }

  subscribe(subscriber: EventSubscriber): void {
    if (!this.subscribers.has(subscriber.eventType)) {
      this.subscribers.set(subscriber.eventType, []);
    }

    this.subscribers.get(subscriber.eventType)!.push(subscriber);

    this.logger.info('Event subscriber registered', {
      eventType: subscriber.eventType,
      totalSubscribers: this.subscribers.get(subscriber.eventType)!.length
    });
  }

  unsubscribe(eventType: string, handler: (event: DomainEvent<any>) => Promise<void>): void {
    const subscribers = this.subscribers.get(eventType);
    if (subscribers) {
      const index = subscribers.findIndex(sub => sub.handler === handler);
      if (index >= 0) {
        subscribers.splice(index, 1);
        this.logger.info('Event subscriber unregistered', {
          eventType,
          remainingSubscribers: subscribers.length
        });
      }
    }
  }

  getEventHistory(): DomainEvent<any>[] {
    return [...this.eventHistory];
  }

  getSubscriberCount(eventType: string): number {
    return this.subscribers.get(eventType)?.length || 0;
  }

  clearEventHistory(): void {
    this.eventHistory.length = 0;
    this.logger.info('Event history cleared');
  }

  private async notifySubscriber<T>(subscriber: EventSubscriber, event: DomainEvent<T>): Promise<void> {
    try {
      await subscriber.handler(event);
      
      this.logger.debug('Subscriber notified successfully', {
        eventType: event.eventType,
        eventId: event.eventId
      });

    } catch (error) {
      this.logger.error('Error notifying subscriber', {
        eventType: event.eventType,
        eventId: event.eventId,
        error: error.message
      });

      // Don't throw error to prevent other subscribers from failing
    }
  }

  private trimEventHistory(): void {
    const maxEvents = this.config.inMemory?.maxEvents || 1000;
    if (this.eventHistory.length > maxEvents) {
      const excess = this.eventHistory.length - maxEvents;
      this.eventHistory.splice(0, excess);
    }
  }

  private cleanupOldEvents(): void {
    if (!this.config.inMemory?.retentionTime) return;

    const cutoffTime = new Date(Date.now() - this.config.inMemory.retentionTime);
    const originalLength = this.eventHistory.length;

    for (let i = this.eventHistory.length - 1; i >= 0; i--) {
      if (this.eventHistory[i].timestamp < cutoffTime) {
        this.eventHistory.splice(i, 1);
      }
    }

    const removedCount = originalLength - this.eventHistory.length;
    if (removedCount > 0) {
      this.logger.debug('Cleaned up old events', {
        removedCount,
        remainingCount: this.eventHistory.length
      });
    }
  }
}

/**
 * Hybrid Event Publisher
 * Combines RabbitMQ and in-memory publishing for flexibility
 */
export class HybridEventPublisher implements IEventPublisher {
  private readonly rabbitMQPublisher: RabbitMQEventPublisher;
  private readonly inMemoryPublisher: InMemoryEventPublisher;
  private readonly logger: ILogger;

  constructor(config: EventPublisherConfig, logger: ILogger) {
    this.rabbitMQPublisher = new RabbitMQEventPublisher(config, logger);
    this.inMemoryPublisher = new InMemoryEventPublisher(config, logger);
    this.logger = logger;
  }

  async initialize(): Promise<void> {
    try {
      await this.rabbitMQPublisher.initialize();
      await this.inMemoryPublisher.initialize();

      this.logger.info('Hybrid Event Publisher initialized');

    } catch (error) {
      this.logger.warn('RabbitMQ initialization failed, falling back to in-memory only', {
        error: error.message
      });

      // Continue with in-memory only
      await this.inMemoryPublisher.initialize();
    }
  }

  async publish<T>(event: DomainEvent<T>): Promise<void> {
    const promises: Promise<void>[] = [];

    // Always publish to in-memory for local subscribers
    promises.push(this.inMemoryPublisher.publish(event));

    // Try to publish to RabbitMQ for inter-service communication
    try {
      promises.push(this.rabbitMQPublisher.publish(event));
    } catch (error) {
      this.logger.warn('RabbitMQ publish failed, continuing with in-memory only', {
        eventType: event.eventType,
        eventId: event.eventId,
        error: error.message
      });
    }

    await Promise.allSettled(promises);
  }

  async publishBatch<T>(events: DomainEvent<T>[]): Promise<void> {
    const promises: Promise<void>[] = [];

    // Always publish to in-memory
    promises.push(this.inMemoryPublisher.publishBatch(events));

    // Try to publish to RabbitMQ
    try {
      promises.push(this.rabbitMQPublisher.publishBatch(events));
    } catch (error) {
      this.logger.warn('RabbitMQ batch publish failed, continuing with in-memory only', {
        eventCount: events.length,
        error: error.message
      });
    }

    await Promise.allSettled(promises);
  }

  // Delegate in-memory specific methods
  subscribe(subscriber: EventSubscriber): void {
    this.inMemoryPublisher.subscribe(subscriber);
  }

  unsubscribe(eventType: string, handler: (event: DomainEvent<any>) => Promise<void>): void {
    this.inMemoryPublisher.unsubscribe(eventType, handler);
  }

  getEventHistory(): DomainEvent<any>[] {
    return this.inMemoryPublisher.getEventHistory();
  }

  getSubscriberCount(eventType: string): number {
    return this.inMemoryPublisher.getSubscriberCount(eventType);
  }

  clearEventHistory(): void {
    this.inMemoryPublisher.clearEventHistory();
  }

  async close(): Promise<void> {
    await Promise.allSettled([
      this.rabbitMQPublisher.close(),
      // In-memory publisher doesn't need closing
    ]);

    this.logger.info('Hybrid Event Publisher closed');
  }
}

/**
 * Event Publisher Factory
 * Creates appropriate event publisher based on configuration
 */
export class EventPublisherFactory {
  static create(config: EventPublisherConfig, logger: ILogger): IEventPublisher {
    switch (config.type) {
      case 'rabbitmq':
        return new RabbitMQEventPublisher(config, logger);
      
      case 'in-memory':
        return new InMemoryEventPublisher(config, logger);
      
      case 'hybrid':
        return new HybridEventPublisher(config, logger);
      
      default:
        throw new Error(`Unsupported event publisher type: ${config.type}`);
    }
  }
}
