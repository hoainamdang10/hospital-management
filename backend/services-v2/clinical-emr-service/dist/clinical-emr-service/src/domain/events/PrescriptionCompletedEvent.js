"use strict";
/**
 * PrescriptionCompletedEvent - Domain Event
 * Triggered when prescription is completed
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven, FHIR R4
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrescriptionCompletedEvent = void 0;
const domain_event_1 = require("@shared/domain/base/domain-event");
class PrescriptionCompletedEvent extends domain_event_1.DomainEvent {
    constructor(payload, aggregateId, eventVersion = 1, correlationId, causationId, userId) {
        super('PrescriptionCompleted', aggregateId || payload.prescriptionId, 'Prescription', payload, eventVersion, correlationId, causationId, userId || payload.completedBy, { source: 'domain', priority: 'normal', retryable: true });
        this.payload = payload;
        this.prescriptionId = payload.prescriptionId;
        this.medicalRecordId = payload.medicalRecordId;
        this.patientId = payload.patientId;
        this.prescribedBy = payload.prescribedBy;
        this.completedBy = payload.completedBy;
        this.completedAt = payload.completedAt;
    }
    toPrimitives() {
        return {
            prescriptionId: this.prescriptionId,
            medicalRecordId: this.medicalRecordId,
            patientId: this.patientId,
            prescribedBy: this.prescribedBy,
            completedBy: this.completedBy,
            completedAt: this.completedAt.toISOString(),
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
exports.PrescriptionCompletedEvent = PrescriptionCompletedEvent;
//# sourceMappingURL=PrescriptionCompletedEvent.js.map