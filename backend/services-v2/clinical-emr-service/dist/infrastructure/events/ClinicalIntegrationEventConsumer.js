"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClinicalIntegrationEventConsumer = void 0;
const amqplib_1 = __importDefault(require("amqplib"));
const uuid_1 = require("uuid");
const rabbitmq_connection_1 = require("../../shared/rabbitmq-connection");
class ClinicalIntegrationEventConsumer {
    constructor(config, logger, inboxRepository, syncService) {
        this.config = config;
        this.logger = logger;
        this.inboxRepository = inboxRepository;
        this.syncService = syncService;
        this.connection = null;
        this.channel = null;
        this.isRunning = false;
    }
    async start() {
        if (this.isRunning) {
            return;
        }
        this.isRunning = true;
        await this.connect();
    }
    async stop() {
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
    async connect() {
        try {
            this.logger.info("[IntegrationConsumer] Connecting to RabbitMQ...", {
                queue: this.config.queueName,
            });
            this.connection = await (0, rabbitmq_connection_1.connectRabbitMQWithRetry)(() => amqplib_1.default.connect(this.config.url), this.logger, {
                connectionName: this.config.serviceName ?? "clinical-integration-consumer",
            });
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
            await this.channel.consume(this.config.queueName, (msg) => this.handleMessage(msg), { noAck: false });
            this.logger.info("[IntegrationConsumer] Listening for events", {
                queue: this.config.queueName,
                routingKeys: this.config.routingKeys,
            });
        }
        catch (error) {
            this.logger.error("[IntegrationConsumer] Failed to connect", {
                error: error instanceof Error ? error.message : "Unknown error",
            });
            this.scheduleReconnect();
        }
    }
    scheduleReconnect() {
        if (!this.isRunning) {
            return;
        }
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
        }
        this.reconnectTimer = setTimeout(() => {
            this.connect().catch((error) => this.logger.error("[IntegrationConsumer] Reconnect failed", {
                error: error instanceof Error ? error.message : "Unknown error",
            }));
        }, 5000);
    }
    async setupBindings() {
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
            await this.channel.bindQueue(this.config.queueName, this.config.exchange, key);
        }
    }
    async handleMessage(msg) {
        if (!msg || !this.channel) {
            return;
        }
        const routingKey = msg.fields.routingKey;
        let envelope;
        try {
            envelope = JSON.parse(msg.content.toString("utf-8"));
        }
        catch (error) {
            this.logger.error("[IntegrationConsumer] Invalid JSON payload", {
                routingKey,
                error: error instanceof Error ? error.message : "Unknown error",
            });
            this.channel.nack(msg, false, false);
            return;
        }
        const eventId = envelope.eventId ||
            envelope.id ||
            envelope.payload?.eventId ||
            msg.properties.messageId ||
            (0, uuid_1.v4)();
        const sourceService = envelope.sourceService ||
            envelope.serviceName ||
            envelope.metadata?.source;
        const payload = envelope.eventData ?? envelope.payload ?? envelope.data ?? envelope;
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
        }
        catch (error) {
            const reason = error instanceof Error ? error.message : "Unknown error";
            await this.inboxRepository
                .markFailed(eventId, reason)
                .catch((innerError) => this.logger.error("[IntegrationConsumer] Failed to update inbox", {
                eventId,
                error: innerError instanceof Error
                    ? innerError.message
                    : "Unknown error",
            }));
            this.logger.error("[IntegrationConsumer] Handler failed", {
                eventId,
                routingKey,
                error: reason,
            });
            this.channel.nack(msg, false, false);
        }
    }
}
exports.ClinicalIntegrationEventConsumer = ClinicalIntegrationEventConsumer;
