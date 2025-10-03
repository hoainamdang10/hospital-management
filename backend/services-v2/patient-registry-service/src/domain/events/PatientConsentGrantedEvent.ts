/**
 * PatientConsentGrantedEvent - Domain Event
 * Published when patient grants consent
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture, HIPAA
 */

import { DomainEvent } from '../../../../shared/domain/base/domain-event';
import { PatientId } from '../value-objects/PatientId';

export interface PatientConsentGrantedEventPayload {
  patientId: PatientId;
  consentType: string;
  grantedAt: Date;
}

export class PatientConsentGrantedEvent extends DomainEvent {
  public readonly patientId: PatientId;
  public readonly consentType: string;
  public readonly grantedAt: Date;

  constructor(
    patientId: PatientId,
    consentType: string,
    grantedAt?: Date
  ) {
    super('PatientConsentGranted', {
      patientId: patientId.value,
      consentType,
      grantedAt: (grantedAt || new Date()).toISOString()
    });

    this.patientId = patientId;
    this.consentType = consentType;
    this.grantedAt = grantedAt || new Date();
  }

  /**
   * Get event payload for event bus
   */
  public getPayload(): PatientConsentGrantedEventPayload {
    return {
      patientId: this.patientId,
      consentType: this.consentType,
      grantedAt: this.grantedAt
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
      consentType: this.consentType,
      timestamp: this.timestamp.toISOString()
    };
  }
}

