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
  public readonly patientUserId: string;

  constructor(
    public readonly patientId: string,
    patientUserId: string,
    public readonly fullName: string,
    public readonly dateOfBirth: Date,
    public readonly gender: 'male' | 'female' | 'other',
    public readonly nationalId: string,
    correlationId?: string,
    causationId?: string,
    userIdForAudit?: string
  ) {
    const eventData: PatientRegisteredEventData = {
      patientId,
      userId: patientUserId,
      personalInfo: {
        fullName,
        dateOfBirth,
        gender,
        nationalId
      },
      registeredAt: new Date()
    };

    super(
      'PatientRegistered',
      patientId,
      'Patient',
      eventData,
      1,
      correlationId,
      causationId,
      userIdForAudit
    );

    this.patientUserId = patientUserId;
  }

  public getEventData(): PatientRegisteredEventData {
    return {
      patientId: this.patientId,
      userId: this.patientUserId,
      personalInfo: {
        fullName: this.fullName,
        dateOfBirth: this.dateOfBirth,
        gender: this.gender,
        nationalId: this.nationalId
      },
      registeredAt: this.occurredAt
    };
  }

  public containsPHI(): boolean {
    return true;
  }

  public getPatientId(): string | null {
    return this.patientId;
  }

  public getPayload(): PatientRegisteredEventData {
    return this.getEventData();
  }
}

