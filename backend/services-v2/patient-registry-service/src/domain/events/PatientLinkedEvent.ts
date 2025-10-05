/**
 * PatientLinkedEvent
 *
 * Published when patients are linked (FHIR-style)
 */

import { DomainEvent } from '@shared/domain/base/domain-event';
import { Patient } from '../aggregates/Patient';
import { PatientId } from '../value-objects/PatientId';

export interface PatientLinkedEventData {
  patientId: string;
  otherPatientId: string;
  linkType: 'refer' | 'seealso';
  performedBy: string;
  linkedAt: Date;
}

export class PatientLinkedEvent extends DomainEvent {
  constructor(
    public readonly patient: Patient,
    public readonly otherPatientId: PatientId,
    public readonly linkType: 'refer' | 'seealso',
    public readonly performedBy: string
  ) {
    const patientId = patient.getPatientId() || '';
    const eventData = {
      patientId,
      otherPatientId: otherPatientId.value,
      linkType,
      performedBy
    };

    super(
      'PatientLinked',
      patientId,
      'Patient',
      eventData,
      1
    );
  }

  public getEventData(): PatientLinkedEventData {
    const patientId = this.patient.getPatientId() || '';
    return {
      patientId,
      otherPatientId: this.otherPatientId.value,
      linkType: this.linkType,
      performedBy: this.performedBy,
      linkedAt: this.occurredAt
    };
  }

  public containsPHI(): boolean {
    return true; // Contains patient linking information
  }

  public getPatientId(): string | null {
    return this.patient.getPatientId();
  }

  public getPayload(): PatientLinkedEventData {
    return this.getEventData();
  }
}

