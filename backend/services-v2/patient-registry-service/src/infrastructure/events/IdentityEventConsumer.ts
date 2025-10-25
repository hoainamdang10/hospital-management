/**
 * IdentityEventConsumer
 * Consumes events from Identity Service via RabbitMQ
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Event-Driven Architecture
 */

import amqp, { Channel, ConsumeMessage } from 'amqplib';
import { ILogger } from '@shared/application/services/logger.interface';
import { 
  IdentityUserCreatedEventHandler,
  IdentityUserCreatedEventData 
} from './handlers/IdentityUserCreatedEventHandler';
import { 
  IdentityUserDeletedEventHandler,
  IdentityUserDeletedEventData 
} from './handlers/IdentityUserDeletedEventHandler';
import { 
  IdentityUserUpdatedEventHandler,
  IdentityUserUpdatedEventData 
} from './handlers/IdentityUserUpdatedEventHandler';

/**
 * Identity Event Consumer Configuration
 */
export interface IdentityEventConsumerConfig {
  rabbitmqUrl: string;
  queueName: string;
  exchangeName: string;
  routingKeys: string[];
}

/**
 * Identity Event Consumer
 * Subscribes to identity.* events from Identity Service
 */
export class IdentityEventConsumer {
  private connection: any = null;
  private channel: Channel | null = null;
  private isConnected = false;

  constructor(
    private config: IdentityEventConsumerConfig,
    private logger: ILogger,
    private userCreatedHandler: IdentityUserCreatedEventHandler,
    private userDeletedHandler: IdentityUserDeletedEventHandler,
    private userUpdatedHandler: IdentityUserUpdatedEventHandler
  ) {}

  /**
   * Connect to RabbitMQ and start consuming
   */
  async connect(): Promise<void> {
    try {
      this.logger.info('Connecting to RabbitMQ for Identity events', {
        url: this.config.rabbitmqUrl.replace(/\/\/.*@/, '//***@'), // Hide credentials
        queueName: this.config.queueName
      });

      // Create connection
      this.connection = await amqp.connect(this.config.rabbitmqUrl);
      this.channel = await this.connection.createChannel();

      if (!this.channel) {
        throw new Error('Failed to create RabbitMQ channel');
      }

      // Assert exchange
      await this.channel.assertExchange(this.config.exchangeName, 'topic', {
        durable: true
      });

      // Assert queue
      await this.channel.assertQueue(this.config.queueName, {
        durable: true,
        arguments: {
          'x-message-ttl': 86400000, // 24 hours
          'x-max-length': 10000
        }
      });

      // Bind queue to routing keys
      for (const routingKey of this.config.routingKeys) {
        await this.channel.bindQueue(
          this.config.queueName,
          this.config.exchangeName,
          routingKey
        );
        this.logger.info('Queue bound to routing key', {
          queueName: this.config.queueName,
          routingKey
        });
      }

      // Start consuming
      await this.channel.consume(
        this.config.queueName,
        this.handleMessage.bind(this),
        { noAck: false }
      );

      this.isConnected = true;
      this.logger.info('Identity event consumer connected successfully');

      // Handle connection errors
      this.connection.on('error', (error: Error) => {
        this.logger.error('RabbitMQ connection error', { error: error.message });
        this.isConnected = false;
      });

      this.connection.on('close', () => {
        this.logger.warn('RabbitMQ connection closed');
        this.isConnected = false;
      });

    } catch (error) {
      this.logger.error('Failed to connect Identity event consumer', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Handle incoming message
   */
  private async handleMessage(msg: ConsumeMessage | null): Promise<void> {
    if (!msg || !this.channel) {
      return;
    }

    try {
      const content = msg.content.toString();
      const event = JSON.parse(content);
      const routingKey = msg.fields.routingKey;

      this.logger.debug('Received identity event', {
        routingKey,
        eventId: event.eventId
      });

      // Route to appropriate handler
      switch (routingKey) {
        case 'user.user_created_event':
          await this.userCreatedHandler.handle(event.payload as IdentityUserCreatedEventData);
          break;

        case 'user.user_deleted_event':
          await this.userDeletedHandler.handle(event.payload as IdentityUserDeletedEventData);
          break;

        case 'user.user_updated_event':
          await this.userUpdatedHandler.handle(event.payload as IdentityUserUpdatedEventData);
          break;

        default:
          this.logger.warn('Unknown identity event routing key', { routingKey });
      }

      // Acknowledge message
      this.channel.ack(msg);

    } catch (error) {
      this.logger.error('Error handling identity event', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      // Reject and requeue message
      if (this.channel) {
        this.channel.nack(msg, false, true);
      }
    }
  }

  /**
   * Disconnect from RabbitMQ
   */
  async disconnect(): Promise<void> {
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
      this.logger.info('Identity event consumer disconnected');

    } catch (error) {
      this.logger.error('Error disconnecting Identity event consumer', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Check if consumer is connected
   */
  isActive(): boolean {
    return this.isConnected;
  }
}

