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
const domain_event_1 = require("../../shared/domain/base/domain-event");
class PatientRegisteredEvent extends domain_event_1.DomainEvent {
    constructor(patient) {
        super('PatientRegistered', patient.getPatientId().getValue());
        this.patient = patient;
    }
    getPayload() {
        const personalInfo = this.patient.getPersonalInfo();
        return {
            patientId: this.patient.getPatientId().getValue(),
            userId: this.patient.getUserId(),
            personalInfo: {
                fullName: personalInfo.fullName,
                dateOfBirth: personalInfo.dateOfBirth,
                gender: personalInfo.gender,
                nationalId: personalInfo.nationalId,
                age: personalInfo.age
            },
            registeredAt: this.occurredAt
        };
    }
}
exports.PatientRegisteredEvent = PatientRegisteredEvent;
//# sourceMappingURL=PatientRegisteredEvent.js.map