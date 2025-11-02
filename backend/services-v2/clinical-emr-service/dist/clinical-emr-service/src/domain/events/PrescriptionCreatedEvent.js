"use strict";
/**
 * PrescriptionCreatedEvent - Domain Event
 * Triggered when a new prescription is created
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven, FHIR R4
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrescriptionCreatedEvent = void 0;
const domain_event_1 = require("@shared/domain/base/domain-event");
class PrescriptionCreatedEvent extends domain_event_1.DomainEvent {
    constructor(payload, eventVersion = 1, correlationId, causationId, userId) {
        super('PrescriptionCreated', payload.prescriptionId, 'Prescription', payload, eventVersion, correlationId, causationId, userId || payload.createdBy, { source: 'domain', priority: 'normal', retryable: true });
        this.prescriptionId = payload.prescriptionId;
        this.medicalRecordId = payload.medicalRecordId;
        this.patientId = payload.patientId;
        this.prescribedBy = payload.prescribedBy;
        this.medicationCount = payload.medicationCount;
        this.prescribedDate = payload.prescribedDate;
        this.createdBy = payload.createdBy;
        this.createdAt = payload.createdAt;
        this.payload = payload;
    }
    getEventData() {
        return this.payload;
    }
    containsPHI() {
        return true;
    }
    getPatientId() {
        return this.patientId;
    }
    toPrimitives() {
        return {
            prescriptionId: this.prescriptionId,
            medicalRecordId: this.medicalRecordId,
            patientId: this.patientId,
            prescribedBy: this.prescribedBy,
            medicationCount: this.medicationCount,
            prescribedDate: this.prescribedDate.toISOString(),
            createdBy: this.createdBy,
            createdAt: this.createdAt.toISOString(),
        };
    }
}
exports.PrescriptionCreatedEvent = PrescriptionCreatedEvent;
//# sourceMappingURL=PrescriptionCreatedEvent.js.map