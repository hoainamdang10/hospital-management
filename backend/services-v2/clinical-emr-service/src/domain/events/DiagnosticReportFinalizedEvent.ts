/**
 * DiagnosticReportFinalizedEvent - Domain Event
 * Published when diagnostic report is finalized by verifying doctor
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance DDD, Event-Driven Architecture
 */

import { DomainEvent } from '@shared/domain/base/domain-event';

export interface DiagnosticReportFinalizedEventPayload {
  reportId: string;
  medicalRecordId: string;
  patientId: string;
  orderedBy: string;
  verifiedBy: string;
  verifiedAt: Date;
  verificationComment?: string;
}

export class DiagnosticReportFinalizedEvent extends DomainEvent {
  private readonly payload: any;
  public readonly reportId: string;
  public readonly medicalRecordId: string;
  public readonly patientId: string;
  public readonly orderedBy: string;
  public readonly verifiedBy: string;
  public readonly verifiedAt: Date;
  public readonly verificationComment?: string;

  constructor(
    payload: DiagnosticReportFinalizedEventPayload,
    aggregateId?: string,
    eventVersion: number = 1,
    correlationId?: string,
    causationId?: string,
    userId?: string
  ) {
    super(
      'DiagnosticReportFinalized',
      aggregateId || payload.reportId,
      'DiagnosticReport',
      payload,
      eventVersion,
      correlationId,
      causationId,
      userId || payload.verifiedBy,
      { source: 'domain', priority: 'normal', retryable: true }
    );
    this.payload = payload;

    this.reportId = payload.reportId;
    this.medicalRecordId = payload.medicalRecordId;
    this.patientId = payload.patientId;
    this.orderedBy = payload.orderedBy;
    this.verifiedBy = payload.verifiedBy;
    this.verifiedAt = payload.verifiedAt;
    this.verificationComment = payload.verificationComment;
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
