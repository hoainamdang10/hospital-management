"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RabbitMQEventPublisher = void 0;
const amqplib_1 = __importDefault(require("amqplib"));
const rabbitmq_connection_1 = require("../../shared/rabbitmq-connection");
class RabbitMQEventPublisher {
    constructor(config, publisherConfig, logger) {
        this.config = config;
        this.publisherConfig = publisherConfig;
        this.logger = logger;
        this.connection = null;
        this.channel = null;
        this.isConnected = false;
        this.intentionallyClosed = false;
    }
    async connect() {
        this.logger.info("[RabbitMQPublisher] Connecting...", {
            exchange: this.config.exchange,
        });
        const connectionName = this.config.serviceName
            ? `${this.config.serviceName}-publisher`
            : "clinical-emr-publisher";
        this.connection = await (0, rabbitmq_connection_1.connectRabbitMQWithRetry)(() => amqplib_1.default.connect(this.config.url), this.logger, {
            connectionName,
            maxAttempts: this.config.connectionRetries ?? 5,
            initialDelayMs: this.config.connectionRetryDelayMs ?? 1000,
        });
        this.connection.on("error", (error) => {
            this.isConnected = false;
            this.logger.error("[RabbitMQPublisher] Connection error", {
                error: error.message,
            });
        });
        this.connection.on("close", () => {
            this.isConnected = false;
            if (!this.intentionallyClosed) {
                this.logger.warn("[RabbitMQPublisher] Connection closed, reconnecting...");
                setTimeout(() => this.connect().catch((err) => this.logger.error(err.message)), 3000);
            }
        });
        this.channel = await this.connection.createChannel();
        await this.channel.assertExchange(this.config.exchange, this.config.exchangeType, {
            durable: this.config.durable,
            autoDelete: this.config.autoDelete,
        });
        this.isConnected = true;
        this.logger.info("[RabbitMQPublisher] Connected to exchange", {
            exchange: this.config.exchange,
        });
    }
    async disconnect() {
        this.intentionallyClosed = true;
        if (this.channel) {
            await this.channel.close();
        }
        if (this.connection) {
            await this.connection.close();
        }
        this.isConnected = false;
    }
    async publish(event) {
        if (!this.isConnected || !this.channel) {
            throw new Error("RabbitMQ publisher is not connected");
        }
        const routingKey = `${event.aggregateType.toLowerCase()}.${event.eventType.toLowerCase()}`;
        const payload = Buffer.from(JSON.stringify(event.toJSON()));
        const published = this.channel.publish(this.config.exchange, routingKey, payload, {
            persistent: true,
            contentType: "application/json",
            messageId: event.eventId,
            timestamp: Date.now(),
            type: event.eventType,
        });
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
    async publishBatch(events) {
        for (const event of events) {
            await this.publish(event);
        }
    }
    async subscribe() {
        throw new Error("Subscribe is not implemented for this publisher");
    }
    async unsubscribe() {
        throw new Error("Unsubscribe is not implemented for this publisher");
    }
}
exports.RabbitMQEventPublisher = RabbitMQEventPublisher;
