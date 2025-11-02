/**
 * DiagnosticReportCreatedEvent - Domain Event
 * Published when a new diagnostic report is created
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance DDD, Event-Driven Architecture
 */

import { DomainEvent } from '@shared/domain/base/domain-event';

export interface DiagnosticReportCreatedEventPayload {
  reportId: string;
  medicalRecordId: string;
  patientId: string;
  orderedBy: string;
  reportType: string;
  testName: string;
  createdBy: string;
  createdAt: Date;
}

export class DiagnosticReportCreatedEvent extends DomainEvent {
  public readonly reportId: string;
  public readonly medicalRecordId: string;
  public readonly patientId: string;
  public readonly orderedBy: string;
  public readonly reportType: string;
  public readonly testName: string;
  public readonly createdBy: string;
  public readonly createdAt: Date;
  private readonly payload: DiagnosticReportCreatedEventPayload;

  constructor(
    payload: DiagnosticReportCreatedEventPayload,
    eventVersion: number = 1,
    correlationId?: string,
    causationId?: string,
    userId?: string
  ) {
    super(
      'DiagnosticReportCreated',
      payload.reportId,
      'DiagnosticReport',
      payload,
      eventVersion,
      correlationId,
      causationId,
      userId || payload.createdBy,
      { source: 'domain', priority: 'normal', retryable: true }
    );

    this.reportId = payload.reportId;
    this.medicalRecordId = payload.medicalRecordId;
    this.patientId = payload.patientId;
    this.orderedBy = payload.orderedBy;
    this.reportType = payload.reportType;
    this.testName = payload.testName;
    this.createdBy = payload.createdBy;
    this.createdAt = payload.createdAt;
    this.payload = payload;
  }

  public getEventData(): DiagnosticReportCreatedEventPayload {
    return this.payload;
  }

  public containsPHI(): boolean {
    return true;
  }

  public getPatientId(): string | null {
    return this.patientId;
  }
}
