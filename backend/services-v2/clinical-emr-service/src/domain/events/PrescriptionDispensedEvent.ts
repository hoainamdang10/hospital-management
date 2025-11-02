/**
 * PrescriptionDispensedEvent - Domain Event
 * Triggered when prescription is dispensed by pharmacy
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven, FHIR R4
 */

import { DomainEvent } from '@shared/domain/base/domain-event';

export interface PrescriptionDispensedEventPayload {
  prescriptionId: string;
  medicalRecordId: string;
  patientId: string;
  dispensedBy: string; // Pharmacist ID
  dispensedAt: Date;
  pharmacyId: string;
  medicationCount: number;
}

export class PrescriptionDispensedEvent extends DomainEvent {
  private readonly payload: PrescriptionDispensedEventPayload;
  public readonly prescriptionId: string;
  public readonly medicalRecordId: string;
  public readonly patientId: string;
  public readonly dispensedBy: string;
  public readonly dispensedAt: Date;
  public readonly pharmacyId: string;
  public readonly medicationCount: number;

  constructor(
    payload: PrescriptionDispensedEventPayload,
    aggregateId?: string,
    eventVersion: number = 1,
    correlationId?: string,
    causationId?: string,
    userId?: string
  ) {
    super(
      'PrescriptionDispensed',
      aggregateId || payload.prescriptionId,
      'Prescription',
      payload,
      eventVersion,
      correlationId,
      causationId,
      userId || payload.dispensedBy,
      { source: 'domain', priority: 'normal', retryable: true }
    );
    this.payload = payload;

    this.prescriptionId = payload.prescriptionId;
    this.medicalRecordId = payload.medicalRecordId;
    this.patientId = payload.patientId;
    this.dispensedBy = payload.dispensedBy;
    this.dispensedAt = payload.dispensedAt;
    this.pharmacyId = payload.pharmacyId;
    this.medicationCount = payload.medicationCount;
  }

  public toPrimitives(): any {
    return {
      prescriptionId: this.prescriptionId,
      medicalRecordId: this.medicalRecordId,
      patientId: this.patientId,
      dispensedBy: this.dispensedBy,
      dispensedAt: this.dispensedAt.toISOString(),
      pharmacyId: this.pharmacyId,
      medicationCount: this.medicationCount,
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
