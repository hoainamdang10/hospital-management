/**
 * PatientUpdatedEvent - Domain Event
 * Published when patient information is updated
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture
 */

import { DomainEvent } from '../../../../shared/domain/base/domain-event';
import { PatientId } from '../value-objects/PatientId';

export interface PatientUpdatedEventPayload {
  patientId: PatientId;
  updateType: string;
  updatedAt: Date;
}

export class PatientUpdatedEvent extends DomainEvent {
  public readonly patientId: PatientId;
  public readonly updateType: string;
  public readonly updatedAt: Date;

  constructor(
    patientId: PatientId,
    updateType: string,
    updatedAt?: Date
  ) {
    super('PatientUpdated', {
      patientId: patientId.value,
      updateType,
      updatedAt: (updatedAt || new Date()).toISOString()
    });

    this.patientId = patientId;
    this.updateType = updateType;
    this.updatedAt = updatedAt || new Date();
  }

  /**
   * Get event payload for event bus
   */
  public getPayload(): PatientUpdatedEventPayload {
    return {
      patientId: this.patientId,
      updateType: this.updateType,
      updatedAt: this.updatedAt
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
      updateType: this.updateType,
      timestamp: this.timestamp.toISOString()
    };
  }
}

