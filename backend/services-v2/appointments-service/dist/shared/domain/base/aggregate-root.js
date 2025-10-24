"use strict";
/**
 * Aggregate Root Base Class - Clean Architecture + DDD
 * Enhanced version with healthcare-specific features
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, HIPAA, Event Sourcing
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthcareAggregateRoot = exports.AggregateRoot = void 0;
const entity_1 = require("./entity");
/**
 * Abstract Aggregate Root with healthcare compliance
 */
class AggregateRoot extends entity_1.Entity {
    constructor(props, id) {
        super(props, id);
        this._domainEvents = [];
        this._version = 0;
        this._lastModified = new Date();
    }
    /**
     * Get aggregate version for optimistic concurrency
     */
    get version() {
        return this._version;
    }
    /**
     * Get last modified timestamp
     */
    get lastModified() {
        return this._lastModified;
    }
    /**
     * Get who last modified this aggregate
     */
    get modifiedBy() {
        return this._modifiedBy;
    }
    /**
     * Add domain event to be published
     */
    addDomainEvent(event) {
        this._domainEvents.push(event);
        this._lastModified = new Date();
    }
    /**
     * Remove domain event
     */
    removeDomainEvent(event) {
        const index = this._domainEvents.findIndex(e => e.eventId === event.eventId);
        if (index !== -1) {
            this._domainEvents.splice(index, 1);
        }
    }
    /**
     * Get uncommitted domain events
     */
    getUncommittedEvents() {
        return [...this._domainEvents];
    }
    /**
     * Mark events as committed (after successful persistence)
     */
    markEventsAsCommitted() {
        this._domainEvents = [];
    }
    /**
     * Increment version (for event sourcing)
     */
    incrementVersion() {
        this._version++;
        this._lastModified = new Date();
    }
    /**
     * Set version (when loading from event store)
     */
    setVersion(version) {
        this._version = version;
    }
    /**
     * Set modified by user
     */
    setModifiedBy(userId) {
        this._modifiedBy = userId;
        this._lastModified = new Date();
    }
    /**
     * Check if aggregate has uncommitted changes
     */
    hasUncommittedChanges() {
        return this._domainEvents.length > 0;
    }
    /**
     * Get aggregate snapshot for event sourcing
     */
    getSnapshot() {
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
    static fromSnapshot(snapshot, AggregateClass) {
        const aggregate = new AggregateClass(snapshot.data, snapshot.aggregateId);
        aggregate.setVersion(snapshot.version);
        aggregate._lastModified = snapshot.lastModified;
        aggregate._modifiedBy = snapshot.modifiedBy;
        return aggregate;
    }
    /**
     * Healthcare-specific: Get audit information
     */
    getAuditInfo() {
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
     * Replay events to rebuild aggregate state
     */
    replayEvents(events) {
        for (const event of events) {
            this.applyEvent(event);
            this.incrementVersion();
        }
    }
}
exports.AggregateRoot = AggregateRoot;
/**
 * Healthcare Aggregate Root
 * Base class for healthcare-specific aggregates
 */
class HealthcareAggregateRoot extends AggregateRoot {
    constructor(props, id) {
        super(props, id);
    }
    /**
     * Always contains PHI for healthcare aggregates
     */
    containsPHI() {
        return true;
    }
    /**
     * Healthcare-specific validation
     */
    validateInvariants() {
        this.validateHealthcareInvariants();
        this.validateBusinessInvariants();
    }
    /**
     * Validate healthcare-specific invariants
     */
    validateHealthcareInvariants() {
        // Common healthcare validations
        const patientId = this.getPatientId();
        if (patientId && !this.isValidPatientId(patientId)) {
            throw new Error('Invalid patient ID format');
        }
    }
    /**
     * Validate patient ID format
     */
    isValidPatientId(patientId) {
        // Vietnamese patient ID format: PAT-YYYYMM-XXX
        const patientIdRegex = /^PAT-\d{6}-\d{3}$/;
        return patientIdRegex.test(patientId);
    }
    /**
     * Get HIPAA audit trail
     */
    getHIPAAAuditTrail() {
        return {
            ...this.getAuditInfo(),
            accessedAt: new Date(),
            auditType: 'AGGREGATE_ACCESS',
            complianceLevel: 'HIPAA_COMPLIANT'
        };
    }
}
exports.HealthcareAggregateRoot = HealthcareAggregateRoot;
//# sourceMappingURL=aggregate-root.js.map