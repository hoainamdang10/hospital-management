/**
 * PrescriptionUpdatedEvent - Domain Event
 * Triggered when prescription is updated
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven, FHIR R4
 */

import { DomainEvent } from '@shared/domain/base/domain-event';

export interface PrescriptionUpdatedEventPayload {
  prescriptionId: string;
  medicalRecordId: string;
  patientId: string;
  updatedFields: string[];
  previousValues?: Record<string, any>;
  newValues?: Record<string, any>;
  updatedBy: string;
  updatedAt: Date;
  updateReason?: string;
}

export class PrescriptionUpdatedEvent extends DomainEvent {
  private readonly payload: PrescriptionUpdatedEventPayload;
  public readonly prescriptionId: string;
  public readonly medicalRecordId: string;
  public readonly patientId: string;
  public readonly updatedFields: string[];
  public readonly previousValues?: Record<string, any>;
  public readonly newValues?: Record<string, any>;
  public readonly updatedBy: string;
  public readonly updatedAt: Date;
  public readonly updateReason?: string;

  constructor(
    payload: PrescriptionUpdatedEventPayload,
    aggregateId?: string,
    eventVersion: number = 1,
    correlationId?: string,
    causationId?: string,
    userId?: string
  ) {
    super(
      'PrescriptionUpdated',
      aggregateId || payload.prescriptionId,
      'Prescription',
      payload,
      eventVersion,
      correlationId,
      causationId,
      userId || payload.updatedBy,
      { source: 'domain', priority: 'normal', retryable: true }
    );
    this.payload = payload;

    this.prescriptionId = payload.prescriptionId;
    this.medicalRecordId = payload.medicalRecordId;
    this.patientId = payload.patientId;
    this.updatedFields = payload.updatedFields;
    this.previousValues = payload.previousValues;
    this.newValues = payload.newValues;
    this.updatedBy = payload.updatedBy;
    this.updatedAt = payload.updatedAt;
    this.updateReason = payload.updateReason;
  }

  public toPrimitives(): any {
    return {
      prescriptionId: this.prescriptionId,
      medicalRecordId: this.medicalRecordId,
      patientId: this.patientId,
      updatedFields: this.updatedFields,
      previousValues: this.previousValues,
      newValues: this.newValues,
      updatedBy: this.updatedBy,
      updatedAt: this.updatedAt.toISOString(),
      updateReason: this.updateReason,
    };
  }

  public getEventData(): any {
    return this.payload || {
      ...Object.keys(this).reduce((acc: any, key: string) => {
        if (!key.startsWith('event') && key !== 'metadata' && key !== 'payload') {
          acc[key] = (this as any)[key];
        }
        return acc;
      }, {} as Record<string, any>)
    };
  }

  public containsPHI(): boolean {
    return true;
  }

  public getPatientId(): string | null {
    return this.patientId || this.payload?.patientId || null;
  }

}
