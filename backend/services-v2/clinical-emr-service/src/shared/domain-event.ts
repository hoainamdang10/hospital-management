import { v4 as uuidv4 } from 'uuid';

export abstract class DomainEvent {
  public readonly eventId: string;
  public readonly eventType: string;
  public readonly aggregateId: string;
  public readonly aggregateType: string;
  public readonly eventVersion: number;
  public readonly occurredAt: Date;
  public readonly correlationId?: string;
  public readonly causationId?: string;
  public readonly userId?: string;
  public readonly metadata: Record<string, unknown>;

  protected constructor(
    eventType: string,
    aggregateId: string,
    aggregateType: string,
    version: number = 1,
    userId?: string,
    metadata: Record<string, unknown> = {},
  ) {
    this.eventId = uuidv4();
    this.eventType = eventType;
    this.aggregateId = aggregateId;
    this.aggregateType = aggregateType;
    this.eventVersion = version;
    this.occurredAt = new Date();
    this.userId = userId;
    this.metadata = metadata;
  }

  abstract getEventData(): any;
  abstract containsPHI(): boolean;
  abstract getPatientId(): string | null;

  getRoutingKey(): string {
    return this.eventType;
  }

  toJSON() {
    return {
      eventId: this.eventId,
      eventType: this.eventType,
      aggregateId: this.aggregateId,
      aggregateType: this.aggregateType,
      eventVersion: this.eventVersion,
      occurredAt: this.occurredAt.toISOString(),
      eventData: this.getEventData(),
      userId: this.userId,
      metadata: this.metadata,
    };
  }
}
