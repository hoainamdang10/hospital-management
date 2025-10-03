"use strict";
/**
 * PatientUpdatedEvent - Domain Event
 * Published when patient information is updated
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatientUpdatedEvent = void 0;
const domain_event_1 = require("../../../../shared/domain/base/domain-event");
class PatientUpdatedEvent extends domain_event_1.DomainEvent {
    constructor(patientId, updateType, updatedAt) {
        super('PatientUpdated', {
            patientId: patientId.value,
            updateType,
            updatedAt: (updatedAt || new Date()).toISOString()
        });
        this.patientId = patientId;
        this.updateType = updateType;
        this.updatedAt = updatedAt || new Date();
    }
    /**
     * Get event payload for event bus
     */
    getPayload() {
        return {
            patientId: this.patientId,
            updateType: this.updateType,
            updatedAt: this.updatedAt
        };
    }
    /**
     * Get event summary for logging
     */
    getSummaryForLogging() {
        return {
            eventType: this.eventType,
            eventId: this.eventId,
            patientId: this.patientId.value,
            updateType: this.updateType,
            timestamp: this.timestamp.toISOString()
        };
    }
}
exports.PatientUpdatedEvent = PatientUpdatedEvent;
//# sourceMappingURL=PatientUpdatedEvent.js.map