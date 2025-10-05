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

export interface PatientRegisteredEventData {
  patientId: string;
  userId: string;
  personalInfo: {
    fullName: string;
    dateOfBirth: Date;
    gender: 'male' | 'female' | 'other';
    nationalId: string;
  };
  registeredAt: Date;
}

export class PatientRegisteredEvent extends DomainEvent {
  constructor(
    public readonly patient: Patient
  ) {
    const patientId = patient.getPatientId() || '';
    const personalInfo = patient.getPersonalInfo();
    const eventData = {
      patientId,
      userId: patient.getUserId(),
      fullName: personalInfo.fullName
    };

    super(
      'PatientRegistered',
      patientId,
      'Patient',
      eventData,
      1
    );
  }

  public getEventData(): PatientRegisteredEventData {
    const personalInfo = this.patient.getPersonalInfo();
    const patientId = this.patient.getPatientId() || '';

    return {
      patientId,
      userId: this.patient.getUserId(),
      personalInfo: {
        fullName: personalInfo.fullName,
        dateOfBirth: personalInfo.dateOfBirth,
        gender: personalInfo.gender,
        nationalId: personalInfo.nationalId
      },
      registeredAt: this.occurredAt
    };
  }

  public containsPHI(): boolean {
    return true;
  }

  public getPatientId(): string | null {
    return this.patient.getPatientId();
  }

  public getPayload(): PatientRegisteredEventData {
    return this.getEventData();
  }
}

