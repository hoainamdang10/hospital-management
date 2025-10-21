export interface DomainEvent {
  eventId: string;
  eventType: string;
  aggregateId: string;
  aggregateType: string;
  occurredAt: Date;
  eventData: any;
}

export abstract class BaseDomainEvent implements DomainEvent {
  public readonly eventId: string;
  public readonly eventType: string;
  public readonly aggregateId: string;
  public readonly aggregateType: string;
  public readonly occurredAt: Date;
  public readonly eventData: any;

  constructor(
    aggregateId: string,
    aggregateType: string,
    eventType: string,
    eventData: any
  ) {
    this.eventId = crypto.randomUUID();
    this.aggregateId = aggregateId;
    this.aggregateType = aggregateType;
    this.eventType = eventType;
    this.occurredAt = new Date();
    // Freeze eventData to ensure immutability
    this.eventData = Object.freeze({ ...eventData });
  }
}

