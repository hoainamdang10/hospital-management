import * as amqp from 'amqplib';
import { Event, EventType } from '../types/common.types';
import logger from '../utils/logger';

export class EventBus {
  private connection: any = null;
  private channel: any = null;
  private readonly exchangeName: string;
  private readonly serviceName: string;

  constructor(serviceName: string, exchangeName: string = 'hospital.events') {
    this.serviceName = serviceName;
    this.exchangeName = exchangeName;
  }

  async connect(url: string): Promise<void> {
    const maxRetries = 5;
    const retryDelay = 5000; // 5 seconds

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logger.info(`Attempting to connect to RabbitMQ (attempt ${attempt}/${maxRetries})...`);

        this.connection = await amqp.connect(url);
        this.channel = await this.connection.createChannel();

        // Create exchange
        await this.channel.assertExchange(this.exchangeName, 'topic', {
          durable: true,
        });

        // Handle connection errors
        this.connection.on('error', (err: any) => {
          logger.error('RabbitMQ connection error', { error: err.message });
        });

        this.connection.on('close', () => {
          logger.warn('RabbitMQ connection closed');
        });

        logger.info('Connected to RabbitMQ', {
          service: this.serviceName,
          exchange: this.exchangeName
        });
        return; // Success, exit retry loop
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Failed to connect to RabbitMQ (attempt ${attempt}/${maxRetries})`, {
          error: errorMessage
        });

        if (attempt === maxRetries) {
          logger.error('Max retries reached. Unable to connect to RabbitMQ');
          throw error;
        }

        // Wait before retrying
        logger.info(`Retrying in ${retryDelay / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
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
      logger.info('Disconnected from RabbitMQ');
    } catch (error) {
      logger.error('Error disconnecting from RabbitMQ', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async publish(eventType: EventType, data: any, routingKey?: string): Promise<void> {
    if (!this.channel) {
      throw new Error('EventBus not connected');
    }

    const event: Event = {
      id: this.generateEventId(),
      type: eventType,
      data,
      timestamp: new Date(),
      source: this.serviceName,
      version: '1.0',
    };

    const key = routingKey || eventType;
    const message = Buffer.from(JSON.stringify(event));

    try {
      const published = this.channel.publish(
        this.exchangeName,
        key,
        message,
        {
          persistent: true,
          messageId: event.id,
          timestamp: event.timestamp.getTime(),
        }
      );

      if (published) {
        logger.info('Event published', {
          eventId: event.id,
          eventType: event.type,
          routingKey: key,
        });
      } else {
        throw new Error('Failed to publish event');
      }
    } catch (error) {
      logger.error('Error publishing event', {
        eventType: event.type,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  async subscribe(
    pattern: string,
    handler: (event: Event) => Promise<void>,
    queueName?: string
  ): Promise<void> {
    if (!this.channel) {
      throw new Error('EventBus not connected');
    }

    const queue = queueName || `${this.serviceName}.${pattern}`;

    try {
      // Assert queue
      await this.channel.assertQueue(queue, {
        durable: true,
        exclusive: false,
        autoDelete: false,
      });

      // Bind queue to exchange
      await this.channel.bindQueue(queue, this.exchangeName, pattern);

      // Set prefetch to 1 for fair dispatch
      await this.channel.prefetch(1);

      // Consume messages
      await this.channel.consume(
        queue,
        async (msg: any) => {
          if (!msg) return;

          try {
            const event: Event = JSON.parse(msg.content.toString());

            logger.info('Event received', {
              eventId: event.id,
              eventType: event.type,
              queue,
            });

            await handler(event);

            // Acknowledge message
            this.channel!.ack(msg);

            logger.info('Event processed successfully', {
              eventId: event.id,
              eventType: event.type,
            });
          } catch (error) {
            logger.error('Error processing event', {
              error: error instanceof Error ? error.message : 'Unknown error',
              queue,
            });

            // Reject message and requeue
            this.channel!.nack(msg, false, true);
          }
        },
        {
          noAck: false,
        }
      );

      logger.info('Subscribed to events', {
        pattern,
        queue,
        service: this.serviceName,
      });
    } catch (error) {
      logger.error('Error subscribing to events', {
        pattern,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  async createQueue(queueName: string, options: any = {}): Promise<void> {
    if (!this.channel) {
      throw new Error('EventBus not connected');
    }

    await this.channel.assertQueue(queueName, {
      durable: true,
      exclusive: false,
      autoDelete: false,
      ...options,
    });
  }

  async bindQueue(queueName: string, pattern: string): Promise<void> {
    if (!this.channel) {
      throw new Error('EventBus not connected');
    }

    await this.channel.bindQueue(queueName, this.exchangeName, pattern);
  }

  private generateEventId(): string {
    return `${this.serviceName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Health check
  async isHealthy(): Promise<boolean> {
    try {
      return !!(this.connection && this.channel);
    } catch {
      return false;
    }
  }
}

// Singleton instance
let eventBusInstance: EventBus | null = null;

export const getEventBus = (serviceName: string): EventBus => {
  if (!eventBusInstance) {
    eventBusInstance = new EventBus(serviceName);
  }
  return eventBusInstance;
};

export default EventBus;
