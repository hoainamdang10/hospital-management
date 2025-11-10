"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClinicalEventDispatcher = void 0;
const ClinicalEvents_1 = require("../../domain/events/ClinicalEvents");
class ClinicalEventDispatcher {
    constructor(outboxRepository, logger) {
        this.outboxRepository = outboxRepository;
        this.logger = logger;
    }
    async medicalRecordCreated(record, userId) {
        await this.enqueue(new ClinicalEvents_1.ClinicalMedicalRecordCreatedEvent(record, userId));
    }
    async medicalRecordUpdated(record, userId) {
        await this.enqueue(new ClinicalEvents_1.ClinicalMedicalRecordUpdatedEvent(record, userId));
    }
    async clinicalNoteCreated(note, patientId, userId) {
        await this.enqueue(new ClinicalEvents_1.ClinicalNoteCreatedEvent(note, patientId, userId));
    }
    async labResultCreated(result, patientId, userId) {
        await this.enqueue(new ClinicalEvents_1.ClinicalLabResultCreatedEvent(result, patientId, userId));
    }
    async imagingStudyCreated(study, patientId, userId) {
        await this.enqueue(new ClinicalEvents_1.ClinicalImagingStudyCreatedEvent(study, patientId, userId));
    }
    async prescriptionCreated(prescription, patientId, userId) {
        await this.enqueue(new ClinicalEvents_1.ClinicalPrescriptionCreatedEvent(prescription, patientId, userId));
    }
    async treatmentPlanCreated(plan, patientId, userId) {
        await this.enqueue(new ClinicalEvents_1.ClinicalTreatmentPlanCreatedEvent(plan, patientId, userId));
    }
    async treatmentPlanStatusUpdated(plan, patientId, userId) {
        await this.enqueue(new ClinicalEvents_1.ClinicalTreatmentPlanStatusUpdatedEvent(plan, patientId, userId));
    }
    async enqueue(event) {
        try {
            await this.outboxRepository.saveEvents([event]);
        }
        catch (error) {
            this.logger.error("[ClinicalEventDispatcher] Failed to enqueue event", {
                eventType: event.eventType,
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
}
exports.ClinicalEventDispatcher = ClinicalEventDispatcher;
