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
        super('PatientDeactivated', patient.getPatientId().getValue());
        this.patient = patient;
        this.reason = reason;
        this.performedBy = performedBy;
    }
    getPayload() {
        return {
            patientId: this.patient.getPatientId().getValue(),
            reason: this.reason,
            performedBy: this.performedBy,
            deactivatedAt: this.occurredAt
        };
    }
}
exports.PatientDeactivatedEvent = PatientDeactivatedEvent;
//# sourceMappingURL=PatientDeactivatedEvent.js.map