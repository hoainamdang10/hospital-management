/**
 * PatientEventConsumer
 * Consumes events from Patient Registry Service via RabbitMQ
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Event-Driven Architecture
 */

import { Channel, ConsumeMessage } from "amqplib";
import * as amqp from "amqplib";
import { connectRabbitMQWithRetry } from "@shared/infrastructure/event-bus/rabbitmq-connection";
import { ILogger } from "@shared/application/services/logger.interface";
import {
  PatientUpdatedEventHandler,
  PatientUpdatedEventData,
} from "./handlers/PatientUpdatedEventHandler";
import { IdempotentEventHandler, EventMessage } from "./IdempotentEventHandler";
import { AuditService } from "../audit/AuditService";

/**
 * Patient Event Consumer Configuration
 */
export interface PatientEventConsumerConfig {
  rabbitmqUrl: string;
  queueName: string;
  exchangeName: string;
  routingKeys: string[];
  deadLetterExchange?: string;
  deadLetterQueue?: string;
  maxRetries?: number;
  connectionRetries?: number;
  connectionRetryDelayMs?: number;
}

/**
 * Patient Event Consumer
 * Subscribes to patient.* events from Patient Registry Service
 */
export class PatientEventConsumer {
  private connection: { close: () => Promise<void>; on: (event: string, callback: (error: Error) => void) => void } | null = null;
  private channel: Channel | null = null;
  private isConnected = false;
  private isShuttingDown = false;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 10;
  private readonly reconnectDelayMs = 5000;

  constructor(
    private config: PatientEventConsumerConfig,
    private logger: ILogger,
    private patientUpdatedEventHandler: PatientUpdatedEventHandler,
    private auditService: AuditService
  ) {}

  /**
   * Start consuming events
   */
  async start(): Promise<void> {
    try {
      this.logger.info('Starting Patient Event Consumer', {
        queueName: this.config.queueName,
        exchangeName: this.config.exchangeName,
        routingKeys: this.config.routingKeys
      });

      await this.connect();
      await this.setupQueuesAndExchanges();
      await this.startConsuming();

      this.logger.info('Patient Event Consumer started successfully');

    } catch (error) {
      this.logger.error('Failed to start Patient Event Consumer', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Connect to RabbitMQ
   */
  private async connect(): Promise<void> {
    try {
      // Create connection with retry logic
      this.connection = await connectRabbitMQWithRetry(
        () => amqp.connect(this.config.rabbitmqUrl),
        this.logger,
        {
          connectionName: 'PatientEventConsumer',
          maxAttempts: this.config.connectionRetries,
          initialDelayMs: this.config.connectionRetryDelayMs,
        },
      );

      this.channel = await (this.connection as any).createChannel();
      this.isConnected = true;

      this.logger.info('Connected to RabbitMQ for Patient events');

      // Setup connection error handling
      this.connection?.on('error', (error: Error) => {
        this.logger.error('RabbitMQ connection error', { error: error.message });
        this.handleConnectionError();
      });

      this.connection?.on('close', () => {
        this.logger.warn('RabbitMQ connection closed');
        this.isConnected = false;
        this.handleConnectionError();
      });

    } catch (error) {
      this.logger.error('Failed to connect to RabbitMQ', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Setup queues and exchanges
   */
  private async setupQueuesAndExchanges(): Promise<void> {
    if (!this.channel) {
      throw new Error('Channel not available');
    }

    // Assert exchange
    await this.channel.assertExchange(
      this.config.exchangeName,
      'topic',
      { durable: true }
    );

    // Assert queue
    await this.channel.assertQueue(
      this.config.queueName,
      {
        durable: true,
        arguments: {
          'x-dead-letter-exchange': this.config.deadLetterExchange || '',
          'x-dead-letter-routing-key': this.config.deadLetterQueue || '',
          'x-max-retries': this.config.maxRetries || 3
        }
      }
    );

    // Bind queue to exchange with routing keys
    for (const routingKey of this.config.routingKeys) {
      await this.channel.bindQueue(
        this.config.queueName,
        this.config.exchangeName,
        routingKey
      );
    }

    this.logger.info('Queues and exchanges setup completed');
  }

  /**
   * Start consuming messages
   */
  private async startConsuming(): Promise<void> {
    if (!this.channel) {
      throw new Error('Channel not available');
    }

    // Set prefetch
    await this.channel.prefetch(1);

    // Start consuming
    await this.channel.consume(
      this.config.queueName,
      async (message: ConsumeMessage | null) => {
        if (!message) {
          this.logger.debug('Received null message');
          return;
        }

        try {
          await this.handleMessage(message);
          if (this.channel) {
            this.channel.ack(message);
          }
        } catch (error) {
          this.logger.error('Failed to process message', {
            error: error instanceof Error ? error.message : 'Unknown error',
            messageId: message.properties.messageId
          });

          // Negative acknowledge with requeue
          if (this.channel) {
            this.channel.nack(message, false, false);
          }
        }
      }
    );

    this.logger.info('Started consuming patient events');
  }

  /**
   * Handle incoming message
   */
  private async handleMessage(message: ConsumeMessage): Promise<void> {
    try {
      const eventMessage: EventMessage = JSON.parse(message.content.toString());
      
      this.logger.info('Received patient event', {
        eventType: eventMessage.eventType,
        messageId: message.properties.messageId,
        timestamp: eventMessage.timestamp
      });

      // Check idempotency
      const idempotentHandler = new IdempotentEventHandler(
        this.logger,
        this.auditService
      );

      const isProcessed = await idempotentHandler.hasBeenProcessed(
        eventMessage.eventId,
        eventMessage.timestamp
      );

      if (isProcessed) {
        this.logger.debug('Event already processed', {
          eventId: eventMessage.eventId
        });
        return;
      }

      // Route to appropriate handler
      await this.routeEvent(eventMessage);

      // Mark as processed
      await idempotentHandler.markAsProcessed(
        eventMessage.eventId,
        eventMessage.timestamp
      );

    } catch (error) {
      this.logger.error('Error handling message', {
        error: error instanceof Error ? error.message : 'Unknown error',
        messageId: message.properties.messageId
      });
      throw error;
    }
  }

  /**
   * Route event to appropriate handler
   */
  private async routeEvent(eventMessage: EventMessage): Promise<void> {
    switch (eventMessage.eventType) {
      case 'PatientUpdated':
        await this.patientUpdatedEventHandler.handle(
          eventMessage.data as PatientUpdatedEventData
        );
        break;

      default:
        this.logger.warn('Unknown patient event type', {
          eventType: eventMessage.eventType
        });
        break;
    }
  }

  /**
   * Handle connection errors
   */
  private async handleConnectionError(): Promise<void> {
    if (this.isShuttingDown || this.isConnected === false) {
      return;
    }

    this.isConnected = false;
    this.reconnectAttempts++;

    if (this.reconnectAttempts <= this.maxReconnectAttempts) {
      this.logger.info(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(async (): Promise<void> => {
        try {
          await this.start();
          this.reconnectAttempts = 0; // Reset on successful reconnection
        } catch (error) {
          this.logger.error('Reconnection failed', {
            attempt: this.reconnectAttempts,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }, this.reconnectDelayMs);
    } else {
      this.logger.error('Max reconnection attempts reached, giving up');
    }
  }

  /**
   * Stop consuming events
   */
  async stop(): Promise<void> {
    this.isShuttingDown = true;
    this.isConnected = false;

    try {
      if (this.channel) {
        await this.channel.close();
        this.channel = null;
      }

      if (this.connection) {
        await this.connection.close();
        this.connection = null;
      }

      this.logger.info('Patient Event Consumer stopped successfully');

    } catch (error) {
      this.logger.error('Error stopping Patient Event Consumer', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get connection status
   */
  isRunning(): boolean {
    return this.isConnected && !this.isShuttingDown;
  }
}
