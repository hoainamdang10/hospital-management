/**
 * Domain Event Base Class
 * Event-Driven Architecture Implementation
 */
export declare abstract class DomainEvent {
    readonly occurredOn: Date;
    readonly eventId: string;
    readonly eventType: string;
    protected constructor(eventType: string);
    private generateEventId;
    abstract getAggregateId(): string;
}
//# sourceMappingURL=DomainEvent.d.ts.map