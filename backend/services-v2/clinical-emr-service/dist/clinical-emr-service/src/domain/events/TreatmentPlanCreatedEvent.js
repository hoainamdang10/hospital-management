"use strict";
/**
 * TreatmentPlanCreatedEvent - Domain Event
 * Triggered when a new treatment plan is created
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven, FHIR R4
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TreatmentPlanCreatedEvent = void 0;
const domain_event_1 = require("@shared/domain/base/domain-event");
class TreatmentPlanCreatedEvent extends domain_event_1.DomainEvent {
    constructor(payload, aggregateId, eventVersion = 1, correlationId, causationId, userId) {
        super('TreatmentPlanCreated', aggregateId || payload.planId, 'TreatmentPlan', payload, eventVersion, correlationId, causationId, userId || payload.createdBy, { source: 'domain', priority: 'normal', retryable: true });
        this.payload = payload;
        this.planId = payload.planId;
        this.medicalRecordId = payload.medicalRecordId;
        this.patientId = payload.patientId;
        this.primaryDoctorId = payload.primaryDoctorId;
        this.diagnosis = payload.diagnosis;
        this.treatmentGoals = payload.treatmentGoals;
        this.startDate = payload.startDate;
        this.patientConsent = payload.patientConsent;
        this.createdBy = payload.createdBy;
        this.createdAt = payload.createdAt;
    }
    toPrimitives() {
        return {
            planId: this.planId,
            medicalRecordId: this.medicalRecordId,
            patientId: this.patientId,
            primaryDoctorId: this.primaryDoctorId,
            diagnosis: this.diagnosis,
            treatmentGoals: this.treatmentGoals,
            startDate: this.startDate.toISOString(),
            patientConsent: this.patientConsent,
            createdBy: this.createdBy,
            createdAt: this.createdAt.toISOString(),
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
exports.TreatmentPlanCreatedEvent = TreatmentPlanCreatedEvent;
//# sourceMappingURL=TreatmentPlanCreatedEvent.js.map