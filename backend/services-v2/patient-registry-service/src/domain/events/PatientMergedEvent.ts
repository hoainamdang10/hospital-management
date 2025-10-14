/**
 * PatientMergedEvent
 *
 * Published when duplicate patients are merged
 */

import { DomainEvent } from '@shared/domain/base/domain-event';

export interface PatientMergedEventData {
  duplicatePatientId: string;
  masterPatientId: string;
  reason: string;
  performedBy: string;
  mergedAt: Date;
}

export class PatientMergedEvent extends DomainEvent {
  constructor(
    public readonly duplicatePatientId: string,
    public readonly masterPatientId: string,
    public readonly reason: string,
    public readonly performedBy: string,
    correlationId?: string,
    causationId?: string,
    userIdForAudit?: string
  ) {
    const eventData = {
      duplicatePatientId,
      masterPatientId,
      reason,
      performedBy
    };

    super(
      'PatientMerged',
      duplicatePatientId,
      'Patient',
      eventData,
      1,
      correlationId,
      causationId,
      userIdForAudit
    );
  }

  public getEventData(): PatientMergedEventData {
    return {
      duplicatePatientId: this.duplicatePatientId,
      masterPatientId: this.masterPatientId,
      reason: this.reason,
      performedBy: this.performedBy,
      mergedAt: this.occurredAt
    };
  }

  public containsPHI(): boolean {
    return true;
  }

  public getPatientId(): string | null {
    return this.duplicatePatientId;
  }

  public getPayload(): PatientMergedEventData {
    return this.getEventData();
  }
}

