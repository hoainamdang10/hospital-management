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
const domain_event_1 = require("../../../../shared/domain/base/domain-event");
class PatientConsentGrantedEvent extends domain_event_1.DomainEvent {
    constructor(patientId, consentType, grantedAt) {
        super('PatientConsentGranted', {
            patientId: patientId.value,
            consentType,
            grantedAt: (grantedAt || new Date()).toISOString()
        });
        this.patientId = patientId;
        this.consentType = consentType;
        this.grantedAt = grantedAt || new Date();
    }
    /**
     * Get event payload for event bus
     */
    getPayload() {
        return {
            patientId: this.patientId,
            consentType: this.consentType,
            grantedAt: this.grantedAt
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
            consentType: this.consentType,
            timestamp: this.timestamp.toISOString()
        };
    }
}
exports.PatientConsentGrantedEvent = PatientConsentGrantedEvent;
//# sourceMappingURL=PatientConsentGrantedEvent.js.map