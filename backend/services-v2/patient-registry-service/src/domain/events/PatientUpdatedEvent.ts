/**
 * PatientUpdatedEvent - Domain Event
 * Published when patient information is updated
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture
 */

import { DomainEvent } from '@shared/domain/base/domain-event';
import { Patient } from '../aggregates/Patient';

export class PatientUpdatedEvent extends DomainEvent {
  constructor(
    public readonly patient: Patient,
    public readonly updateType: string,
    public readonly updatedBy: string
  ) {
    super('PatientUpdated', patient.getPatientId().getValue());
  }

  public getPayload(): any {
    return {
      patientId: this.patient.getPatientId().getValue(),
      updateType: this.updateType,
      updatedBy: this.updatedBy,
      updatedAt: this.occurredAt
    };
  }
}

