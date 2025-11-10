"use strict";
/**
 * RabbitMQEventPublisher - RabbitMQ Domain Event Publisher
 * Publishes domain events to RabbitMQ message broker
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Event-Driven Architecture, Clean Architecture
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RabbitMQEventPublisher = void 0;
const amqplib_1 = __importDefault(require("amqplib"));
const domain_event_1 = require("../../../../shared/domain/base/domain-event");
const rabbitmq_connection_1 = require("../../../../shared/infrastructure/event-bus/rabbitmq-connection");
/**
 * RabbitMQ Event Publisher
 * Implements IDomainEventPublisher using RabbitMQ
 */
class RabbitMQEventPublisher {
    constructor(config, publisherConfig, logger) {
        this.config = config;
        this.publisherConfig = publisherConfig;
        this.logger = logger;
        this.connection = null;
        this.channel = null;
        this.isConnected = false;
        this.intentionallyClosed = false;
        this.reconnectAttempts = 0;
        this.reconnectTimer = null;
        this.maxReconnectAttempts = 10;
        this.reconnectDelayMs = 5000;
    }
    /**
     * Initialize connection to RabbitMQ
     */
    async connect() {
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
            this.connection = await (0, rabbitmq_connection_1.connectRabbitMQWithRetry)(() => amqplib_1.default.connect(this.config.url), this.logger, {
                connectionName,
                maxAttempts: this.config.connectionRetries,
                initialDelayMs: this.config.connectionRetryDelayMs,
            });
            // Handle connection errors
            this.connection.on("error", (err) => {
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
            await this.channel.assertExchange(this.config.exchange, this.config.exchangeType, {
                durable: this.config.durable,
                autoDelete: this.config.autoDelete,
            });
            this.isConnected = true;
            this.reconnectAttempts = 0;
            this.logger.info("RabbitMQ Event Publisher connected", {
                exchange: this.config.exchange,
            });
        }
        catch (error) {
            this.logger.error("Failed to connect to RabbitMQ", {
                error: error instanceof Error ? error.message : "Unknown error",
            });
            throw error;
        }
    }
    /**
     * Reconnect to RabbitMQ
     */
    async reconnect() {
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
        this.logger.info(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
        this.reconnectTimer = setTimeout(async () => {
            try {
                await this.connect();
            }
            catch (error) {
                this.logger.error("Reconnect failed", {
                    error: error instanceof Error ? error.message : "Unknown error",
                });
            }
        }, this.reconnectDelayMs);
    }
    /**
     * Publish a single domain event
     */
    async publish(event) {
        if (!this.isConnected || !this.channel) {
            throw new Error("RabbitMQ publisher is not connected");
        }
        try {
            const routingKey = this.getRoutingKey(event);
            const message = this.serializeEvent(event);
            const published = this.channel.publish(this.config.exchange, routingKey, Buffer.from(message), {
                persistent: true,
                contentType: "application/json",
                timestamp: Date.now(),
                messageId: event.eventId,
                type: event.eventType,
                headers: {
                    aggregateId: event.aggregateId,
                    occurredAt: event.occurredAt.toISOString(),
                },
            });
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
        }
        catch (error) {
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
    async publishBatch(events) {
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
        }
        catch (error) {
            this.logger.error("Failed to publish batch events", {
                error: error instanceof Error ? error.message : "Unknown error",
            });
            throw error;
        }
    }
    /**
     * Publish event with retry mechanism
     */
    async publishWithRetry(event, maxRetries = 3) {
        let lastError = null;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                await this.publish(event);
                return; // Success
            }
            catch (error) {
                lastError = error instanceof Error ? error : new Error("Unknown error");
                this.logger.warn(`Publish attempt ${attempt}/${maxRetries} failed`, {
                    eventType: event.eventType,
                    error: lastError.message,
                });
                if (attempt < maxRetries) {
                    // Wait before retry with exponential backoff
                    const delayMs = this.publisherConfig.retryDelayMs || 1000;
                    await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
                }
            }
        }
        throw new Error(`Failed to publish event after ${maxRetries} attempts: ${lastError?.message}`);
    }
    /**
     * Schedule event for future publishing
     */
    async scheduleEvent(event, publishAt) {
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
            }
            catch (error) {
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
    async isHealthy() {
        return this.isConnected && this.channel !== null;
    }
    /**
     * Close connection
     */
    async close() {
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
        }
        catch (error) {
            this.logger.error("Error closing RabbitMQ connection", {
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    /**
     * Get routing key for event
     */
    getRoutingKey(event) {
        try {
            const routingKey = event.getRoutingKey();
            if (routingKey && routingKey.length > 0) {
                return routingKey;
            }
        }
        catch {
            // Fall back to manual builder below
        }
        return (0, domain_event_1.buildRoutingKey)(event.aggregateType, event.eventType);
    }
    /**
     * Serialize event to JSON
     */
    serializeEvent(event) {
        // Use toJSON() method from DomainEvent base class
        return JSON.stringify(event.toJSON());
    }
}
exports.RabbitMQEventPublisher = RabbitMQEventPublisher;
//# sourceMappingURL=RabbitMQEventPublisher.js.map