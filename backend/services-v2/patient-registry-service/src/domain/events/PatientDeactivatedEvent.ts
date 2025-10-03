/**
 * PatientDeactivatedEvent
 * 
 * Published when a patient is deactivated
 */

import { DomainEvent } from '@shared/domain/base/domain-event';
import { Patient } from '../aggregates/Patient';

export class PatientDeactivatedEvent extends DomainEvent {
  constructor(
    public readonly patient: Patient,
    public readonly reason: string,
    public readonly performedBy: string
  ) {
    super('PatientDeactivated', patient.getPatientId().getValue());
  }

  public getPayload(): any {
    return {
      patientId: this.patient.getPatientId().getValue(),
      reason: this.reason,
      performedBy: this.performedBy,
      deactivatedAt: this.occurredAt
    };
  }
}

