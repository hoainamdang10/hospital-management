"use strict";
/**
 * PatientLinkedEvent
 *
 * Published when patients are linked (FHIR-style)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatientLinkedEvent = void 0;
const domain_event_1 = require("@shared/domain/base/domain-event");
class PatientLinkedEvent extends domain_event_1.DomainEvent {
    constructor(patient, otherPatientId, linkType, performedBy) {
        const patientId = patient.getPatientId() || '';
        const eventData = {
            patientId,
            otherPatientId: otherPatientId.value,
            linkType,
            performedBy
        };
        super('PatientLinked', patientId, 'Patient', eventData, 1);
        this.patient = patient;
        this.otherPatientId = otherPatientId;
        this.linkType = linkType;
        this.performedBy = performedBy;
    }
    getEventData() {
        const patientId = this.patient.getPatientId() || '';
        return {
            patientId,
            otherPatientId: this.otherPatientId.value,
            linkType: this.linkType,
            performedBy: this.performedBy,
            linkedAt: this.occurredAt
        };
    }
    containsPHI() {
        return true; // Contains patient linking information
    }
    getPatientId() {
        return this.patient.getPatientId();
    }
    getPayload() {
        return this.getEventData();
    }
}
exports.PatientLinkedEvent = PatientLinkedEvent;
//# sourceMappingURL=PatientLinkedEvent.js.map