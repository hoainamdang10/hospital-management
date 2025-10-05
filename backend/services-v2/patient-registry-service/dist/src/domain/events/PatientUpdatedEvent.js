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
const domain_event_1 = require("../../../shared/domain/base/domain-event");
class PatientUpdatedEvent extends domain_event_1.DomainEvent {
    constructor(patient, updateType, updatedBy) {
        super('PatientUpdated', patient.getPatientId().getValue());
        this.patient = patient;
        this.updateType = updateType;
        this.updatedBy = updatedBy;
    }
    getPayload() {
        return {
            patientId: this.patient.getPatientId().getValue(),
            updateType: this.updateType,
            updatedBy: this.updatedBy,
            updatedAt: this.occurredAt
        };
    }
}
exports.PatientUpdatedEvent = PatientUpdatedEvent;
//# sourceMappingURL=PatientUpdatedEvent.js.map