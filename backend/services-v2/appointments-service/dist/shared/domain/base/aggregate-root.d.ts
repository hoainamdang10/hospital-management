/**
 * Aggregate Root Base Class - Clean Architecture + DDD
 * Enhanced version with healthcare-specific features
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, HIPAA, Event Sourcing
 */
import { Entity } from './entity';
import { DomainEvent } from './domain-event';
/**
 * Abstract Aggregate Root with healthcare compliance
 */
export declare abstract class AggregateRoot<T> extends Entity<T> {
    private _domainEvents;
    private _version;
    private _lastModified;
    private _modifiedBy?;
    protected constructor(props: T, id?: string);
    /**
     * Get aggregate version for optimistic concurrency
     */
    get version(): number;
    /**
     * Get last modified timestamp
     */
    get lastModified(): Date;
    /**
     * Get who last modified this aggregate
     */
    get modifiedBy(): string | undefined;
    /**
     * Add domain event to be published
     */
    protected addDomainEvent(event: DomainEvent): void;
    /**
     * Remove domain event
     */
    protected removeDomainEvent(event: DomainEvent): void;
    /**
     * Get uncommitted domain events
     */
    getUncommittedEvents(): DomainEvent[];
    /**
     * Mark events as committed (after successful persistence)
     */
    markEventsAsCommitted(): void;
    /**
     * Increment version (for event sourcing)
     */
    incrementVersion(): void;
    /**
     * Set version (when loading from event store)
     */
    setVersion(version: number): void;
    /**
     * Set modified by user
     */
    setModifiedBy(userId: string): void;
    /**
     * Check if aggregate has uncommitted changes
     */
    hasUncommittedChanges(): boolean;
    /**
     * Get aggregate snapshot for event sourcing
     */
    getSnapshot(): AggregateSnapshot;
    /**
     * Restore from snapshot
     */
    static fromSnapshot<T>(snapshot: AggregateSnapshot, AggregateClass: new (props: any, id?: string) => AggregateRoot<T>): AggregateRoot<T>;
    /**
     * Healthcare-specific: Check if aggregate contains PHI
     */
    abstract containsPHI(): boolean;
    /**
     * Healthcare-specific: Get patient ID if applicable
     */
    abstract getPatientId(): string | null;
    /**
     * Healthcare-specific: Get audit information
     */
    getAuditInfo(): AggregateAuditInfo;
    /**
     * Healthcare-specific: Validate business invariants
     */
    abstract validateInvariants(): void;
    /**
     * Apply domain event (for event sourcing)
     */
    protected abstract applyEvent(event: DomainEvent): void;
    /**
     * Replay events to rebuild aggregate state
     */
    replayEvents(events: DomainEvent[]): void;
}
/**
 * Aggregate Snapshot Interface
 */
export interface AggregateSnapshot {
    aggregateId: string;
    aggregateType: string;
    version: number;
    data: any;
    lastModified: Date;
    modifiedBy?: string;
}
/**
 * Aggregate Audit Information
 */
export interface AggregateAuditInfo {
    aggregateId: string;
    aggregateType: string;
    version: number;
    lastModified: Date;
    modifiedBy?: string;
    containsPHI: boolean;
    patientId?: string | null;
}
/**
 * Healthcare Aggregate Root
 * Base class for healthcare-specific aggregates
 */
export declare abstract class HealthcareAggregateRoot<T> extends AggregateRoot<T> {
    protected constructor(props: T, id?: string);
    /**
     * Always contains PHI for healthcare aggregates
     */
    containsPHI(): boolean;
    /**
     * Healthcare-specific validation
     */
    validateInvariants(): void;
    /**
     * Validate healthcare-specific invariants
     */
    protected validateHealthcareInvariants(): void;
    /**
     * Validate business-specific invariants (to be implemented by subclasses)
     */
    protected abstract validateBusinessInvariants(): void;
    /**
     * Validate patient ID format
     */
    private isValidPatientId;
    /**
     * Get HIPAA audit trail
     */
    getHIPAAAuditTrail(): HIPAAAuditTrail;
}
/**
 * HIPAA Audit Trail Interface
 */
export interface HIPAAAuditTrail extends AggregateAuditInfo {
    accessedAt: Date;
    auditType: string;
    complianceLevel: string;
}
//# sourceMappingURL=aggregate-root.d.ts.map