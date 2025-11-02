"use strict";
/**
 * PrescriptionDispensedEvent - Domain Event
 * Triggered when prescription is dispensed by pharmacy
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven, FHIR R4
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrescriptionDispensedEvent = void 0;
const domain_event_1 = require("@shared/domain/base/domain-event");
class PrescriptionDispensedEvent extends domain_event_1.DomainEvent {
    constructor(payload, aggregateId, eventVersion = 1, correlationId, causationId, userId) {
        super('PrescriptionDispensed', aggregateId || payload.prescriptionId, 'Prescription', payload, eventVersion, correlationId, causationId, userId || payload.dispensedBy, { source: 'domain', priority: 'normal', retryable: true });
        this.payload = payload;
        this.prescriptionId = payload.prescriptionId;
        this.medicalRecordId = payload.medicalRecordId;
        this.patientId = payload.patientId;
        this.dispensedBy = payload.dispensedBy;
        this.dispensedAt = payload.dispensedAt;
        this.pharmacyId = payload.pharmacyId;
        this.medicationCount = payload.medicationCount;
    }
    toPrimitives() {
        return {
            prescriptionId: this.prescriptionId,
            medicalRecordId: this.medicalRecordId,
            patientId: this.patientId,
            dispensedBy: this.dispensedBy,
            dispensedAt: this.dispensedAt.toISOString(),
            pharmacyId: this.pharmacyId,
            medicationCount: this.medicationCount,
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
exports.PrescriptionDispensedEvent = PrescriptionDispensedEvent;
//# sourceMappingURL=PrescriptionDispensedEvent.js.map