"use strict";
/**
 * PatientDeactivatedEvent
 *
 * Published when a patient is deactivated
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatientDeactivatedEvent = void 0;
const domain_event_1 = require("../../../../shared/domain/base/domain-event");
class PatientDeactivatedEvent extends domain_event_1.DomainEvent {
    constructor(patientId, reason, performedBy, correlationId, causationId, userIdForAudit) {
        const eventData = {
            patientId,
            reason,
            performedBy
        };
        super('PatientDeactivated', patientId, 'Patient', eventData, 1, correlationId, causationId, userIdForAudit);
        this.patientId = patientId;
        this.reason = reason;
        this.performedBy = performedBy;
    }
    getEventData() {
        return {
            patientId: this.patientId,
            reason: this.reason,
            performedBy: this.performedBy,
            deactivatedAt: this.occurredAt
        };
    }
    containsPHI() {
        return true;
    }
    getPatientId() {
        return this.patientId;
    }
    getPayload() {
        return this.getEventData();
    }
}
exports.PatientDeactivatedEvent = PatientDeactivatedEvent;
//# sourceMappingURL=PatientDeactivatedEvent.js.map