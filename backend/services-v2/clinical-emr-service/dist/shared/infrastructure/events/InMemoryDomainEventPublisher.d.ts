/**
 * In-Memory Domain Event Publisher - Shared Infrastructure
 * Simple in-memory implementation for domain events
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { IDomainEventPublisher } from '../../domain/events/IDomainEventPublisher';
import { DomainEvent } from '../../domain/base/domain-event';
export declare class InMemoryDomainEventPublisher implements IDomainEventPublisher {
    private handlers;
    publish(event: DomainEvent): Promise<void>;
    publishBatch(events: DomainEvent[]): Promise<void>;
    publishWithRetry(event: DomainEvent, maxRetries?: number): Promise<void>;
    scheduleEvent(event: DomainEvent, publishAt: Date): Promise<void>;
    isHealthy(): Promise<boolean>;
    subscribe(eventType: string, handler: (event: DomainEvent) => Promise<void>): void;
}
//# sourceMappingURL=InMemoryDomainEventPublisher.d.ts.map