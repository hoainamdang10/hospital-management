"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClinicalMedicalRecordCreatedEvent = void 0;
const domain_event_1 = require("../../shared/domain-event");
class ClinicalDomainEvent extends domain_event_1.DomainEvent {
    constructor(eventType, aggregateType, aggregateId, payload, patientId, userId, metadata = {}) {
        super(eventType, aggregateId, aggregateType, 1, userId, {
            source: "healthcare-domain",
            priority: "normal",
            publishExternal: true,
            retryable: true,
            tags: ["phi"],
            patientId,
            ...metadata,
        });
        this.payload = payload;
        this.patientIdRef = patientId ?? null;
    }
    getEventData() {
        return this.payload;
    }
    containsPHI() {
        return true;
    }
    getPatientId() {
        return this.patientIdRef;
    }
    getRoutingKey() {
        return this.eventType;
    }
}
class ClinicalMedicalRecordCreatedEvent extends ClinicalDomainEvent {
    constructor(record, userId) {
        super("clinical.record.created", "clinical_record", record.id, record, record.patientId, userId);
    }
}
exports.ClinicalMedicalRecordCreatedEvent = ClinicalMedicalRecordCreatedEvent;
// Full EMR events (ClinicalNoteCreatedEvent, ClinicalLabResultCreatedEvent, ClinicalImagingStudyCreatedEvent,
// ClinicalPrescriptionCreatedEvent, ClinicalTreatmentPlanCreatedEvent, ClinicalTreatmentPlanStatusUpdatedEvent,
// ClinicalMedicalRecordUpdatedEvent) moved to future work - full EMR is out of scope for current phase
