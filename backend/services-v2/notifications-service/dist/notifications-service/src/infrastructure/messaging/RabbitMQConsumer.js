"use strict";
/**
 * RabbitMQConsumer - RabbitMQ Consumer for Notifications Service
 * Consumes scheduled notification events from Scheduler Service
 * Implements idempotent processing with Inbox Pattern
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Event-Driven Architecture, Inbox Pattern
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
exports.RabbitMQConsumer = void 0;
const amqp = __importStar(require("amqplib"));
class RabbitMQConsumer {
    constructor(config, eventHandlers) {
        this.config = config;
        this.eventHandlers = eventHandlers;
        this.connection = null;
        this.channel = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 10;
        this.reconnectDelay = 5000;
        this.consumerTag = null;
    }
    /**
     * Connect to RabbitMQ and start consuming messages
     */
    async start() {
        try {
            console.log(' Connecting to RabbitMQ...', {
                url: this.config.url.replace(/\/\/.*@/, '//***@'),
                queue: this.config.queueName
            });
            // Create connection
            this.connection = (await amqp.connect(this.config.url));
            if (!this.connection) {
                throw new Error('Failed to create RabbitMQ connection');
            }
            // Create channel
            this.channel = await this.connection.createChannel();
            if (!this.channel) {
                throw new Error('Failed to create RabbitMQ channel');
            }
            // Set prefetch count (QoS)
            await this.channel.prefetch(this.config.prefetchCount);
            // Assert exchange
            await this.channel.assertExchange(this.config.exchange, this.config.exchangeType, { durable: this.config.durable });
            // Assert queue
            await this.channel.assertQueue(this.config.queueName, {
                durable: this.config.durable,
                arguments: {
                    'x-queue-type': 'classic',
                    'x-message-ttl': 86400000, // 24 hours
                    'x-max-length': 100000 // Max 100k messages
                }
            });
            // Bind queue to exchange with routing keys
            for (const routingKey of this.config.routingKeys) {
                await this.channel.bindQueue(this.config.queueName, this.config.exchange, routingKey);
                console.log(` Queue bound to routing key: ${routingKey}`);
            }
            // Setup connection error handlers
            this.connection.on('error', (err) => {
                console.error(' RabbitMQ connection error:', err.message);
                this.isConnected = false;
            });
            this.connection.on('close', () => {
                console.warn('️ RabbitMQ connection closed');
                this.isConnected = false;
                this.reconnect();
            });
            // Start consuming messages
            const { consumerTag } = await this.channel.consume(this.config.queueName, async (msg) => {
                if (!msg)
                    return;
                await this.handleMessage(msg);
            }, {
                noAck: false // Manual acknowledgment
            });
            this.consumerTag = consumerTag;
            this.isConnected = true;
            this.reconnectAttempts = 0;
            console.log(' RabbitMQ consumer started successfully', {
                queue: this.config.queueName,
                consumerTag: this.consumerTag,
                prefetchCount: this.config.prefetchCount
            });
        }
        catch (error) {
            console.error(' Failed to start RabbitMQ consumer:', error);
            throw error;
        }
    }
    /**
     * Handle incoming message
     */
    async handleMessage(msg) {
        const startTime = Date.now();
        const headers = msg.properties.headers;
        const routingKey = msg.fields.routingKey;
        const idempotencyKey = headers.idempotency_key || msg.properties.messageId || `${routingKey}-${Date.now()}`;
        try {
            console.log(' Received message', {
                routingKey,
                idempotencyKey,
                timestamp: new Date().toISOString()
            });
            // Parse message payload
            const payload = JSON.parse(msg.content.toString());
            // Route to appropriate handler based on routing key
            if (routingKey === 'scheduler.schedule.run.due') {
                // Handle ScheduleRunDueEvent from Scheduler Service (CRITICAL PATH)
                const event = {
                    type: 'schedule.run.due',
                    payload: payload,
                    headers: {
                        idempotency_key: idempotencyKey,
                        schedule_id: headers.schedule_id || '',
                        run_id: headers.run_id || '',
                        correlation_id: headers.correlation_id,
                        causation_id: headers.causation_id,
                        tenant_id: headers.tenant_id
                    }
                };
                await this.eventHandlers.handleScheduleRunDue(event);
            }
            else {
                // Handle Integration Events from other services
                const integrationEvent = {
                    eventId: payload.eventId || idempotencyKey,
                    eventType: this.mapRoutingKeyToEventType(routingKey),
                    aggregateId: payload.aggregateId || payload.id || '',
                    aggregateType: this.extractAggregateTypeFromRoutingKey(routingKey),
                    eventData: payload,
                    occurredAt: payload.occurredAt ? new Date(payload.occurredAt) : new Date(),
                    version: payload.version || 1,
                    metadata: {
                        correlationId: headers.correlation_id,
                        causationId: headers.causation_id,
                        userId: payload.userId,
                        source: this.extractServiceFromRoutingKey(routingKey)
                    },
                    serviceName: this.extractServiceFromRoutingKey(routingKey),
                    eventVersion: '1.0',
                    headers: {
                        idempotency_key: idempotencyKey,
                        correlation_id: headers.correlation_id,
                        causation_id: headers.causation_id,
                        tenant_id: headers.tenant_id
                    }
                };
                await this.eventHandlers.handleEvent(integrationEvent);
            }
            // Acknowledge message
            if (this.channel) {
                this.channel.ack(msg);
            }
            const processingTime = Date.now() - startTime;
            console.log(' Message processed successfully', {
                routingKey,
                idempotencyKey,
                processingTime: `${processingTime}ms`
            });
        }
        catch (error) {
            const processingTime = Date.now() - startTime;
            console.error(' Error processing message', {
                routingKey,
                idempotencyKey,
                error: error instanceof Error ? error.message : 'Unknown error',
                processingTime: `${processingTime}ms`
            });
            // Decide whether to retry or dead-letter
            const shouldRetry = this.shouldRetryMessage(msg, error);
            if (shouldRetry) {
                // Nack and requeue
                if (this.channel) {
                    this.channel.nack(msg, false, true);
                }
                console.log(' Message requeued for retry', { idempotencyKey });
            }
            else {
                // Nack without requeue (send to DLQ if configured)
                if (this.channel) {
                    this.channel.nack(msg, false, false);
                }
                console.log(' Message sent to dead letter queue', { idempotencyKey });
            }
        }
    }
    /**
     * Map routing key to event type
     */
    mapRoutingKeyToEventType(routingKey) {
        // Map routing keys to event types
        const routingKeyMap = {
            'appointments.appointment.scheduled': 'AppointmentScheduled',
            'appointments.appointment.cancelled': 'AppointmentCancelled',
            'billing.invoice.generated': 'InvoiceGenerated',
            'billing.payment.completed': 'PaymentCompleted',
            'clinical.medical_record_updated': 'MedicalRecordUpdated',
            'emergency.alert': 'EmergencyAlert',
            'user.user_created': 'UserCreated',
            'user.user_activated': 'UserActivated',
            'user.user_role_changed': 'UserRoleChanged',
            'user.password_reset': 'PasswordReset',
            'staffinvitation.staff_invitation_created': 'StaffInvitationCreated',
            'patient.patient_registered': 'PatientRegistered',
            'patient.patient_updated': 'PatientUpdated',
            'patient.patient_deactivated': 'PatientDeactivated',
            'patient.patient_consent_granted': 'PatientConsentGranted'
        };
        return routingKeyMap[routingKey] || routingKey;
    }
    /**
     * Extract aggregate type from routing key
     */
    extractAggregateTypeFromRoutingKey(routingKey) {
        const parts = routingKey.split('.');
        return parts[1] || 'unknown';
    }
    /**
     * Extract service name from routing key
     */
    extractServiceFromRoutingKey(routingKey) {
        const parts = routingKey.split('.');
        const serviceMap = {
            'appointments': 'APPOINTMENT_SERVICE',
            'billing': 'BILLING_SERVICE',
            'clinical': 'CLINICAL_EMR_SERVICE',
            'emergency': 'EMERGENCY_SERVICE',
            'user': 'IDENTITY_SERVICE',
            'staffinvitation': 'IDENTITY_SERVICE',
            'patient': 'PATIENT_REGISTRY_SERVICE'
        };
        return serviceMap[parts[0]] || parts[0].toUpperCase() + '_SERVICE';
    }
    /**
     * Determine if message should be retried
     */
    shouldRetryMessage(msg, error) {
        const headers = msg.properties.headers;
        const retryCount = headers['x-retry-count'] || 0;
        const maxRetries = 3;
        // Don't retry if max retries reached
        if (retryCount >= maxRetries) {
            return false;
        }
        // Don't retry for validation errors
        if (error instanceof Error && error.message.includes('validation')) {
            return false;
        }
        // Retry for transient errors
        return true;
    }
    /**
     * Reconnect to RabbitMQ
     */
    async reconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error(' Max reconnect attempts reached. Giving up.');
            return;
        }
        this.reconnectAttempts++;
        console.log(` Reconnecting to RabbitMQ (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
        await new Promise(resolve => setTimeout(resolve, this.reconnectDelay));
        try {
            await this.start();
        }
        catch (error) {
            console.error(' Reconnect failed:', error);
            await this.reconnect();
        }
    }
    /**
     * Stop consuming and close connection
     */
    async stop() {
        try {
            if (this.channel && this.consumerTag) {
                await this.channel.cancel(this.consumerTag);
                console.log(' Consumer cancelled');
            }
            if (this.channel) {
                await this.channel.close();
                console.log(' Channel closed');
            }
            if (this.connection) {
                await this.connection.close();
                console.log(' Connection closed');
            }
            this.isConnected = false;
            console.log(' RabbitMQ consumer stopped successfully');
        }
        catch (error) {
            console.error(' Error stopping RabbitMQ consumer:', error);
        }
    }
    /**
     * Get connection status
     */
    getConnectionStatus() {
        return this.isConnected;
    }
    /**
     * Get queue stats
     */
    async getQueueStats() {
        if (!this.channel) {
            return null;
        }
        try {
            const queueInfo = await this.channel.checkQueue(this.config.queueName);
            return {
                messageCount: queueInfo.messageCount,
                consumerCount: queueInfo.consumerCount
            };
        }
        catch (error) {
            console.error(' Error getting queue stats:', error);
            return null;
        }
    }
}
exports.RabbitMQConsumer = RabbitMQConsumer;
//# sourceMappingURL=RabbitMQConsumer.js.map