import * as amqp from 'amqplib';
import { IDeadLetterRepository } from '../../domain/repositories/IDeadLetterRepository';
import { DeadLetter } from '../../domain/entities/DeadLetter.entity';
import { AlertService } from '../alerting/AlertService';
import { MetricsCollector } from '../observability/MetricsCollector';

export interface RabbitMQConfig {
  url: string;
  exchange: string;
  exchangeType: string;
  durable: boolean;
}

export interface MessageHeaders {
  correlation_id: string;
  causation_id: string;
  schedule_id: string;
  run_id: string;
  tenant_id: string;
  idempotency_key: string;
  emitted_at: string;
}

export class RabbitMQPublisher {
  private connection: amqp.Connection | null = null;
  private channel: amqp.ConfirmChannel | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 5000;
  private metrics: MetricsCollector;

  constructor(
    private readonly config: RabbitMQConfig,
    private readonly deadLetterRepo?: IDeadLetterRepository,
    private readonly alertService?: AlertService
  ) {
    this.metrics = MetricsCollector.getInstance();
  }

  async connect(): Promise<void> {
    try {
      console.log('🔌 Connecting to RabbitMQ...', {
        url: this.config.url.replace(/\/\/.*@/, '//***@')
      });

      this.connection = await amqp.connect(this.config.url) as any;
      if (!this.connection) {
        throw new Error('Failed to create RabbitMQ connection');
      }

      // Use createConfirmChannel for publisher confirms
      this.channel = await (this.connection as any).createConfirmChannel();
      if (!this.channel) {
        throw new Error('Failed to create RabbitMQ confirm channel');
      }

      // Listen for returned messages (unroutable)
      this.channel.on('return', async (msg: amqp.Message) => {
        console.error('❌ Message returned (unroutable):', {
          routingKey: msg.fields.routingKey,
          exchange: msg.fields.exchange,
          messageId: msg.properties.messageId
        });

        // Increment Prometheus metrics
        this.metrics.unroutableMessagesTotal.inc({
          routing_key: msg.fields.routingKey,
          exchange: msg.fields.exchange
        });
        this.metrics.unroutableMessagesByExchange.inc({
          exchange: msg.fields.exchange
        });

        // Save to dead_letters table
        await this.handleUnroutableMessage(msg);
      });

      (this.connection as any).on('error', (err: Error) => {
        console.error('❌ RabbitMQ connection error:', err.message);
        this.isConnected = false;
      });

      (this.connection as any).on('close', () => {
        console.warn('⚠️ RabbitMQ connection closed');
        this.isConnected = false;
        this.reconnect();
      });

      await this.channel.assertExchange(
        this.config.exchange,
        this.config.exchangeType,
        { durable: this.config.durable }
      );

      this.isConnected = true;
      this.reconnectAttempts = 0;

      console.log('✅ RabbitMQ connected successfully');
    } catch (error) {
      console.error('❌ Failed to connect to RabbitMQ:', error);
      throw error;
    }
  }

  private async reconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnect attempts reached. Giving up.');
      return;
    }

    this.reconnectAttempts++;
    console.log(`🔄 Reconnecting to RabbitMQ (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

    await new Promise(resolve => setTimeout(resolve, this.reconnectDelay));

    try {
      await this.connect();
    } catch (error) {
      console.error('❌ Reconnect failed:', error);
      await this.reconnect();
    }
  }

  async publish(
    topic: string,
    payload: any,
    headers: MessageHeaders
  ): Promise<void> {
    if (!this.isConnected || !this.channel) {
      throw new Error('RabbitMQ not connected');
    }

    try {
      const message = JSON.stringify(payload);

      // Use promise-based publish with publisher confirms
      await new Promise<void>((resolve, reject) => {
        this.channel!.publish(
          this.config.exchange,
          topic,
          Buffer.from(message),
          {
            persistent: true,
            contentType: 'application/json',
            timestamp: Date.now(),
            messageId: headers.idempotency_key, // Use idempotency_key as messageId
            mandatory: true, // Detect unroutable messages
            headers: {
              ...headers
            }
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

      console.log('📤 Message published and confirmed', {
        topic,
        idempotency_key: headers.idempotency_key
      });
    } catch (error) {
      console.error('❌ Failed to publish message:', error);
      throw error;
    }
  }

  async close(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await (this.connection as any).close();
      }
      this.isConnected = false;
      console.log('✅ RabbitMQ connection closed');
    } catch (error) {
      console.error('❌ Error closing RabbitMQ connection:', error);
    }
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  /**
   * Handle unroutable message by saving to dead_letters table
   */
  private async handleUnroutableMessage(msg: amqp.Message): Promise<void> {
    const messageId = msg.properties.messageId || 'unknown';
    const routingKey = msg.fields.routingKey;
    const exchange = msg.fields.exchange;

    try {
      // Send alert
      if (this.alertService) {
        await this.alertService.sendUnroutableMessageAlert(
          messageId,
          routingKey,
          exchange,
          {
            headers: msg.properties.headers,
            timestamp: new Date().toISOString()
          }
        );
      }

      if (!this.deadLetterRepo) {
        console.warn('⚠️ DeadLetterRepository not configured, skipping dead letter save');
        return;
      }

      // Parse payload
      let payload: Record<string, any> = {};
      try {
        payload = JSON.parse(msg.content.toString());
      } catch (error) {
        payload = { raw: msg.content.toString() };
      }

      // Create dead letter
      const deadLetter = DeadLetter.createForUnroutableMessage(
        messageId,
        routingKey,
        exchange,
        payload,
        msg.properties.headers || {},
        `Message returned as unroutable. Exchange: ${exchange}, Routing Key: ${routingKey}`
      );

      // Save to database
      await this.deadLetterRepo.save(deadLetter);

      console.log('✅ Unroutable message saved to dead_letters table', {
        messageId,
        routingKey,
        exchange
      });
    } catch (error) {
      console.error('❌ Failed to save unroutable message to dead_letters:', error);

      // Send alert for save failure
      if (this.alertService && error instanceof Error) {
        await this.alertService.sendDeadLetterSaveFailureAlert(error, messageId);
      }

      // Don't throw - we don't want to crash the publisher
    }
  }
}

