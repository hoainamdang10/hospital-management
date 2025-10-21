/**
 * RabbitMQEventPublisher - RabbitMQ Domain Event Publisher
 * Publishes domain events to RabbitMQ message broker
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Event-Driven Architecture, Clean Architecture
 */
import { DomainEvent } from '../../../../shared/domain/base/domain-event';
import { IDomainEventPublisher, DomainEventPublisherConfig } from '../../../../shared/domain/events/IDomainEventPublisher';
import { ILogger } from '../../../../shared/application/services/logger.interface';
export interface RabbitMQConfig {
    url: string;
    exchange: string;
    exchangeType: 'topic' | 'fanout' | 'direct';
    durable: boolean;
    autoDelete: boolean;
}
/**
 * RabbitMQ Event Publisher
 * Implements IDomainEventPublisher using RabbitMQ
 */
export declare class RabbitMQEventPublisher implements IDomainEventPublisher {
    private readonly config;
    private readonly publisherConfig;
    private readonly logger;
    private connection;
    private channel;
    private isConnected;
    private intentionallyClosed;
    private reconnectAttempts;
    private reconnectTimer;
    private readonly maxReconnectAttempts;
    private readonly reconnectDelayMs;
    constructor(config: RabbitMQConfig, publisherConfig: DomainEventPublisherConfig, logger: ILogger);
    /**
     * Initialize connection to RabbitMQ
     */
    connect(): Promise<void>;
    /**
     * Reconnect to RabbitMQ
     */
    private reconnect;
    /**
     * Publish a single domain event
     */
    publish(event: DomainEvent): Promise<void>;
    /**
     * Publish multiple domain events in batch
     */
    publishBatch(events: DomainEvent[]): Promise<void>;
    /**
     * Publish event with retry mechanism
     */
    publishWithRetry(event: DomainEvent, maxRetries?: number): Promise<void>;
    /**
     * Schedule event for future publishing
     */
    scheduleEvent(event: DomainEvent, publishAt: Date): Promise<void>;
    /**
     * Check if publisher is healthy
     */
    isHealthy(): Promise<boolean>;
    /**
     * Close connection
     */
    close(): Promise<void>;
    /**
     * Get routing key for event
     */
    private getRoutingKey;
    /**
     * Serialize event to JSON
     */
    private serializeEvent;
}
//# sourceMappingURL=RabbitMQEventPublisher.d.ts.map