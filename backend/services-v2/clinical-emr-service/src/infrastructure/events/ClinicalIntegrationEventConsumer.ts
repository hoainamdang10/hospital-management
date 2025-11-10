import amqp, { Channel, ChannelModel, ConsumeMessage } from "amqplib";
import { v4 as uuidv4 } from "uuid";
import { ILogger } from "../../shared/logger";
import { connectRabbitMQWithRetry } from "../../shared/rabbitmq-connection";
import { SupabaseIntegrationInboxRepository } from "../repositories/SupabaseIntegrationInboxRepository";
import { ClinicalIntegrationSyncService } from "../../application/services/ClinicalIntegrationSyncService";

export interface ClinicalIntegrationConsumerConfig {
  url: string;
  exchange: string;
  queueName: string;
  routingKeys: string[];
  prefetch?: number;
  serviceName?: string;
  deadLetterExchange?: string;
  deadLetterRoutingKey?: string;
}

export class ClinicalIntegrationEventConsumer {
  private connection: ChannelModel | null = null;
  private channel: Channel | null = null;
  private isRunning = false;
  private reconnectTimer?: NodeJS.Timeout;

  constructor(
    private readonly config: ClinicalIntegrationConsumerConfig,
    private readonly logger: ILogger,
    private readonly inboxRepository: SupabaseIntegrationInboxRepository,
    private readonly syncService: ClinicalIntegrationSyncService,
  ) {}

  async start(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    await this.connect();
  }

  async stop(): Promise<void> {
    this.isRunning = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }

    const channel = this.channel;
    if (channel) {
      await channel.close().catch(() => undefined);
      this.channel = null;
    }
    const connection = this.connection;
    if (connection) {
      await connection.close().catch(() => undefined);
      this.connection = null;
    }
  }

  private async connect(): Promise<void> {
    try {
      this.logger.info("[IntegrationConsumer] Connecting to RabbitMQ...", {
        queue: this.config.queueName,
      });

      this.connection = await connectRabbitMQWithRetry(
        () => amqp.connect(this.config.url),
        this.logger,
        {
          connectionName:
            this.config.serviceName ?? "clinical-integration-consumer",
        },
      );

      this.connection.on("close", () => {
        this.logger.warn("[IntegrationConsumer] Connection closed");
        if (this.isRunning) {
          this.scheduleReconnect();
        }
      });

      this.connection.on("error", (error) => {
        this.logger.error("[IntegrationConsumer] Connection error", {
          error: error?.message,
        });
      });

      this.channel = await this.connection.createChannel();
      await this.setupBindings();

      const prefetch = this.config.prefetch ?? 5;
      this.channel.prefetch(prefetch);

      await this.channel.consume(
        this.config.queueName,
        (msg) => this.handleMessage(msg),
        { noAck: false },
      );

      this.logger.info("[IntegrationConsumer] Listening for events", {
        queue: this.config.queueName,
        routingKeys: this.config.routingKeys,
      });
    } catch (error) {
      this.logger.error("[IntegrationConsumer] Failed to connect", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (!this.isRunning) {
      return;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.reconnectTimer = setTimeout(() => {
      this.connect().catch((error) =>
        this.logger.error("[IntegrationConsumer] Reconnect failed", {
          error: error instanceof Error ? error.message : "Unknown error",
        }),
      );
    }, 5000);
  }

  private async setupBindings(): Promise<void> {
    if (!this.channel) {
      throw new Error("RabbitMQ channel not initialized");
    }

    await this.channel.assertExchange(this.config.exchange, "topic", {
      durable: true,
    });

    await this.channel.assertQueue(this.config.queueName, {
      durable: true,
      deadLetterExchange: this.config.deadLetterExchange,
      deadLetterRoutingKey: this.config.deadLetterRoutingKey,
    });

    for (const key of this.config.routingKeys) {
      await this.channel.bindQueue(
        this.config.queueName,
        this.config.exchange,
        key,
      );
    }
  }

  private async handleMessage(msg: ConsumeMessage | null): Promise<void> {
    if (!msg || !this.channel) {
      return;
    }

    const routingKey = msg.fields.routingKey;
    let envelope: Record<string, any>;

    try {
      envelope = JSON.parse(msg.content.toString("utf-8"));
    } catch (error) {
      this.logger.error("[IntegrationConsumer] Invalid JSON payload", {
        routingKey,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      this.channel.nack(msg, false, false);
      return;
    }

    const eventId =
      envelope.eventId ||
      envelope.id ||
      envelope.payload?.eventId ||
      msg.properties.messageId ||
      uuidv4();

    const sourceService =
      envelope.sourceService ||
      envelope.serviceName ||
      envelope.metadata?.source;
    const payload =
      envelope.eventData ?? envelope.payload ?? envelope.data ?? envelope;

    try {
      const isNew = await this.inboxRepository.registerEvent({
        eventId,
        routingKey,
        sourceService,
        payload,
      });

      if (!isNew) {
        this.channel.ack(msg);
        return;
      }

      await this.syncService.handle(routingKey, envelope);
      await this.inboxRepository.markProcessed(eventId);
      this.channel.ack(msg);
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Unknown error";
      await this.inboxRepository
        .markFailed(eventId, reason)
        .catch((innerError) =>
          this.logger.error("[IntegrationConsumer] Failed to update inbox", {
            eventId,
            error:
              innerError instanceof Error
                ? innerError.message
                : "Unknown error",
          }),
        );
      this.logger.error("[IntegrationConsumer] Handler failed", {
        eventId,
        routingKey,
        error: reason,
      });
      this.channel.nack(msg, false, false);
    }
  }
}
