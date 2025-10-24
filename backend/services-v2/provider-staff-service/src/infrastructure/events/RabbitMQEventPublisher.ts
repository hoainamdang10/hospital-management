/**
 * RabbitMQ Event Publisher
 * Publishes domain events to RabbitMQ for inter-service communication
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Event-Driven Architecture, Clean Architecture
 */

import amqp, { Channel, Connection } from 'amqplib';
import { ILogger } from '../../application/interfaces/ILogger';

export interface RabbitMQConfig {
  url: string;
  exchange: string;
  exchangeType: 'topic' | 'direct' | 'fanout';
  durable: boolean;
  autoDelete: boolean;
}

export interface PublisherConfig {
  enableRetry: boolean;
  maxRetries: number;
  retryDelayMs: number;
  enableLogging: boolean;
}

export interface IntegrationEvent {
  eventId: string;
  eventType: string;
  aggregateId: string;
  aggregateType: string;
  occurredAt: Date;
  serviceName: string;
  eventData: any;
  metadata?: {
    priority?: 'low' | 'normal' | 'high' | 'critical';
    complianceLevel?: 'hipaa' | 'gdpr' | 'vietnamese-healthcare';
    containsPHI?: boolean;
    eventCategory?: string;
    eventSubcategory?: string;
    vietnameseDescription?: string;
  };
}

/**
 * RabbitMQ Event Publisher
 */
export class RabbitMQEventPublisher {
  private connection: Connection | null = null;
  private channel: Channel | null = null;
  private isConnected: boolean = false;
  private intentionallyClosed: boolean = false;

  constructor(
    private readonly config: RabbitMQConfig,
    private readonly publisherConfig: PublisherConfig,
    private readonly logger: ILogger
  ) {}

  /**
   * Initialize connection to RabbitMQ
   */
  async connect(): Promise<void> {
    if (this.isConnected && this.channel) {
      this.logger.warn('RabbitMQ connection already established, skipping reconnect attempt');
      return;
    }

    try {
      this.logger.info('Connecting to RabbitMQ...', {
        url: this.config.url.replace(/\/\/.*@/, '//***@'), // Hide credentials
        exchange: this.config.exchange
      });

      // Reset intentionally closed flag
      this.intentionallyClosed = false;

      // Create connection
      this.connection = await amqp.connect(this.config.url) as any;

      // Handle connection errors
      (this.connection as any).on('error', (err: Error) => {
        this.logger.error('RabbitMQ connection error', { error: err.message });
        this.isConnected = false;
      });

      // Handle connection close
      (this.connection as any).on('close', () => {
        this.logger.warn('RabbitMQ connection closed');
        this.isConnected = false;

        // Auto-reconnect if not intentionally closed
        if (!this.intentionallyClosed) {
          this.logger.info('Attempting to reconnect to RabbitMQ...');
          setTimeout(() => this.connect(), 5000);
        }
      });

      // Create channel
      this.channel = await (this.connection as any).createChannel();

      // Declare exchange
      await this.channel!.assertExchange(
        this.config.exchange,
        this.config.exchangeType,
        {
          durable: this.config.durable,
          autoDelete: this.config.autoDelete
        }
      );

      this.isConnected = true;
      this.logger.info('Connected to RabbitMQ successfully', {
        exchange: this.config.exchange,
        exchangeType: this.config.exchangeType
      });

    } catch (error) {
      this.logger.error('Failed to connect to RabbitMQ', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      // Retry connection after delay
      if (!this.intentionallyClosed) {
        setTimeout(() => this.connect(), 5000);
      }
      
      throw error;
    }
  }

  /**
   * Publish a single event
   */
  async publish(event: IntegrationEvent): Promise<void> {
    if (!this.isConnected || !this.channel) {
      const error = new Error('Not connected to RabbitMQ');
      this.logger.error('Cannot publish event: RabbitMQ not connected', {
        eventType: event.eventType
      });
      throw error;
    }

    try {
      await this.attemptPublish(event);
    } catch (error) {
      this.logger.error('Failed to publish event', {
        eventType: event.eventType,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      // Retry if enabled
      if (this.publisherConfig.enableRetry) {
        await this.retryPublish(event, 1);
      } else {
        throw error;
      }
    }
  }

  /**
   * Publish multiple events
   */
  async publishAll(events: IntegrationEvent[]): Promise<void> {
    for (const event of events) {
      await this.publish(event);
    }
  }

  /**
   * Retry publishing event
   */
  private async retryPublish(event: IntegrationEvent, attempt: number): Promise<void> {
    if (attempt > this.publisherConfig.maxRetries) {
      this.logger.error('Max retries exceeded for event', {
        eventType: event.eventType,
        eventId: event.eventId,
        attempts: attempt - 1
      });
      throw new Error(`Failed to publish event after ${this.publisherConfig.maxRetries} attempts`);
    }

    this.logger.warn('Retrying event publish', {
      eventType: event.eventType,
      attempt,
      maxRetries: this.publisherConfig.maxRetries
    });

    await this.delay(this.publisherConfig.retryDelayMs);

    try {
      await this.attemptPublish(event);
    } catch (error) {
      await this.retryPublish(event, attempt + 1);
    }
  }

  /**
   * Attempt to publish without handling retry logic
   */
  private async attemptPublish(event: IntegrationEvent): Promise<void> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not available');
    }

    const routingKey = this.getRoutingKey(event);
    const message = this.serializeEvent(event);

    const published = this.channel.publish(
      this.config.exchange,
      routingKey,
      Buffer.from(message),
      {
        persistent: true,
        contentType: 'application/json',
        timestamp: Date.now(),
        messageId: event.eventId,
        type: event.eventType,
        headers: {
          aggregateId: event.aggregateId,
          occurredAt: event.occurredAt.toISOString()
        }
      }
    );

    if (!published) {
      throw new Error('Failed to publish event - channel buffer full');
    }

    if (this.publisherConfig.enableLogging) {
      this.logger.info('Event published', {
        eventType: event.eventType,
        eventId: event.eventId,
        routingKey
      });
    }
  }

  /**
   * Delay helper for retries
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get routing key for event
   */
  private getRoutingKey(event: IntegrationEvent): string {
    // Format: provider.{aggregate}.{action}
    // Example: provider.staff.registered, provider.doctor.availability.changed
    const parts = event.eventType.split('.');
    return parts.join('.');
  }

  /**
   * Serialize event to JSON
   */
  private serializeEvent(event: IntegrationEvent): string {
    return JSON.stringify({
      ...event,
      occurredAt: event.occurredAt.toISOString()
    });
  }

  /**
   * Disconnect from RabbitMQ
   */
  async disconnect(): Promise<void> {
    this.intentionallyClosed = true;

    try {
      if (this.channel) {
        await this.channel.close();
        this.channel = null;
      }

      if (this.connection) {
        await (this.connection as any).close();
        this.connection = null;
      }

      this.isConnected = false;
      this.logger.info('Disconnected from RabbitMQ');

    } catch (error) {
      this.logger.error('Error disconnecting from RabbitMQ', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Check if connected
   */
  isReady(): boolean {
    return this.isConnected && this.channel !== null;
  }
}

