/**
 * DomainEvent - Base class for all domain events
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture
 */
export declare abstract class DomainEvent<T = any> {
    readonly eventType: string;
    readonly data: T;
    readonly timestamp: Date;
    readonly eventId: string;
    readonly version: string;
    protected constructor(eventType: string, data: T, timestamp?: Date, eventId?: string, version?: string);
    /**
     * Generate unique event ID
     */
    private static generateEventId;
    /**
     * Get event type
     */
    getEventType(): string;
    /**
     * Get event data
     */
    getData(): T;
    /**
     * Get event timestamp
     */
    getTimestamp(): Date;
    /**
     * Get event ID
     */
    getEventId(): string;
    /**
     * Get event version
     */
    getVersion(): string;
    /**
     * Get event age in milliseconds
     */
    getAge(): number;
    /**
     * Check if event is recent (within last 5 minutes)
     */
    isRecent(): boolean;
    /**
     * Check if event is stale (older than 1 hour)
     */
    isStale(): boolean;
    /**
     * Serialize to JSON
     */
    toJSON(): object;
    /**
     * String representation
     */
    toString(): string;
    /**
     * Equality comparison
     */
    equals(other: DomainEvent): boolean;
}
//# sourceMappingURL=DomainEvent.d.ts.map