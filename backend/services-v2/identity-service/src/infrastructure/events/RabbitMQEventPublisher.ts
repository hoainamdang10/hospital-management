/**
 * RabbitMQ Event Publisher
 * Publishes domain events to RabbitMQ message broker
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */

import * as amqp from 'amqplib';
import type { Connection, Channel } from 'amqplib';
import { ILogger } from '../../application/services/ILogger';

export interface DomainEvent {
  eventType: string;
  aggregateId: string;
  aggregateType: string;
  occurredAt: Date;
  payload: any;
  metadata?: {
    userId?: string;
    correlationId?: string;
    causationId?: string;
  };
}

export interface IEventPublisher {
  initialize(): Promise<void>;
  publish(event: DomainEvent): Promise<void>;
  publishBatch(events: DomainEvent[]): Promise<void>;
  close(): Promise<void>;
}

export class RabbitMQEventPublisher implements IEventPublisher {
  private connection: Connection | null = null;
  private channel: Channel | null = null;
  private readonly exchangeName = 'hospital.events';
  private isConnected = false;

  constructor(
    private readonly rabbitMQUrl: string,
    private readonly logger: ILogger
  ) {}

  /**
   * Initialize RabbitMQ connection and channel
   */
  async initialize(): Promise<void> {
    try {
      this.logger.info('Connecting to RabbitMQ', {
        url: this.rabbitMQUrl.replace(/\/\/.*@/, '//<credentials>@')
      });

      // Create connection
      this.connection = await amqp.connect(this.rabbitMQUrl);

      // Handle connection errors
      this.connection.on('error', (err) => {
        this.logger.error('RabbitMQ connection error', { error: err.message });
        this.isConnected = false;
      });

      this.connection.on('close', () => {
        this.logger.warn('RabbitMQ connection closed');
        this.isConnected = false;
      });

      // Create channel
      this.channel = await this.connection.createChannel();

      // Declare exchange (topic exchange for routing by event type)
      await this.channel.assertExchange(this.exchangeName, 'topic', {
        durable: true
      });

      this.isConnected = true;
      this.logger.info('RabbitMQ connection established', {
        exchange: this.exchangeName
      });
    } catch (error) {
      this.logger.error('Failed to initialize RabbitMQ', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Publish a single domain event
   */
  async publish(event: DomainEvent): Promise<void> {
    if (!this.isConnected || !this.channel) {
      this.logger.warn('RabbitMQ not connected, skipping event publish', {
        eventType: event.eventType
      });
      return;
    }

    try {
      const routingKey = this.getRoutingKey(event);
      const message = JSON.stringify({
        ...event,
        occurredAt: event.occurredAt.toISOString()
      });

      const published = this.channel.publish(
        this.exchangeName,
        routingKey,
        Buffer.from(message),
        {
          persistent: true,
          contentType: 'application/json',
          timestamp: Date.now(),
          messageId: `${event.aggregateId}-${Date.now()}`,
          type: event.eventType
        }
      );

      if (!published) {
        this.logger.warn('Event publish buffer full, waiting...', {
          eventType: event.eventType
        });
        await new Promise((resolve) => this.channel!.once('drain', resolve));
      }

      this.logger.info('Event published', {
        eventType: event.eventType,
        aggregateId: event.aggregateId,
        routingKey
      });
    } catch (error) {
      this.logger.error('Failed to publish event', {
        eventType: event.eventType,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Publish multiple events in batch
   */
  async publishBatch(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      await this.publish(event);
    }
  }

  /**
   * Close RabbitMQ connection
   */
  async close(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
        this.channel = null;
      }

      if (this.connection) {
        await this.connection.close();
        this.connection = null;
      }

      this.isConnected = false;
      this.logger.info('RabbitMQ connection closed');
    } catch (error) {
      this.logger.error('Error closing RabbitMQ connection', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Get routing key for event
   * Format: {aggregateType}.{eventType}
   * Example: user.registered, user.activated, user.role_changed
   */
  private getRoutingKey(event: DomainEvent): string {
    const aggregateType = event.aggregateType.toLowerCase();
    const eventType = event.eventType
      .replace(/([A-Z])/g, '_$1')
      .toLowerCase()
      .replace(/^_/, '');
    
    return `${aggregateType}.${eventType}`;
  }
}

/**
 * Mock Event Publisher for testing
 */
export class MockEventPublisher implements IEventPublisher {
  private publishedEvents: DomainEvent[] = [];

  constructor(private readonly logger: ILogger) {}

  async initialize(): Promise<void> {
    this.logger.info('Mock Event Publisher initialized');
  }

  async publish(event: DomainEvent): Promise<void> {
    this.publishedEvents.push(event);
    this.logger.info('Mock event published', {
      eventType: event.eventType,
      aggregateId: event.aggregateId
    });
  }

  async publishBatch(events: DomainEvent[]): Promise<void> {
    this.publishedEvents.push(...events);
    this.logger.info('Mock events published', {
      count: events.length
    });
  }

  async close(): Promise<void> {
    this.logger.info('Mock Event Publisher closed');
  }

  getPublishedEvents(): DomainEvent[] {
    return [...this.publishedEvents];
  }

  clearEvents(): void {
    this.publishedEvents = [];
  }
}

