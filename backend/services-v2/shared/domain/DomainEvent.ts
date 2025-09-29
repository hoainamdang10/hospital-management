/**
 * Domain Event Base Class
 * Event-Driven Architecture Implementation
 */

export abstract class DomainEvent {
  public readonly occurredOn: Date;
  public readonly eventId: string;
  public readonly eventType: string;

  protected constructor(eventType: string) {
    this.occurredOn = new Date();
    this.eventId = this.generateEventId();
    this.eventType = eventType;
  }

  private generateEventId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  public abstract getAggregateId(): string;
}
