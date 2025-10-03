/**
 * PatientRegisteredEvent - Domain Event
 * Published when a new patient is registered
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture
 */

import { DomainEvent } from '../../../../shared/domain/base/domain-event';
import { PatientId } from '../value-objects/PatientId';
import { PersonalInfo } from '../value-objects/PersonalInfo';

export interface PatientRegisteredEventPayload {
  patientId: PatientId;
  userId: string;
  personalInfo: PersonalInfo;
  registrationDate: Date;
}

export class PatientRegisteredEvent extends DomainEvent {
  public readonly patientId: PatientId;
  public readonly userId: string;
  public readonly personalInfo: PersonalInfo;
  public readonly registrationDate: Date;

  constructor(
    patientId: PatientId,
    userId: string,
    personalInfo: PersonalInfo,
    registrationDate?: Date
  ) {
    super('PatientRegistered', {
      patientId: patientId.value,
      userId,
      fullName: personalInfo.fullName,
      age: personalInfo.getAge(),
      gender: personalInfo.gender,
      registrationDate: (registrationDate || new Date()).toISOString()
    });

    this.patientId = patientId;
    this.userId = userId;
    this.personalInfo = personalInfo;
    this.registrationDate = registrationDate || new Date();
  }

  /**
   * Get event payload for event bus
   */
  public getPayload(): PatientRegisteredEventPayload {
    return {
      patientId: this.patientId,
      userId: this.userId,
      personalInfo: this.personalInfo,
      registrationDate: this.registrationDate
    };
  }

  /**
   * Get event summary for logging
   */
  public getSummaryForLogging(): object {
    return {
      eventType: this.eventType,
      eventId: this.eventId,
      patientId: this.patientId.value,
      userId: this.userId,
      fullName: this.personalInfo.fullName,
      age: this.personalInfo.getAge(),
      timestamp: this.timestamp.toISOString()
    };
  }
}

