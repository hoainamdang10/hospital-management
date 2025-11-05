"use strict";
/**
 * RabbitMQ Event Bus Implementation
 * Patient Registry Service - Infrastructure Layer
 *
 * Replaces InMemoryEventBus with production-ready RabbitMQ implementation
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Event-Driven Architecture, Clean Architecture, DDD
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
exports.RabbitMQEventBus = void 0;
const amqp = __importStar(require("amqplib"));
/**
 * RabbitMQ Event Bus
 * Production-ready event bus with:
 * - Automatic reconnection
 * - Dead letter queue
 * - Message persistence
 * - Error handling
 * - Metrics tracking
 */
class RabbitMQEventBus {
    constructor(config, logger) {
        this.config = config;
        this.logger = logger;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 10;
        this.reconnectDelay = 5000;
        this.subscribers = new Map();
        this.exchangeName = config.exchangeName || 'hospital.events';
        this.serviceName = config.serviceName || 'patient-registry-service';
        this.queueName = config.queueName || `${this.serviceName}.events`;
        this.routingKeyPrefix = config.routingKeyPrefix || 'patient';
        this.deadLetterExchange = config.deadLetterExchange || `${this.exchangeName}.dlx`;
        this.maxRetries = config.maxRetries || 3;
        this.retryDelay = config.retryDelay || 5000;
        this.prefetchCount = config.prefetchCount || 10;
    }
    /**
     * Connect to RabbitMQ and setup topology
     */
    async connect() {
        try {
            this.logger.info('Connecting to RabbitMQ...', {
                url: this.maskUrl(this.config.rabbitmqUrl),
                exchange: this.exchangeName,
                queue: this.queueName
            });
            this.connection = await amqp.connect(this.config.rabbitmqUrl);
            // Handle connection events
            this.connection.on('error', (err) => {
                this.logger.error('RabbitMQ connection error', { error: err.message });
                this.handleConnectionError(err);
            });
            this.connection.on('close', () => {
                this.logger.warn('RabbitMQ connection closed');
                this.isConnected = false;
                this.attemptReconnect();
            });
            // Create channel
            this.channel = await this.connection.createChannel();
            // Set prefetch count for load balancing
            await this.channel.prefetch(this.prefetchCount);
            // Handle channel events
            this.channel.on('error', (err) => {
                this.logger.error('RabbitMQ channel error', { error: err.message });
            });
            this.channel.on('close', () => {
                this.logger.warn('RabbitMQ channel closed');
            });
            // Setup exchange and queues
            await this.setupTopology();
            this.isConnected = true;
            this.reconnectAttempts = 0;
            this.logger.info('Connected to RabbitMQ successfully', {
                exchange: this.exchangeName,
                queue: this.queueName
            });
        }
        catch (error) {
            this.logger.error('Failed to connect to RabbitMQ', {
                error: error instanceof Error ? error.message : 'Unknown error',
                attempts: this.reconnectAttempts
            });
            throw error;
        }
    }
    /**
     * Setup RabbitMQ topology (exchanges, queues, bindings)
     */
    async setupTopology() {
        if (!this.channel) {
            throw new Error('Channel not initialized');
        }
        // 1. Assert main exchange (topic)
        await this.channel.assertExchange(this.exchangeName, 'topic', {
            durable: true,
            autoDelete: false
        });
        // 2. Assert dead letter exchange
        await this.channel.assertExchange(this.deadLetterExchange, 'direct', {
            durable: true,
            autoDelete: false
        });
        // 3. Assert dead letter queue
        const dlqName = `${this.queueName}.dlq`;
        await this.channel.assertQueue(dlqName, {
            durable: true,
            autoDelete: false
        });
        // 4. Bind DLQ to DLX
        await this.channel.bindQueue(dlqName, this.deadLetterExchange, this.queueName);
        // 5. Assert main queue with DLX configuration
        await this.channel.assertQueue(this.queueName, {
            durable: true,
            autoDelete: false,
            arguments: {
                'x-dead-letter-exchange': this.deadLetterExchange,
                'x-dead-letter-routing-key': this.queueName,
                'x-message-ttl': 86400000, // 24 hours
                'x-max-length': 10000 // Max 10k messages
            }
        });
        this.logger.info('RabbitMQ topology setup completed', {
            exchange: this.exchangeName,
            queue: this.queueName,
            dlx: this.deadLetterExchange
        });
    }
    /**
     * Disconnect from RabbitMQ
     */
    async disconnect() {
        try {
            this.logger.info('Disconnecting from RabbitMQ...');
            if (this.channel) {
                await this.channel.close();
                this.channel = undefined;
            }
            if (this.connection) {
                await this.connection.close();
                this.connection = undefined;
            }
            this.isConnected = false;
            this.logger.info('Disconnected from RabbitMQ successfully');
        }
        catch (error) {
            this.logger.error('Error disconnecting from RabbitMQ', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    /**
     * Publish domain event to RabbitMQ
     */
    async publish(event, options) {
        if (!this.isConnected || !this.channel) {
            this.logger.error('Cannot publish event: Not connected to RabbitMQ', {
                eventType: event.eventType
            });
            throw new Error('Event bus not connected');
        }
        try {
            // Generate routing key
            const routingKey = this.generateRoutingKey(event);
            // Prepare message
            const message = this.serializeEvent(event);
            const buffer = Buffer.from(message);
            // Publish options
            const publishOptions = {
                persistent: options?.persistent ?? true,
                priority: options?.priority ?? 0,
                timestamp: Date.now(),
                contentType: 'application/json',
                contentEncoding: 'utf-8',
                headers: {
                    eventType: event.eventType,
                    aggregateId: event.aggregateId,
                    aggregateType: event.aggregateType,
                    eventVersion: event.eventVersion,
                    serviceName: this.serviceName
                }
            };
            if (options?.correlationId) {
                publishOptions.correlationId = options.correlationId;
            }
            if (options?.replyTo) {
                publishOptions.replyTo = options.replyTo;
            }
            if (options?.expiration) {
                publishOptions.expiration = options.expiration;
            }
            // Publish to exchange
            const published = this.channel.publish(this.exchangeName, routingKey, buffer, publishOptions);
            if (!published) {
                this.logger.warn('Message buffer full, waiting...', {
                    eventType: event.eventType,
                    routingKey
                });
                // Wait for drain event
                await new Promise((resolve) => this.channel.once('drain', resolve));
            }
            this.logger.debug('Event published successfully', {
                eventType: event.eventType,
                eventId: event.eventId,
                aggregateId: event.aggregateId,
                routingKey
            });
        }
        catch (error) {
            this.logger.error('Failed to publish event', {
                eventType: event.eventType,
                eventId: event.eventId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }
    /**
     * Publish batch of events
     */
    async publishBatch(events, options) {
        if (!this.isConnected || !this.channel) {
            throw new Error('Event bus not connected');
        }
        this.logger.info('Publishing batch of events', {
            count: events.length
        });
        const errors = [];
        for (const event of events) {
            try {
                await this.publish(event, options);
            }
            catch (error) {
                errors.push({
                    event,
                    error: error instanceof Error ? error : new Error('Unknown error')
                });
            }
        }
        if (errors.length > 0) {
            this.logger.error('Some events failed to publish', {
                totalEvents: events.length,
                failedEvents: errors.length,
                errors: errors.map(e => ({
                    eventType: e.event.eventType,
                    error: e.error.message
                }))
            });
            throw new Error(`Failed to publish ${errors.length} out of ${events.length} events`);
        }
        this.logger.info('Batch published successfully', {
            count: events.length
        });
    }
    /**
     * Subscribe to events
     */
    async subscribe(eventType, handler, queueName) {
        if (!this.subscribers.has(eventType)) {
            this.subscribers.set(eventType, []);
        }
        this.subscribers.get(eventType).push(handler);
        this.logger.info('Event handler registered', {
            eventType,
            queueName: queueName || this.queueName,
            handlersCount: this.subscribers.get(eventType).length
        });
    }
    /**
     * Start consuming messages from queue
     */
    async startConsuming(routingKeys) {
        if (!this.isConnected || !this.channel) {
            throw new Error('Event bus not connected');
        }
        // Bind queue to routing keys
        for (const routingKey of routingKeys) {
            await this.channel.bindQueue(this.queueName, this.exchangeName, routingKey);
            this.logger.info('Queue bound to routing key', {
                queue: this.queueName,
                routingKey
            });
        }
        // Start consuming
        await this.channel.consume(this.queueName, async (msg) => {
            if (!msg) {
                return;
            }
            try {
                await this.handleMessage(msg);
                this.channel.ack(msg);
            }
            catch (error) {
                this.logger.error('Error handling message', {
                    error: error instanceof Error ? error.message : 'Unknown error',
                    messageId: msg.properties.messageId
                });
                // Check retry count
                const retryCount = this.getRetryCount(msg);
                if (retryCount < this.maxRetries) {
                    // Retry
                    this.logger.info('Retrying message', {
                        retryCount: retryCount + 1,
                        maxRetries: this.maxRetries
                    });
                    this.channel.nack(msg, false, true);
                }
                else {
                    // Send to DLQ
                    this.logger.error('Max retries reached, sending to DLQ', {
                        messageId: msg.properties.messageId
                    });
                    this.channel.nack(msg, false, false);
                }
            }
        }, {
            noAck: false
        });
        this.logger.info('Started consuming messages', {
            queue: this.queueName,
            routingKeys
        });
    }
    /**
    private async handleMessage(msg: ConsumeMessage): Promise<void> {
     */
    async handleMessage(msg) {
        const eventType = msg.properties.headers?.eventType;
        if (!eventType) {
            this.logger.warn('Message missing eventType header');
            return;
        }
        const handlers = this.subscribers.get(eventType);
        if (!handlers || handlers.length === 0) {
            this.logger.debug('No handlers registered for event', { eventType });
            return;
        }
        const event = this.deserializeEvent(msg.content.toString());
        for (const handler of handlers) {
            try {
                await handler.handle(event);
            }
            catch (error) {
                this.logger.error('Event handler failed', {
                    eventType,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
                throw error;
            }
        }
    }
    /**
     * Check if event bus is connected
     */
    isEventBusConnected() {
        return this.isConnected;
    }
    /**
     * Generate routing key from event
     */
    generateRoutingKey(event) {
        const eventType = event.eventType.toLowerCase().replace(/\s+/g, '_');
        return `${this.routingKeyPrefix}.${eventType}`;
    }
    /**
     * Serialize event to JSON
     */
    serializeEvent(event) {
        return JSON.stringify({
            eventId: event.eventId,
            eventType: event.eventType,
            aggregateId: event.aggregateId,
            aggregateType: event.aggregateType,
            eventVersion: event.eventVersion,
            occurredAt: event.occurredAt.toISOString(),
            data: event.getEventData(),
            metadata: {
                serviceName: this.serviceName,
                publishedAt: new Date().toISOString()
            }
        });
    }
    /**
     * Deserialize event from JSON
     */
    deserializeEvent(message) {
        try {
            return JSON.parse(message);
        }
        catch (error) {
            this.logger.error('Failed to deserialize event', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }
    /**
    private getRetryCount(msg: ConsumeMessage): number {
     */
    getRetryCount(msg) {
        const xDeath = msg.properties.headers?.['x-death'];
        if (Array.isArray(xDeath) && xDeath.length > 0) {
            return xDeath[0].count || 0;
        }
        return 0;
    }
    /**
     * Handle connection error
     */
    handleConnectionError(error) {
        this.isConnected = false;
        this.logger.error('RabbitMQ connection error occurred', {
            error: error.message,
            attempts: this.reconnectAttempts
        });
    }
    /**
     * Attempt to reconnect
     */
    async attemptReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            this.logger.error('Max reconnection attempts reached', {
                attempts: this.reconnectAttempts
            });
            return;
        }
        this.reconnectAttempts++;
        this.logger.info('Attempting to reconnect to RabbitMQ...', {
            attempt: this.reconnectAttempts,
            maxAttempts: this.maxReconnectAttempts
        });
        await new Promise((resolve) => setTimeout(resolve, this.reconnectDelay));
        try {
            await this.connect();
            this.logger.info('Reconnected to RabbitMQ successfully');
        }
        catch (error) {
            this.logger.error('Reconnection failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
                nextAttemptIn: `${this.reconnectDelay}ms`
            });
            await this.attemptReconnect();
        }
    }
    /**
     * Mask sensitive URL information
     */
    maskUrl(url) {
        try {
            const parsed = new URL(url);
            if (parsed.password) {
                parsed.password = '***';
            }
            return parsed.toString();
        }
        catch {
            return '***';
        }
    }
    /**
     * Get event bus metrics
     */
    getMetrics() {
        return {
            isConnected: this.isConnected,
            reconnectAttempts: this.reconnectAttempts,
            subscribersCount: this.subscribers.size
        };
    }
}
exports.RabbitMQEventBus = RabbitMQEventBus;
//# sourceMappingURL=RabbitMQEventBus.js.map