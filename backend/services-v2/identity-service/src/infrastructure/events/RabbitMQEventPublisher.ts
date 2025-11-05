/**
 * RabbitMQ Event Publisher
 * Publishes domain events to RabbitMQ message broker
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */

import * as amqp from "amqplib";
import type { Connection, Channel } from "amqplib";
import { DomainEvent } from "@shared/domain/base/domain-event";
import { ILogger } from "../../application/services/ILogger";
import {
  IEventPublisher,
  IntegrationEventPayload,
} from "../../application/services/IEventPublisher";
import { DomainEventMapper } from "./DomainEventMapper";

export class RabbitMQEventPublisher implements IEventPublisher {
  private connection: Connection | null = null;
  private channel: Channel | null = null;
  private readonly exchangeName = "hospital.events";
  private isConnected = false;
  private readonly pendingEvents: IntegrationEventPayload[] = [];
  private flushingPending = false;
  private readonly maxPublishAttempts = 3;
  private readonly publishRetryDelayMs = 500;

  constructor(
    private readonly rabbitMQUrl: string,
    private readonly logger: ILogger,
  ) {}

  /**
   * Initialize RabbitMQ connection and channel
   */
  async initialize(): Promise<void> {
    try {
      this.logger.info("Connecting to RabbitMQ", {
        url: this.rabbitMQUrl.replace(/\/\/.*@/, "//<credentials>@"),
      });

      // Create connection - explicit type assertion for amqplib compatibility
      // Note: amqplib types have issues, using unknown cast to fix
      const connection = await amqp.connect(this.rabbitMQUrl);
      this.connection = connection as unknown as Connection;

      // Handle connection errors
      if (this.connection) {
        this.connection.on("error", (err) => {
          this.logger.error("RabbitMQ connection error", {
            error: err.message,
          });
          this.isConnected = false;
        });

        this.connection.on("close", () => {
          this.logger.warn("RabbitMQ connection closed");
          this.isConnected = false;
        });

        // Create channel
        // @ts-expect-error - amqplib type definitions issue
        this.channel = await this.connection.createChannel();
      }

      // Declare exchange (topic exchange for routing by event type)
      if (this.channel) {
        await this.channel.assertExchange(this.exchangeName, "topic", {
          durable: true,
        });
      }

      this.isConnected = true;
      this.logger.info("RabbitMQ connection established", {
        exchange: this.exchangeName,
      });
      await this.flushPendingEvents();
    } catch (error) {
      this.logger.error("Failed to initialize RabbitMQ", {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Publish a single domain event
   */
  async publishIntegrationEvent(event: IntegrationEventPayload): Promise<void> {
    if (!this.isConnected || !this.channel) {
      this.logger.warn(
        "RabbitMQ not connected, queueing event for later publish",
        {
          eventType: event.eventType,
        },
      );
      this.pendingEvents.push(event);
      return;
    }

    try {
      await this.publishWithRetry(event);
    } catch (error) {
      this.logger.error("Failed to publish event", {
        eventType: event.eventType,
        error: error instanceof Error ? error.message : String(error),
      });
      this.pendingEvents.push(event);
      throw error;
    }
  }

  /**
   * Publish multiple events in batch
   */
  async publishDomainEvents(events: DomainEvent[]): Promise<void> {
    if (events.length === 0) {
      return;
    }

    const rabbitEvents = DomainEventMapper.toRabbitMQEvents(events);
    for (const event of rabbitEvents) {
      await this.publishIntegrationEvent(event);
    }
  }

  /**
   * Close RabbitMQ connection
   */
  async close(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
        this.channel = null;
      }

      if (this.connection) {
        // @ts-expect-error - amqplib type definitions issue
        await this.connection.close();
        this.connection = null;
      }

      this.isConnected = false;
      this.logger.info("RabbitMQ connection closed");
    } catch (error) {
      this.logger.error("Error closing RabbitMQ connection", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Get routing key for event
   * Format: {aggregateType}.{eventType}
   * Example: user.registered, user.activated, user.role_changed
   */
  private getRoutingKey(event: IntegrationEventPayload): string {
    const servicePrefix = "identity";

    const entity =
      event.aggregateType
        .replace(/event$/i, "")
        .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
        .replace(/[_\s]+/g, "-")
        .toLowerCase() || "generic";

    const rawAction = event.eventType.replace(/Event$/, "");
    const aggregateRegex = new RegExp(`^${event.aggregateType}`, "i");
    const trimmedAction = rawAction.replace(aggregateRegex, "") || rawAction;

    const action =
      trimmedAction
        .replace(/([a-z0-9])([A-Z])/g, "$1.$2")
        .replace(/([A-Z]+)([A-Z][a-z])/g, "$1.$2")
        .replace(/[_\s]+/g, ".")
        .replace(/\.+/g, ".")
        .replace(/^\./, "")
        .toLowerCase() || "event";

    return `${servicePrefix}.${entity}.${action}`;
  }

  private async publishWithRetry(
    event: IntegrationEventPayload,
    attempt = 1,
  ): Promise<void> {
    if (!this.channel) {
      throw new Error("RabbitMQ channel not available");
    }

    const routingKey = this.getRoutingKey(event);
    const message = JSON.stringify({
      ...event,
      occurredAt: event.occurredAt.toISOString(),
    });

    try {
      const published = this.channel.publish(
        this.exchangeName,
        routingKey,
        Buffer.from(message),
        {
          persistent: true,
          contentType: "application/json",
          timestamp: Date.now(),
          messageId: `${event.aggregateId}-${Date.now()}`,
          type: event.eventType,
        },
      );

      if (!published) {
        this.logger.warn("Event publish buffer full, waiting...", {
          eventType: event.eventType,
          routingKey,
        });
        await new Promise((resolve) => this.channel!.once("drain", resolve));
      }

      this.logger.info("Event published", {
        eventType: event.eventType,
        aggregateId: event.aggregateId,
        routingKey,
        attempt,
      });
    } catch (error) {
      if (attempt < this.maxPublishAttempts) {
        const delay = this.publishRetryDelayMs * attempt;
        this.logger.warn("Retrying event publish", {
          eventType: event.eventType,
          attempt,
          delay,
        });
        await new Promise((resolve) => setTimeout(resolve, delay));
        await this.publishWithRetry(event, attempt + 1);
        return;
      }

      throw error instanceof Error ? error : new Error(String(error));
    }
  }

  private async flushPendingEvents(): Promise<void> {
    if (this.flushingPending || !this.isConnected || !this.channel) {
      return;
    }

    if (this.pendingEvents.length === 0) {
      return;
    }

    this.flushingPending = true;

    try {
      this.logger.info("Flushing pending RabbitMQ events", {
        count: this.pendingEvents.length,
      });

      const queuedEvents = [...this.pendingEvents];
      this.pendingEvents.length = 0;

      for (const pendingEvent of queuedEvents) {
        await this.publishIntegrationEvent(pendingEvent);
      }
    } finally {
      this.flushingPending = false;
    }
  }
}

/**
 * Mock Event Publisher for testing
 */
export class MockEventPublisher implements IEventPublisher {
  private integrationEvents: IntegrationEventPayload[] = [];
  private domainEvents: DomainEvent[] = [];

  constructor(private readonly logger: ILogger) {}

  async initialize(): Promise<void> {
    this.logger.info("Mock Event Publisher initialized");
  }

  async close(): Promise<void> {
    this.logger.info("Mock Event Publisher closed");
  }

  async publishIntegrationEvent(event: IntegrationEventPayload): Promise<void> {
    this.integrationEvents.push(event);
    this.logger.info("Mock integration event published", {
      eventType: event.eventType,
      aggregateId: event.aggregateId,
    });
  }

  async publishDomainEvents(events: DomainEvent[]): Promise<void> {
    this.domainEvents.push(...events);
    this.logger.info("Mock domain events published", {
      count: events.length,
    });
  }

  getIntegrationEvents(): IntegrationEventPayload[] {
    return [...this.integrationEvents];
  }

  getDomainEvents(): DomainEvent[] {
    return [...this.domainEvents];
  }

  clear(): void {
    this.integrationEvents = [];
    this.domainEvents = [];
  }
}
