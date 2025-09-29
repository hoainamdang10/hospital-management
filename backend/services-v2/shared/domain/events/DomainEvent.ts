/**
 * DomainEvent - Base class for all domain events
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture
 */

export abstract class DomainEvent<T = any> {
  public readonly eventType: string;
  public readonly data: T;
  public readonly timestamp: Date;
  public readonly eventId: string;
  public readonly version: string;

  protected constructor(
    eventType: string,
    data: T,
    timestamp: Date = new Date(),
    eventId: string = DomainEvent.generateEventId(),
    version: string = '1.0'
  ) {
    this.eventType = eventType;
    this.data = data;
    this.timestamp = timestamp;
    this.eventId = eventId;
    this.version = version;
  }

  /**
   * Generate unique event ID
   */
  private static generateEventId(): string {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 15);
    return `evt_${timestamp}_${randomPart}`;
  }

  /**
   * Get event type
   */
  public getEventType(): string {
    return this.eventType;
  }

  /**
   * Get event data
   */
  public getData(): T {
    return this.data;
  }

  /**
   * Get event timestamp
   */
  public getTimestamp(): Date {
    return new Date(this.timestamp);
  }

  /**
   * Get event ID
   */
  public getEventId(): string {
    return this.eventId;
  }

  /**
   * Get event version
   */
  public getVersion(): string {
    return this.version;
  }

  /**
   * Get event age in milliseconds
   */
  public getAge(): number {
    return Date.now() - this.timestamp.getTime();
  }

  /**
   * Check if event is recent (within last 5 minutes)
   */
  public isRecent(): boolean {
    return this.getAge() < 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Check if event is stale (older than 1 hour)
   */
  public isStale(): boolean {
    return this.getAge() > 60 * 60 * 1000; // 1 hour
  }

  /**
   * Serialize to JSON
   */
  public toJSON(): object {
    return {
      eventType: this.eventType,
      eventId: this.eventId,
      timestamp: this.timestamp.toISOString(),
      version: this.version,
      data: this.data
    };
  }

  /**
   * String representation
   */
  public toString(): string {
    return `${this.eventType}(${this.eventId})`;
  }

  /**
   * Equality comparison
   */
  public equals(other: DomainEvent): boolean {
    if (!other) return false;
    return this.eventId === other.eventId;
  }
}
