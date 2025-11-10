import { DomainEvent } from "../../shared/domain-event";
import { MedicalRecordDTO } from "../../application/dto/MedicalRecordDTO";
import { ClinicalNoteDTO } from "../../application/dto/ClinicalNoteDTO";
import { LabResultDTO } from "../../application/dto/LabResultDTO";
import { ImagingStudyDTO } from "../../application/dto/ImagingStudyDTO";
import { PrescriptionDTO } from "../../application/dto/PrescriptionDTO";
import { TreatmentPlanDTO } from "../../application/dto/TreatmentPlanDTO";

class ClinicalDomainEvent<TPayload> extends DomainEvent {
  protected readonly payload: TPayload;
  private readonly patientIdRef: string | null;

  constructor(
    eventType: string,
    aggregateType: string,
    aggregateId: string,
    payload: TPayload,
    patientId?: string | null,
    userId?: string,
    metadata: Record<string, unknown> = {},
  ) {
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

  getEventData(): TPayload {
    return this.payload;
  }

  containsPHI(): boolean {
    return true;
  }

  getPatientId(): string | null {
    return this.patientIdRef;
  }

  getRoutingKey(): string {
    return this.eventType;
  }
}

export class ClinicalMedicalRecordCreatedEvent extends ClinicalDomainEvent<MedicalRecordDTO> {
  constructor(record: MedicalRecordDTO, userId?: string) {
    super(
      "clinical.record.created",
      "clinical_record",
      record.id,
      record,
      record.patientId,
      userId,
    );
  }
}

export class ClinicalMedicalRecordUpdatedEvent extends ClinicalDomainEvent<MedicalRecordDTO> {
  constructor(record: MedicalRecordDTO, userId?: string) {
    super(
      "clinical.record.updated",
      "clinical_record",
      record.id,
      record,
      record.patientId,
      userId,
    );
  }
}

export class ClinicalNoteCreatedEvent extends ClinicalDomainEvent<ClinicalNoteDTO> {
  constructor(note: ClinicalNoteDTO, patientId: string, userId?: string) {
    super(
      "clinical.note.created",
      "clinical_note",
      note.id,
      note,
      patientId,
      userId,
      { aggregateId: note.recordId },
    );
  }
}

export class ClinicalLabResultCreatedEvent extends ClinicalDomainEvent<LabResultDTO> {
  constructor(result: LabResultDTO, patientId: string, userId?: string) {
    super(
      "clinical.lab_result.created",
      "clinical_lab_result",
      result.id,
      result,
      patientId,
      userId,
      { aggregateId: result.recordId },
    );
  }
}

export class ClinicalImagingStudyCreatedEvent extends ClinicalDomainEvent<ImagingStudyDTO> {
  constructor(study: ImagingStudyDTO, patientId: string, userId?: string) {
    super(
      "clinical.imaging_study.created",
      "clinical_imaging_study",
      study.id,
      study,
      patientId,
      userId,
      { aggregateId: study.recordId },
    );
  }
}

export class ClinicalPrescriptionCreatedEvent extends ClinicalDomainEvent<PrescriptionDTO> {
  constructor(
    prescription: PrescriptionDTO,
    patientId: string,
    userId?: string,
  ) {
    super(
      "clinical.prescription.created",
      "clinical_prescription",
      prescription.id,
      prescription,
      patientId,
      userId,
      { aggregateId: prescription.recordId },
    );
  }
}

export class ClinicalTreatmentPlanCreatedEvent extends ClinicalDomainEvent<TreatmentPlanDTO> {
  constructor(plan: TreatmentPlanDTO, patientId: string, userId?: string) {
    super(
      "clinical.treatment_plan.created",
      "clinical_treatment_plan",
      plan.id,
      plan,
      patientId,
      userId,
      { aggregateId: plan.recordId },
    );
  }
}

export class ClinicalTreatmentPlanStatusUpdatedEvent extends ClinicalDomainEvent<TreatmentPlanDTO> {
  constructor(plan: TreatmentPlanDTO, patientId: string, userId?: string) {
    super(
      "clinical.treatment_plan.status_updated",
      "clinical_treatment_plan",
      plan.id,
      plan,
      patientId,
      userId,
      { aggregateId: plan.recordId },
    );
  }
}
