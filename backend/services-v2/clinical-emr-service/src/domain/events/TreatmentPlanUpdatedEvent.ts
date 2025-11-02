/**
 * TreatmentPlanUpdatedEvent - Domain Event
 * Triggered when treatment plan is updated
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven, FHIR R4
 */

import { DomainEvent } from '@shared/domain/base/domain-event';

export interface TreatmentPlanUpdatedEventPayload {
  planId: string;
  medicalRecordId: string;
  patientId: string;
  updatedFields: string[]; // e.g., ['progressNotes', 'currentProgress', 'treatmentItemStatus']
  previousValues?: Record<string, any>;
  newValues?: Record<string, any>;
  updatedBy: string;
  updatedAt: Date;
  updateReason?: string;
}

export class TreatmentPlanUpdatedEvent extends DomainEvent {
  private readonly payload: TreatmentPlanUpdatedEventPayload;
  public readonly planId: string;
  public readonly medicalRecordId: string;
  public readonly patientId: string;
  public readonly updatedFields: string[];
  public readonly previousValues?: Record<string, any>;
  public readonly newValues?: Record<string, any>;
  public readonly updatedBy: string;
  public readonly updatedAt: Date;
  public readonly updateReason?: string;

  constructor(
    payload: TreatmentPlanUpdatedEventPayload,
    aggregateId?: string,
    eventVersion: number = 1,
    correlationId?: string,
    causationId?: string,
    userId?: string
  ) {
    super(
      'TreatmentPlanUpdated',
      aggregateId || payload.planId,
      'TreatmentPlan',
      payload,
      eventVersion,
      correlationId,
      causationId,
      userId || payload.updatedBy,
      { source: 'domain', priority: 'normal', retryable: true }
    );
    this.payload = payload;

    this.planId = payload.planId;
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
      planId: this.planId,
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
