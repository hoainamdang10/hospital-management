"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEventBus = exports.EventBus = void 0;
const amqp = __importStar(require("amqplib"));
const logger_1 = __importDefault(require("../utils/logger"));
class EventBus {
    constructor(serviceName, exchangeName = 'hospital.events') {
        this.connection = null;
        this.channel = null;
        this.serviceName = serviceName;
        this.exchangeName = exchangeName;
    }
    async connect(url) {
        const maxRetries = 5;
        const retryDelay = 5000; // 5 seconds
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                logger_1.default.info(`Attempting to connect to RabbitMQ (attempt ${attempt}/${maxRetries})...`);
                this.connection = await amqp.connect(url);
                this.channel = await this.connection.createChannel();
                // Create exchange
                await this.channel.assertExchange(this.exchangeName, 'topic', {
                    durable: true,
                });
                // Handle connection errors
                this.connection.on('error', (err) => {
                    logger_1.default.error('RabbitMQ connection error', { error: err.message });
                });
                this.connection.on('close', () => {
                    logger_1.default.warn('RabbitMQ connection closed');
                });
                logger_1.default.info('Connected to RabbitMQ', {
                    service: this.serviceName,
                    exchange: this.exchangeName
                });
                return; // Success, exit retry loop
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                logger_1.default.error(`Failed to connect to RabbitMQ (attempt ${attempt}/${maxRetries})`, {
                    error: errorMessage
                });
                if (attempt === maxRetries) {
                    logger_1.default.error('Max retries reached. Unable to connect to RabbitMQ');
                    throw error;
                }
                // Wait before retrying
                logger_1.default.info(`Retrying in ${retryDelay / 1000} seconds...`);
                await new Promise(resolve => setTimeout(resolve, retryDelay));
            }
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
            logger_1.default.info('Disconnected from RabbitMQ');
        }
        catch (error) {
            logger_1.default.error('Error disconnecting from RabbitMQ', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    async publish(eventType, data, routingKey) {
        if (!this.channel) {
            throw new Error('EventBus not connected');
        }
        const event = {
            id: this.generateEventId(),
            type: eventType,
            data,
            timestamp: new Date(),
            source: this.serviceName,
            version: '1.0',
        };
        const key = routingKey || eventType;
        const message = Buffer.from(JSON.stringify(event));
        try {
            const published = this.channel.publish(this.exchangeName, key, message, {
                persistent: true,
                messageId: event.id,
                timestamp: event.timestamp.getTime(),
            });
            if (published) {
                logger_1.default.info('Event published', {
                    eventId: event.id,
                    eventType: event.type,
                    routingKey: key,
                });
            }
            else {
                throw new Error('Failed to publish event');
            }
        }
        catch (error) {
            logger_1.default.error('Error publishing event', {
                eventType: event.type,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    async subscribe(pattern, handler, queueName) {
        if (!this.channel) {
            throw new Error('EventBus not connected');
        }
        const queue = queueName || `${this.serviceName}.${pattern}`;
        try {
            // Assert queue
            await this.channel.assertQueue(queue, {
                durable: true,
                exclusive: false,
                autoDelete: false,
            });
            // Bind queue to exchange
            await this.channel.bindQueue(queue, this.exchangeName, pattern);
            // Set prefetch to 1 for fair dispatch
            await this.channel.prefetch(1);
            // Consume messages
            await this.channel.consume(queue, async (msg) => {
                if (!msg)
                    return;
                try {
                    const event = JSON.parse(msg.content.toString());
                    logger_1.default.info('Event received', {
                        eventId: event.id,
                        eventType: event.type,
                        queue,
                    });
                    await handler(event);
                    // Acknowledge message
                    this.channel.ack(msg);
                    logger_1.default.info('Event processed successfully', {
                        eventId: event.id,
                        eventType: event.type,
                    });
                }
                catch (error) {
                    logger_1.default.error('Error processing event', {
                        error: error instanceof Error ? error.message : 'Unknown error',
                        queue,
                    });
                    // Reject message and requeue
                    this.channel.nack(msg, false, true);
                }
            }, {
                noAck: false,
            });
            logger_1.default.info('Subscribed to events', {
                pattern,
                queue,
                service: this.serviceName,
            });
        }
        catch (error) {
            logger_1.default.error('Error subscribing to events', {
                pattern,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    async createQueue(queueName, options = {}) {
        if (!this.channel) {
            throw new Error('EventBus not connected');
        }
        await this.channel.assertQueue(queueName, {
            durable: true,
            exclusive: false,
            autoDelete: false,
            ...options,
        });
    }
    async bindQueue(queueName, pattern) {
        if (!this.channel) {
            throw new Error('EventBus not connected');
        }
        await this.channel.bindQueue(queueName, this.exchangeName, pattern);
    }
    generateEventId() {
        return `${this.serviceName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    // Health check
    async isHealthy() {
        try {
            return !!(this.connection && this.channel);
        }
        catch {
            return false;
        }
    }
}
exports.EventBus = EventBus;
// Singleton instance
let eventBusInstance = null;
const getEventBus = (serviceName) => {
    if (!eventBusInstance) {
        eventBusInstance = new EventBus(serviceName);
    }
    return eventBusInstance;
};
exports.getEventBus = getEventBus;
exports.default = EventBus;
//# sourceMappingURL=event-bus.js.map