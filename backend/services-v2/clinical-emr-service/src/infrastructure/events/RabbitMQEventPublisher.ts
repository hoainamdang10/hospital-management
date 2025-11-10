import amqp, { Channel, ChannelModel } from "amqplib";
import { DomainEvent } from "../../shared/domain-event";
import { ILogger } from "../../shared/logger";
import { connectRabbitMQWithRetry } from "../../shared/rabbitmq-connection";

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

export interface PublisherConfig {
  enableRetry: boolean;
  maxRetries: number;
  retryDelayMs: number;
  enableLogging?: boolean;
}

export class RabbitMQEventPublisher {
  private connection: ChannelModel | null = null;
  private channel: Channel | null = null;
  private isConnected = false;
  private intentionallyClosed = false;

  constructor(
    private readonly config: RabbitMQConfig,
    private readonly publisherConfig: PublisherConfig,
    private readonly logger: ILogger,
  ) {}

  async connect(): Promise<void> {
    this.logger.info("[RabbitMQPublisher] Connecting...", {
      exchange: this.config.exchange,
    });

    const connectionName = this.config.serviceName
      ? `${this.config.serviceName}-publisher`
      : "clinical-emr-publisher";

    this.connection = await connectRabbitMQWithRetry(
      () => amqp.connect(this.config.url),
      this.logger,
      {
        connectionName,
        maxAttempts: this.config.connectionRetries ?? 5,
        initialDelayMs: this.config.connectionRetryDelayMs ?? 1000,
      },
    );

    this.connection.on("error", (error: Error) => {
      this.isConnected = false;
      this.logger.error("[RabbitMQPublisher] Connection error", {
        error: error.message,
      });
    });

    this.connection.on("close", () => {
      this.isConnected = false;
      if (!this.intentionallyClosed) {
        this.logger.warn(
          "[RabbitMQPublisher] Connection closed, reconnecting...",
        );
        setTimeout(
          () => this.connect().catch((err) => this.logger.error(err.message)),
          3000,
        );
      }
    });

    this.channel = await this.connection.createChannel();
    await this.channel.assertExchange(
      this.config.exchange,
      this.config.exchangeType,
      {
        durable: this.config.durable,
        autoDelete: this.config.autoDelete,
      },
    );

    this.isConnected = true;
    this.logger.info("[RabbitMQPublisher] Connected to exchange", {
      exchange: this.config.exchange,
    });
  }

  async disconnect(): Promise<void> {
    this.intentionallyClosed = true;
    if (this.channel) {
      await this.channel.close();
    }
    if (this.connection) {
      await this.connection.close();
    }
    this.isConnected = false;
  }

  async publish(event: DomainEvent): Promise<void> {
    if (!this.isConnected || !this.channel) {
      throw new Error("RabbitMQ publisher is not connected");
    }

    const routingKey = `${event.aggregateType.toLowerCase()}.${event.eventType.toLowerCase()}`;
    const payload = Buffer.from(JSON.stringify(event.toJSON()));

    const published = this.channel.publish(
      this.config.exchange,
      routingKey,
      payload,
      {
        persistent: true,
        contentType: "application/json",
        messageId: event.eventId,
        timestamp: Date.now(),
        type: event.eventType,
      },
    );

    if (!published) {
      throw new Error("Failed to publish event: channel buffer full");
    }

    if (this.publisherConfig.enableLogging) {
      this.logger.info("[RabbitMQPublisher] Event published", {
        routingKey,
        eventId: event.eventId,
      });
    }
  }

  async publishBatch(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      await this.publish(event);
    }
  }

  async subscribe(): Promise<void> {
    throw new Error("Subscribe is not implemented for this publisher");
  }

  async unsubscribe(): Promise<void> {
    throw new Error("Unsubscribe is not implemented for this publisher");
  }
}
