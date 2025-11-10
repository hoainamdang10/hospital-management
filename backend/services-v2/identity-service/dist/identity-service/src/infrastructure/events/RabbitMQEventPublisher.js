"use strict";
/**
 * RabbitMQ Event Publisher
 * Publishes domain events to RabbitMQ message broker
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockEventPublisher = exports.RabbitMQEventPublisher = void 0;
const amqp = __importStar(require("amqplib"));
const domain_event_1 = require("../../../../shared/domain/base/domain-event");
const DomainEventMapper_1 = require("./DomainEventMapper");
class RabbitMQEventPublisher {
    constructor(rabbitMQUrl, logger, exchangeName) {
        this.rabbitMQUrl = rabbitMQUrl;
        this.logger = logger;
        this.connection = null;
        this.channel = null;
        this.isConnected = false;
        this.pendingEvents = [];
        this.flushingPending = false;
        this.maxPublishAttempts = 3;
        this.publishRetryDelayMs = 500;
        this.exchangeName =
            exchangeName || process.env.RABBITMQ_EXCHANGE || "hospital.events";
    }
    /**
     * Initialize RabbitMQ connection and channel
     */
    async initialize() {
        try {
            this.logger.info("Connecting to RabbitMQ", {
                url: this.rabbitMQUrl.replace(/\/\/.*@/, "//<credentials>@"),
            });
            // Create connection - explicit type assertion for amqplib compatibility
            // Note: amqplib types have issues, using unknown cast to fix
            const connection = await amqp.connect(this.rabbitMQUrl);
            this.connection = connection;
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
        }
        catch (error) {
            this.logger.error("Failed to initialize RabbitMQ", {
                error: error instanceof Error ? error.message : String(error),
            });
            throw error;
        }
    }
    /**
     * Publish a single domain event
     */
    async publishIntegrationEvent(event) {
        if (!this.isConnected || !this.channel) {
            this.logger.warn("RabbitMQ not connected, queueing event for later publish", {
                eventType: event.eventType,
            });
            this.pendingEvents.push(event);
            return;
        }
        try {
            await this.publishWithRetry(event);
        }
        catch (error) {
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
    async publishDomainEvents(events) {
        if (events.length === 0) {
            return;
        }
        const rabbitEvents = DomainEventMapper_1.DomainEventMapper.toRabbitMQEvents(events);
        for (const event of rabbitEvents) {
            await this.publishIntegrationEvent(event);
        }
    }
    /**
     * Close RabbitMQ connection
     */
    async close() {
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
        }
        catch (error) {
            this.logger.error("Error closing RabbitMQ connection", {
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }
    /**
     * Build AMQP routing key using shared helper for consistent naming
     */
    getRoutingKey(event) {
        const routingKey = (0, domain_event_1.buildRoutingKey)(event.aggregateType, event.eventType);
        if (routingKey && routingKey.length > 0) {
            return routingKey;
        }
        const fallbackAggregate = event.aggregateType?.trim().replace(/\s+/g, "-").toLowerCase() ||
            "identity";
        const fallbackEvent = event.eventType?.replace(/\s+/g, ".").toLowerCase() || "event";
        return `${fallbackAggregate}.${fallbackEvent}`;
    }
    async publishWithRetry(event, attempt = 1) {
        if (!this.channel) {
            throw new Error("RabbitMQ channel not available");
        }
        const routingKey = this.getRoutingKey(event);
        const message = JSON.stringify({
            ...event,
            occurredAt: event.occurredAt.toISOString(),
        });
        try {
            const published = this.channel.publish(this.exchangeName, routingKey, Buffer.from(message), {
                persistent: true,
                contentType: "application/json",
                timestamp: Date.now(),
                messageId: `${event.aggregateId}-${Date.now()}`,
                type: event.eventType,
            });
            if (!published) {
                this.logger.warn("Event publish buffer full, waiting...", {
                    eventType: event.eventType,
                    routingKey,
                });
                await new Promise((resolve) => this.channel.once("drain", resolve));
            }
            this.logger.info("Event published", {
                eventType: event.eventType,
                aggregateId: event.aggregateId,
                routingKey,
                attempt,
            });
        }
        catch (error) {
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
    async flushPendingEvents() {
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
        }
        finally {
            this.flushingPending = false;
        }
    }
}
exports.RabbitMQEventPublisher = RabbitMQEventPublisher;
/**
 * Mock Event Publisher for testing
 */
class MockEventPublisher {
    constructor(logger) {
        this.logger = logger;
        this.integrationEvents = [];
        this.domainEvents = [];
    }
    async initialize() {
        this.logger.info("Mock Event Publisher initialized");
    }
    async close() {
        this.logger.info("Mock Event Publisher closed");
    }
    async publishIntegrationEvent(event) {
        this.integrationEvents.push(event);
        this.logger.info("Mock integration event published", {
            eventType: event.eventType,
            aggregateId: event.aggregateId,
        });
    }
    async publishDomainEvents(events) {
        this.domainEvents.push(...events);
        this.logger.info("Mock domain events published", {
            count: events.length,
        });
    }
    getIntegrationEvents() {
        return [...this.integrationEvents];
    }
    getDomainEvents() {
        return [...this.domainEvents];
    }
    clear() {
        this.integrationEvents = [];
        this.domainEvents = [];
    }
}
exports.MockEventPublisher = MockEventPublisher;
//# sourceMappingURL=RabbitMQEventPublisher.js.map