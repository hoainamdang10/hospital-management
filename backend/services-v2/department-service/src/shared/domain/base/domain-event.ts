import { randomUUID } from 'crypto';

/**
 * Base class for healthcare domain events used by Department Service.
 */
export abstract class HealthcareDomainEvent<TPayload = any> {
  public readonly eventId: string;
  public readonly eventType: string;
  public readonly occurredOn: Date;
  public readonly payload: TPayload;

  protected constructor(eventType: string, payload: TPayload, eventId?: string, occurredOn?: Date) {
    this.eventType = eventType;
    this.payload = payload;
    this.eventId = eventId ?? randomUUID();
    this.occurredOn = occurredOn ?? new Date();
  }

  toJSON(): Record<string, unknown> {
    return {
      eventId: this.eventId,
      eventType: this.eventType,
      occurredOn: this.occurredOn.toISOString(),
      payload: this.payload,
    };
  }
}
