"use strict";
/**
 * PatientConsentGrantedEvent - Domain Event
 * Published when patient grants consent
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture, HIPAA
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatientConsentGrantedEvent = void 0;
const domain_event_1 = require("@shared/domain/base/domain-event");
class PatientConsentGrantedEvent extends domain_event_1.DomainEvent {
    constructor(patient, consent, grantedBy) {
        super('PatientConsentGranted', patient.getPatientId().getValue());
        this.patient = patient;
        this.consent = consent;
        this.grantedBy = grantedBy;
    }
    getPayload() {
        return {
            patientId: this.patient.getPatientId().getValue(),
            consentId: this.consent.id,
            consentType: this.consent.consentType,
            grantedBy: this.grantedBy,
            grantedAt: this.occurredAt
        };
    }
}
exports.PatientConsentGrantedEvent = PatientConsentGrantedEvent;
//# sourceMappingURL=PatientConsentGrantedEvent.js.map