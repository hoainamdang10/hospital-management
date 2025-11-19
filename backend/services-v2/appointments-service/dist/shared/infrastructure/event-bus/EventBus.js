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
        this.isReconnecting = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 10;
        this.reconnectDelay = 3000; // 3 seconds
    }
    async connect() {
        return this.connectWithRetry();
    }
    async connectWithRetry(attempt = 1) {
        try {
            // Dynamic import to avoid bundling issues
            const amqp = await Promise.resolve().then(() => __importStar(require('amqplib')));
            console.log(`[EventBus] Connecting to RabbitMQ (attempt ${attempt}/${this.maxReconnectAttempts})...`);
            this.connection = await amqp.connect(this.config.rabbitmqUrl);
            this.channel = await this.connection.createChannel();
            // Declare exchange for domain events
            await this.channel.assertExchange(this.config.exchangeName, 'topic', { durable: true });
            // Setup connection error handlers for auto-reconnect
            this.connection.on('error', (err) => {
                console.error('[EventBus] Connection error:', err.message);
                if (!this.isReconnecting) {
                    this.handleConnectionLost();
                }
            });
            this.connection.on('close', () => {
                console.log('[EventBus] Connection closed');
                if (!this.isReconnecting) {
                    this.handleConnectionLost();
                }
            });
            this.reconnectAttempts = 0;
            console.log(`✅ Event Bus connected: ${this.config.serviceName}`);
        }
        catch (error) {
            console.error(`❌ Failed to connect to Event Bus (attempt ${attempt}):`, error);
            if (attempt < this.maxReconnectAttempts) {
                const delay = this.reconnectDelay * Math.min(attempt, 5); // Max 15s delay
                console.log(`[EventBus] Retrying in ${delay}ms...`);
                await this.sleep(delay);
                return this.connectWithRetry(attempt + 1);
            }
            else {
                throw new Error(`Failed to connect to RabbitMQ after ${this.maxReconnectAttempts} attempts`);
            }
        }
    }
    async handleConnectionLost() {
        if (this.isReconnecting) {
            return;
        }
        this.isReconnecting = true;
        console.log('[EventBus] Connection lost, attempting to reconnect...');
        try {
            // Clean up existing connection
            this.connection = null;
            this.channel = null;
            // Wait before reconnecting
            await this.sleep(this.reconnectDelay);
            // Attempt to reconnect
            await this.connectWithRetry();
            // Restore subscriptions
            await this.restoreSubscriptions();
            console.log('[EventBus] ✅ Reconnected successfully');
        }
        catch (error) {
            console.error('[EventBus] ❌ Failed to reconnect:', error);
        }
        finally {
            this.isReconnecting = false;
        }
    }
    async restoreSubscriptions() {
        console.log('[EventBus] Restoring subscriptions...');
        // Store current subscriptions
        const subsToRestore = new Map(this.subscriptions);
        // Clear subscription map to avoid duplicates
        this.subscriptions.clear();
        for (const [eventType, subs] of subsToRestore.entries()) {
            for (const sub of subs) {
                try {
                    await this.subscribe(eventType, sub.handler, sub.queueName);
                    console.log(`[EventBus] ✅ Restored subscription: ${eventType}`);
                }
                catch (error) {
                    console.error(`[EventBus] ❌ Failed to restore subscription for ${eventType}:`, error);
                }
            }
        }
    }
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
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
        // Handle special cases for billing service compatibility
        switch (eventType) {
            case 'AppointmentCancelled':
                // Check if it's a late cancellation (would need to be determined from event data)
                // For now, use cancelled_late as it's more specific for billing
                return 'appointment.cancelled_late';
            case 'AppointmentNoShow':
                return 'appointment.no_show';
            default:
                // If eventType already contains dots (e.g., 'billing.payment.completed'), return as-is
                if (eventType.includes('.')) {
                    return eventType;
                }
                // Convert PascalCase to dot.notation
                // e.g., UserCreated -> user.created
                return eventType
                    .replace(/([A-Z])/g, '.$1')
                    .toLowerCase()
                    .substring(1);
        }
    }
    serializeEvent(event) {
        // FIX: Use toJSON() method which calls getEventData() internally
        // This ensures we only serialize the event data, not the entire object
        return JSON.stringify(event.toJSON());
    }
    deserializeEvent(message) {
        const data = JSON.parse(message);
        // Get event class from registry
        const EventClass = domain_events_1.EVENT_TYPE_REGISTRY[data.eventType];
        if (!EventClass) {
            throw new Error(`Unknown event type: ${data.eventType}`);
        }
        const eventData = data.eventData || data.payload || {};
        // FIX: Use constructor for AppointmentScheduledEvent to properly initialize readonly properties
        // This ensures all properties are set correctly during deserialization
        try {
            if (data.eventType === 'AppointmentScheduled') {
                return new EventClass(eventData.appointmentId, eventData.patientId, eventData.doctorId, eventData.appointmentDate, eventData.appointmentTime, eventData.durationMinutes, eventData.type, eventData.priority, eventData.status, eventData.consultationFee, eventData.createdBy, data.correlationId, data.causationId, data.userId);
            }
            // FALLBACK: For other events, use Object.create approach
            // This is safer than Object.assign with readonly properties
            const event = Object.create(EventClass.prototype);
            // Assign all properties from serialized data
            Object.assign(event, {
                eventId: data.eventId,
                eventType: data.eventType,
                aggregateId: data.aggregateId,
                aggregateType: data.aggregateType,
                eventVersion: data.eventVersion || 1,
                occurredAt: new Date(data.occurredAt),
                correlationId: data.correlationId,
                causationId: data.causationId,
                userId: data.userId,
                metadata: data.metadata || { source: 'domain', priority: 'normal', retryable: true },
                ...eventData
            });
            return event;
        }
        catch (error) {
            console.error(`[EventBus] Failed to deserialize event: ${data.eventType}`, error);
            throw new Error(`Failed to deserialize event ${data.eventType}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
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