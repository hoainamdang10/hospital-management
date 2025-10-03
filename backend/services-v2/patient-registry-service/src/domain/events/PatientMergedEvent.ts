/**
 * PatientMergedEvent
 * 
 * Published when duplicate patients are merged
 */

import { DomainEvent } from '@shared/domain/base/domain-event';
import { Patient } from '../aggregates/Patient';
import { PatientId } from '../value-objects/PatientId';

export class PatientMergedEvent extends DomainEvent {
  constructor(
    public readonly duplicatePatient: Patient,
    public readonly masterPatientId: PatientId,
    public readonly reason: string,
    public readonly performedBy: string
  ) {
    super('PatientMerged', duplicatePatient.getPatientId().getValue());
  }

  public getPayload(): any {
    return {
      duplicatePatientId: this.duplicatePatient.getPatientId().getValue(),
      masterPatientId: this.masterPatientId.getValue(),
      reason: this.reason,
      performedBy: this.performedBy,
      mergedAt: this.occurredAt
    };
  }
}

