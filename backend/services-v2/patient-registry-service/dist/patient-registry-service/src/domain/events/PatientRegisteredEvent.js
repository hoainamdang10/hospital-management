"use strict";
/**
 * PatientRegisteredEvent - Domain Event
 * Published when a new patient is registered
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatientRegisteredEvent = void 0;
const domain_event_1 = require("../../../../shared/domain/base/domain-event");
class PatientRegisteredEvent extends domain_event_1.DomainEvent {
    constructor(patientId, patientUserId, fullName, dateOfBirth, gender, nationalId, correlationId, causationId, userIdForAudit) {
        const eventData = {
            patientId,
            userId: patientUserId,
            personalInfo: {
                fullName,
                dateOfBirth,
                gender,
                nationalId
            },
            registeredAt: new Date()
        };
        super('PatientRegistered', patientId, 'Patient', eventData, 1, correlationId, causationId, userIdForAudit);
        this.patientId = patientId;
        this.fullName = fullName;
        this.dateOfBirth = dateOfBirth;
        this.gender = gender;
        this.nationalId = nationalId;
        this.patientUserId = patientUserId;
    }
    getEventData() {
        return {
            patientId: this.patientId,
            userId: this.patientUserId,
            personalInfo: {
                fullName: this.fullName,
                dateOfBirth: this.dateOfBirth,
                gender: this.gender,
                nationalId: this.nationalId
            },
            registeredAt: this.occurredAt
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
exports.PatientRegisteredEvent = PatientRegisteredEvent;
//# sourceMappingURL=PatientRegisteredEvent.js.map