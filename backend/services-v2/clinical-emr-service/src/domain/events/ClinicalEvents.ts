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

// Full EMR events (ClinicalNoteCreatedEvent, ClinicalLabResultCreatedEvent, ClinicalImagingStudyCreatedEvent,
// ClinicalPrescriptionCreatedEvent, ClinicalTreatmentPlanCreatedEvent, ClinicalTreatmentPlanStatusUpdatedEvent,
// ClinicalMedicalRecordUpdatedEvent) moved to future work - full EMR is out of scope for current phase
