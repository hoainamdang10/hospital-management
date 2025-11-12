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
    constructor(patientId, otherPatientId, linkType, performedBy, correlationId, causationId, userIdForAudit) {
        const eventData = {
            patientId,
            otherPatientId,
            linkType,
            performedBy
        };
        super('PatientLinked', patientId, 'Patient', eventData, 1, correlationId, causationId, userIdForAudit);
        this.patientId = patientId;
        this.otherPatientId = otherPatientId;
        this.linkType = linkType;
        this.performedBy = performedBy;
    }
    getEventData() {
        return {
            patientId: this.patientId,
            otherPatientId: this.otherPatientId,
            linkType: this.linkType,
            performedBy: this.performedBy,
            linkedAt: this.occurredAt
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
exports.PatientLinkedEvent = PatientLinkedEvent;
//# sourceMappingURL=PatientLinkedEvent.js.map