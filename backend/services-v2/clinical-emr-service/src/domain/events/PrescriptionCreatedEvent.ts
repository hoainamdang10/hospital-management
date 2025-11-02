/**
 * PrescriptionCreatedEvent - Domain Event
 * Triggered when a new prescription is created
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven, FHIR R4
 */

import { DomainEvent } from '@shared/domain/base/domain-event';

export interface PrescriptionCreatedEventPayload {
  prescriptionId: string;
  medicalRecordId: string;
  patientId: string;
  prescribedBy: string;
  medicationCount: number;
  prescribedDate: Date;
  createdBy: string;
  createdAt: Date;
}

export class PrescriptionCreatedEvent extends DomainEvent {
  public readonly prescriptionId: string;
  public readonly medicalRecordId: string;
  public readonly patientId: string;
  public readonly prescribedBy: string;
  public readonly medicationCount: number;
  public readonly prescribedDate: Date;
  public readonly createdBy: string;
  public readonly createdAt: Date;
  private readonly payload: PrescriptionCreatedEventPayload;

  constructor(
    payload: PrescriptionCreatedEventPayload,
    eventVersion: number = 1,
    correlationId?: string,
    causationId?: string,
    userId?: string
  ) {
    super(
      'PrescriptionCreated',
      payload.prescriptionId,
      'Prescription',
      payload,
      eventVersion,
      correlationId,
      causationId,
      userId || payload.createdBy,
      { source: 'domain', priority: 'normal', retryable: true }
    );

    this.prescriptionId = payload.prescriptionId;
    this.medicalRecordId = payload.medicalRecordId;
    this.patientId = payload.patientId;
    this.prescribedBy = payload.prescribedBy;
    this.medicationCount = payload.medicationCount;
    this.prescribedDate = payload.prescribedDate;
    this.createdBy = payload.createdBy;
    this.createdAt = payload.createdAt;
    this.payload = payload;
  }

  public getEventData(): PrescriptionCreatedEventPayload {
    return this.payload;
  }

  public containsPHI(): boolean {
    return true;
  }

  public getPatientId(): string | null {
    return this.patientId;
  }

  public toPrimitives(): any {
    return {
      prescriptionId: this.prescriptionId,
      medicalRecordId: this.medicalRecordId,
      patientId: this.patientId,
      prescribedBy: this.prescribedBy,
      medicationCount: this.medicationCount,
      prescribedDate: this.prescribedDate.toISOString(),
      createdBy: this.createdBy,
      createdAt: this.createdAt.toISOString(),
    };
  }
}
