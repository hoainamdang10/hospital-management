"use strict";
/**
 * PatientUpdatedEvent - Domain Event
 * Published when patient information is updated
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatientUpdatedEvent = void 0;
const domain_event_1 = require("@shared/domain/base/domain-event");
class PatientUpdatedEvent extends domain_event_1.DomainEvent {
    constructor(patientId, identityUserId, // Identity Service user ID - renamed to avoid override
    updateType, updatedBy, personalInfo, contactInfo, correlationId, causationId, userIdForAudit) {
        const eventData = {
            patientId,
            userId: identityUserId, // Map to expected field name
            updateType,
            updatedBy,
            personalInfo,
            contactInfo
        };
        super('PatientUpdated', patientId, 'Patient', eventData, 1, correlationId, causationId, userIdForAudit);
        this.patientId = patientId;
        this.identityUserId = identityUserId;
        this.updateType = updateType;
        this.updatedBy = updatedBy;
        this.personalInfo = personalInfo;
        this.contactInfo = contactInfo;
    }
    getEventData() {
        return {
            patientId: this.patientId,
            identityUserId: this.identityUserId, // Use renamed field
            updateType: this.updateType,
            updatedBy: this.updatedBy,
            updatedAt: this.occurredAt,
            personalInfo: this.personalInfo,
            contactInfo: this.contactInfo
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
exports.PatientUpdatedEvent = PatientUpdatedEvent;
//# sourceMappingURL=PatientUpdatedEvent.js.map