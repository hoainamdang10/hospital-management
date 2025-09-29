"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RabbitMQClient = void 0;
const amqplib_1 = __importDefault(require("amqplib"));
const events_1 = require("events");
class RabbitMQClient extends events_1.EventEmitter {
    constructor(logger, connectionUrl) {
        super();
        this.connection = null;
        this.channel = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 10;
        this.reconnectDelay = 5000;
        this.logger = logger;
        this.connectionUrl = connectionUrl || process.env.RABBITMQ_URL || 'amqp://admin:admin@localhost:5672';
    }
    async connect() {
        try {
            this.logger.info('Connecting to RabbitMQ...');
            this.connection = await amqplib_1.default.connect(this.connectionUrl);
            this.channel = await this.connection.createChannel();
            this.isConnected = true;
            this.reconnectAttempts = 0;
            this.setupConnectionHandlers();
            this.logger.info('RabbitMQ connection established');
            this.emit('connected');
        }
        catch (error) {
            this.logger.error('Failed to connect to RabbitMQ:', error);
            this.isConnected = false;
            if (this.reconnectAttempts < this.maxReconnectAttempts) {
                this.reconnectAttempts++;
                this.logger.info(`Attempting to reconnect to RabbitMQ (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
                setTimeout(() => {
                    this.connect();
                }, this.reconnectDelay);
            }
            else {
                this.logger.error('Max reconnection attempts reached. Giving up.');
                this.emit('error', error);
            }
            throw error;
        }
    }
    setupConnectionHandlers() {
        if (this.connection) {
            this.connection.on('error', (error) => {
                this.logger.error('RabbitMQ connection error:', error);
                this.isConnected = false;
                this.emit('error', error);
            });
            this.connection.on('close', () => {
                this.logger.warn('RabbitMQ connection closed');
                this.isConnected = false;
                this.emit('disconnected');
                if (this.reconnectAttempts < this.maxReconnectAttempts) {
                    setTimeout(() => {
                        this.connect();
                    }, this.reconnectDelay);
                }
            });
        }
        if (this.channel) {
            this.channel.on('error', (error) => {
                this.logger.error('RabbitMQ channel error:', error);
                this.emit('error', error);
            });
            this.channel.on('close', () => {
                this.logger.warn('RabbitMQ channel closed');
            });
        }
    }
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
            this.logger.info('RabbitMQ connection closed');
            this.emit('disconnected');
        }
        catch (error) {
            this.logger.error('Error disconnecting from RabbitMQ:', error);
        }
    }
    isReady() {
        return this.isConnected && this.connection !== null && this.channel !== null;
    }
    async assertQueue(queue, options = {}) {
        if (!this.channel) {
            throw new Error('RabbitMQ channel not available');
        }
        const defaultOptions = {
            durable: true,
            exclusive: false,
            autoDelete: false,
            ...options
        };
        try {
            await this.channel.assertQueue(queue, defaultOptions);
            this.logger.debug(`Queue '${queue}' asserted`);
        }
        catch (error) {
            this.logger.error(`Failed to assert queue '${queue}':`, error);
            throw error;
        }
    }
    async assertExchange(exchange, options) {
        if (!this.channel) {
            throw new Error('RabbitMQ channel not available');
        }
        const defaultOptions = {
            durable: true,
            autoDelete: false,
            ...options
        };
        try {
            await this.channel.assertExchange(exchange, options.type, defaultOptions);
            this.logger.debug(`Exchange '${exchange}' asserted`);
        }
        catch (error) {
            this.logger.error(`Failed to assert exchange '${exchange}':`, error);
            throw error;
        }
    }
    async sendToQueue(queue, message, options = {}) {
        if (!this.channel) {
            throw new Error('RabbitMQ channel not available');
        }
        try {
            const messageBuffer = Buffer.from(JSON.stringify(message));
            const result = this.channel.sendToQueue(queue, messageBuffer, {
                persistent: true,
                timestamp: Date.now(),
                ...options
            });
            this.logger.debug(`Message sent to queue '${queue}'`);
            return result;
        }
        catch (error) {
            this.logger.error(`Failed to send message to queue '${queue}':`, error);
            throw error;
        }
    }
    async publish(exchange, routingKey, message, options = {}) {
        if (!this.channel) {
            throw new Error('RabbitMQ channel not available');
        }
        try {
            const messageBuffer = Buffer.from(JSON.stringify(message));
            const result = this.channel.publish(exchange, routingKey, messageBuffer, {
                persistent: true,
                timestamp: Date.now(),
                ...options
            });
            this.logger.debug(`Message published to exchange '${exchange}' with routing key '${routingKey}'`);
            return result;
        }
        catch (error) {
            this.logger.error(`Failed to publish message to exchange '${exchange}':`, error);
            throw error;
        }
    }
    async consume(queue, callback, options = {}) {
        if (!this.channel) {
            throw new Error('RabbitMQ channel not available');
        }
        try {
            await this.channel.consume(queue, (msg) => {
                if (msg) {
                    const message = {
                        content: JSON.parse(msg.content.toString()),
                        properties: msg.properties,
                        fields: msg.fields
                    };
                    callback(message);
                    if (!options.noAck) {
                        this.channel.ack(msg);
                    }
                }
                else {
                    callback(null);
                }
            }, {
                noAck: false,
                ...options
            });
            this.logger.debug(`Started consuming from queue '${queue}'`);
        }
        catch (error) {
            this.logger.error(`Failed to consume from queue '${queue}':`, error);
            throw error;
        }
    }
    async bindQueue(queue, exchange, routingKey = '') {
        if (!this.channel) {
            throw new Error('RabbitMQ channel not available');
        }
        try {
            await this.channel.bindQueue(queue, exchange, routingKey);
            this.logger.debug(`Queue '${queue}' bound to exchange '${exchange}' with routing key '${routingKey}'`);
        }
        catch (error) {
            this.logger.error(`Failed to bind queue '${queue}' to exchange '${exchange}':`, error);
            throw error;
        }
    }
    getChannel() {
        return this.channel;
    }
    async healthCheck() {
        try {
            const connectionOk = this.connection !== null && !this.connection.connection.destroyed;
            const channelOk = this.channel !== null;
            return {
                status: connectionOk && channelOk ? 'healthy' : 'unhealthy',
                connection: connectionOk,
                channel: channelOk
            };
        }
        catch (error) {
            this.logger.error('RabbitMQ health check failed:', error);
            return {
                status: 'unhealthy',
                connection: false,
                channel: false
            };
        }
    }
}
exports.RabbitMQClient = RabbitMQClient;
//# sourceMappingURL=RabbitMQClient.js.map