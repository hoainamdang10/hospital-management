/**
 * PatientLinkedEvent
 *
 * Published when patients are linked (FHIR-style)
 */

import { DomainEvent } from '@shared/domain/base/domain-event';

export interface PatientLinkedEventData {
  patientId: string;
  otherPatientId: string;
  linkType: 'refer' | 'seealso';
  performedBy: string;
  linkedAt: Date;
}

export class PatientLinkedEvent extends DomainEvent {
  constructor(
    public readonly patientId: string,
    public readonly otherPatientId: string,
    public readonly linkType: 'refer' | 'seealso',
    public readonly performedBy: string,
    correlationId?: string,
    causationId?: string,
    userIdForAudit?: string
  ) {
    const eventData = {
      patientId,
      otherPatientId,
      linkType,
      performedBy
    };

    super(
      'PatientLinked',
      patientId,
      'Patient',
      eventData,
      1,
      correlationId,
      causationId,
      userIdForAudit
    );
  }

  public getEventData(): PatientLinkedEventData {
    return {
      patientId: this.patientId,
      otherPatientId: this.otherPatientId,
      linkType: this.linkType,
      performedBy: this.performedBy,
      linkedAt: this.occurredAt
    };
  }

  public containsPHI(): boolean {
    return true;
  }

  public getPatientId(): string | null {
    return this.patientId;
  }

  public getPayload(): PatientLinkedEventData {
    return this.getEventData();
  }
}

