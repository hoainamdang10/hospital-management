/**
 * TreatmentPlanCreatedEvent - Domain Event
 * Triggered when a new treatment plan is created
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven, FHIR R4
 */

import { DomainEvent } from '@shared/domain/base/domain-event';

export interface TreatmentPlanCreatedEventPayload {
  planId: string;
  medicalRecordId: string;
  patientId: string;
  primaryDoctorId: string;
  diagnosis: string;
  treatmentGoals: string;
  startDate: Date;
  patientConsent: boolean;
  createdBy: string;
  createdAt: Date;
}

export class TreatmentPlanCreatedEvent extends DomainEvent {
  private readonly payload: TreatmentPlanCreatedEventPayload;
  public readonly planId: string;
  public readonly medicalRecordId: string;
  public readonly patientId: string;
  public readonly primaryDoctorId: string;
  public readonly diagnosis: string;
  public readonly treatmentGoals: string;
  public readonly startDate: Date;
  public readonly patientConsent: boolean;
  public readonly createdBy: string;
  public readonly createdAt: Date;

  constructor(
    payload: TreatmentPlanCreatedEventPayload,
    aggregateId?: string,
    eventVersion: number = 1,
    correlationId?: string,
    causationId?: string,
    userId?: string
  ) {
    super(
      'TreatmentPlanCreated',
      aggregateId || payload.planId,
      'TreatmentPlan',
      payload,
      eventVersion,
      correlationId,
      causationId,
      userId || payload.createdBy,
      { source: 'domain', priority: 'normal', retryable: true }
    );
    this.payload = payload;

    this.planId = payload.planId;
    this.medicalRecordId = payload.medicalRecordId;
    this.patientId = payload.patientId;
    this.primaryDoctorId = payload.primaryDoctorId;
    this.diagnosis = payload.diagnosis;
    this.treatmentGoals = payload.treatmentGoals;
    this.startDate = payload.startDate;
    this.patientConsent = payload.patientConsent;
    this.createdBy = payload.createdBy;
    this.createdAt = payload.createdAt;
  }

  public toPrimitives(): any {
    return {
      planId: this.planId,
      medicalRecordId: this.medicalRecordId,
      patientId: this.patientId,
      primaryDoctorId: this.primaryDoctorId,
      diagnosis: this.diagnosis,
      treatmentGoals: this.treatmentGoals,
      startDate: this.startDate.toISOString(),
      patientConsent: this.patientConsent,
      createdBy: this.createdBy,
      createdAt: this.createdAt.toISOString(),
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
