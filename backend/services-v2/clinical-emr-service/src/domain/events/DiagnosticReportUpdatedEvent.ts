/**
 * DiagnosticReportUpdatedEvent - Domain Event
 * Published when diagnostic report results are updated
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance DDD, Event-Driven Architecture
 */

import { DomainEvent } from '@shared/domain/base/domain-event';

export interface DiagnosticReportUpdatedEventPayload {
  reportId: string;
  medicalRecordId: string;
  patientId: string;
  updatedFields: string[];
  previousValues: Record<string, any>;
  newValues: Record<string, any>;
  updatedBy: string;
  updatedAt: Date;
  updateReason?: string;
}

export class DiagnosticReportUpdatedEvent extends DomainEvent {
  private readonly payload: any;
  public readonly reportId: string;
  public readonly medicalRecordId: string;
  public readonly patientId: string;
  public readonly updatedFields: string[];
  public readonly previousValues: Record<string, any>;
  public readonly newValues: Record<string, any>;
  public readonly updatedBy: string;
  public readonly updatedAt: Date;
  public readonly updateReason?: string;

  constructor(
    payload: DiagnosticReportUpdatedEventPayload,
    aggregateId?: string,
    eventVersion: number = 1,
    correlationId?: string,
    causationId?: string,
    userId?: string
  ) {
    super(
      'DiagnosticReportUpdated',
      aggregateId || payload.reportId,
      'DiagnosticReport',
      payload,
      eventVersion,
      correlationId,
      causationId,
      userId || payload.updatedBy,
      { source: 'domain', priority: 'normal', retryable: true }
    );
    this.payload = payload;

    this.reportId = payload.reportId;
    this.medicalRecordId = payload.medicalRecordId;
    this.patientId = payload.patientId;
    this.updatedFields = payload.updatedFields;
    this.previousValues = payload.previousValues;
    this.newValues = payload.newValues;
    this.updatedBy = payload.updatedBy;
    this.updatedAt = payload.updatedAt;
    this.updateReason = payload.updateReason;
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
