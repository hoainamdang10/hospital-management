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
    constructor(patientId, consentId, consentType, grantedBy, correlationId, causationId, userIdForAudit) {
        const eventData = {
            patientId,
            consentId,
            consentType,
            grantedBy
        };
        super('PatientConsentGranted', patientId, 'Patient', eventData, 1, correlationId, causationId, userIdForAudit);
        this.patientId = patientId;
        this.consentId = consentId;
        this.consentType = consentType;
        this.grantedBy = grantedBy;
    }
    getEventData() {
        return {
            patientId: this.patientId,
            consentId: this.consentId,
            consentType: this.consentType,
            grantedBy: this.grantedBy,
            grantedAt: this.occurredAt
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
exports.PatientConsentGrantedEvent = PatientConsentGrantedEvent;
//# sourceMappingURL=PatientConsentGrantedEvent.js.map