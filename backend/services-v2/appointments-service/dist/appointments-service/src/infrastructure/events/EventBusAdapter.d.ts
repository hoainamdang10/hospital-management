/**
 * EventBusAdapter - Adapter Pattern
 * Adapts IEventBus to IDomainEventPublisher interface
 *
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance Clean Architecture, Adapter Pattern
 */
import { DomainEvent } from '../../../../shared/domain/base/domain-event';
import { IDomainEventPublisher } from '../../../../shared/domain/events/IDomainEventPublisher';
import { IEventBus } from '../../../../shared/infrastructure/event-bus/EventBus';
/**
 * Adapter that wraps IEventBus to implement IDomainEventPublisher
 * This allows us to use the existing EventBus infrastructure for domain event publishing
 */
export declare class EventBusAdapter implements IDomainEventPublisher {
    private readonly eventBus;
    constructor(eventBus: IEventBus);
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
     * Note: Retry logic is handled by the underlying EventBus/RabbitMQ
     */
    publishWithRetry(event: DomainEvent, maxRetries?: number): Promise<void>;
    /**
     * Schedule event for future publishing
     */
    scheduleEvent(event: DomainEvent, publishAt: Date): Promise<void>;
    /**
     * Check if publisher is healthy
     * Note: This is a simple check - EventBus doesn't expose health status
     */
    isHealthy(): Promise<boolean>;
}
//# sourceMappingURL=EventBusAdapter.d.ts.map