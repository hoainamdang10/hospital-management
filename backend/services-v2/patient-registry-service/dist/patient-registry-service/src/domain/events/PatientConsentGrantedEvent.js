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
        const patientId = patient.getPatientId() || '';
        const eventData = {
            patientId,
            consentId: consent.getId(),
            consentType: consent.consentType,
            grantedBy
        };
        super('PatientConsentGranted', patientId, 'Patient', eventData, 1);
        this.patient = patient;
        this.consent = consent;
        this.grantedBy = grantedBy;
    }
    getEventData() {
        const patientId = this.patient.getPatientId() || '';
        return {
            patientId,
            consentId: this.consent.getId(),
            consentType: this.consent.consentType,
            grantedBy: this.grantedBy,
            grantedAt: this.occurredAt
        };
    }
    containsPHI() {
        return true; // Contains patient consent information
    }
    getPatientId() {
        return this.patient.getPatientId();
    }
    getPayload() {
        return this.getEventData();
    }
}
exports.PatientConsentGrantedEvent = PatientConsentGrantedEvent;
//# sourceMappingURL=PatientConsentGrantedEvent.js.map