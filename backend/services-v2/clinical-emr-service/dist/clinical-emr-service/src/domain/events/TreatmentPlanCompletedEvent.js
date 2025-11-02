"use strict";
/**
 * TreatmentPlanCompletedEvent - Domain Event
 * Triggered when treatment plan is completed
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven, FHIR R4
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TreatmentPlanCompletedEvent = void 0;
const domain_event_1 = require("@shared/domain/base/domain-event");
class TreatmentPlanCompletedEvent extends domain_event_1.DomainEvent {
    constructor(payload, aggregateId, eventVersion = 1, correlationId, causationId, userId) {
        super('TreatmentPlanCompleted', aggregateId || payload.planId, 'TreatmentPlan', payload, eventVersion, correlationId, causationId, userId || payload.completedBy, { source: 'domain', priority: 'normal', retryable: true });
        this.payload = payload;
        this.planId = payload.planId;
        this.medicalRecordId = payload.medicalRecordId;
        this.patientId = payload.patientId;
        this.primaryDoctorId = payload.primaryDoctorId;
        this.completedBy = payload.completedBy;
        this.completedAt = payload.completedAt;
        this.completionNotes = payload.completionNotes;
    }
    toPrimitives() {
        return {
            planId: this.planId,
            medicalRecordId: this.medicalRecordId,
            patientId: this.patientId,
            primaryDoctorId: this.primaryDoctorId,
            completedBy: this.completedBy,
            completedAt: this.completedAt.toISOString(),
            completionNotes: this.completionNotes,
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
exports.TreatmentPlanCompletedEvent = TreatmentPlanCompletedEvent;
//# sourceMappingURL=TreatmentPlanCompletedEvent.js.map