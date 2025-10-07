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
class RabbitMQEventPublisher {
    constructor(rabbitMQUrl, logger) {
        this.rabbitMQUrl = rabbitMQUrl;
        this.logger = logger;
        this.connection = null;
        this.channel = null;
        this.exchangeName = 'hospital.events';
        this.isConnected = false;
    }
    /**
     * Initialize RabbitMQ connection and channel
     */
    async initialize() {
        try {
            this.logger.info('Connecting to RabbitMQ', {
                url: this.rabbitMQUrl.replace(/\/\/.*@/, '//<credentials>@')
            });
            // Create connection
            this.connection = await amqp.connect(this.rabbitMQUrl);
            // Handle connection errors
            this.connection.on('error', (err) => {
                this.logger.error('RabbitMQ connection error', { error: err.message });
                this.isConnected = false;
            });
            this.connection.on('close', () => {
                this.logger.warn('RabbitMQ connection closed');
                this.isConnected = false;
            });
            // Create channel
            this.channel = await this.connection.createChannel();
            // Declare exchange (topic exchange for routing by event type)
            await this.channel.assertExchange(this.exchangeName, 'topic', {
                durable: true
            });
            this.isConnected = true;
            this.logger.info('RabbitMQ connection established', {
                exchange: this.exchangeName
            });
        }
        catch (error) {
            this.logger.error('Failed to initialize RabbitMQ', {
                error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        }
    }
    /**
     * Publish a single domain event
     */
    async publish(event) {
        if (!this.isConnected || !this.channel) {
            this.logger.warn('RabbitMQ not connected, skipping event publish', {
                eventType: event.eventType
            });
            return;
        }
        try {
            const routingKey = this.getRoutingKey(event);
            const message = JSON.stringify({
                ...event,
                occurredAt: event.occurredAt.toISOString()
            });
            const published = this.channel.publish(this.exchangeName, routingKey, Buffer.from(message), {
                persistent: true,
                contentType: 'application/json',
                timestamp: Date.now(),
                messageId: `${event.aggregateId}-${Date.now()}`,
                type: event.eventType
            });
            if (!published) {
                this.logger.warn('Event publish buffer full, waiting...', {
                    eventType: event.eventType
                });
                await new Promise((resolve) => this.channel.once('drain', resolve));
            }
            this.logger.info('Event published', {
                eventType: event.eventType,
                aggregateId: event.aggregateId,
                routingKey
            });
        }
        catch (error) {
            this.logger.error('Failed to publish event', {
                eventType: event.eventType,
                error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        }
    }
    /**
     * Publish multiple events in batch
     */
    async publishBatch(events) {
        for (const event of events) {
            await this.publish(event);
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
                await this.connection.close();
                this.connection = null;
            }
            this.isConnected = false;
            this.logger.info('RabbitMQ connection closed');
        }
        catch (error) {
            this.logger.error('Error closing RabbitMQ connection', {
                error: error instanceof Error ? error.message : String(error)
            });
        }
    }
    /**
     * Get routing key for event
     * Format: {aggregateType}.{eventType}
     * Example: user.registered, user.activated, user.role_changed
     */
    getRoutingKey(event) {
        const aggregateType = event.aggregateType.toLowerCase();
        const eventType = event.eventType
            .replace(/([A-Z])/g, '_$1')
            .toLowerCase()
            .replace(/^_/, '');
        return `${aggregateType}.${eventType}`;
    }
}
exports.RabbitMQEventPublisher = RabbitMQEventPublisher;
/**
 * Mock Event Publisher for testing
 */
class MockEventPublisher {
    constructor(logger) {
        this.logger = logger;
        this.publishedEvents = [];
    }
    async initialize() {
        this.logger.info('Mock Event Publisher initialized');
    }
    async publish(event) {
        this.publishedEvents.push(event);
        this.logger.info('Mock event published', {
            eventType: event.eventType,
            aggregateId: event.aggregateId
        });
    }
    async publishBatch(events) {
        this.publishedEvents.push(...events);
        this.logger.info('Mock events published', {
            count: events.length
        });
    }
    async close() {
        this.logger.info('Mock Event Publisher closed');
    }
    getPublishedEvents() {
        return [...this.publishedEvents];
    }
    clearEvents() {
        this.publishedEvents = [];
    }
}
exports.MockEventPublisher = MockEventPublisher;
//# sourceMappingURL=RabbitMQEventPublisher.js.map