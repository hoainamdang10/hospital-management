"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClinicalTreatmentPlanStatusUpdatedEvent = exports.ClinicalTreatmentPlanCreatedEvent = exports.ClinicalPrescriptionCreatedEvent = exports.ClinicalImagingStudyCreatedEvent = exports.ClinicalLabResultCreatedEvent = exports.ClinicalNoteCreatedEvent = exports.ClinicalMedicalRecordUpdatedEvent = exports.ClinicalMedicalRecordCreatedEvent = void 0;
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
class ClinicalMedicalRecordUpdatedEvent extends ClinicalDomainEvent {
    constructor(record, userId) {
        super("clinical.record.updated", "clinical_record", record.id, record, record.patientId, userId);
    }
}
exports.ClinicalMedicalRecordUpdatedEvent = ClinicalMedicalRecordUpdatedEvent;
class ClinicalNoteCreatedEvent extends ClinicalDomainEvent {
    constructor(note, patientId, userId) {
        super("clinical.note.created", "clinical_note", note.id, note, patientId, userId, { aggregateId: note.recordId });
    }
}
exports.ClinicalNoteCreatedEvent = ClinicalNoteCreatedEvent;
class ClinicalLabResultCreatedEvent extends ClinicalDomainEvent {
    constructor(result, patientId, userId) {
        super("clinical.lab_result.created", "clinical_lab_result", result.id, result, patientId, userId, { aggregateId: result.recordId });
    }
}
exports.ClinicalLabResultCreatedEvent = ClinicalLabResultCreatedEvent;
class ClinicalImagingStudyCreatedEvent extends ClinicalDomainEvent {
    constructor(study, patientId, userId) {
        super("clinical.imaging_study.created", "clinical_imaging_study", study.id, study, patientId, userId, { aggregateId: study.recordId });
    }
}
exports.ClinicalImagingStudyCreatedEvent = ClinicalImagingStudyCreatedEvent;
class ClinicalPrescriptionCreatedEvent extends ClinicalDomainEvent {
    constructor(prescription, patientId, userId) {
        super("clinical.prescription.created", "clinical_prescription", prescription.id, prescription, patientId, userId, { aggregateId: prescription.recordId });
    }
}
exports.ClinicalPrescriptionCreatedEvent = ClinicalPrescriptionCreatedEvent;
class ClinicalTreatmentPlanCreatedEvent extends ClinicalDomainEvent {
    constructor(plan, patientId, userId) {
        super("clinical.treatment_plan.created", "clinical_treatment_plan", plan.id, plan, patientId, userId, { aggregateId: plan.recordId });
    }
}
exports.ClinicalTreatmentPlanCreatedEvent = ClinicalTreatmentPlanCreatedEvent;
class ClinicalTreatmentPlanStatusUpdatedEvent extends ClinicalDomainEvent {
    constructor(plan, patientId, userId) {
        super("clinical.treatment_plan.status_updated", "clinical_treatment_plan", plan.id, plan, patientId, userId, { aggregateId: plan.recordId });
    }
}
exports.ClinicalTreatmentPlanStatusUpdatedEvent = ClinicalTreatmentPlanStatusUpdatedEvent;
