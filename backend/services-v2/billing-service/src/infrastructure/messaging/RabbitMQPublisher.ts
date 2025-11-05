/**
 * RabbitMQ Publisher - Infrastructure Layer
 * Publishes events to RabbitMQ message broker
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */

import amqp, { Connection, Channel } from 'amqplib';
import { OutboxEvent } from '../../domain/repositories/IOutboxRepository';
import { ILogger } from '../../../../shared/infrastructure/logging/logger.interface';

export interface RabbitMQConfig {
  url: string;
  exchangeName: string;
  routingKeyPrefix: string;
}

/**
 * RabbitMQ Publisher
 * Production-ready implementation with connection management
 */
export class RabbitMQPublisher {
  private connection?: Connection;
  private channel?: Channel;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private readonly maxReconnectAttempts: number = 5;
  private readonly reconnectDelay: number = 5000; // 5 seconds

  constructor(
    private config: RabbitMQConfig,
    private logger: ILogger
  ) {}

  /**
   * Initialize connection to RabbitMQ
   */
  async connect(): Promise<void> {
    try {
      this.logger.info('[RabbitMQ] Connecting to RabbitMQ...', {
        url: this.config.url.replace(/\/\/.*@/, '//***@'), // Hide credentials in logs
        exchange: this.config.exchangeName,
      });

      // Create connection
      this.connection = await amqp.connect(this.config.url);

      // Create channel
      this.channel = await this.connection.createChannel();

      // Assert exchange (create if not exists)
      await this.channel.assertExchange(
        this.config.exchangeName,
        'topic',
        { durable: true }
      );

      // Enable publisher confirms
      await this.channel.confirmChannel();

      // Setup connection error handlers
      this.connection.on('error', (err) => {
        this.logger.error('[RabbitMQ] Connection error', { error: err });
        this.isConnected = false;
      });

      this.connection.on('close', () => {
        this.logger.warn('[RabbitMQ] Connection closed');
        this.isConnected = false;
        this.reconnect();
      });

      this.channel.on('error', (err) => {
        this.logger.error('[RabbitMQ] Channel error', { error: err });
      });

      this.channel.on('close', () => {
        this.logger.warn('[RabbitMQ] Channel closed');
      });

      this.isConnected = true;
      this.reconnectAttempts = 0;

      this.logger.info('[RabbitMQ] Connected successfully', {
        exchange: this.config.exchangeName,
      });
    } catch (error) {
      this.logger.error('[RabbitMQ] Failed to connect', { error });
      this.isConnected = false;
      throw error;
    }
  }

  /**
   * Reconnect to RabbitMQ with exponential backoff
   */
  private async reconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.logger.error('[RabbitMQ] Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * this.reconnectAttempts;

    this.logger.info('[RabbitMQ] Attempting to reconnect...', {
      attempt: this.reconnectAttempts,
      maxAttempts: this.maxReconnectAttempts,
      delay,
    });

    setTimeout(async () => {
      try {
        await this.connect();
      } catch (error) {
        this.logger.error('[RabbitMQ] Reconnect failed', { error });
      }
    }, delay);
  }

  /**
   * Publish event to RabbitMQ
   */
  async publish(event: OutboxEvent): Promise<void> {
    if (!this.isConnected || !this.channel) {
      await this.connect();
    }

    if (!this.channel) {
      throw new Error('RabbitMQ channel not available');
    }

    try {
      // Build routing key: billing.invoice.created
      const routingKey = `${this.config.routingKeyPrefix}.${event.aggregateType.toLowerCase()}.${this.extractAction(event.eventType)}`;

      // Prepare message
      const message = {
        eventId: event.eventId,
        eventType: event.eventType,
        aggregateType: event.aggregateType,
        aggregateId: event.aggregateId,
        payload: event.payload,
        metadata: {
          ...event.metadata,
          publishedAt: new Date().toISOString(),
          source: 'billing-service',
        },
      };

      // Publish with publisher confirms
      await new Promise<void>((resolve, reject) => {
        this.channel!.publish(
          this.config.exchangeName,
          routingKey,
          Buffer.from(JSON.stringify(message)),
          {
            persistent: true,
            messageId: event.eventId,
            timestamp: Date.now(),
            contentType: 'application/json',
            headers: {
              eventType: event.eventType,
              aggregateType: event.aggregateType,
              eventId: event.eventId,
            },
          },
          (err) => {
            if (err) {
              reject(new Error(`Publish failed: ${err.message}`));
            } else {
              resolve();
            }
          }
        );
      });

      this.logger.debug('[RabbitMQ] Published event', {
        eventId: event.eventId,
        routingKey,
        exchange: this.config.exchangeName,
      });
    } catch (error) {
      this.logger.error('[RabbitMQ] Failed to publish event', {
        eventId: event.eventId,
        error,
      });
      throw error;
    }
  }

  /**
   * Disconnect from RabbitMQ
   */
  async disconnect(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
        this.channel = undefined;
      }

      if (this.connection) {
        await this.connection.close();
        this.connection = undefined;
      }

      this.isConnected = false;
      this.logger.info('[RabbitMQ] Disconnected successfully');
    } catch (error) {
      this.logger.error('[RabbitMQ] Error disconnecting', { error });
    }
  }

  /**
   * Check if connected
   */
  isReady(): boolean {
    return this.isConnected && !!this.channel;
  }

  /**
   * Extract action from event type
   * Example: "InvoiceCreatedEvent" -> "created"
   */
  private extractAction(eventType: string): string {
    // Remove "Event" suffix if present
    const cleaned = eventType.replace(/Event$/, '');
    
    // Convert PascalCase to lowercase with dots
    // InvoiceCreated -> invoice.created
    return cleaned
      .replace(/([A-Z])/g, '.$1')
      .toLowerCase()
      .substring(1)
      .split('.')
      .pop() || 'unknown';
  }
}
