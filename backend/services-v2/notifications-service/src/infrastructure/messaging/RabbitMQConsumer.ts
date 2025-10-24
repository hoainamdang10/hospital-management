/**
 * RabbitMQConsumer - RabbitMQ Consumer for Notifications Service
 * Consumes scheduled notification events from Scheduler Service
 * Implements idempotent processing with Inbox Pattern
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Event-Driven Architecture, Inbox Pattern
 */

import * as amqp from 'amqplib';
import { NotificationEventHandlers, ScheduleRunDueEvent } from '../events/NotificationEventHandlers';

export interface RabbitMQConsumerConfig {
  url: string;
  exchange: string;
  exchangeType: string;
  queueName: string;
  routingKeys: string[];
  prefetchCount: number;
  durable: boolean;
}

export interface MessageHeaders {
  correlation_id?: string;
  causation_id?: string;
  schedule_id?: string;
  run_id?: string;
  tenant_id?: string;
  idempotency_key?: string;
  emitted_at?: string;
}

export class RabbitMQConsumer {
  private connection: amqp.Connection | null = null;
  private channel: amqp.Channel | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 5000;
  private consumerTag: string | null = null;

  constructor(
    private readonly config: RabbitMQConsumerConfig,
    private readonly eventHandlers: NotificationEventHandlers
  ) {}

  /**
   * Connect to RabbitMQ and start consuming messages
   */
  async start(): Promise<void> {
    try {
      console.log('🔌 Connecting to RabbitMQ...', {
        url: this.config.url.replace(/\/\/.*@/, '//***@'),
        queue: this.config.queueName
      });

      // Create connection
      this.connection = await amqp.connect(this.config.url);
      if (!this.connection) {
        throw new Error('Failed to create RabbitMQ connection');
      }

      // Create channel
      this.channel = await this.connection.createChannel();
      if (!this.channel) {
        throw new Error('Failed to create RabbitMQ channel');
      }

      // Set prefetch count (QoS)
      await this.channel.prefetch(this.config.prefetchCount);

      // Assert exchange
      await this.channel.assertExchange(
        this.config.exchange,
        this.config.exchangeType,
        { durable: this.config.durable }
      );

      // Assert queue
      await this.channel.assertQueue(this.config.queueName, {
        durable: this.config.durable,
        arguments: {
          'x-queue-type': 'classic',
          'x-message-ttl': 86400000, // 24 hours
          'x-max-length': 100000 // Max 100k messages
        }
      });

      // Bind queue to exchange with routing keys
      for (const routingKey of this.config.routingKeys) {
        await this.channel.bindQueue(
          this.config.queueName,
          this.config.exchange,
          routingKey
        );
        console.log(`✅ Queue bound to routing key: ${routingKey}`);
      }

      // Setup connection error handlers
      this.connection.on('error', (err: Error) => {
        console.error('❌ RabbitMQ connection error:', err.message);
        this.isConnected = false;
      });

      this.connection.on('close', () => {
        console.warn('⚠️ RabbitMQ connection closed');
        this.isConnected = false;
        this.reconnect();
      });

      // Start consuming messages
      const { consumerTag } = await this.channel.consume(
        this.config.queueName,
        async (msg) => {
          if (!msg) return;
          await this.handleMessage(msg);
        },
        {
          noAck: false // Manual acknowledgment
        }
      );

      this.consumerTag = consumerTag;
      this.isConnected = true;
      this.reconnectAttempts = 0;

      console.log('✅ RabbitMQ consumer started successfully', {
        queue: this.config.queueName,
        consumerTag: this.consumerTag,
        prefetchCount: this.config.prefetchCount
      });

    } catch (error) {
      console.error('❌ Failed to start RabbitMQ consumer:', error);
      throw error;
    }
  }

  /**
   * Handle incoming message
   */
  private async handleMessage(msg: amqp.Message): Promise<void> {
    const startTime = Date.now();
    const headers = msg.properties.headers as MessageHeaders;
    const idempotencyKey = headers.idempotency_key || msg.properties.messageId || 'unknown';

    try {
      console.log('📥 Received message', {
        routingKey: msg.fields.routingKey,
        idempotencyKey,
        timestamp: new Date().toISOString()
      });

      // Parse message payload
      const payload = JSON.parse(msg.content.toString());

      // Construct ScheduleRunDueEvent
      const event: ScheduleRunDueEvent = {
        type: 'schedule.run.due',
        payload: payload,
        headers: {
          idempotency_key: idempotencyKey,
          schedule_id: headers.schedule_id || '',
          run_id: headers.run_id || '',
          correlation_id: headers.correlation_id,
          causation_id: headers.causation_id,
          tenant_id: headers.tenant_id
        }
      };

      // Process event (idempotent via Inbox Pattern)
      await this.eventHandlers.handleScheduleRunDue(event);

      // Acknowledge message
      if (this.channel) {
        this.channel.ack(msg);
      }

      const processingTime = Date.now() - startTime;
      console.log('✅ Message processed successfully', {
        idempotencyKey,
        processingTime: `${processingTime}ms`
      });

    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error('❌ Error processing message', {
        idempotencyKey,
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime: `${processingTime}ms`
      });

      // Decide whether to retry or dead-letter
      const shouldRetry = this.shouldRetryMessage(msg, error);

      if (shouldRetry) {
        // Nack and requeue
        if (this.channel) {
          this.channel.nack(msg, false, true);
        }
        console.log('🔄 Message requeued for retry', { idempotencyKey });
      } else {
        // Nack without requeue (send to DLQ if configured)
        if (this.channel) {
          this.channel.nack(msg, false, false);
        }
        console.log('💀 Message sent to dead letter queue', { idempotencyKey });
      }
    }
  }

  /**
   * Determine if message should be retried
   */
  private shouldRetryMessage(msg: amqp.Message, error: any): boolean {
    const headers = msg.properties.headers as any;
    const retryCount = headers['x-retry-count'] || 0;
    const maxRetries = 3;

    // Don't retry if max retries reached
    if (retryCount >= maxRetries) {
      return false;
    }

    // Don't retry for validation errors
    if (error instanceof Error && error.message.includes('validation')) {
      return false;
    }

    // Retry for transient errors
    return true;
  }

  /**
   * Reconnect to RabbitMQ
   */
  private async reconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnect attempts reached. Giving up.');
      return;
    }

    this.reconnectAttempts++;
    console.log(`🔄 Reconnecting to RabbitMQ (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

    await new Promise(resolve => setTimeout(resolve, this.reconnectDelay));

    try {
      await this.start();
    } catch (error) {
      console.error('❌ Reconnect failed:', error);
      await this.reconnect();
    }
  }

  /**
   * Stop consuming and close connection
   */
  async stop(): Promise<void> {
    try {
      if (this.channel && this.consumerTag) {
        await this.channel.cancel(this.consumerTag);
        console.log('✅ Consumer cancelled');
      }

      if (this.channel) {
        await this.channel.close();
        console.log('✅ Channel closed');
      }

      if (this.connection) {
        await this.connection.close();
        console.log('✅ Connection closed');
      }

      this.isConnected = false;
      console.log('✅ RabbitMQ consumer stopped successfully');

    } catch (error) {
      console.error('❌ Error stopping RabbitMQ consumer:', error);
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  /**
   * Get queue stats
   */
  async getQueueStats(): Promise<{ messageCount: number; consumerCount: number } | null> {
    if (!this.channel) {
      return null;
    }

    try {
      const queueInfo = await this.channel.checkQueue(this.config.queueName);
      return {
        messageCount: queueInfo.messageCount,
        consumerCount: queueInfo.consumerCount
      };
    } catch (error) {
      console.error('❌ Error getting queue stats:', error);
      return null;
    }
  }
}

