/**
 * PatientMergedEvent
 *
 * Published when duplicate patients are merged
 */

import { DomainEvent } from '@shared/domain/base/domain-event';
import { Patient } from '../aggregates/Patient';
import { PatientId } from '../value-objects/PatientId';

export interface PatientMergedEventData {
  duplicatePatientId: string;
  masterPatientId: string;
  reason: string;
  performedBy: string;
  mergedAt: Date;
}

export class PatientMergedEvent extends DomainEvent {
  constructor(
    public readonly duplicatePatient: Patient,
    public readonly masterPatientId: PatientId,
    public readonly reason: string,
    public readonly performedBy: string
  ) {
    const patientId = duplicatePatient.getPatientId() || '';
    const eventData = {
      duplicatePatientId: patientId,
      masterPatientId: masterPatientId.value,
      reason,
      performedBy
    };

    super(
      'PatientMerged',
      patientId,
      'Patient',
      eventData,
      1
    );
  }

  public getEventData(): PatientMergedEventData {
    const patientId = this.duplicatePatient.getPatientId() || '';
    return {
      duplicatePatientId: patientId,
      masterPatientId: this.masterPatientId.value,
      reason: this.reason,
      performedBy: this.performedBy,
      mergedAt: this.occurredAt
    };
  }

  public containsPHI(): boolean {
    return true;
  }

  public getPatientId(): string | null {
    return this.duplicatePatient.getPatientId();
  }

  public getPayload(): PatientMergedEventData {
    return this.getEventData();
  }
}

