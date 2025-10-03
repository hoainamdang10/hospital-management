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
    constructor(patientId, userId, personalInfo, registrationDate) {
        super('PatientRegistered', {
            patientId: patientId.value,
            userId,
            fullName: personalInfo.fullName,
            age: personalInfo.getAge(),
            gender: personalInfo.gender,
            registrationDate: (registrationDate || new Date()).toISOString()
        });
        this.patientId = patientId;
        this.userId = userId;
        this.personalInfo = personalInfo;
        this.registrationDate = registrationDate || new Date();
    }
    /**
     * Get event payload for event bus
     */
    getPayload() {
        return {
            patientId: this.patientId,
            userId: this.userId,
            personalInfo: this.personalInfo,
            registrationDate: this.registrationDate
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
            userId: this.userId,
            fullName: this.personalInfo.fullName,
            age: this.personalInfo.getAge(),
            timestamp: this.timestamp.toISOString()
        };
    }
}
exports.PatientRegisteredEvent = PatientRegisteredEvent;
//# sourceMappingURL=PatientRegisteredEvent.js.map