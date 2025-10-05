/**
 * IDomainEventPublisher - Domain Event Publisher Interface
 * Interface for publishing domain events
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Event-Driven Architecture
 */
import { DomainEvent } from '../base/domain-event';
export interface IDomainEventPublisher {
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
}
export interface IDomainEventSubscriber {
    /**
     * Subscribe to domain events by type
     */
    subscribe(eventType: string, handler: DomainEventHandler): Promise<void>;
    /**
     * Unsubscribe from domain events
     */
    unsubscribe(eventType: string, handler: DomainEventHandler): Promise<void>;
    /**
     * Start listening for events
     */
    start(): Promise<void>;
    /**
     * Stop listening for events
     */
    stop(): Promise<void>;
}
export type DomainEventHandler = (event: DomainEvent) => Promise<void>;
export interface DomainEventPublisherConfig {
    enableRetry?: boolean;
    maxRetries?: number;
    retryDelayMs?: number;
    enableBatching?: boolean;
    batchSize?: number;
    batchTimeoutMs?: number;
    enableMetrics?: boolean;
    enableLogging?: boolean;
}
//# sourceMappingURL=IDomainEventPublisher.d.ts.map