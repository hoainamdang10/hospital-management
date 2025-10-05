/**
 * PatientConsentGrantedEvent - Domain Event
 * Published when patient grants consent
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture, HIPAA
 */

import { DomainEvent } from '@shared/domain/base/domain-event';
import { Patient } from '../aggregates/Patient';
import { PatientConsent } from '../entities/PatientConsent';

export interface PatientConsentGrantedEventData {
  patientId: string;
  consentId: string;
  consentType: string;
  grantedBy: string;
  grantedAt: Date;
}

export class PatientConsentGrantedEvent extends DomainEvent {
  constructor(
    public readonly patient: Patient,
    public readonly consent: PatientConsent,
    public readonly grantedBy: string
  ) {
    const patientId = patient.getPatientId() || '';
    const eventData = {
      patientId,
      consentId: consent.getId(),
      consentType: consent.consentType,
      grantedBy
    };

    super(
      'PatientConsentGranted',
      patientId,
      'Patient',
      eventData,
      1
    );
  }

  public getEventData(): PatientConsentGrantedEventData {
    const patientId = this.patient.getPatientId() || '';
    return {
      patientId,
      consentId: this.consent.getId(),
      consentType: this.consent.consentType,
      grantedBy: this.grantedBy,
      grantedAt: this.occurredAt
    };
  }

  public containsPHI(): boolean {
    return true; // Contains patient consent information
  }

  public getPatientId(): string | null {
    return this.patient.getPatientId();
  }

  public getPayload(): PatientConsentGrantedEventData {
    return this.getEventData();
  }
}

