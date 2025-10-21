/**
 * MockEventPublisher - Test Mock
 * Mock implementation of IDomainEventPublisher for testing
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Testing Best Practices
 */
import { IDomainEventPublisher } from '../../../shared/domain/events/IDomainEventPublisher';
import { IDomainEvent } from '../../../shared/domain/events/IDomainEvent';
import { IntegrationEvent } from '../../../shared/domain/events/IntegrationEvent';
export declare class MockEventPublisher implements IDomainEventPublisher {
    private events;
    private integrationEvents;
    private publishHistory;
    private subscribers;
    constructor();
    /**
     * Publish domain event
     */
    publish(event: IDomainEvent): Promise<void>;
    /**
     * Publish multiple events
     */
    publishAll(events: IDomainEvent[]): Promise<void>;
    /**
     * Subscribe to events
     */
    subscribe(eventType: string, handler: (event: IDomainEvent) => Promise<void>): void;
    /**
     * Unsubscribe from events
     */
    unsubscribe(eventType: string, handler: (event: IDomainEvent) => Promise<void>): void;
    /**
     * Get all published events
     */
    get publishedEvents(): IDomainEvent[];
    /**
     * Get all published integration events
     */
    get publishedIntegrationEvents(): IntegrationEvent[];
    /**
     * Get all events (domain + integration)
     */
    get allPublishedEvents(): (IDomainEvent | IntegrationEvent)[];
    /**
     * Get publish history
     */
    get publishHistory(): Array<{
        event: IDomainEvent | IntegrationEvent;
        timestamp: Date;
        success: boolean;
        error?: Error;
    }>;
    /**
     * Clear all events and history
     */
    clear(): void;
    /**
     * Get events by type
     */
    getEventsByType(eventType: string): IDomainEvent[];
    /**
     * Get integration events by type
     */
    getIntegrationEventsByType(eventType: string): IntegrationEvent[];
    /**
     * Get events by aggregate ID
     */
    getEventsByAggregateId(aggregateId: string): IDomainEvent[];
    /**
     * Get events count
     */
    getEventsCount(): number;
    /**
     * Get integration events count
     */
    getIntegrationEventsCount(): number;
    /**
     * Get total events count
     */
    getTotalEventsCount(): number;
    /**
     * Check if event was published
     */
    wasEventPublished(eventType: string): boolean;
    /**
     * Check if integration event was published
     */
    wasIntegrationEventPublished(eventType: string): boolean;
    /**
     * Get last published event
     */
    getLastPublishedEvent(): IDomainEvent | IntegrationEvent | null;
    /**
     * Get last published event of type
     */
    getLastPublishedEventOfType(eventType: string): IDomainEvent | IntegrationEvent | null;
    /**
     * Get events published in time range
     */
    getEventsInTimeRange(startTime: Date, endTime: Date): (IDomainEvent | IntegrationEvent)[];
    /**
     * Get failed publishes
     */
    getFailedPublishes(): Array<{
        event: IDomainEvent | IntegrationEvent;
        timestamp: Date;
        error: Error;
    }>;
    /**
     * Get successful publishes
     */
    getSuccessfulPublishes(): Array<{
        event: IDomainEvent | IntegrationEvent;
        timestamp: Date;
    }>;
    /**
     * Get publish success rate
     */
    getPublishSuccessRate(): number;
    /**
     * Simulate publish failure
     */
    private shouldSimulateFailure;
    private failureError;
    simulatePublishFailure(error: Error): void;
    clearFailureSimulation(): void;
    /**
     * Get event statistics
     */
    getEventStatistics(): {
        totalEvents: number;
        domainEvents: number;
        integrationEvents: number;
        eventsByType: Record<string, number>;
        publishSuccessRate: number;
        averagePublishTime: number;
        recentEvents: Array<{
            eventType: string;
            timestamp: Date;
            success: boolean;
        }>;
    };
    /**
     * Wait for events to be published
     */
    waitForEvents(count: number, timeoutMs?: number): Promise<void>;
    /**
     * Wait for specific event type
     */
    waitForEventType(eventType: string, timeoutMs?: number): Promise<IDomainEvent | IntegrationEvent>;
    /**
     * Get event type from event object
     */
    private getEventType;
    /**
     * Simulate async operation
     */
    private simulateAsyncOperation;
    /**
     * Create event matcher for testing
     */
    createEventMatcher(eventType: string, properties?: Record<string, any>): (event: IDomainEvent | IntegrationEvent) => boolean;
    /**
     * Find events matching criteria
     */
    findEvents(matcher: (event: IDomainEvent | IntegrationEvent) => boolean): (IDomainEvent | IntegrationEvent)[];
    /**
     * Assert event was published (for testing)
     */
    assertEventPublished(eventType: string, properties?: Record<string, any>): void;
    /**
     * Assert event was not published (for testing)
     */
    assertEventNotPublished(eventType: string, properties?: Record<string, any>): void;
    /**
     * Assert event count (for testing)
     */
    assertEventCount(eventType: string, expectedCount: number): void;
}
//# sourceMappingURL=MockEventPublisher.d.ts.map