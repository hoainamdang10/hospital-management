/**
 * Event Bus for Inter-Service Communication
 * Hospital Management System V2
 * 
 * Implements publish-subscribe pattern using RabbitMQ
 * Replaces cross-schema foreign keys with event-driven architecture
 */

import { DomainEvent } from '../../domain/base/domain-event';
import { EVENT_TYPE_REGISTRY } from '../../domain/events/domain-events';

export interface EventBusConfig {
  rabbitmqUrl: string;
  exchangeName: string;
  serviceName: string;
}

export interface EventHandler<T extends DomainEvent> {
  handle(event: T): Promise<void>;
}

export interface EventSubscription {
  eventType: string;
  handler: EventHandler<any>;
  queueName?: string;
}

/**
 * Event Bus Interface
 */
export interface IEventBus {
  /**
   * Publish a domain event to the event bus
   */
  publish(event: DomainEvent): Promise<void>;

  /**
   * Subscribe to a specific event type
   */
  subscribe<T extends DomainEvent>(
    eventType: string,
    handler: EventHandler<T>,
    queueName?: string
  ): Promise<void>;

  /**
   * Connect to the event bus
   */
  connect(): Promise<void>;

  /**
   * Disconnect from the event bus
   */
  disconnect(): Promise<void>;
}

/**
 * RabbitMQ Event Bus Implementation
 */
export class RabbitMQEventBus implements IEventBus {
  private connection: any = null;
  private channel: any = null;
  private subscriptions: Map<string, EventSubscription[]> = new Map();

  constructor(private config: EventBusConfig) {}

  async connect(): Promise<void> {
    try {
      // Dynamic import to avoid bundling issues
      const amqp = await import('amqplib');
      
      this.connection = await amqp.connect(this.config.rabbitmqUrl);
      this.channel = await this.connection.createChannel();

      // Declare exchange for domain events
      await this.channel.assertExchange(
        this.config.exchangeName,
        'topic',
        { durable: true }
      );

      console.log(`✅ Event Bus connected: ${this.config.serviceName}`);
    } catch (error) {
      console.error('❌ Failed to connect to Event Bus:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      console.log(`✅ Event Bus disconnected: ${this.config.serviceName}`);
    } catch (error) {
      console.error('❌ Failed to disconnect from Event Bus:', error);
      throw error;
    }
  }

  async publish(event: DomainEvent): Promise<void> {
    if (!this.channel) {
      throw new Error('Event Bus not connected. Call connect() first.');
    }

    try {
      const routingKey = this.getRoutingKey(event.eventType);
      const message = this.serializeEvent(event);

      const published = this.channel.publish(
        this.config.exchangeName,
        routingKey,
        Buffer.from(message),
        {
          persistent: true,
          contentType: 'application/json',
          timestamp: Date.now(),
          messageId: event.eventId,
          headers: {
            eventType: event.eventType,
            aggregateId: event.aggregateId,
            occurredAt: event.occurredAt.toISOString(),
            serviceName: this.config.serviceName,
          },
        }
      );

      if (!published) {
        console.warn(`⚠️ Event not published (buffer full): ${event.eventType}`);
      } else {
        console.log(`📤 Event published: ${event.eventType} (${event.eventId})`);
      }
    } catch (error) {
      console.error(`❌ Failed to publish event: ${event.eventType}`, error);
      throw error;
    }
  }

  async subscribe<T extends DomainEvent>(
    eventType: string,
    handler: EventHandler<T>,
    queueName?: string
  ): Promise<void> {
    if (!this.channel) {
      throw new Error('Event Bus not connected. Call connect() first.');
    }

    try {
      // Generate queue name if not provided
      const queue = queueName || `${this.config.serviceName}.${eventType}`;

      // Assert queue
      await this.channel.assertQueue(queue, {
        durable: true,
        arguments: {
          'x-message-ttl': 86400000, // 24 hours
          'x-max-length': 10000,
        },
      });

      // Bind queue to exchange with routing key
      const routingKey = this.getRoutingKey(eventType);
      await this.channel.bindQueue(queue, this.config.exchangeName, routingKey);

      // Consume messages
      await this.channel.consume(
        queue,
        async (msg: any) => {
          if (!msg) return;

          try {
            const event = this.deserializeEvent(msg.content.toString());
            
            console.log(`📥 Event received: ${event.eventType} (${event.eventId})`);

            // Handle event
            await handler.handle(event as T);

            // Acknowledge message
            this.channel.ack(msg);
            
            console.log(`✅ Event processed: ${event.eventType} (${event.eventId})`);
          } catch (error) {
            console.error(`❌ Failed to process event:`, error);
            
            // Reject and requeue (with limit)
            const retryCount = (msg.properties.headers['x-retry-count'] || 0) + 1;
            
            if (retryCount < 3) {
              // Requeue with retry count
              this.channel.nack(msg, false, true);
            } else {
              // Dead letter after 3 retries
              console.error(`💀 Event moved to dead letter queue after ${retryCount} retries`);
              this.channel.nack(msg, false, false);
            }
          }
        },
        { noAck: false }
      );

      // Store subscription
      const subscriptions = this.subscriptions.get(eventType) || [];
      subscriptions.push({ eventType, handler, queueName: queue });
      this.subscriptions.set(eventType, subscriptions);

      console.log(`✅ Subscribed to event: ${eventType} (queue: ${queue})`);
    } catch (error) {
      console.error(`❌ Failed to subscribe to event: ${eventType}`, error);
      throw error;
    }
  }

  private getRoutingKey(eventType: string): string {
    // Handle special cases for billing service compatibility
    switch (eventType) {
      case 'AppointmentCancelled':
        // Check if it's a late cancellation (would need to be determined from event data)
        // For now, use cancelled_late as it's more specific for billing
        return 'appointment.cancelled_late';
      case 'AppointmentNoShow':
        return 'appointment.no_show';
      default:
        // Convert PascalCase to dot.notation
        // e.g., UserCreated -> user.created
        return eventType
          .replace(/([A-Z])/g, '.$1')
          .toLowerCase()
          .substring(1);
    }
  }

  private serializeEvent(event: DomainEvent): string {
    return JSON.stringify({
      eventId: event.eventId,
      eventType: event.eventType,
      aggregateId: event.aggregateId,
      occurredAt: event.occurredAt.toISOString(),
      payload: event,
    });
  }

  private deserializeEvent(message: string): DomainEvent {
    const data = JSON.parse(message);
    
    // Get event class from registry
    const EventClass = EVENT_TYPE_REGISTRY[data.eventType];
    
    if (!EventClass) {
      throw new Error(`Unknown event type: ${data.eventType}`);
    }

    // Reconstruct event
    const event = Object.assign(
      new EventClass(),
      data.payload
    );

    return event;
  }
}

/**
 * In-Memory Event Bus for Testing
 */
export class InMemoryEventBus implements IEventBus {
  private handlers: Map<string, EventHandler<any>[]> = new Map();
  private publishedEvents: DomainEvent[] = [];

  async connect(): Promise<void> {
    console.log('✅ In-Memory Event Bus connected');
  }

  async disconnect(): Promise<void> {
    this.handlers.clear();
    this.publishedEvents = [];
    console.log('✅ In-Memory Event Bus disconnected');
  }

  async publish(event: DomainEvent): Promise<void> {
    this.publishedEvents.push(event);
    
    const handlers = this.handlers.get(event.eventType) || [];
    
    for (const handler of handlers) {
      try {
        await handler.handle(event);
      } catch (error) {
        console.error(`Failed to handle event: ${event.eventType}`, error);
      }
    }
  }

  async subscribe<T extends DomainEvent>(
    eventType: string,
    handler: EventHandler<T>
  ): Promise<void> {
    const handlers = this.handlers.get(eventType) || [];
    handlers.push(handler);
    this.handlers.set(eventType, handlers);
  }

  // Test helpers
  getPublishedEvents(): DomainEvent[] {
    return [...this.publishedEvents];
  }

  clearPublishedEvents(): void {
    this.publishedEvents = [];
  }
}

/**
 * Event Bus Factory
 */
export class EventBusFactory {
  static create(config: EventBusConfig, useInMemory: boolean = false): IEventBus {
    if (useInMemory || process.env.NODE_ENV === 'test') {
      return new InMemoryEventBus();
    }
    return new RabbitMQEventBus(config);
  }
}

