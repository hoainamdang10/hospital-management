"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mappers = void 0;
exports.mappers = {
    medicalRecord(record) {
        return {
            id: record.id,
            patientId: record.patientId,
            doctorId: record.doctorId,
            encounterType: record.encounterType,
            encounterDate: record.encounterDate.toISOString(),
            diagnosis: record.diagnosis,
            treatmentSummary: record.treatmentSummary,
            vitalSigns: record.vitalSigns,
            status: record.status,
            createdAt: record.createdAt.toISOString(),
            updatedAt: record.updatedAt.toISOString(),
        };
    },
    clinicalNote(note) {
        return {
            id: note.id,
            recordId: note.recordId,
            authorId: note.authorId,
            type: note.type,
            content: note.content,
            createdAt: note.createdAt.toISOString(),
            updatedAt: note.updatedAt.toISOString(),
        };
    },
    labResult(result) {
        return {
            id: result.id,
            recordId: result.recordId,
            testName: result.testName,
            category: result.category,
            resultValue: result.resultValue,
            unit: result.unit,
            referenceRange: result.referenceRange,
            status: result.status,
            attachments: result.attachments,
            createdAt: result.createdAt.toISOString(),
        };
    },
    imagingStudy(study) {
        return {
            id: study.id,
            recordId: study.recordId,
            modality: study.modality,
            bodyRegion: study.bodyRegion,
            findings: study.findings,
            impression: study.impression,
            imageUrls: study.imageUrls,
            createdAt: study.createdAt.toISOString(),
        };
    },
    prescription(prescription) {
        return {
            id: prescription.id,
            recordId: prescription.recordId,
            medicationName: prescription.medicationName,
            dosage: prescription.dosage,
            frequency: prescription.frequency,
            route: prescription.route,
            startDate: prescription.startDate.toISOString(),
            endDate: prescription.endDate?.toISOString(),
            instructions: prescription.instructions,
            status: prescription.status,
            createdAt: prescription.createdAt.toISOString(),
        };
    },
    treatmentPlan(plan) {
        return {
            id: plan.id,
            recordId: plan.recordId,
            summary: plan.summary,
            tasks: plan.tasks,
            status: plan.status,
            createdAt: plan.createdAt.toISOString(),
            updatedAt: plan.updatedAt.toISOString(),
        };
    },
    auditLog(log) {
        return {
            id: log.id,
            recordId: log.recordId,
            actorId: log.actorId,
            action: log.action,
            metadata: log.metadata,
            createdAt: log.createdAt.toISOString(),
        };
    },
};
