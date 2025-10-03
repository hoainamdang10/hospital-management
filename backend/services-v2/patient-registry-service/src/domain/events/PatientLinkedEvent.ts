/**
 * PatientLinkedEvent
 * 
 * Published when patients are linked (FHIR-style)
 */

import { DomainEvent } from '@shared/domain/base/domain-event';
import { Patient } from '../aggregates/Patient';
import { PatientId } from '../value-objects/PatientId';

export class PatientLinkedEvent extends DomainEvent {
  constructor(
    public readonly patient: Patient,
    public readonly otherPatientId: PatientId,
    public readonly linkType: 'refer' | 'seealso',
    public readonly performedBy: string
  ) {
    super('PatientLinked', patient.getPatientId().getValue());
  }

  public getPayload(): any {
    return {
      patientId: this.patient.getPatientId().getValue(),
      otherPatientId: this.otherPatientId.getValue(),
      linkType: this.linkType,
      performedBy: this.performedBy,
      linkedAt: this.occurredAt
    };
  }
}

