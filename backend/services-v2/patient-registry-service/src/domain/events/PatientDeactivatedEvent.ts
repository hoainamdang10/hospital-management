/**
 * PatientDeactivatedEvent
 *
 * Published when a patient is deactivated
 */

import { DomainEvent } from '@shared/domain/base/domain-event';

export interface PatientDeactivatedEventData {
  patientId: string;
  reason: string;
  performedBy: string;
  deactivatedAt: Date;
}

export class PatientDeactivatedEvent extends DomainEvent {
  constructor(
    public readonly patientId: string,
    public readonly reason: string,
    public readonly performedBy: string,
    correlationId?: string,
    causationId?: string,
    userIdForAudit?: string
  ) {
    const eventData = {
      patientId,
      reason,
      performedBy
    };

    super(
      'PatientDeactivated',
      patientId,
      'Patient',
      eventData,
      1,
      correlationId,
      causationId,
      userIdForAudit
    );
  }

  public getEventData(): PatientDeactivatedEventData {
    return {
      patientId: this.patientId,
      reason: this.reason,
      performedBy: this.performedBy,
      deactivatedAt: this.occurredAt
    };
  }

  public containsPHI(): boolean {
    return true;
  }

  public getPatientId(): string | null {
    return this.patientId;
  }

  public getPayload(): PatientDeactivatedEventData {
    return this.getEventData();
  }
}

