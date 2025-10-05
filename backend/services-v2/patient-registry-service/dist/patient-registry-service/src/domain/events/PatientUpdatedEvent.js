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
    constructor(patient, updateType, updatedBy) {
        const patientId = patient.getPatientId() || '';
        const eventData = {
            patientId,
            updateType,
            updatedBy
        };
        super('PatientUpdated', patientId, 'Patient', eventData, 1);
        this.patient = patient;
        this.updateType = updateType;
        this.updatedBy = updatedBy;
    }
    getEventData() {
        const patientId = this.patient.getPatientId() || '';
        return {
            patientId,
            updateType: this.updateType,
            updatedBy: this.updatedBy,
            updatedAt: this.occurredAt
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
exports.PatientUpdatedEvent = PatientUpdatedEvent;
//# sourceMappingURL=PatientUpdatedEvent.js.map