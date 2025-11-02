/**
 * TreatmentPlanCompletedEvent - Domain Event
 * Triggered when treatment plan is completed
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven, FHIR R4
 */

import { DomainEvent } from '@shared/domain/base/domain-event';

export interface TreatmentPlanCompletedEventPayload {
  planId: string;
  medicalRecordId: string;
  patientId: string;
  primaryDoctorId: string;
  completedBy: string;
  completedAt: Date;
  completionNotes?: string;
}

export class TreatmentPlanCompletedEvent extends DomainEvent {
  private readonly payload: TreatmentPlanCompletedEventPayload;
  public readonly planId: string;
  public readonly medicalRecordId: string;
  public readonly patientId: string;
  public readonly primaryDoctorId: string;
  public readonly completedBy: string;
  public readonly completedAt: Date;
  public readonly completionNotes?: string;

  constructor(
    payload: TreatmentPlanCompletedEventPayload,
    aggregateId?: string,
    eventVersion: number = 1,
    correlationId?: string,
    causationId?: string,
    userId?: string
  ) {
    super(
      'TreatmentPlanCompleted',
      aggregateId || payload.planId,
      'TreatmentPlan',
      payload,
      eventVersion,
      correlationId,
      causationId,
      userId || payload.completedBy,
      { source: 'domain', priority: 'normal', retryable: true }
    );
    this.payload = payload;

    this.planId = payload.planId;
    this.medicalRecordId = payload.medicalRecordId;
    this.patientId = payload.patientId;
    this.primaryDoctorId = payload.primaryDoctorId;
    this.completedBy = payload.completedBy;
    this.completedAt = payload.completedAt;
    this.completionNotes = payload.completionNotes;
  }

  public toPrimitives(): any {
    return {
      planId: this.planId,
      medicalRecordId: this.medicalRecordId,
      patientId: this.patientId,
      primaryDoctorId: this.primaryDoctorId,
      completedBy: this.completedBy,
      completedAt: this.completedAt.toISOString(),
      completionNotes: this.completionNotes,
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
