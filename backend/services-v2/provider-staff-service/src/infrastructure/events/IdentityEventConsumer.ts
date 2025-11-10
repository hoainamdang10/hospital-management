/**
 * IdentityEventConsumer - RabbitMQ Consumer for Identity Service Events
 * Provider/Staff Service V2
 *
 * Subscribes to Identity Service events via RabbitMQ and routes to appropriate handlers
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Event-Driven Architecture, Clean Architecture, HIPAA
 */

import * as amqp from "amqplib";
import { ILogger } from "../../application/interfaces/ILogger";
import { UserCreatedEventHandler } from "./UserCreatedEventHandler";
import { UserDeactivatedEventHandler } from "./UserDeactivatedEventHandler";
import { UserRoleChangedEventHandler } from "./UserRoleChangedEventHandler";
import {
  UserCreatedEvent,
  UserDeactivatedEvent,
  UserRoleChangedEvent,
} from "@shared/domain/events/domain-events";
import { connectRabbitMQWithRetry } from "@shared/infrastructure/event-bus/rabbitmq-connection";

export interface IdentityEventConsumerConfig {
  rabbitmqUrl: string;
  exchange: string;
  queueName: string;
  routingKeys: string[];
  prefetchCount?: number;
  retryAttempts?: number;
  retryDelayMs?: number;
  connectionRetries?: number;
  connectionRetryDelayMs?: number;
}

/**
 * RabbitMQ Consumer for Identity Service Events
 * Subscribes to user.* events and routes to handlers
 */
export class IdentityEventConsumer {
  private connection: amqp.Connection | undefined = undefined;
  private channel: amqp.Channel | undefined = undefined;
  private isConnected: boolean = false;

  constructor(
    private config: IdentityEventConsumerConfig,
    private logger: ILogger,
    private userCreatedHandler: UserCreatedEventHandler,
    private userDeactivatedHandler: UserDeactivatedEventHandler,
    private userRoleChangedHandler: UserRoleChangedEventHandler,
  ) {}

  /**
   * Connect to RabbitMQ and start consuming
   */
  async connect(): Promise<void> {
    try {
      this.logger.info("Connecting to RabbitMQ for Identity Service events", {
        url: this.config.rabbitmqUrl,
        exchange: this.config.exchange,
        queueName: this.config.queueName,
      });

      const connectionName = "IdentityEventConsumer";
      const connectionRetries =
        this.config.connectionRetries ??
        Number(process.env.RABBITMQ_CONNECT_MAX_RETRIES || 5);
      const connectionRetryDelayMs =
        this.config.connectionRetryDelayMs ??
        Number(process.env.RABBITMQ_CONNECT_RETRY_DELAY_MS || 3000);

      // Create connection with retry logic
      this.connection = await connectRabbitMQWithRetry(
        () => amqp.connect(this.config.rabbitmqUrl) as any,
        this.logger,
        {
          connectionName,
          maxAttempts: connectionRetries,
          initialDelayMs: connectionRetryDelayMs,
        },
      );
      this.channel = await (this.connection as any).createChannel();

      // Set prefetch count for fair dispatch
      await this.channel!.prefetch(this.config.prefetchCount || 1);

      // Assert exchange (should already exist, created by Identity Service)
      await this.channel!.assertExchange(this.config.exchange, "topic", {
        durable: true,
      });

      // Assert queue
      await this.channel!.assertQueue(this.config.queueName, {
        durable: true,
        arguments: {
          "x-message-ttl": 86400000, // 24 hours
          "x-max-length": 10000,
          "x-dead-letter-exchange": `${this.config.exchange}.dlx`,
          "x-dead-letter-routing-key": "dead-letter",
        },
      });

      // Bind queue to exchange with routing keys
      for (const routingKey of this.config.routingKeys) {
        await this.channel!.bindQueue(
          this.config.queueName,
          this.config.exchange,
          routingKey,
        );
        this.logger.info("Queue bound to exchange", {
          queue: this.config.queueName,
          exchange: this.config.exchange,
          routingKey,
        });
      }

      // Start consuming
      await this.channel!.consume(
        this.config.queueName,
        async (msg) => {
          if (!msg) return;

          try {
            await this.handleMessage(msg);
            this.channel!.ack(msg);
          } catch (error) {
            this.logger.error("Error processing message", {
              error: error instanceof Error ? error.message : "Unknown error",
              messageId: msg.properties.messageId,
            });

            // Retry logic
            const retryCount = (msg.properties.headers?.["x-retry-count"] ||
              0) as number;
            const maxRetries = this.config.retryAttempts || 3;

            if (retryCount < maxRetries) {
              // Requeue with delay
              setTimeout(() => {
                if (this.channel) {
                  this.channel.nack(msg, false, true);
                }
              }, this.config.retryDelayMs || 1000);
            } else {
              // Send to dead letter queue
              this.channel!.nack(msg, false, false);
            }
          }
        },
        { noAck: false },
      );

      this.isConnected = true;
      this.logger.info(
        "Successfully connected to RabbitMQ and started consuming Identity Service events",
        {
          queueName: this.config.queueName,
          routingKeys: this.config.routingKeys,
        },
      );

      // Handle connection errors
      this.connection!.on("error", (err) => {
        this.logger.error("RabbitMQ connection error", { error: err.message });
        this.isConnected = false;
      });

      this.connection!.on("close", () => {
        this.logger.warn("RabbitMQ connection closed");
        this.isConnected = false;
        // Attempt reconnection after delay
        setTimeout(() => this.connect(), 5000);
      });
    } catch (error) {
      this.logger.error("Failed to connect to RabbitMQ", {
        error: error instanceof Error ? error.message : "Unknown error",
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

    this.logger.info("Received message from Identity Service", {
      routingKey,
      messageId: msg.properties.messageId,
      timestamp: msg.properties.timestamp,
    });

    try {
      const event = JSON.parse(content);

      // Route to appropriate handler based on event type
      switch (event.eventType) {
        case "UserCreatedEvent":
          await this.handleUserCreated(event);
          break;

        case "UserDeletedEvent":
        case "UserDeactivatedEvent":
          // Handle both UserDeletedEvent (soft delete) and UserDeactivatedEvent
          await this.handleUserDeactivated(event);
          break;

        case "UserRoleChangedEvent":
          await this.handleUserRoleChanged(event);
          break;

        default:
          this.logger.warn("Unknown event type from Identity Service", {
            eventType: event.eventType,
            eventId: event.eventId,
          });
      }
    } catch (error) {
      this.logger.error("Error parsing or handling message", {
        error: error instanceof Error ? error.message : "Unknown error",
        routingKey,
        messageId: msg.properties.messageId,
      });
      throw error;
    }
  }

  /**
   * Handle UserCreated event
   */
  private async handleUserCreated(eventData: any): Promise<void> {
    const payload = eventData.payload || eventData;
    const event = new UserCreatedEvent(
      payload.userId || eventData.aggregateId,
      payload.email,
      payload.fullName || "",
      payload.role || payload.roleType,
      payload.citizenId,
      payload.phoneNumber,
    );

    await this.userCreatedHandler.handle(event);
  }

  /**
   * Handle UserDeactivated event
   */
  private async handleUserDeactivated(eventData: any): Promise<void> {
    const payload = eventData.payload || eventData;
    const event = new UserDeactivatedEvent(
      payload.userId || eventData.aggregateId,
      payload.email,
      payload.reason || "User deactivated",
      payload.deactivatedBy || payload.deletedBy || "system",
    );

    await this.userDeactivatedHandler.handle(event);
  }

  /**
   * Handle UserRoleChanged event
   */
  private async handleUserRoleChanged(eventData: any): Promise<void> {
    const payload = eventData.payload || eventData;
    const event = new UserRoleChangedEvent(
      payload.userId || eventData.aggregateId,
      payload.oldRole,
      payload.newRole,
      payload.changedBy || "system",
      payload.reason,
    );

    await this.userRoleChangedHandler.handle(event);
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
        await (this.connection as any).close();
        this.connection = undefined;
      }

      this.isConnected = false;
      this.logger.info("Disconnected from RabbitMQ");
    } catch (error) {
      this.logger.error("Error disconnecting from RabbitMQ", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Check if consumer is connected
   */
  isHealthy(): boolean {
    return (
      this.isConnected &&
      this.connection !== undefined &&
      this.channel !== undefined
    );
  }

  /**
   * Get consumer statistics
   */
  getStatistics(): any {
    return {
      isConnected: this.isConnected,
      queueName: this.config.queueName,
      exchange: this.config.exchange,
      routingKeys: this.config.routingKeys,
      prefetchCount: this.config.prefetchCount || 1,
    };
  }
}
