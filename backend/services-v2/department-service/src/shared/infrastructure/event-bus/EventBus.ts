import { Channel, ChannelModel, connect } from 'amqplib';
import { HealthcareDomainEvent } from '../../domain/base/domain-event';
import { IEventBus } from '../../application/services/event-bus.interface';

export interface RabbitMQEventBusConfig {
  rabbitmqUrl: string;
  exchangeName: string;
  serviceName: string;
  retryAttempts?: number;
  retryDelayMs?: number;
}

export class RabbitMQEventBus implements IEventBus {
  private connection?: ChannelModel;
  private channel?: Channel;
  private isConnected = false;

  constructor(private readonly config: RabbitMQEventBusConfig) {}

  async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    this.connection = await connect(this.config.rabbitmqUrl);
    this.channel = await this.connection.createChannel();

    await this.channel.assertExchange(this.config.exchangeName, 'topic', { durable: true });

    this.connection.on('close', () => {
      this.isConnected = false;
      this.channel = undefined;
    });

    this.connection.on('error', () => {
      this.isConnected = false;
    });

    this.isConnected = true;
  }

  async publish(event: HealthcareDomainEvent): Promise<void> {
    if (!this.channel) {
      await this.connect();
    }

    const payload = Buffer.from(
      JSON.stringify({
        eventId: event.eventId,
        eventType: event.eventType,
        occurredOn: event.occurredOn.toISOString(),
        payload: event.payload,
        metadata: {
          service: this.config.serviceName,
        },
      }),
    );

    const routingKey = event.eventType;
    const maxAttempts = this.config.retryAttempts ?? 3;
    const retryDelay = this.config.retryDelayMs ?? 500;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const published = this.channel!.publish(this.config.exchangeName, routingKey, payload, {
          persistent: true,
          contentType: 'application/json',
        });

        if (!published) {
          throw new Error('Failed to publish event to RabbitMQ');
        }
        return;
      } catch (error) {
        if (attempt === maxAttempts) {
          throw error;
        }
        await new Promise((resolve) => setTimeout(resolve, retryDelay * attempt));
      }
    }
  }

  async disconnect(): Promise<void> {
    if (this.channel) {
      await this.channel.close().catch(() => undefined);
      this.channel = undefined;
    }
    if (this.connection) {
      await this.connection.close().catch(() => undefined);
      this.connection = undefined;
    }
    this.isConnected = false;
  }
}
