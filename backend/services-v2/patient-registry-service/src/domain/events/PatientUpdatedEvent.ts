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

export interface PatientUpdatedEventData {
  patientId: string;
  updateType: string;
  updatedBy: string;
  updatedAt: Date;
}

export class PatientUpdatedEvent extends DomainEvent {
  constructor(
    public readonly patient: Patient,
    public readonly updateType: string,
    public readonly updatedBy: string
  ) {
    const patientId = patient.getPatientId() || '';
    const eventData = {
      patientId,
      updateType,
      updatedBy
    };

    super(
      'PatientUpdated',
      patientId,
      'Patient',
      eventData,
      1
    );
  }

  public getEventData(): PatientUpdatedEventData {
    const patientId = this.patient.getPatientId() || '';
    return {
      patientId,
      updateType: this.updateType,
      updatedBy: this.updatedBy,
      updatedAt: this.occurredAt
    };
  }

  public containsPHI(): boolean {
    return true;
  }

  public getPatientId(): string | null {
    return this.patient.getPatientId();
  }

  public getPayload(): PatientUpdatedEventData {
    return this.getEventData();
  }
}

