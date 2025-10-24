/**
 * PatientEventConsumer - RabbitMQ Consumer for Patient Registry Service Events
 * Provider/Staff Service V2
 * 
 * Subscribes to Patient Registry Service events via RabbitMQ and routes to appropriate handlers
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Event-Driven Architecture, Clean Architecture, HIPAA
 */

import * as amqp from 'amqplib';
import { ILogger } from '../../application/interfaces/ILogger';
import { PatientRegisteredEventHandler } from './PatientRegisteredEventHandler';
import { PatientUpdatedEventHandler } from './PatientUpdatedEventHandler';

export interface PatientEventConsumerConfig {
  rabbitmqUrl: string;
  exchange: string;
  queueName: string;
  routingKeys: string[];
  prefetchCount?: number;
  retryAttempts?: number;
  retryDelayMs?: number;
}

/**
 * RabbitMQ Consumer for Patient Registry Service Events
 * Subscribes to patient.* events and routes to handlers
 */
export class PatientEventConsumer {
  private connection: amqp.Connection | undefined = undefined;
  private channel: amqp.Channel | undefined = undefined;
  private isConnected: boolean = false;

  constructor(
    private config: PatientEventConsumerConfig,
    private logger: ILogger,
    private patientRegisteredHandler: PatientRegisteredEventHandler,
    private patientUpdatedHandler: PatientUpdatedEventHandler
  ) {}

  /**
   * Connect to RabbitMQ and start consuming
   */
  async connect(): Promise<void> {
    try {
      this.logger.info('Connecting to RabbitMQ for Patient events', {
        url: this.config.rabbitmqUrl.replace(/\/\/.*@/, '//***@'), // Mask credentials
        exchange: this.config.exchange,
        queue: this.config.queueName
      });

      // Create connection
      this.connection = await amqp.connect(this.config.rabbitmqUrl) as any;
      this.channel = await (this.connection as any).createChannel();

      // Set prefetch count
      await this.channel!.prefetch(this.config.prefetchCount || 10);

      // Assert exchange
      await this.channel!.assertExchange(this.config.exchange, 'topic', {
        durable: true
      });

      // Assert queue
      await this.channel!.assertQueue(this.config.queueName, {
        durable: true,
        arguments: {
          'x-message-ttl': 86400000, // 24 hours
          'x-max-length': 10000
        }
      });

      // Bind queue to routing keys
      for (const routingKey of this.config.routingKeys) {
        await this.channel!.bindQueue(
          this.config.queueName,
          this.config.exchange,
          routingKey
        );
        this.logger.info('Bound queue to routing key', {
          queue: this.config.queueName,
          routingKey
        });
      }

      // Start consuming
      await this.channel!.consume(
        this.config.queueName,
        async (msg) => {
          if (msg) {
            await this.handleMessage(msg);
          }
        },
        { noAck: false }
      );

      this.isConnected = true;
      this.logger.info('PatientEventConsumer connected successfully', {
        queue: this.config.queueName,
        routingKeys: this.config.routingKeys
      });

      // Handle connection errors
      (this.connection as any).on('error', (err: Error) => {
        this.logger.error('RabbitMQ connection error', {
          error: err.message
        });
        this.isConnected = false;
      });

      (this.connection as any).on('close', () => {
        this.logger.warn('RabbitMQ connection closed');
        this.isConnected = false;
      });

    } catch (error) {
      this.logger.error('Failed to connect PatientEventConsumer', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Handle incoming message
   */
  private async handleMessage(msg: amqp.ConsumeMessage): Promise<void> {
    const content = msg.content.toString();
    const routingKey = msg.fields.routingKey;

    this.logger.info('Received message from Patient Registry Service', {
      routingKey,
      messageId: msg.properties.messageId,
      timestamp: msg.properties.timestamp
    });

    try {
      const event = JSON.parse(content);

      // Route to appropriate handler based on event type
      switch (event.eventType) {
        case 'PatientRegistered':
          await this.handlePatientRegistered(event);
          break;

        case 'PatientUpdated':
          await this.handlePatientUpdated(event);
          break;

        case 'PatientDeactivated':
          await this.handlePatientDeactivated(event);
          break;

        default:
          this.logger.warn('Unknown event type from Patient Registry Service', {
            eventType: event.eventType,
            eventId: event.eventId
          });
      }

      // Acknowledge message
      this.channel?.ack(msg);

    } catch (error) {
      this.logger.error('Error parsing or handling message', {
        error: error instanceof Error ? error.message : 'Unknown error',
        routingKey,
        messageId: msg.properties.messageId
      });

      // Reject and requeue message for retry
      this.channel?.nack(msg, false, true);
    }
  }

  /**
   * Handle PatientRegistered event
   */
  private async handlePatientRegistered(eventData: any): Promise<void> {
    await this.patientRegisteredHandler.handle({
      patientId: eventData.patientId || eventData.aggregateId,
      fullName: eventData.fullName || eventData.eventData?.fullName,
      dateOfBirth: eventData.dateOfBirth || eventData.eventData?.dateOfBirth,
      gender: eventData.gender || eventData.eventData?.gender,
      phoneNumber: eventData.phoneNumber || eventData.eventData?.phoneNumber,
      email: eventData.email || eventData.eventData?.email,
      registeredAt: eventData.registeredAt || eventData.occurredAt
    });
  }

  /**
   * Handle PatientUpdated event
   */
  private async handlePatientUpdated(eventData: any): Promise<void> {
    await this.patientUpdatedHandler.handle({
      patientId: eventData.patientId || eventData.aggregateId,
      updatedFields: eventData.updatedFields || eventData.eventData?.updatedFields || {},
      updatedBy: eventData.updatedBy || eventData.eventData?.updatedBy,
      updatedAt: eventData.updatedAt || eventData.occurredAt
    });
  }

  /**
   * Handle PatientDeactivated event
   */
  private async handlePatientDeactivated(eventData: any): Promise<void> {
    // Log for audit purposes - Provider/Staff service doesn't need to take action
    this.logger.info('Patient deactivated', {
      patientId: eventData.patientId || eventData.aggregateId,
      deactivatedBy: eventData.deactivatedBy || eventData.eventData?.deactivatedBy,
      reason: eventData.reason || eventData.eventData?.reason
    });
  }

  /**
   * Disconnect from RabbitMQ
   */
  async disconnect(): Promise<void> {
    try {
      await this.channel?.close();
      await (this.connection as any)?.close();
      this.isConnected = false;
      this.logger.info('PatientEventConsumer disconnected');
    } catch (error) {
      this.logger.error('Error disconnecting PatientEventConsumer', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Check if consumer is connected
   */
  isReady(): boolean {
    return this.isConnected;
  }
}

