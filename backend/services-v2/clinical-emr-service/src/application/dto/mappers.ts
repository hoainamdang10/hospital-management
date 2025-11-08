import { MedicalRecord } from "../../domain/entities/MedicalRecord";
import { ClinicalNote } from "../../domain/entities/ClinicalNote";
import { LabResult } from "../../domain/entities/LabResult";
import { ImagingStudy } from "../../domain/entities/ImagingStudy";
import { Prescription } from "../../domain/entities/Prescription";
import { TreatmentPlan } from "../../domain/entities/TreatmentPlan";
import { AuditLog } from "../../domain/entities/AuditLog";
import { MedicalRecordDTO } from "./MedicalRecordDTO";
import { ClinicalNoteDTO } from "./ClinicalNoteDTO";
import { LabResultDTO } from "./LabResultDTO";
import { ImagingStudyDTO } from "./ImagingStudyDTO";
import { PrescriptionDTO } from "./PrescriptionDTO";
import { TreatmentPlanDTO } from "./TreatmentPlanDTO";
import { AuditLogDTO } from "./AuditLogDTO";

export const mappers = {
  medicalRecord(record: ReturnType<MedicalRecord["toJSON"]>): MedicalRecordDTO {
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

  clinicalNote(note: ReturnType<ClinicalNote["toJSON"]>): ClinicalNoteDTO {
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

  labResult(result: ReturnType<LabResult["toJSON"]>): LabResultDTO {
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

  imagingStudy(study: ReturnType<ImagingStudy["toJSON"]>): ImagingStudyDTO {
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

  prescription(
    prescription: ReturnType<Prescription["toJSON"]>,
  ): PrescriptionDTO {
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

  treatmentPlan(plan: ReturnType<TreatmentPlan["toJSON"]>): TreatmentPlanDTO {
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

  auditLog(log: ReturnType<AuditLog["toJSON"]>): AuditLogDTO {
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
