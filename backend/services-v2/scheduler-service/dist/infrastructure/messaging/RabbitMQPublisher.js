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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RabbitMQPublisher = void 0;
const amqp = __importStar(require("amqplib"));
const DeadLetter_entity_1 = require("../../domain/entities/DeadLetter.entity");
class RabbitMQPublisher {
    constructor(config, deadLetterRepo, alertService) {
        this.config = config;
        this.deadLetterRepo = deadLetterRepo;
        this.alertService = alertService;
        this.connection = null;
        this.channel = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 10;
        this.reconnectDelay = 5000;
    }
    async connect() {
        try {
            console.log('🔌 Connecting to RabbitMQ...', {
                url: this.config.url.replace(/\/\/.*@/, '//***@')
            });
            this.connection = await amqp.connect(this.config.url);
            if (!this.connection) {
                throw new Error('Failed to create RabbitMQ connection');
            }
            // Use createConfirmChannel for publisher confirms
            this.channel = await this.connection.createConfirmChannel();
            if (!this.channel) {
                throw new Error('Failed to create RabbitMQ confirm channel');
            }
            // Listen for returned messages (unroutable)
            this.channel.on('return', async (msg) => {
                console.error('❌ Message returned (unroutable):', {
                    routingKey: msg.fields.routingKey,
                    exchange: msg.fields.exchange,
                    messageId: msg.properties.messageId
                });
                // Save to dead_letters table
                await this.handleUnroutableMessage(msg);
            });
            this.connection.on('error', (err) => {
                console.error('❌ RabbitMQ connection error:', err.message);
                this.isConnected = false;
            });
            this.connection.on('close', () => {
                console.warn('⚠️ RabbitMQ connection closed');
                this.isConnected = false;
                this.reconnect();
            });
            await this.channel.assertExchange(this.config.exchange, this.config.exchangeType, { durable: this.config.durable });
            this.isConnected = true;
            this.reconnectAttempts = 0;
            console.log('✅ RabbitMQ connected successfully');
        }
        catch (error) {
            console.error('❌ Failed to connect to RabbitMQ:', error);
            throw error;
        }
    }
    async reconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('❌ Max reconnect attempts reached. Giving up.');
            return;
        }
        this.reconnectAttempts++;
        console.log(`🔄 Reconnecting to RabbitMQ (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
        await new Promise(resolve => setTimeout(resolve, this.reconnectDelay));
        try {
            await this.connect();
        }
        catch (error) {
            console.error('❌ Reconnect failed:', error);
            await this.reconnect();
        }
    }
    async publish(topic, payload, headers) {
        if (!this.isConnected || !this.channel) {
            throw new Error('RabbitMQ not connected');
        }
        try {
            const message = JSON.stringify(payload);
            // Use promise-based publish with publisher confirms
            await new Promise((resolve, reject) => {
                this.channel.publish(this.config.exchange, topic, Buffer.from(message), {
                    persistent: true,
                    contentType: 'application/json',
                    timestamp: Date.now(),
                    messageId: headers.idempotency_key, // Use idempotency_key as messageId
                    mandatory: true, // Detect unroutable messages
                    headers: {
                        ...headers
                    }
                }, (err) => {
                    if (err) {
                        reject(new Error(`Publish failed: ${err.message}`));
                    }
                    else {
                        resolve();
                    }
                });
            });
            console.log('📤 Message published and confirmed', {
                topic,
                idempotency_key: headers.idempotency_key
            });
        }
        catch (error) {
            console.error('❌ Failed to publish message:', error);
            throw error;
        }
    }
    async close() {
        try {
            if (this.channel) {
                await this.channel.close();
            }
            if (this.connection) {
                await this.connection.close();
            }
            this.isConnected = false;
            console.log('✅ RabbitMQ connection closed');
        }
        catch (error) {
            console.error('❌ Error closing RabbitMQ connection:', error);
        }
    }
    getConnectionStatus() {
        return this.isConnected;
    }
    /**
     * Handle unroutable message by saving to dead_letters table
     */
    async handleUnroutableMessage(msg) {
        const messageId = msg.properties.messageId || 'unknown';
        const routingKey = msg.fields.routingKey;
        const exchange = msg.fields.exchange;
        try {
            // Send alert
            if (this.alertService) {
                await this.alertService.sendUnroutableMessageAlert(messageId, routingKey, exchange, {
                    headers: msg.properties.headers,
                    timestamp: new Date().toISOString()
                });
            }
            if (!this.deadLetterRepo) {
                console.warn('⚠️ DeadLetterRepository not configured, skipping dead letter save');
                return;
            }
            // Parse payload
            let payload = {};
            try {
                payload = JSON.parse(msg.content.toString());
            }
            catch (error) {
                payload = { raw: msg.content.toString() };
            }
            // Create dead letter
            const deadLetter = DeadLetter_entity_1.DeadLetter.createForUnroutableMessage(messageId, routingKey, exchange, payload, msg.properties.headers || {}, `Message returned as unroutable. Exchange: ${exchange}, Routing Key: ${routingKey}`);
            // Save to database
            await this.deadLetterRepo.save(deadLetter);
            console.log('✅ Unroutable message saved to dead_letters table', {
                messageId,
                routingKey,
                exchange
            });
        }
        catch (error) {
            console.error('❌ Failed to save unroutable message to dead_letters:', error);
            // Send alert for save failure
            if (this.alertService && error instanceof Error) {
                await this.alertService.sendDeadLetterSaveFailureAlert(error, messageId);
            }
            // Don't throw - we don't want to crash the publisher
        }
    }
}
exports.RabbitMQPublisher = RabbitMQPublisher;
//# sourceMappingURL=RabbitMQPublisher.js.map