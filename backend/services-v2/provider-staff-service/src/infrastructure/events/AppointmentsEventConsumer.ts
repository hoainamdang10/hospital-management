/**
 * AppointmentsEventConsumer - RabbitMQ Consumer for Appointments Service Events
 * Provider/Staff Service V2
 *
 * Subscribes to Appointments Service events via RabbitMQ and routes to appropriate handlers
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Event-Driven Architecture, Clean Architecture, HIPAA
 */

import * as amqp from "amqplib";
import { ILogger } from "../../application/interfaces/ILogger";
import { AppointmentScheduledEventHandler } from "./AppointmentScheduledEventHandler";
import { AppointmentCancelledEventHandler } from "./AppointmentCancelledEventHandler";
import { AppointmentCompletedEventHandler } from "./AppointmentCompletedEventHandler";
import { connectRabbitMQWithRetry } from "@shared/infrastructure/event-bus/rabbitmq-connection";

export interface AppointmentsEventConsumerConfig {
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
 * RabbitMQ Consumer for Appointments Service Events
 * Subscribes to appointment.* events and routes to handlers
 */
export class AppointmentsEventConsumer {
  private connection: amqp.Connection | undefined = undefined;
  private channel: amqp.Channel | undefined = undefined;
  private isConnected: boolean = false;

  constructor(
    private config: AppointmentsEventConsumerConfig,
    private logger: ILogger,
    private appointmentScheduledHandler: AppointmentScheduledEventHandler,
    private appointmentCancelledHandler: AppointmentCancelledEventHandler,
    private appointmentCompletedHandler: AppointmentCompletedEventHandler,
  ) {}

  /**
   * Connect to RabbitMQ and start consuming
   */
  async connect(): Promise<void> {
    try {
      this.logger.info("Connecting to RabbitMQ for Appointments events", {
        url: this.config.rabbitmqUrl.replace(/\/\/.*@/, "//***@"), // Mask credentials
        exchange: this.config.exchange,
        queue: this.config.queueName,
      });

      const connectionName = "AppointmentsEventConsumer";
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

      // Set prefetch count
      await this.channel!.prefetch(this.config.prefetchCount || 10);

      // Assert exchange
      await this.channel!.assertExchange(this.config.exchange, "topic", {
        durable: true,
      });

      // Assert queue
      await this.channel!.assertQueue(this.config.queueName, {
        durable: true,
        arguments: {
          "x-message-ttl": 86400000, // 24 hours
          "x-max-length": 10000,
        },
      });

      // Bind queue to routing keys
      for (const routingKey of this.config.routingKeys) {
        await this.channel!.bindQueue(
          this.config.queueName,
          this.config.exchange,
          routingKey,
        );
        this.logger.info("Bound queue to routing key", {
          queue: this.config.queueName,
          routingKey,
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
        { noAck: false },
      );

      this.isConnected = true;
      this.logger.info("AppointmentsEventConsumer connected successfully", {
        queue: this.config.queueName,
        routingKeys: this.config.routingKeys,
      });

      // Handle connection errors
      (this.connection as any).on("error", (err: Error) => {
        this.logger.error("RabbitMQ connection error", {
          error: err.message,
        });
        this.isConnected = false;
      });

      (this.connection as any).on("close", () => {
        this.logger.warn("RabbitMQ connection closed");
        this.isConnected = false;
      });
    } catch (error) {
      this.logger.error("Failed to connect AppointmentsEventConsumer", {
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

    this.logger.info("Received message from Appointments Service", {
      routingKey,
      messageId: msg.properties.messageId,
      timestamp: msg.properties.timestamp,
    });

    try {
      const event = JSON.parse(content);

      // Route to appropriate handler based on event type
      switch (event.eventType) {
        case "AppointmentScheduled":
          await this.handleAppointmentScheduled(event);
          break;

        case "AppointmentCancelled":
          await this.handleAppointmentCancelled(event);
          break;

        case "AppointmentCompleted":
          await this.handleAppointmentCompleted(event);
          break;

        case "AppointmentRescheduled":
          await this.handleAppointmentRescheduled(event);
          break;

        default:
          this.logger.warn("Unknown event type from Appointments Service", {
            eventType: event.eventType,
            eventId: event.eventId,
          });
      }

      // Acknowledge message
      this.channel?.ack(msg);
    } catch (error) {
      this.logger.error("Error parsing or handling message", {
        error: error instanceof Error ? error.message : "Unknown error",
        routingKey,
        messageId: msg.properties.messageId,
      });

      // Reject and requeue message for retry
      this.channel?.nack(msg, false, true);
    }
  }

  /**
   * Handle AppointmentScheduled event
   */
  private async handleAppointmentScheduled(eventData: any): Promise<void> {
    await this.appointmentScheduledHandler.handle({
      appointmentId: eventData.appointmentId || eventData.aggregateId,
      patientId: eventData.patientId || eventData.eventData?.patientId,
      doctorId: eventData.doctorId || eventData.eventData?.doctorId,
      scheduledTime:
        eventData.scheduledTime || eventData.eventData?.scheduledTime,
      duration: eventData.duration || eventData.eventData?.duration,
      appointmentType:
        eventData.appointmentType || eventData.eventData?.appointmentType,
      status: eventData.status || eventData.eventData?.status || "scheduled",
    });
  }

  /**
   * Handle AppointmentCancelled event
   */
  private async handleAppointmentCancelled(eventData: any): Promise<void> {
    await this.appointmentCancelledHandler.handle({
      appointmentId: eventData.appointmentId || eventData.aggregateId,
      doctorId: eventData.doctorId || eventData.eventData?.doctorId,
      cancelledBy: eventData.cancelledBy || eventData.eventData?.cancelledBy,
      cancellationReason:
        eventData.cancellationReason || eventData.eventData?.cancellationReason,
      cancelledAt: eventData.cancelledAt || eventData.occurredAt,
    });
  }

  /**
   * Handle AppointmentCompleted event
   */
  private async handleAppointmentCompleted(eventData: any): Promise<void> {
    await this.appointmentCompletedHandler.handle({
      appointmentId: eventData.appointmentId || eventData.aggregateId,
      doctorId: eventData.doctorId || eventData.eventData?.doctorId,
      patientId: eventData.patientId || eventData.eventData?.patientId,
      completedAt: eventData.completedAt || eventData.occurredAt,
      duration: eventData.duration || eventData.eventData?.actualDuration,
    });
  }

  /**
   * Handle AppointmentRescheduled event
   */
  private async handleAppointmentRescheduled(eventData: any): Promise<void> {
    // Treat as cancelled + scheduled
    await this.handleAppointmentCancelled({
      ...eventData,
      cancellationReason: "Rescheduled",
    });
    await this.handleAppointmentScheduled(eventData);
  }

  /**
   * Disconnect from RabbitMQ
   */
  async disconnect(): Promise<void> {
    try {
      await this.channel?.close();
      await (this.connection as any)?.close();
      this.isConnected = false;
      this.logger.info("AppointmentsEventConsumer disconnected");
    } catch (error) {
      this.logger.error("Error disconnecting AppointmentsEventConsumer", {
        error: error instanceof Error ? error.message : "Unknown error",
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
