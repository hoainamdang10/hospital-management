/**
 * PatientDeactivatedEvent
 *
 * Published when a patient is deactivated
 */

import { DomainEvent } from '@shared/domain/base/domain-event';
import { Patient } from '../aggregates/Patient';

export interface PatientDeactivatedEventData {
  patientId: string;
  reason: string;
  performedBy: string;
  deactivatedAt: Date;
}

export class PatientDeactivatedEvent extends DomainEvent {
  constructor(
    public readonly patient: Patient,
    public readonly reason: string,
    public readonly performedBy: string
  ) {
    const patientId = patient.getPatientId() || '';
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
      1
    );
  }

  public getEventData(): PatientDeactivatedEventData {
    const patientId = this.patient.getPatientId() || '';
    return {
      patientId,
      reason: this.reason,
      performedBy: this.performedBy,
      deactivatedAt: this.occurredAt
    };
  }

  public containsPHI(): boolean {
    return true; // Contains patient information
  }

  public getPatientId(): string | null {
    return this.patient.getPatientId();
  }

  public getPayload(): PatientDeactivatedEventData {
    return this.getEventData();
  }
}

