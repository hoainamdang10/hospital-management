/**
 * RabbitMQ Event Publisher
 * Publishes domain events to RabbitMQ message broker
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { DomainEvent } from "../../../../shared/domain/base/domain-event";
import { ILogger } from "../../application/services/ILogger";
import { IEventPublisher, IntegrationEventPayload } from "../../application/services/IEventPublisher";
export declare class RabbitMQEventPublisher implements IEventPublisher {
    private readonly rabbitMQUrl;
    private readonly logger;
    private connection;
    private channel;
    private readonly exchangeName;
    private isConnected;
    private readonly pendingEvents;
    private flushingPending;
    private readonly maxPublishAttempts;
    private readonly publishRetryDelayMs;
    constructor(rabbitMQUrl: string, logger: ILogger, exchangeName?: string);
    /**
     * Initialize RabbitMQ connection and channel
     */
    initialize(): Promise<void>;
    /**
     * Publish a single domain event
     */
    publishIntegrationEvent(event: IntegrationEventPayload): Promise<void>;
    /**
     * Publish multiple events in batch
     */
    publishDomainEvents(events: DomainEvent[]): Promise<void>;
    /**
     * Close RabbitMQ connection
     */
    close(): Promise<void>;
    /**
     * Build AMQP routing key using shared helper for consistent naming
     */
    private getRoutingKey;
    private publishWithRetry;
    private flushPendingEvents;
}
/**
 * Mock Event Publisher for testing
 */
export declare class MockEventPublisher implements IEventPublisher {
    private readonly logger;
    private integrationEvents;
    private domainEvents;
    constructor(logger: ILogger);
    initialize(): Promise<void>;
    close(): Promise<void>;
    publishIntegrationEvent(event: IntegrationEventPayload): Promise<void>;
    publishDomainEvents(events: DomainEvent[]): Promise<void>;
    getIntegrationEvents(): IntegrationEventPayload[];
    getDomainEvents(): DomainEvent[];
    clear(): void;
}
//# sourceMappingURL=RabbitMQEventPublisher.d.ts.map