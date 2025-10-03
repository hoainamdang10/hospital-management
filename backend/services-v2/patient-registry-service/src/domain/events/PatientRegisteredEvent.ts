/**
 * PatientRegisteredEvent - Domain Event
 * Published when a new patient is registered
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture
 */

import { DomainEvent } from '@shared/domain/base/domain-event';
import { Patient } from '../aggregates/Patient';

export class PatientRegisteredEvent extends DomainEvent {
  constructor(
    public readonly patient: Patient
  ) {
    super('PatientRegistered', patient.getPatientId().getValue());
  }

  public getPayload(): any {
    const personalInfo = this.patient.getPersonalInfo();

    return {
      patientId: this.patient.getPatientId().getValue(),
      userId: this.patient.getUserId(),
      personalInfo: {
        fullName: personalInfo.fullName,
        dateOfBirth: personalInfo.dateOfBirth,
        gender: personalInfo.gender,
        nationalId: personalInfo.nationalId,
        age: personalInfo.age
      },
      registeredAt: this.occurredAt
    };
  }
}

