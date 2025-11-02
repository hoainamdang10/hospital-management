"use strict";
/**
 * IdentityEventConsumer
 * Consumes events from Identity Service via RabbitMQ
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Event-Driven Architecture
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdentityEventConsumer = void 0;
const amqplib_1 = __importDefault(require("amqplib"));
/**
 * Identity Event Consumer
 * Subscribes to identity.* events from Identity Service
 */
class IdentityEventConsumer {
    constructor(config, logger, userCreatedHandler, userDeletedHandler, userUpdatedHandler) {
        this.config = config;
        this.logger = logger;
        this.userCreatedHandler = userCreatedHandler;
        this.userDeletedHandler = userDeletedHandler;
        this.userUpdatedHandler = userUpdatedHandler;
        this.connection = null;
        this.channel = null;
        this.isConnected = false;
    }
    /**
     * Connect to RabbitMQ and start consuming
     */
    async connect() {
        try {
            this.logger.info('Connecting to RabbitMQ for Identity events', {
                url: this.config.rabbitmqUrl.replace(/\/\/.*@/, '//***@'), // Hide credentials
                queueName: this.config.queueName
            });
            // Create connection
            this.connection = await amqplib_1.default.connect(this.config.rabbitmqUrl);
            this.channel = await this.connection.createChannel();
            if (!this.channel) {
                throw new Error('Failed to create RabbitMQ channel');
            }
            // Assert exchange
            await this.channel.assertExchange(this.config.exchangeName, 'topic', {
                durable: true
            });
            // Assert dead letter exchange
            const dlxName = this.config.deadLetterExchange || `${this.config.exchangeName}.dlx`;
            await this.channel.assertExchange(dlxName, 'direct', {
                durable: true
            });
            // Assert dead letter queue
            const dlqName = this.config.deadLetterQueue || `${this.config.queueName}.dlq`;
            await this.channel.assertQueue(dlqName, {
                durable: true
            });
            // Bind DLQ to DLX
            await this.channel.bindQueue(dlqName, dlxName, 'failed');
            this.logger.info('Dead letter queue configured', {
                dlxName,
                dlqName
            });
            // Assert queue with DLX configuration
            await this.channel.assertQueue(this.config.queueName, {
                durable: true,
                arguments: {
                    'x-message-ttl': 86400000, // 24 hours
                    'x-max-length': 10000,
                    'x-dead-letter-exchange': dlxName,
                    'x-dead-letter-routing-key': 'failed'
                }
            });
            // Bind queue to routing keys
            for (const routingKey of this.config.routingKeys) {
                await this.channel.bindQueue(this.config.queueName, this.config.exchangeName, routingKey);
                this.logger.info('Queue bound to routing key', {
                    queueName: this.config.queueName,
                    routingKey
                });
            }
            // Start consuming
            await this.channel.consume(this.config.queueName, this.handleMessage.bind(this), { noAck: false });
            this.isConnected = true;
            this.logger.info('Identity event consumer connected successfully');
            // Handle connection errors
            this.connection.on('error', (error) => {
                this.logger.error('RabbitMQ connection error', { error: error.message });
                this.isConnected = false;
            });
            this.connection.on('close', () => {
                this.logger.warn('RabbitMQ connection closed');
                this.isConnected = false;
            });
        }
        catch (error) {
            this.logger.error('Failed to connect Identity event consumer', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }
    /**
     * Handle incoming message
     */
    async handleMessage(msg) {
        if (!msg || !this.channel) {
            return;
        }
        try {
            const content = msg.content.toString();
            const event = JSON.parse(content);
            const routingKey = msg.fields.routingKey;
            // Get retry count
            const retryCount = msg.properties.headers?.['x-retry-count'] || 0;
            const maxRetries = this.config.maxRetries || 3;
            this.logger.debug('Received identity event', {
                routingKey,
                eventId: event.eventId,
                retryCount
            });
            // Route to appropriate handler
            try {
                switch (routingKey) {
                    case 'user.user_created_event':
                        await this.userCreatedHandler.handle(event.payload);
                        break;
                    case 'user.user_deleted_event':
                        await this.userDeletedHandler.handle(event.payload);
                        break;
                    case 'user.user_updated_event':
                        await this.userUpdatedHandler.handle(event.payload);
                        break;
                    default:
                        this.logger.warn('Unknown identity event routing key', { routingKey });
                }
                // Acknowledge message on success
                this.channel.ack(msg);
            }
            catch (handlerError) {
                this.logger.error('Handler error', {
                    routingKey,
                    error: handlerError instanceof Error ? handlerError.message : 'Unknown error',
                    retryCount
                });
                // Retry logic
                if (retryCount < maxRetries) {
                    // Nack without requeue - will go to DLQ
                    this.channel.nack(msg, false, false);
                    // Republish with incremented retry count
                    const retryHeaders = {
                        ...msg.properties.headers,
                        'x-retry-count': retryCount + 1,
                        'x-first-death-reason': handlerError instanceof Error ? handlerError.message : 'Unknown error'
                    };
                    await this.channel.publish(this.config.exchangeName, routingKey, msg.content, {
                        ...msg.properties,
                        headers: retryHeaders
                    });
                    this.logger.info('Message requeued for retry', {
                        eventId: event.eventId,
                        retryCount: retryCount + 1,
                        maxRetries
                    });
                }
                else {
                    // Max retries exceeded - send to DLQ
                    this.channel.nack(msg, false, false);
                    this.logger.error('Max retries exceeded - message sent to DLQ', {
                        routingKey,
                        eventId: event.eventId,
                        retryCount
                    });
                }
            }
        }
        catch (error) {
            this.logger.error('Error processing message', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            // Nack without requeue on parse errors
            if (this.channel) {
                this.channel.nack(msg, false, false);
            }
        }
    }
    /**
     * Disconnect from RabbitMQ
     */
    async disconnect() {
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
            this.logger.info('Identity event consumer disconnected');
        }
        catch (error) {
            this.logger.error('Error disconnecting Identity event consumer', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    /**
     * Check if consumer is connected
     */
    isActive() {
        return this.isConnected;
    }
}
exports.IdentityEventConsumer = IdentityEventConsumer;
//# sourceMappingURL=IdentityEventConsumer.js.map