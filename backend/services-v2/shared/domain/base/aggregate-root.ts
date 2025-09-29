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
export abstract class AggregateRoot<T> extends Entity<T> {
  private _domainEvents: DomainEvent[] = [];
  private _version: number = 0;
  private _lastModified: Date = new Date();
  private _modifiedBy?: string;

  protected constructor(props: T, id?: string) {
    super(props, id);
  }

  /**
   * Get aggregate version for optimistic concurrency
   */
  get version(): number {
    return this._version;
  }

  /**
   * Get last modified timestamp
   */
  get lastModified(): Date {
    return this._lastModified;
  }

  /**
   * Get who last modified this aggregate
   */
  get modifiedBy(): string | undefined {
    return this._modifiedBy;
  }

  /**
   * Add domain event to be published
   */
  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
    this._lastModified = new Date();
  }

  /**
   * Remove domain event
   */
  protected removeDomainEvent(event: DomainEvent): void {
    const index = this._domainEvents.findIndex(e => e.eventId === event.eventId);
    if (index !== -1) {
      this._domainEvents.splice(index, 1);
    }
  }

  /**
   * Get uncommitted domain events
   */
  getUncommittedEvents(): DomainEvent[] {
    return [...this._domainEvents];
  }

  /**
   * Mark events as committed (after successful persistence)
   */
  markEventsAsCommitted(): void {
    this._domainEvents = [];
  }

  /**
   * Increment version (for event sourcing)
   */
  incrementVersion(): void {
    this._version++;
    this._lastModified = new Date();
  }

  /**
   * Set version (when loading from event store)
   */
  setVersion(version: number): void {
    this._version = version;
  }

  /**
   * Set modified by user
   */
  setModifiedBy(userId: string): void {
    this._modifiedBy = userId;
    this._lastModified = new Date();
  }

  /**
   * Check if aggregate has uncommitted changes
   */
  hasUncommittedChanges(): boolean {
    return this._domainEvents.length > 0;
  }

  /**
   * Get aggregate snapshot for event sourcing
   */
  getSnapshot(): AggregateSnapshot {
    return {
      aggregateId: this.id,
      aggregateType: this.constructor.name,
      version: this._version,
      data: this.props,
      lastModified: this._lastModified,
      modifiedBy: this._modifiedBy
    };
  }

  /**
   * Restore from snapshot
   */
  static fromSnapshot<T>(
    snapshot: AggregateSnapshot,
    AggregateClass: new (props: any, id?: string) => AggregateRoot<T>
  ): AggregateRoot<T> {
    const aggregate = new AggregateClass(snapshot.data, snapshot.aggregateId);
    aggregate.setVersion(snapshot.version);
    aggregate._lastModified = snapshot.lastModified;
    aggregate._modifiedBy = snapshot.modifiedBy;
    return aggregate;
  }

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
  getAuditInfo(): AggregateAuditInfo {
    return {
      aggregateId: this.id,
      aggregateType: this.constructor.name,
      version: this._version,
      lastModified: this._lastModified,
      modifiedBy: this._modifiedBy,
      containsPHI: this.containsPHI(),
      patientId: this.getPatientId()
    };
  }

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
  replayEvents(events: DomainEvent[]): void {
    for (const event of events) {
      this.applyEvent(event);
      this.incrementVersion();
    }
  }
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
export abstract class HealthcareAggregateRoot<T> extends AggregateRoot<T> {
  protected constructor(props: T, id?: string) {
    super(props, id);
  }

  /**
   * Always contains PHI for healthcare aggregates
   */
  containsPHI(): boolean {
    return true;
  }

  /**
   * Healthcare-specific validation
   */
  validateInvariants(): void {
    this.validateHealthcareInvariants();
    this.validateBusinessInvariants();
  }

  /**
   * Validate healthcare-specific invariants
   */
  protected validateHealthcareInvariants(): void {
    // Common healthcare validations
    const patientId = this.getPatientId();
    if (patientId && !this.isValidPatientId(patientId)) {
      throw new Error('Invalid patient ID format');
    }
  }

  /**
   * Validate business-specific invariants (to be implemented by subclasses)
   */
  protected abstract validateBusinessInvariants(): void;

  /**
   * Validate patient ID format
   */
  private isValidPatientId(patientId: string): boolean {
    // Vietnamese patient ID format: PAT-YYYYMM-XXX
    const patientIdRegex = /^PAT-\d{6}-\d{3}$/;
    return patientIdRegex.test(patientId);
  }

  /**
   * Get HIPAA audit trail
   */
  getHIPAAAuditTrail(): HIPAAAuditTrail {
    return {
      ...this.getAuditInfo(),
      accessedAt: new Date(),
      auditType: 'AGGREGATE_ACCESS',
      complianceLevel: 'HIPAA_COMPLIANT'
    };
  }
}

/**
 * HIPAA Audit Trail Interface
 */
export interface HIPAAAuditTrail extends AggregateAuditInfo {
  accessedAt: Date;
  auditType: string;
  complianceLevel: string;
}
