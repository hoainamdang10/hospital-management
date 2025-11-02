/**
 * RabbitMQConsumer - RabbitMQ Consumer for Notifications Service
 * Consumes scheduled notification events from Scheduler Service
 * Implements idempotent processing with Inbox Pattern
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Event-Driven Architecture, Inbox Pattern
 */
import { NotificationEventHandlers } from '../events/NotificationEventHandlers';
export interface RabbitMQConsumerConfig {
    url: string;
    exchange: string;
    exchangeType: string;
    queueName: string;
    routingKeys: string[];
    prefetchCount: number;
    durable: boolean;
}
export interface MessageHeaders {
    correlation_id?: string;
    causation_id?: string;
    schedule_id?: string;
    run_id?: string;
    tenant_id?: string;
    idempotency_key?: string;
    emitted_at?: string;
}
export declare class RabbitMQConsumer {
    private readonly config;
    private readonly eventHandlers;
    private connection;
    private channel;
    private isConnected;
    private reconnectAttempts;
    private maxReconnectAttempts;
    private reconnectDelay;
    private consumerTag;
    constructor(config: RabbitMQConsumerConfig, eventHandlers: NotificationEventHandlers);
    /**
     * Connect to RabbitMQ and start consuming messages
     */
    start(): Promise<void>;
    /**
     * Handle incoming message
     */
    private handleMessage;
    /**
     * Map routing key to event type
     */
    private mapRoutingKeyToEventType;
    /**
     * Extract aggregate type from routing key
     */
    private extractAggregateTypeFromRoutingKey;
    /**
     * Extract service name from routing key
     */
    private extractServiceFromRoutingKey;
    /**
     * Determine if message should be retried
     */
    private shouldRetryMessage;
    /**
     * Reconnect to RabbitMQ
     */
    private reconnect;
    /**
     * Stop consuming and close connection
     */
    stop(): Promise<void>;
    /**
     * Get connection status
     */
    getConnectionStatus(): boolean;
    /**
     * Get queue stats
     */
    getQueueStats(): Promise<{
        messageCount: number;
        consumerCount: number;
    } | null>;
}
//# sourceMappingURL=RabbitMQConsumer.d.ts.map