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
const domain_event_1 = require("@shared/domain/base/domain-event");
class PatientRegisteredEvent extends domain_event_1.DomainEvent {
    constructor(patient) {
        const patientId = patient.getPatientId() || '';
        const personalInfo = patient.getPersonalInfo();
        const eventData = {
            patientId,
            userId: patient.getUserId(),
            fullName: personalInfo.fullName
        };
        super('PatientRegistered', patientId, 'Patient', eventData, 1);
        this.patient = patient;
    }
    getEventData() {
        const personalInfo = this.patient.getPersonalInfo();
        const patientId = this.patient.getPatientId() || '';
        return {
            patientId,
            userId: this.patient.getUserId(),
            personalInfo: {
                fullName: personalInfo.fullName,
                dateOfBirth: personalInfo.dateOfBirth,
                gender: personalInfo.gender,
                nationalId: personalInfo.nationalId
            },
            registeredAt: this.occurredAt
        };
    }
    containsPHI() {
        return true;
    }
    getPatientId() {
        return this.patient.getPatientId();
    }
    getPayload() {
        return this.getEventData();
    }
}
exports.PatientRegisteredEvent = PatientRegisteredEvent;
//# sourceMappingURL=PatientRegisteredEvent.js.map