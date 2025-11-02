"use strict";
/**
 * PrescriptionUpdatedEvent - Domain Event
 * Triggered when prescription is updated
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven, FHIR R4
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrescriptionUpdatedEvent = void 0;
const domain_event_1 = require("@shared/domain/base/domain-event");
class PrescriptionUpdatedEvent extends domain_event_1.DomainEvent {
    constructor(payload, aggregateId, eventVersion = 1, correlationId, causationId, userId) {
        super('PrescriptionUpdated', aggregateId || payload.prescriptionId, 'Prescription', payload, eventVersion, correlationId, causationId, userId || payload.updatedBy, { source: 'domain', priority: 'normal', retryable: true });
        this.payload = payload;
        this.prescriptionId = payload.prescriptionId;
        this.medicalRecordId = payload.medicalRecordId;
        this.patientId = payload.patientId;
        this.updatedFields = payload.updatedFields;
        this.previousValues = payload.previousValues;
        this.newValues = payload.newValues;
        this.updatedBy = payload.updatedBy;
        this.updatedAt = payload.updatedAt;
        this.updateReason = payload.updateReason;
    }
    toPrimitives() {
        return {
            prescriptionId: this.prescriptionId,
            medicalRecordId: this.medicalRecordId,
            patientId: this.patientId,
            updatedFields: this.updatedFields,
            previousValues: this.previousValues,
            newValues: this.newValues,
            updatedBy: this.updatedBy,
            updatedAt: this.updatedAt.toISOString(),
            updateReason: this.updateReason,
        };
    }
    getEventData() {
        return this.payload || {
            ...Object.keys(this).reduce((acc, key) => {
                if (!key.startsWith('event') && key !== 'metadata' && key !== 'payload') {
                    acc[key] = this[key];
                }
                return acc;
            }, {})
        };
    }
    containsPHI() {
        return true;
    }
    getPatientId() {
        return this.patientId || this.payload?.patientId || null;
    }
}
exports.PrescriptionUpdatedEvent = PrescriptionUpdatedEvent;
//# sourceMappingURL=PrescriptionUpdatedEvent.js.map