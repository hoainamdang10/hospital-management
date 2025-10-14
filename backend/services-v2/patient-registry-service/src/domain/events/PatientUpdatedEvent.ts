/**
 * PatientUpdatedEvent - Domain Event
 * Published when patient information is updated
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture
 */

import { DomainEvent } from '@shared/domain/base/domain-event';

export interface PatientUpdatedEventData {
  patientId: string;
  updateType: string;
  updatedBy: string;
  updatedAt: Date;
}

export class PatientUpdatedEvent extends DomainEvent {
  constructor(
    public readonly patientId: string,
    public readonly updateType: string,
    public readonly updatedBy: string,
    correlationId?: string,
    causationId?: string,
    userIdForAudit?: string
  ) {
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
      1,
      correlationId,
      causationId,
      userIdForAudit
    );
  }

  public getEventData(): PatientUpdatedEventData {
    return {
      patientId: this.patientId,
      updateType: this.updateType,
      updatedBy: this.updatedBy,
      updatedAt: this.occurredAt
    };
  }

  public containsPHI(): boolean {
    return true;
  }

  public getPatientId(): string | null {
    return this.patientId;
  }

  public getPayload(): PatientUpdatedEventData {
    return this.getEventData();
  }
}

