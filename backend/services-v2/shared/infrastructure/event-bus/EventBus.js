"use strict";
/**
 * Event Bus for Inter-Service Communication
 * Hospital Management System V2
 *
 * Implements publish-subscribe pattern using RabbitMQ
 * Replaces cross-schema foreign keys with event-driven architecture
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
exports.EventBusFactory = exports.InMemoryEventBus = exports.RabbitMQEventBus = void 0;
const domain_events_1 = require("../../domain/events/domain-events");
/**
 * RabbitMQ Event Bus Implementation
 */
class RabbitMQEventBus {
    constructor(config) {
        this.config = config;
        this.connection = null;
        this.channel = null;
        this.subscriptions = new Map();
    }
    async connect() {
        try {
            // Dynamic import to avoid bundling issues
            const amqp = await Promise.resolve().then(() => __importStar(require('amqplib')));
            this.connection = await amqp.connect(this.config.rabbitmqUrl);
            this.channel = await this.connection.createChannel();
            // Declare exchange for domain events
            await this.channel.assertExchange(this.config.exchangeName, 'topic', { durable: true });
            console.log(`✅ Event Bus connected: ${this.config.serviceName}`);
        }
        catch (error) {
            console.error('❌ Failed to connect to Event Bus:', error);
            throw error;
        }
    }
    async disconnect() {
        try {
            if (this.channel) {
                await this.channel.close();
            }
            if (this.connection) {
                await this.connection.close();
            }
            console.log(`✅ Event Bus disconnected: ${this.config.serviceName}`);
        }
        catch (error) {
            console.error('❌ Failed to disconnect from Event Bus:', error);
            throw error;
        }
    }
    async publish(event) {
        if (!this.channel) {
            throw new Error('Event Bus not connected. Call connect() first.');
        }
        try {
            const routingKey = this.getRoutingKey(event.eventType);
            const message = this.serializeEvent(event);
            const published = this.channel.publish(this.config.exchangeName, routingKey, Buffer.from(message), {
                persistent: true,
                contentType: 'application/json',
                timestamp: Date.now(),
                messageId: event.eventId,
                headers: {
                    eventType: event.eventType,
                    aggregateId: event.aggregateId,
                    occurredAt: event.occurredAt.toISOString(),
                    serviceName: this.config.serviceName,
                },
            });
            if (!published) {
                console.warn(`⚠️ Event not published (buffer full): ${event.eventType}`);
            }
            else {
                console.log(`📤 Event published: ${event.eventType} (${event.eventId})`);
            }
        }
        catch (error) {
            console.error(`❌ Failed to publish event: ${event.eventType}`, error);
            throw error;
        }
    }
    async subscribe(eventType, handler, queueName) {
        if (!this.channel) {
            throw new Error('Event Bus not connected. Call connect() first.');
        }
        try {
            // Generate queue name if not provided
            const queue = queueName || `${this.config.serviceName}.${eventType}`;
            // Assert queue
            await this.channel.assertQueue(queue, {
                durable: true,
                arguments: {
                    'x-message-ttl': 86400000, // 24 hours
                    'x-max-length': 10000,
                },
            });
            // Bind queue to exchange with routing key
            const routingKey = this.getRoutingKey(eventType);
            await this.channel.bindQueue(queue, this.config.exchangeName, routingKey);
            // Consume messages
            await this.channel.consume(queue, async (msg) => {
                if (!msg)
                    return;
                try {
                    const event = this.deserializeEvent(msg.content.toString());
                    console.log(`📥 Event received: ${event.eventType} (${event.eventId})`);
                    // Handle event
                    await handler.handle(event);
                    // Acknowledge message
                    this.channel.ack(msg);
                    console.log(`✅ Event processed: ${event.eventType} (${event.eventId})`);
                }
                catch (error) {
                    console.error(`❌ Failed to process event:`, error);
                    // Reject and requeue (with limit)
                    const retryCount = (msg.properties.headers['x-retry-count'] || 0) + 1;
                    if (retryCount < 3) {
                        // Requeue with retry count
                        this.channel.nack(msg, false, true);
                    }
                    else {
                        // Dead letter after 3 retries
                        console.error(`💀 Event moved to dead letter queue after ${retryCount} retries`);
                        this.channel.nack(msg, false, false);
                    }
                }
            }, { noAck: false });
            // Store subscription
            const subscriptions = this.subscriptions.get(eventType) || [];
            subscriptions.push({ eventType, handler, queueName: queue });
            this.subscriptions.set(eventType, subscriptions);
            console.log(`✅ Subscribed to event: ${eventType} (queue: ${queue})`);
        }
        catch (error) {
            console.error(`❌ Failed to subscribe to event: ${eventType}`, error);
            throw error;
        }
    }
    getRoutingKey(eventType) {
        // Convert PascalCase to dot.notation
        // e.g., UserCreated -> user.created
        return eventType
            .replace(/([A-Z])/g, '.$1')
            .toLowerCase()
            .substring(1);
    }
    serializeEvent(event) {
        return JSON.stringify({
            eventId: event.eventId,
            eventType: event.eventType,
            aggregateId: event.aggregateId,
            occurredAt: event.occurredAt.toISOString(),
            payload: event,
        });
    }
    deserializeEvent(message) {
        const data = JSON.parse(message);
        // Get event class from registry
        const EventClass = domain_events_1.EVENT_TYPE_REGISTRY[data.eventType];
        if (!EventClass) {
            throw new Error(`Unknown event type: ${data.eventType}`);
        }
        // Reconstruct event
        const event = Object.assign(new EventClass(), data.payload);
        return event;
    }
}
exports.RabbitMQEventBus = RabbitMQEventBus;
/**
 * In-Memory Event Bus for Testing
 */
class InMemoryEventBus {
    constructor() {
        this.handlers = new Map();
        this.publishedEvents = [];
    }
    async connect() {
        console.log('✅ In-Memory Event Bus connected');
    }
    async disconnect() {
        this.handlers.clear();
        this.publishedEvents = [];
        console.log('✅ In-Memory Event Bus disconnected');
    }
    async publish(event) {
        this.publishedEvents.push(event);
        const handlers = this.handlers.get(event.eventType) || [];
        for (const handler of handlers) {
            try {
                await handler.handle(event);
            }
            catch (error) {
                console.error(`Failed to handle event: ${event.eventType}`, error);
            }
        }
    }
    async subscribe(eventType, handler) {
        const handlers = this.handlers.get(eventType) || [];
        handlers.push(handler);
        this.handlers.set(eventType, handlers);
    }
    // Test helpers
    getPublishedEvents() {
        return [...this.publishedEvents];
    }
    clearPublishedEvents() {
        this.publishedEvents = [];
    }
}
exports.InMemoryEventBus = InMemoryEventBus;
/**
 * Event Bus Factory
 */
class EventBusFactory {
    static create(config, useInMemory = false) {
        if (useInMemory || process.env.NODE_ENV === 'test') {
            return new InMemoryEventBus();
        }
        return new RabbitMQEventBus(config);
    }
}
exports.EventBusFactory = EventBusFactory;
//# sourceMappingURL=EventBus.js.map