/**
 * Domain Event Base Class - Clean Architecture + DDD + Event Sourcing
 * Enhanced version with healthcare-specific features
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event Sourcing, HIPAA
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
  public readonly metadata: EventMetadata;

  protected constructor(
    eventType: string,
    aggregateId: string,
    aggregateType: string,
    eventData: any,
    eventVersion: number = 1,
    correlationId?: string,
    causationId?: string,
    userId?: string,
    metadata?: Partial<EventMetadata>
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
    this.metadata = {
      source: 'domain',
      priority: 'normal',
      retryable: true,
      ...metadata
    };
  }

  /**
   * Get event data payload
   */
  public abstract getEventData(): any;

  /**
   * Check if event contains PHI
   */
  public abstract containsPHI(): boolean;

  /**
   * Get patient ID if applicable
   */
  public abstract getPatientId(): string | null;

  /**
   * Get event stream name for event store
   */
  public getStreamName(): string {
    return `${this.aggregateType}-${this.aggregateId}`;
  }

  /**
   * Get event routing key for message bus
   */
  public getRoutingKey(): string {
    return `${this.aggregateType.toLowerCase()}.${this.eventType.toLowerCase()}`;
  }

  /**
   * Check if event should be published externally
   */
  public shouldPublishExternally(): boolean {
    return this.metadata.publishExternal !== false;
  }

  /**
   * Get event priority for processing
   */
  public getPriority(): EventPriority {
    return this.metadata.priority;
  }

  /**
   * Check if event is retryable on failure
   */
  public isRetryable(): boolean {
    return this.metadata.retryable;
  }

  /**
   * Convert event to JSON for serialization
   */
  public toJSON(): SerializedEvent {
    return {
      eventId: this.eventId,
      eventType: this.eventType,
      aggregateId: this.aggregateId,
      aggregateType: this.aggregateType,
      eventVersion: this.eventVersion,
      occurredAt: this.occurredAt.toISOString(),
      eventData: this.getEventData(),
      correlationId: this.correlationId,
      causationId: this.causationId,
      userId: this.userId,
      metadata: this.metadata
    };
  }

  /**
   * Create event from JSON
   */
  public static fromJSON(data: SerializedEvent): DomainEvent {
    throw new Error('fromJSON method must be implemented by subclasses');
  }
}

/**
 * Healthcare Domain Event
 * Specialized domain event for healthcare domain
 */
export abstract class HealthcareDomainEvent extends DomainEvent {
  protected constructor(
    eventType: string,
    aggregateId: string,
    aggregateType: string,
    eventData: any,
    eventVersion: number = 1,
    correlationId?: string,
    causationId?: string,
    userId?: string,
    metadata?: Partial<EventMetadata>
  ) {
    super(
      eventType,
      aggregateId,
      aggregateType,
      eventData,
      eventVersion,
      correlationId,
      causationId,
      userId,
      {
        ...metadata,
        source: 'healthcare-domain',
        complianceLevel: 'HIPAA'
      }
    );
  }

  /**
   * Healthcare events typically contain PHI
   */
  public containsPHI(): boolean {
    return true;
  }

  /**
   * Get HIPAA audit information
   */
  public getHIPAAAuditInfo(): HIPAAAuditInfo {
    return {
      eventId: this.eventId,
      eventType: this.eventType,
      aggregateId: this.aggregateId,
      aggregateType: this.aggregateType,
      patientId: this.getPatientId(),
      userId: this.userId,
      occurredAt: this.occurredAt,
      containsPHI: this.containsPHI(),
      complianceLevel: this.metadata.complianceLevel || 'HIPAA'
    };
  }

  /**
   * Anonymize event for non-PHI use cases
   */
  public abstract anonymize(): Partial<any>;

  /**
   * Validate healthcare compliance
   */
  protected validateHealthcareCompliance(): void {
    if (this.containsPHI() && !this.getPatientId()) {
      throw new Error('Healthcare event with PHI must have patient ID');
    }
  }
}

/**
 * Integration Event
 * For cross-service communication
 */
export abstract class IntegrationEvent extends DomainEvent {
  public readonly sourceService: string;
  public readonly targetService?: string;

  protected constructor(
    eventType: string,
    sourceService: string,
    aggregateId: string,
    aggregateType: string,
    eventData: any,
    targetService?: string,
    correlationId?: string,
    userId?: string
  ) {
    super(
      eventType,
      aggregateId,
      aggregateType,
      eventData,
      1,
      correlationId,
      undefined,
      userId,
      {
        source: 'integration',
        priority: 'normal',
        publishExternal: true,
        retryable: true
      }
    );

    this.sourceService = sourceService;
    this.targetService = targetService;
  }

  /**
   * Get integration routing key
   */
  public getIntegrationRoutingKey(): string {
    const base = `integration.${this.sourceService}.${this.eventType.toLowerCase()}`;
    return this.targetService ? `${base}.${this.targetService}` : base;
  }
}

/**
 * Event Metadata
 */
export interface EventMetadata {
  source: 'domain' | 'integration' | 'healthcare-domain';
  priority: EventPriority;
  publishExternal?: boolean;
  retryable: boolean;
  complianceLevel?: string;
  tags?: string[];
  [key: string]: any;
}

/**
 * Event Priority
 */
export type EventPriority = 'critical' | 'high' | 'normal' | 'low';

/**
 * Serialized Event
 */
export interface SerializedEvent {
  eventId: string;
  eventType: string;
  aggregateId: string;
  aggregateType: string;
  eventVersion: number;
  occurredAt: string;
  eventData: any;
  correlationId?: string;
  causationId?: string;
  userId?: string;
  metadata: EventMetadata;
}

/**
 * HIPAA Audit Information
 */
export interface HIPAAAuditInfo {
  eventId: string;
  eventType: string;
  aggregateId: string;
  aggregateType: string;
  patientId: string | null;
  userId?: string;
  occurredAt: Date;
  containsPHI: boolean;
  complianceLevel: string;
}

/**
 * Event Handler Interface
 */
export interface IDomainEventHandler<T extends DomainEvent = DomainEvent> {
  handle(event: T): Promise<void>;
  canHandle(event: DomainEvent): boolean;
  getHandlerName(): string;
  getPriority(): number;
}

/**
 * Event Publisher Interface
 */
export interface IDomainEventPublisher {
  publish(event: DomainEvent): Promise<void>;
  publishBatch(events: DomainEvent[]): Promise<void>;
  subscribe<T extends DomainEvent>(
    eventType: string,
    handler: IDomainEventHandler<T>
  ): Promise<void>;
  unsubscribe(eventType: string, handlerName: string): Promise<void>;
}

/**
 * Base Domain Event Handler
 */
export abstract class BaseDomainEventHandler<T extends DomainEvent> implements IDomainEventHandler<T> {
  protected readonly handlerName: string;
  protected readonly priority: number;

  protected constructor(handlerName: string, priority: number = 0) {
    this.handlerName = handlerName;
    this.priority = priority;
  }

  abstract handle(event: T): Promise<void>;

  canHandle(event: DomainEvent): boolean {
    return event.eventType === this.getSupportedEventType();
  }

  getHandlerName(): string {
    return this.handlerName;
  }

  getPriority(): number {
    return this.priority;
  }

  protected abstract getSupportedEventType(): string;
}
