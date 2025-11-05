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
import { IEventBus, EventHandler } from '../../../../shared/events/event-bus.interface';
import { DomainEvent } from '../../../../shared/domain/base/domain-event';
import { ILogger } from '../../../../shared/application/services/logger.interface';
export interface RabbitMQEventBusConfig {
    rabbitmqUrl: string;
    exchangeName: string;
    serviceName: string;
    queueName?: string;
    routingKeyPrefix?: string;
    deadLetterExchange?: string;
    maxRetries?: number;
    retryDelay?: number;
    prefetchCount?: number;
}
export interface PublishOptions {
    persistent?: boolean;
    priority?: number;
    expiration?: string;
    correlationId?: string;
    replyTo?: string;
}
/**
 * RabbitMQ Event Bus
 * Production-ready event bus with:
 * - Automatic reconnection
 * - Dead letter queue
 * - Message persistence
 * - Error handling
 * - Metrics tracking
 */
export declare class RabbitMQEventBus implements IEventBus {
    private readonly config;
    private readonly logger;
    private connection?;
    private channel?;
    private isConnected;
    private reconnectAttempts;
    private readonly maxReconnectAttempts;
    private readonly reconnectDelay;
    private subscribers;
    private readonly exchangeName;
    private readonly serviceName;
    private readonly queueName;
    private readonly routingKeyPrefix;
    private readonly deadLetterExchange;
    private readonly maxRetries;
    private readonly retryDelay;
    private readonly prefetchCount;
    constructor(config: RabbitMQEventBusConfig, logger: ILogger);
    /**
     * Connect to RabbitMQ and setup topology
     */
    connect(): Promise<void>;
    /**
     * Setup RabbitMQ topology (exchanges, queues, bindings)
     */
    private setupTopology;
    /**
     * Disconnect from RabbitMQ
     */
    disconnect(): Promise<void>;
    /**
     * Publish domain event to RabbitMQ
     */
    publish(event: DomainEvent, options?: PublishOptions): Promise<void>;
    /**
     * Publish batch of events
     */
    publishBatch(events: DomainEvent[], options?: PublishOptions): Promise<void>;
    /**
     * Subscribe to events
     */
    subscribe<T extends DomainEvent>(eventType: string, handler: EventHandler<T>, queueName?: string): Promise<void>;
    /**
     * Start consuming messages from queue
     */
    startConsuming(routingKeys: string[]): Promise<void>;
    /**
    private async handleMessage(msg: ConsumeMessage): Promise<void> {
     */
    private handleMessage;
    /**
     * Check if event bus is connected
     */
    isEventBusConnected(): boolean;
    /**
     * Generate routing key from event
     */
    private generateRoutingKey;
    /**
     * Serialize event to JSON
     */
    private serializeEvent;
    /**
     * Deserialize event from JSON
     */
    private deserializeEvent;
    /**
    private getRetryCount(msg: ConsumeMessage): number {
     */
    private getRetryCount;
    /**
     * Handle connection error
     */
    private handleConnectionError;
    /**
     * Attempt to reconnect
     */
    private attemptReconnect;
    /**
     * Mask sensitive URL information
     */
    private maskUrl;
    /**
     * Get event bus metrics
     */
    getMetrics(): {
        isConnected: boolean;
        reconnectAttempts: number;
        subscribersCount: number;
    };
}
//# sourceMappingURL=RabbitMQEventBus.d.ts.map