"use strict";
/**
 * PatientLinkedEvent
 *
 * Published when patients are linked (FHIR-style)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatientLinkedEvent = void 0;
const domain_event_1 = require("../../shared/domain/base/domain-event");
class PatientLinkedEvent extends domain_event_1.DomainEvent {
    constructor(patient, otherPatientId, linkType, performedBy) {
        super('PatientLinked', patient.getPatientId().getValue());
        this.patient = patient;
        this.otherPatientId = otherPatientId;
        this.linkType = linkType;
        this.performedBy = performedBy;
    }
    getPayload() {
        return {
            patientId: this.patient.getPatientId().getValue(),
            otherPatientId: this.otherPatientId.getValue(),
            linkType: this.linkType,
            performedBy: this.performedBy,
            linkedAt: this.occurredAt
        };
    }
}
exports.PatientLinkedEvent = PatientLinkedEvent;
//# sourceMappingURL=PatientLinkedEvent.js.map