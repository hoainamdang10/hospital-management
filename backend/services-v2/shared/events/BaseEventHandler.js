"use strict";
/**
 * BaseEventHandler - Base Event Handler
 * Abstract base class for all service event handlers
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Event-Driven Architecture, Vietnamese Healthcare Standards
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseEventHandler = void 0;
const EventBusConfiguration_1 = require("./EventBusConfiguration");
class BaseEventHandler {
    constructor(serviceName, logger) {
        this.serviceName = serviceName;
        this.logger = logger;
        this.connection = null;
        this.channel = null;
        this.isConnected = false;
        this.eventBusConfig = EventBusConfiguration_1.EventBusConfiguration.getInstance();
        this.serviceConfig = this.eventBusConfig.getServiceConfig(serviceName);
        this.metrics = {
            totalProcessed: 0,
            totalSuccessful: 0,
            totalFailed: 0,
            averageProcessingTime: 0,
            errorRate: 0
        };
    }
    /**
     * Initialize event handler
     */
    async initialize() {
        try {
            this.log('info', `🚀 Initializing event handler for ${this.serviceName}`);
            await this.connect();
            await this.setupInfrastructure();
            await this.startConsuming();
            this.log('info', `✅ Event handler initialized for ${this.serviceName}`);
        }
        catch (error) {
            this.log('error', `❌ Failed to initialize event handler for ${this.serviceName}:`, error);
            throw error;
        }
    }
    /**
     * Connect to RabbitMQ
     */
    async connect() {
        try {
            this.connection = await this.eventBusConfig.createConnection();
            this.channel = await this.connection.createChannel();
            this.isConnected = true;
            // Handle connection events
            this.connection.on('error', (error) => {
                this.log('error', `🚨 RabbitMQ connection error for ${this.serviceName}:`, error);
                this.isConnected = false;
                this.scheduleReconnect();
            });
            this.connection.on('close', () => {
                this.log('warn', `⚠️ RabbitMQ connection closed for ${this.serviceName}`);
                this.isConnected = false;
                this.scheduleReconnect();
            });
        }
        catch (error) {
            this.log('error', `❌ Failed to connect to RabbitMQ for ${this.serviceName}:`, error);
            throw error;
        }
    }
    /**
     * Setup RabbitMQ infrastructure
     */
    async setupInfrastructure() {
        if (!this.channel) {
            throw new Error('Channel not available');
        }
        await this.eventBusConfig.setupServiceInfrastructure(this.channel, this.serviceConfig);
    }
    /**
     * Start consuming messages
     */
    async startConsuming() {
        if (!this.channel) {
            throw new Error('Channel not available');
        }
        try {
            await this.channel.consume(this.serviceConfig.queueName, async (message) => {
                if (message) {
                    await this.handleMessage(message);
                }
            }, { noAck: false });
            this.log('info', `👂 Started consuming messages for ${this.serviceName}`);
        }
        catch (error) {
            this.log('error', `❌ Failed to start consuming for ${this.serviceName}:`, error);
            throw error;
        }
    }
    /**
     * Handle incoming message
     */
    async handleMessage(message) {
        const startTime = Date.now();
        let event = null;
        try {
            // Parse message
            const messageContent = message.content.toString();
            event = JSON.parse(messageContent);
            this.log('info', `📨 Received event: ${event.eventType} from ${event.serviceName}`);
            // Validate event
            if (!this.eventBusConfig.validateEvent(event)) {
                throw new Error(`Invalid event structure: ${event.eventType}`);
            }
            // Check if service should process this event
            if (!this.eventBusConfig.shouldProcessEvent(event, this.serviceConfig)) {
                this.log('debug', `⏭️ Skipping event ${event.eventType} - not relevant for ${this.serviceName}`);
                this.channel?.ack(message);
                return;
            }
            // Add Vietnamese healthcare metadata
            const healthcareMetadata = this.eventBusConfig.getVietnameseHealthcareMetadata(event);
            event.metadata = { ...event.metadata, ...healthcareMetadata };
            // Process event
            const result = await this.processEvent(event);
            if (result.success) {
                this.channel?.ack(message);
                this.updateMetrics(true, result.processingTime);
                this.log('info', `✅ Successfully processed event ${event.eventType} in ${result.processingTime}ms`);
            }
            else {
                await this.handleProcessingError(message, event, result.error || new Error('Processing failed'));
            }
        }
        catch (error) {
            this.log('error', `❌ Failed to handle message for ${this.serviceName}:`, error);
            await this.handleProcessingError(message, event, error);
        }
    }
    /**
     * Handle processing error
     */
    async handleProcessingError(message, event, error) {
        try {
            const retryCount = this.getRetryCount(message);
            const maxRetries = this.eventBusConfig.getConfig().retryAttempts;
            this.updateMetrics(false, Date.now() - message.properties.timestamp);
            if (retryCount < maxRetries && this.isRetryableError(error)) {
                // Retry with exponential backoff
                const delay = this.eventBusConfig.getConfig().retryDelay * Math.pow(2, retryCount);
                this.log('warn', `🔄 Retrying event processing (attempt ${retryCount + 1}/${maxRetries}) in ${delay}ms`);
                setTimeout(() => {
                    this.channel?.nack(message, false, true);
                }, delay);
            }
            else {
                // Send to dead letter queue
                this.log('error', `💀 Sending event to dead letter queue after ${retryCount} retries`);
                await this.sendToDeadLetterQueue(message, event, error);
                this.channel?.ack(message);
            }
        }
        catch (retryError) {
            this.log('error', `❌ Failed to handle processing error for ${this.serviceName}:`, retryError);
            this.channel?.nack(message, false, false);
        }
    }
    /**
     * Send message to dead letter queue
     */
    async sendToDeadLetterQueue(message, event, error) {
        if (!this.channel)
            return;
        try {
            const dlxName = this.eventBusConfig.getConfig().deadLetterExchange;
            await this.channel.publish(dlxName, 'failed', message.content, {
                headers: {
                    ...message.properties.headers,
                    'x-original-routing-key': message.fields.routingKey,
                    'x-error-message': error.message,
                    'x-failed-at': new Date().toISOString(),
                    'x-service-name': this.serviceName,
                    'x-event-type': event?.eventType || 'unknown'
                }
            });
            this.log('info', `📤 Sent failed event to dead letter queue: ${event?.eventType || 'unknown'}`);
        }
        catch (dlqError) {
            this.log('error', `❌ Failed to send to dead letter queue for ${this.serviceName}:`, dlqError);
        }
    }
    /**
     * Publish integration event
     */
    async publishEvent(event) {
        if (!this.channel || !this.isConnected) {
            throw new Error(`Event bus not connected for ${this.serviceName}`);
        }
        try {
            // Validate event
            if (!this.eventBusConfig.validateEvent(event)) {
                throw new Error(`Invalid event structure: ${event.eventType}`);
            }
            // Add Vietnamese healthcare metadata
            const healthcareMetadata = this.eventBusConfig.getVietnameseHealthcareMetadata(event);
            event.metadata = { ...event.metadata, ...healthcareMetadata };
            const routingKey = this.eventBusConfig.getRoutingKey(event.eventType, event.priority);
            const messageBuffer = Buffer.from(JSON.stringify(event));
            await this.channel.publish(this.eventBusConfig.getConfig().exchangeName, routingKey, messageBuffer, {
                persistent: true,
                timestamp: Date.now(),
                headers: {
                    'content-type': 'application/json',
                    'source-service': this.serviceName,
                    'event-type': event.eventType,
                    'priority': event.priority,
                    'healthcare-context': 'vietnamese'
                }
            });
            this.log('info', `📤 Published event: ${event.eventType} with routing key: ${routingKey}`);
        }
        catch (error) {
            this.log('error', `❌ Failed to publish event from ${this.serviceName}:`, error);
            throw error;
        }
    }
    /**
     * Get retry count from message headers
     */
    getRetryCount(message) {
        return message.properties.headers?.['x-retry-count'] || 0;
    }
    /**
     * Check if error is retryable
     */
    isRetryableError(error) {
        const retryableErrors = [
            'ECONNREFUSED',
            'ETIMEDOUT',
            'ENOTFOUND',
            'Database connection failed',
            'Service temporarily unavailable'
        ];
        return retryableErrors.some(retryableError => error.message.includes(retryableError));
    }
    /**
     * Update processing metrics
     */
    updateMetrics(success, processingTime) {
        this.metrics.totalProcessed++;
        if (success) {
            this.metrics.totalSuccessful++;
        }
        else {
            this.metrics.totalFailed++;
        }
        // Update average processing time
        const totalTime = (this.metrics.averageProcessingTime * (this.metrics.totalProcessed - 1)) + processingTime;
        this.metrics.averageProcessingTime = totalTime / this.metrics.totalProcessed;
        // Update error rate
        this.metrics.errorRate = (this.metrics.totalFailed / this.metrics.totalProcessed) * 100;
        this.metrics.lastProcessedAt = new Date();
    }
    /**
     * Schedule reconnection
     */
    scheduleReconnect() {
        setTimeout(async () => {
            try {
                this.log('info', `🔄 Attempting to reconnect event handler for ${this.serviceName}`);
                await this.initialize();
            }
            catch (error) {
                this.log('error', `❌ Reconnection failed for ${this.serviceName}:`, error);
                this.scheduleReconnect();
            }
        }, 5000);
    }
    /**
     * Get handler metrics
     */
    getMetrics() {
        return { ...this.metrics };
    }
    /**
     * Get connection status
     */
    getStatus() {
        return {
            connected: this.isConnected,
            serviceName: this.serviceName,
            queueName: this.serviceConfig.queueName,
            metrics: this.getMetrics()
        };
    }
    /**
     * Close connection
     */
    async close() {
        try {
            if (this.channel) {
                await this.channel.close();
            }
            if (this.connection) {
                await this.connection.close();
            }
            this.isConnected = false;
            this.log('info', `🔌 Event handler closed for ${this.serviceName}`);
        }
        catch (error) {
            this.log('error', `❌ Error closing event handler for ${this.serviceName}:`, error);
        }
    }
    /**
     * Logging helper
     */
    log(level, message, ...args) {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] [${this.serviceName}] ${message}`;
        if (this.logger) {
            this.logger[level](logMessage, ...args);
        }
        else {
            console[level](logMessage, ...args);
        }
    }
}
exports.BaseEventHandler = BaseEventHandler;
//# sourceMappingURL=BaseEventHandler.js.map