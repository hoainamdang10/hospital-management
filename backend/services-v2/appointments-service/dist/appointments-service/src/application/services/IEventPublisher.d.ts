/**
 * Event Publisher Interface - Application Layer
 * Defines contract for publishing domain events
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Event-Driven Architecture
 */
export interface DomainEvent {
    eventType: string;
    aggregateId: string;
    aggregateType: string;
    eventData: Record<string, any>;
    metadata: {
        correlationId?: string;
        causationId?: string;
        timestamp: Date;
        [key: string]: any;
    };
}
export interface IEventPublisher {
    /**
     * Publish a domain event
     */
    publish(event: DomainEvent): Promise<void>;
    /**
     * Publish multiple domain events
     */
    publishBatch(events: DomainEvent[]): Promise<void>;
    /**
     * Check if publisher is connected
     */
    isConnected(): boolean;
    /**
     * Connect to event broker
     */
    connect(): Promise<void>;
    /**
     * Disconnect from event broker
     */
    disconnect(): Promise<void>;
}
//# sourceMappingURL=IEventPublisher.d.ts.map