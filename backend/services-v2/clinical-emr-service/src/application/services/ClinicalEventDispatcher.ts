import { ILogger } from "../../shared/logger";
import { DomainEvent } from "../../shared/domain-event";
import { MedicalRecordDTO } from "../dto/MedicalRecordDTO";
import { ClinicalNoteDTO } from "../dto/ClinicalNoteDTO";
import { LabResultDTO } from "../dto/LabResultDTO";
import { ImagingStudyDTO } from "../dto/ImagingStudyDTO";
import { PrescriptionDTO } from "../dto/PrescriptionDTO";
import { TreatmentPlanDTO } from "../dto/TreatmentPlanDTO";
import {
  ClinicalImagingStudyCreatedEvent,
  ClinicalLabResultCreatedEvent,
  ClinicalMedicalRecordCreatedEvent,
  ClinicalMedicalRecordUpdatedEvent,
  ClinicalNoteCreatedEvent,
  ClinicalPrescriptionCreatedEvent,
  ClinicalTreatmentPlanCreatedEvent,
  ClinicalTreatmentPlanStatusUpdatedEvent,
} from "../../domain/events/ClinicalEvents";
import { IOutboxRepository } from "../../infrastructure/outbox/SupabaseOutboxRepository";

export class ClinicalEventDispatcher {
  constructor(
    private readonly outboxRepository: IOutboxRepository,
    private readonly logger: ILogger,
  ) {}

  async medicalRecordCreated(
    record: MedicalRecordDTO,
    userId?: string,
  ): Promise<void> {
    await this.enqueue(new ClinicalMedicalRecordCreatedEvent(record, userId));
  }

  async medicalRecordUpdated(
    record: MedicalRecordDTO,
    userId?: string,
  ): Promise<void> {
    await this.enqueue(new ClinicalMedicalRecordUpdatedEvent(record, userId));
  }

  async clinicalNoteCreated(
    note: ClinicalNoteDTO,
    patientId: string,
    userId?: string,
  ): Promise<void> {
    await this.enqueue(new ClinicalNoteCreatedEvent(note, patientId, userId));
  }

  async labResultCreated(
    result: LabResultDTO,
    patientId: string,
    userId?: string,
  ): Promise<void> {
    await this.enqueue(
      new ClinicalLabResultCreatedEvent(result, patientId, userId),
    );
  }

  async imagingStudyCreated(
    study: ImagingStudyDTO,
    patientId: string,
    userId?: string,
  ): Promise<void> {
    await this.enqueue(
      new ClinicalImagingStudyCreatedEvent(study, patientId, userId),
    );
  }

  async prescriptionCreated(
    prescription: PrescriptionDTO,
    patientId: string,
    userId?: string,
  ): Promise<void> {
    await this.enqueue(
      new ClinicalPrescriptionCreatedEvent(prescription, patientId, userId),
    );
  }

  async treatmentPlanCreated(
    plan: TreatmentPlanDTO,
    patientId: string,
    userId?: string,
  ): Promise<void> {
    await this.enqueue(
      new ClinicalTreatmentPlanCreatedEvent(plan, patientId, userId),
    );
  }

  async treatmentPlanStatusUpdated(
    plan: TreatmentPlanDTO,
    patientId: string,
    userId?: string,
  ): Promise<void> {
    await this.enqueue(
      new ClinicalTreatmentPlanStatusUpdatedEvent(plan, patientId, userId),
    );
  }

  private async enqueue(event: DomainEvent): Promise<void> {
    try {
      await this.outboxRepository.saveEvents([event]);
    } catch (error) {
      this.logger.error("[ClinicalEventDispatcher] Failed to enqueue event", {
        eventType: event.eventType,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}
