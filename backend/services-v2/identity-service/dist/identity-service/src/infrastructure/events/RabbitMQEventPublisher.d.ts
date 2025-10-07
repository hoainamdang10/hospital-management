/**
 * RabbitMQ Event Publisher
 * Publishes domain events to RabbitMQ message broker
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { ILogger } from '../../application/services/ILogger';
export interface DomainEvent {
    eventType: string;
    aggregateId: string;
    aggregateType: string;
    occurredAt: Date;
    payload: any;
    metadata?: {
        userId?: string;
        correlationId?: string;
        causationId?: string;
    };
}
export interface IEventPublisher {
    initialize(): Promise<void>;
    publish(event: DomainEvent): Promise<void>;
    publishBatch(events: DomainEvent[]): Promise<void>;
    close(): Promise<void>;
}
export declare class RabbitMQEventPublisher implements IEventPublisher {
    private readonly rabbitMQUrl;
    private readonly logger;
    private connection;
    private channel;
    private readonly exchangeName;
    private isConnected;
    constructor(rabbitMQUrl: string, logger: ILogger);
    /**
     * Initialize RabbitMQ connection and channel
     */
    initialize(): Promise<void>;
    /**
     * Publish a single domain event
     */
    publish(event: DomainEvent): Promise<void>;
    /**
     * Publish multiple events in batch
     */
    publishBatch(events: DomainEvent[]): Promise<void>;
    /**
     * Close RabbitMQ connection
     */
    close(): Promise<void>;
    /**
     * Get routing key for event
     * Format: {aggregateType}.{eventType}
     * Example: user.registered, user.activated, user.role_changed
     */
    private getRoutingKey;
}
/**
 * Mock Event Publisher for testing
 */
export declare class MockEventPublisher implements IEventPublisher {
    private readonly logger;
    private publishedEvents;
    constructor(logger: ILogger);
    initialize(): Promise<void>;
    publish(event: DomainEvent): Promise<void>;
    publishBatch(events: DomainEvent[]): Promise<void>;
    close(): Promise<void>;
    getPublishedEvents(): DomainEvent[];
    clearEvents(): void;
}
//# sourceMappingURL=RabbitMQEventPublisher.d.ts.map