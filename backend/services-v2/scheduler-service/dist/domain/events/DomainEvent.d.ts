export interface DomainEvent {
    eventId: string;
    eventType: string;
    aggregateId: string;
    aggregateType: string;
    occurredAt: Date;
    eventData: any;
}
export declare abstract class BaseDomainEvent implements DomainEvent {
    readonly eventData: any;
    readonly eventId: string;
    readonly eventType: string;
    readonly aggregateId: string;
    readonly aggregateType: string;
    readonly occurredAt: Date;
    constructor(aggregateId: string, aggregateType: string, eventType: string, eventData: any);
}
//# sourceMappingURL=DomainEvent.d.ts.map