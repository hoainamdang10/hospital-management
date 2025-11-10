/**
 * BillingEventPublisher - Infrastructure Layer
 * Infrastructure implementation of domain event publisher for billing service
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Event-Driven Architecture, RabbitMQ Integration
 */
import { IDomainEvent } from '../../../../shared/domain/events/IDomainEvent';
import { IDomainEventPublisher } from '../../../../shared/domain/events/IDomainEventPublisher';
export interface EventPublisherConfig {
    rabbitmqUrl: string;
    exchangeName: string;
    routingKeyPrefix: string;
    retryAttempts: number;
    retryDelay: number;
    enableDeadLetterQueue: boolean;
    eventStore?: {
        enabled: boolean;
        tableName: string;
    };
}
export interface PublishedEvent {
    eventId: string;
    eventName: string;
    aggregateId: string;
    aggregateType: string;
    eventVersion: number;
    eventData: any;
    occurredAt: string;
    publishedAt: string;
    routingKey: string;
    correlationId?: string;
    causationId?: string;
}
/**
 * BillingEventPublisher
 * Infrastructure implementation for publishing billing domain events
 */
export declare class BillingEventPublisher implements IDomainEventPublisher {
    private readonly config;
    private connection;
    private channel;
    private isConnected;
    private eventStore;
    constructor(config: EventPublisherConfig);
    /**
     * Initialize connection to message broker
     */
    initialize(): Promise<void>;
    /**
     * Publish domain event
     */
    publish(event: IDomainEvent): Promise<void>;
    /**
     * Publish multiple events in batch
     */
    publishBatch(events: IDomainEvent[]): Promise<void>;
    /**
     * Get published events for aggregate
     */
    getEventsForAggregate(aggregateId: string): Promise<PublishedEvent[]>;
    /**
     * Get events by type
     */
    getEventsByType(eventName: string): Promise<PublishedEvent[]>;
    /**
     * Get events in date range
     */
    getEventsInDateRange(startDate: Date, endDate: Date): Promise<PublishedEvent[]>;
    /**
     * Close connection
     */
    close(): Promise<void>;
    /**
     * Connect to RabbitMQ
     */
    private connectToRabbitMQ;
    /**
     * Setup exchange and queues
     */
    private setupExchangeAndQueues;
    /**
     * Create published event from domain event
     */
    private createPublishedEvent;
    /**
     * Store event in event store
     */
    private storeEvent;
    /**
     * Publish event to message broker
     */
    private publishToMessageBroker;
    /**
     * Retry publishing event
     */
    private retryPublish;
    /**
     * Send event to dead letter queue
     */
    private sendToDeadLetterQueue;
    /**
     * Generate correlation ID
     */
    private generateCorrelationId;
    /**
     * Delay utility
     */
    private delay;
    /**
     * Health check
     */
    healthCheck(): Promise<{
        isHealthy: boolean;
        connectionStatus: string;
        lastEventPublished?: string;
        eventStoreSize: number;
    }>;
    /**
     * Get last event published timestamp
     */
    private getLastEventPublished;
    /**
     * Get event statistics
     */
    getEventStatistics(): Promise<{
        totalEvents: number;
        eventsByType: Record<string, number>;
        eventsByAggregate: Record<string, number>;
        eventsToday: number;
        eventsThisWeek: number;
        eventsThisMonth: number;
    }>;
}
//# sourceMappingURL=BillingEventPublisher.d.ts.map