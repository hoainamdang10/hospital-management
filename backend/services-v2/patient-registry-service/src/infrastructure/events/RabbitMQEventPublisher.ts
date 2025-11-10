/**
 * RabbitMQEventPublisher - RabbitMQ Domain Event Publisher
 * Publishes domain events to RabbitMQ message broker
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Event-Driven Architecture, Clean Architecture
 */

import amqp, { Channel, ChannelModel } from "amqplib";
import { DomainEvent, buildRoutingKey } from "@shared/domain/base/domain-event";
import {
  IDomainEventPublisher,
  DomainEventPublisherConfig,
} from "@shared/domain/events/IDomainEventPublisher";
import { ILogger } from "@shared/application/services/logger.interface";
import { connectRabbitMQWithRetry } from "@shared/infrastructure/event-bus/rabbitmq-connection";

export interface RabbitMQConfig {
  url: string;
  exchange: string;
  exchangeType: "topic" | "fanout" | "direct";
  durable: boolean;
  autoDelete: boolean;
  serviceName?: string;
  connectionRetries?: number;
  connectionRetryDelayMs?: number;
}

/**
 * RabbitMQ Event Publisher
 * Implements IDomainEventPublisher using RabbitMQ
 */
export class RabbitMQEventPublisher implements IDomainEventPublisher {
  private connection: ChannelModel | null = null;
  private channel: Channel | null = null;
  private isConnected = false;
  private intentionallyClosed = false;
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private readonly maxReconnectAttempts = 10;
  private readonly reconnectDelayMs = 5000;

  constructor(
    private readonly config: RabbitMQConfig,
    private readonly publisherConfig: DomainEventPublisherConfig,
    private readonly logger: ILogger,
  ) {}

  /**
   * Initialize connection to RabbitMQ
   */
  async connect(): Promise<void> {
    try {
      this.logger.info("Connecting to RabbitMQ...", {
        url: this.config.url.replace(/\/\/.*@/, "//***@"), // Hide credentials
        exchange: this.config.exchange,
      });

      // Reset intentionally closed flag
      this.intentionallyClosed = false;

      const connectionName = this.config.serviceName
        ? `${this.config.serviceName}-publisher`
        : "RabbitMQ Event Publisher";

      // Create connection with retry logic
      this.connection = await connectRabbitMQWithRetry(
        () => amqp.connect(this.config.url),
        this.logger,
        {
          connectionName,
          maxAttempts: this.config.connectionRetries,
          initialDelayMs: this.config.connectionRetryDelayMs,
        },
      );

      // Handle connection errors
      this.connection.on("error", (err: Error) => {
        this.logger.error("RabbitMQ connection error", { error: err.message });
        this.isConnected = false;
      });

      this.connection.on("close", () => {
        this.logger.warn("RabbitMQ connection closed");
        this.isConnected = false;

        // Only reconnect if not intentionally closed
        if (!this.intentionallyClosed) {
          this.reconnect();
        }
      });

      // Create channel
      if (!this.connection) {
        throw new Error("Connection is null after connect");
      }

      this.channel = await this.connection.createChannel();

      // Assert exchange
      await this.channel.assertExchange(
        this.config.exchange,
        this.config.exchangeType,
        {
          durable: this.config.durable,
          autoDelete: this.config.autoDelete,
        },
      );

      this.isConnected = true;
      this.reconnectAttempts = 0;

      this.logger.info("RabbitMQ Event Publisher connected", {
        exchange: this.config.exchange,
      });
    } catch (error) {
      this.logger.error("Failed to connect to RabbitMQ", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Reconnect to RabbitMQ
   */
  private async reconnect(): Promise<void> {
    // Clear existing timer if any
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.logger.error("Max reconnect attempts reached. Giving up.");
      return;
    }

    this.reconnectAttempts++;
    this.logger.info(
      `Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`,
    );

    this.reconnectTimer = setTimeout(async () => {
      try {
        await this.connect();
      } catch (error) {
        this.logger.error("Reconnect failed", {
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }, this.reconnectDelayMs);
  }

  /**
   * Publish a single domain event
   */
  async publish(event: DomainEvent): Promise<void> {
    if (!this.isConnected || !this.channel) {
      throw new Error("RabbitMQ publisher is not connected");
    }

    try {
      const routingKey = this.getRoutingKey(event);
      const message = this.serializeEvent(event);

      const published = this.channel.publish(
        this.config.exchange,
        routingKey,
        Buffer.from(message),
        {
          persistent: true,
          contentType: "application/json",
          timestamp: Date.now(),
          messageId: event.eventId,
          type: event.eventType,
          headers: {
            aggregateId: event.aggregateId,
            occurredAt: event.occurredAt.toISOString(),
          },
        },
      );

      if (!published) {
        throw new Error("Failed to publish event - channel buffer full");
      }

      if (this.publisherConfig.enableLogging) {
        this.logger.info("Event published", {
          eventType: event.eventType,
          eventId: event.eventId,
          routingKey,
        });
      }
    } catch (error) {
      this.logger.error("Failed to publish event", {
        eventType: event.eventType,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Publish multiple domain events in batch
   */
  async publishBatch(events: DomainEvent[]): Promise<void> {
    if (!this.isConnected || !this.channel) {
      throw new Error("RabbitMQ publisher is not connected");
    }

    try {
      for (const event of events) {
        await this.publish(event);
      }

      if (this.publisherConfig.enableLogging) {
        this.logger.info("Batch events published", {
          count: events.length,
        });
      }
    } catch (error) {
      this.logger.error("Failed to publish batch events", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Publish event with retry mechanism
   */
  async publishWithRetry(
    event: DomainEvent,
    maxRetries: number = 3,
  ): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.publish(event);
        return; // Success
      } catch (error) {
        lastError = error instanceof Error ? error : new Error("Unknown error");
        this.logger.warn(`Publish attempt ${attempt}/${maxRetries} failed`, {
          eventType: event.eventType,
          error: lastError.message,
        });

        if (attempt < maxRetries) {
          // Wait before retry with exponential backoff
          const delayMs = this.publisherConfig.retryDelayMs || 1000;
          await new Promise((resolve) =>
            setTimeout(resolve, delayMs * attempt),
          );
        }
      }
    }

    throw new Error(
      `Failed to publish event after ${maxRetries} attempts: ${lastError?.message}`,
    );
  }

  /**
   * Schedule event for future publishing
   */
  async scheduleEvent(event: DomainEvent, publishAt: Date): Promise<void> {
    const delayMs = publishAt.getTime() - Date.now();

    if (delayMs <= 0) {
      // Publish immediately
      await this.publish(event);
      return;
    }

    // Schedule for future
    setTimeout(async () => {
      try {
        await this.publish(event);
      } catch (error) {
        this.logger.error("Failed to publish scheduled event", {
          eventType: event.eventType,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }, delayMs);

    this.logger.info("Event scheduled", {
      eventType: event.eventType,
      publishAt: publishAt.toISOString(),
      delayMs,
    });
  }

  /**
   * Check if publisher is healthy
   */
  async isHealthy(): Promise<boolean> {
    return this.isConnected && this.channel !== null;
  }

  /**
   * Close connection
   */
  async close(): Promise<void> {
    try {
      // Set flag to prevent reconnect
      this.intentionallyClosed = true;

      // Clear reconnect timer if any
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }

      if (this.channel) {
        await this.channel.close();
        this.channel = null;
      }

      if (this.connection) {
        await this.connection.close();
        this.connection = null;
      }

      this.isConnected = false;
      this.logger.info("RabbitMQ Event Publisher disconnected");
    } catch (error) {
      this.logger.error("Error closing RabbitMQ connection", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Get routing key for event
   */
  private getRoutingKey(event: DomainEvent): string {
    try {
      const routingKey = event.getRoutingKey();
      if (routingKey && routingKey.length > 0) {
        return routingKey;
      }
    } catch {
      // Fall back to manual builder below
    }

    return buildRoutingKey(event.aggregateType, event.eventType);
  }

  /**
   * Serialize event to JSON
   */
  private serializeEvent(event: DomainEvent): string {
    // Use toJSON() method from DomainEvent base class
    return JSON.stringify(event.toJSON());
  }

}
