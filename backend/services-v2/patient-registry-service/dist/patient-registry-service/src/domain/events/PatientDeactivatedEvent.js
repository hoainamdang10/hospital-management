"use strict";
/**
 * PatientDeactivatedEvent
 *
 * Published when a patient is deactivated
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatientDeactivatedEvent = void 0;
const domain_event_1 = require("@shared/domain/base/domain-event");
class PatientDeactivatedEvent extends domain_event_1.DomainEvent {
    constructor(patient, reason, performedBy) {
        const patientId = patient.getPatientId() || '';
        const eventData = {
            patientId,
            reason,
            performedBy
        };
        super('PatientDeactivated', patientId, 'Patient', eventData, 1);
        this.patient = patient;
        this.reason = reason;
        this.performedBy = performedBy;
    }
    getEventData() {
        const patientId = this.patient.getPatientId() || '';
        return {
            patientId,
            reason: this.reason,
            performedBy: this.performedBy,
            deactivatedAt: this.occurredAt
        };
    }
    containsPHI() {
        return true; // Contains patient information
    }
    getPatientId() {
        return this.patient.getPatientId();
    }
    getPayload() {
        return this.getEventData();
    }
}
exports.PatientDeactivatedEvent = PatientDeactivatedEvent;
//# sourceMappingURL=PatientDeactivatedEvent.js.map