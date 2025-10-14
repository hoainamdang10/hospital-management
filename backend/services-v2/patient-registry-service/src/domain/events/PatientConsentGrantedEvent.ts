/**
 * PatientConsentGrantedEvent - Domain Event
 * Published when patient grants consent
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture, HIPAA
 */

import { DomainEvent } from '@shared/domain/base/domain-event';

export interface PatientConsentGrantedEventData {
  patientId: string;
  consentId: string;
  consentType: string;
  grantedBy: string;
  grantedAt: Date;
}

export class PatientConsentGrantedEvent extends DomainEvent {
  constructor(
    public readonly patientId: string,
    public readonly consentId: string,
    public readonly consentType: string,
    public readonly grantedBy: string,
    correlationId?: string,
    causationId?: string,
    userIdForAudit?: string
  ) {
    const eventData = {
      patientId,
      consentId,
      consentType,
      grantedBy
    };

    super(
      'PatientConsentGranted',
      patientId,
      'Patient',
      eventData,
      1,
      correlationId,
      causationId,
      userIdForAudit
    );
  }

  public getEventData(): PatientConsentGrantedEventData {
    return {
      patientId: this.patientId,
      consentId: this.consentId,
      consentType: this.consentType,
      grantedBy: this.grantedBy,
      grantedAt: this.occurredAt
    };
  }

  public containsPHI(): boolean {
    return true;
  }

  public getPatientId(): string | null {
    return this.patientId;
  }

  public getPayload(): PatientConsentGrantedEventData {
    return this.getEventData();
  }
}

