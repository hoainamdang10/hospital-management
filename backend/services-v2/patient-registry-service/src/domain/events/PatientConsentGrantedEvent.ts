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

export class PatientConsentGrantedEvent extends DomainEvent {
  constructor(
    public readonly patient: Patient,
    public readonly consent: PatientConsent,
    public readonly grantedBy: string
  ) {
    super('PatientConsentGranted', patient.getPatientId().getValue());
  }

  public getPayload(): any {
    return {
      patientId: this.patient.getPatientId().getValue(),
      consentId: this.consent.id,
      consentType: this.consent.consentType,
      grantedBy: this.grantedBy,
      grantedAt: this.occurredAt
    };
  }
}

