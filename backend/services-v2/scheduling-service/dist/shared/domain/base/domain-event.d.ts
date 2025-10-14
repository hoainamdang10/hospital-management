/**
 * Domain Event Base Class - Clean Architecture + DDD + Event Sourcing
 * Enhanced version with healthcare-specific features
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event Sourcing, HIPAA
 */
/**
 * Abstract base class for all domain events
 */
export declare abstract class DomainEvent {
    readonly eventId: string;
    readonly eventType: string;
    readonly aggregateId: string;
    readonly aggregateType: string;
    readonly eventVersion: number;
    readonly occurredAt: Date;
    readonly correlationId?: string;
    readonly causationId?: string;
    readonly userId?: string;
    readonly metadata: EventMetadata;
    protected constructor(eventType: string, aggregateId: string, aggregateType: string, _eventData: any, eventVersion?: number, correlationId?: string, causationId?: string, userId?: string, metadata?: Partial<EventMetadata>);
    /**
     * Get event data payload
     */
    abstract getEventData(): any;
    /**
     * Check if event contains PHI
     */
    abstract containsPHI(): boolean;
    /**
     * Get patient ID if applicable
     */
    abstract getPatientId(): string | null;
    /**
     * Get event stream name for event store
     */
    getStreamName(): string;
    /**
     * Get event routing key for message bus
     */
    getRoutingKey(): string;
    /**
     * Check if event should be published externally
     */
    shouldPublishExternally(): boolean;
    /**
     * Get event priority for processing
     */
    getPriority(): EventPriority;
    /**
     * Check if event is retryable on failure
     */
    isRetryable(): boolean;
    /**
     * Convert event to JSON for serialization
     */
    toJSON(): SerializedEvent;
    /**
     * Create event from JSON
     */
    static fromJSON(_data: SerializedEvent): DomainEvent;
}
/**
 * Healthcare Domain Event
 * Specialized domain event for healthcare domain
 */
export declare abstract class HealthcareDomainEvent extends DomainEvent {
    protected constructor(eventType: string, aggregateId: string, aggregateType: string, eventData: any, eventVersion?: number, correlationId?: string, causationId?: string, userId?: string, metadata?: Partial<EventMetadata>);
    /**
     * Healthcare events typically contain PHI
     */
    containsPHI(): boolean;
    /**
     * Get HIPAA audit information
     */
    getHIPAAAuditInfo(): HIPAAAuditInfo;
    /**
     * Anonymize event for non-PHI use cases
     */
    abstract anonymize(): Partial<any>;
    /**
     * Validate healthcare compliance
     */
    protected validateHealthcareCompliance(): void;
}
/**
 * Integration Event
 * For cross-service communication
 */
export declare abstract class IntegrationEvent extends DomainEvent {
    readonly sourceService: string;
    readonly targetService?: string;
    protected constructor(eventType: string, sourceService: string, aggregateId: string, aggregateType: string, eventData: any, targetService?: string, correlationId?: string, userId?: string);
    /**
     * Get integration routing key
     */
    getIntegrationRoutingKey(): string;
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
    subscribe<T extends DomainEvent>(eventType: string, handler: IDomainEventHandler<T>): Promise<void>;
    unsubscribe(eventType: string, handlerName: string): Promise<void>;
}
/**
 * Base Domain Event Handler
 */
export declare abstract class BaseDomainEventHandler<T extends DomainEvent> implements IDomainEventHandler<T> {
    protected readonly handlerName: string;
    protected readonly priority: number;
    protected constructor(handlerName: string, priority?: number);
    abstract handle(event: T): Promise<void>;
    canHandle(event: DomainEvent): boolean;
    getHandlerName(): string;
    getPriority(): number;
    protected abstract getSupportedEventType(): string;
}
//# sourceMappingURL=domain-event.d.ts.map