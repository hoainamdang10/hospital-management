"use strict";
/**
 * Domain Event Base Class - Clean Architecture + DDD + Event Sourcing
 * Enhanced version with healthcare-specific features
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event Sourcing, HIPAA
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseDomainEventHandler = exports.IntegrationEvent = exports.HealthcareDomainEvent = exports.DomainEvent = void 0;
const uuid_1 = require("uuid");
/**
 * Abstract base class for all domain events
 */
class DomainEvent {
    constructor(eventType, aggregateId, aggregateType, eventData, eventVersion = 1, correlationId, causationId, userId, metadata) {
        this.eventId = (0, uuid_1.v4)();
        this.eventType = eventType;
        this.aggregateId = aggregateId;
        this.aggregateType = aggregateType;
        this.eventVersion = eventVersion;
        this.occurredAt = new Date();
        this.correlationId = correlationId;
        this.causationId = causationId;
        this.userId = userId;
        this.data = eventData; // Store event data
        this.metadata = {
            source: 'domain',
            priority: 'normal',
            retryable: true,
            ...metadata
        };
    }
    /**
     * Get event stream name for event store
     */
    getStreamName() {
        return `${this.aggregateType}-${this.aggregateId}`;
    }
    /**
     * Get event routing key for message bus
     */
    getRoutingKey() {
        return `${this.aggregateType.toLowerCase()}.${this.eventType.toLowerCase()}`;
    }
    /**
     * Check if event should be published externally
     */
    shouldPublishExternally() {
        return this.metadata.publishExternal !== false;
    }
    /**
     * Get event priority for processing
     */
    getPriority() {
        return this.metadata.priority;
    }
    /**
     * Check if event is retryable on failure
     */
    isRetryable() {
        return this.metadata.retryable;
    }
    /**
     * Convert event to JSON for serialization
     */
    toJSON() {
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
    static fromJSON(_data) {
        throw new Error('fromJSON method must be implemented by subclasses');
    }
}
exports.DomainEvent = DomainEvent;
/**
 * Healthcare Domain Event
 * Specialized domain event for healthcare domain
 */
class HealthcareDomainEvent extends DomainEvent {
    constructor(eventType, aggregateId, aggregateType, eventData, eventVersion = 1, correlationId, causationId, userId, metadata) {
        super(eventType, aggregateId, aggregateType, eventData, eventVersion, correlationId, causationId, userId, {
            ...metadata,
            source: 'healthcare-domain',
            complianceLevel: 'HIPAA'
        });
    }
    /**
     * Healthcare events typically contain PHI
     */
    containsPHI() {
        return true;
    }
    /**
     * Get HIPAA audit information
     */
    getHIPAAAuditInfo() {
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
     * Validate healthcare compliance
     */
    validateHealthcareCompliance() {
        if (this.containsPHI() && !this.getPatientId()) {
            throw new Error('Healthcare event with PHI must have patient ID');
        }
    }
}
exports.HealthcareDomainEvent = HealthcareDomainEvent;
/**
 * Integration Event
 * For cross-service communication
 */
class IntegrationEvent extends DomainEvent {
    constructor(eventType, sourceService, aggregateId, aggregateType, eventData, targetService, correlationId, userId) {
        super(eventType, aggregateId, aggregateType, eventData, 1, correlationId, undefined, userId, {
            source: 'integration',
            priority: 'normal',
            publishExternal: true,
            retryable: true
        });
        this.sourceService = sourceService;
        this.targetService = targetService;
    }
    /**
     * Get integration routing key
     */
    getIntegrationRoutingKey() {
        const base = `integration.${this.sourceService}.${this.eventType.toLowerCase()}`;
        return this.targetService ? `${base}.${this.targetService}` : base;
    }
}
exports.IntegrationEvent = IntegrationEvent;
/**
 * Base Domain Event Handler
 */
class BaseDomainEventHandler {
    constructor(handlerName, priority = 0) {
        this.handlerName = handlerName;
        this.priority = priority;
    }
    canHandle(event) {
        return event.eventType === this.getSupportedEventType();
    }
    getHandlerName() {
        return this.handlerName;
    }
    getPriority() {
        return this.priority;
    }
}
exports.BaseDomainEventHandler = BaseDomainEventHandler;
//# sourceMappingURL=domain-event.js.map