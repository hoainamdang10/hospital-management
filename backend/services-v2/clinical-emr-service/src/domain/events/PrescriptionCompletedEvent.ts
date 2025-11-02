/**
 * PrescriptionCompletedEvent - Domain Event
 * Triggered when prescription is completed
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven, FHIR R4
 */

import { DomainEvent } from '@shared/domain/base/domain-event';

export interface PrescriptionCompletedEventPayload {
  prescriptionId: string;
  medicalRecordId: string;
  patientId: string;
  prescribedBy: string;
  completedBy: string;
  completedAt: Date;
}

export class PrescriptionCompletedEvent extends DomainEvent {
  private readonly payload: PrescriptionCompletedEventPayload;
  public readonly prescriptionId: string;
  public readonly medicalRecordId: string;
  public readonly patientId: string;
  public readonly prescribedBy: string;
  public readonly completedBy: string;
  public readonly completedAt: Date;

  constructor(
    payload: PrescriptionCompletedEventPayload,
    aggregateId?: string,
    eventVersion: number = 1,
    correlationId?: string,
    causationId?: string,
    userId?: string
  ) {
    super(
      'PrescriptionCompleted',
      aggregateId || payload.prescriptionId,
      'Prescription',
      payload,
      eventVersion,
      correlationId,
      causationId,
      userId || payload.completedBy,
      { source: 'domain', priority: 'normal', retryable: true }
    );
    this.payload = payload;

    this.prescriptionId = payload.prescriptionId;
    this.medicalRecordId = payload.medicalRecordId;
    this.patientId = payload.patientId;
    this.prescribedBy = payload.prescribedBy;
    this.completedBy = payload.completedBy;
    this.completedAt = payload.completedAt;
  }

  public toPrimitives(): any {
    return {
      prescriptionId: this.prescriptionId,
      medicalRecordId: this.medicalRecordId,
      patientId: this.patientId,
      prescribedBy: this.prescribedBy,
      completedBy: this.completedBy,
      completedAt: this.completedAt.toISOString(),
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
