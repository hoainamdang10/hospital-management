/**
 * Domain Event Base Class - Domain-Driven Design
 * Base class for all domain events in the system
 * 
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance DDD, Event Sourcing, HIPAA
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Abstract base class for all domain events
 */
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

  protected constructor(
    eventType: string,
    aggregateId: string,
    aggregateType: string,
    eventData: any,
    eventVersion: number = 1,
    correlationId?: string,
    causationId?: string,
    userId?: string
  ) {
    this.eventId = uuidv4();
    this.eventType = eventType;
    this.aggregateId = aggregateId;
    this.aggregateType = aggregateType;
    this.eventVersion = eventVersion;
    this.occurredAt = new Date();
    this.correlationId = correlationId;
    this.causationId = causationId;
    this.userId = userId;
  }

  /**
   * Get event data payload
   */
  public abstract getEventData(): any;

  /**
   * Get event metadata
   */
  public getMetadata(): any {
    return {
      eventId: this.eventId,
      eventType: this.eventType,
      aggregateId: this.aggregateId,
      aggregateType: this.aggregateType,
      eventVersion: this.eventVersion,
      occurredAt: this.occurredAt,
      correlationId: this.correlationId,
      causationId: this.causationId,
      userId: this.userId,
    };
  }

  /**
   * Convert event to plain object for serialization
   */
  public toPlainObject(): any {
    return {
      ...this.getMetadata(),
      eventData: this.getEventData(),
    };
  }

  /**
   * Check if event contains PHI (Protected Health Information)
   */
  public abstract containsPHI(): boolean;

  /**
   * Get patient ID if event is related to patient data
   */
  public abstract getPatientId(): string | null;

  /**
   * Get event description for audit logs
   */
  public abstract getEventDescription(): string;
}
