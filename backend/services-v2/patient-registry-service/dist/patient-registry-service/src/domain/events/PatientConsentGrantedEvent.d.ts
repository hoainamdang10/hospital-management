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
export declare class PatientConsentGrantedEvent extends DomainEvent {
    readonly patient: Patient;
    readonly consent: PatientConsent;
    readonly grantedBy: string;
    constructor(patient: Patient, consent: PatientConsent, grantedBy: string);
    getEventData(): PatientConsentGrantedEventData;
    containsPHI(): boolean;
    getPatientId(): string | null;
    getPayload(): PatientConsentGrantedEventData;
}
//# sourceMappingURL=PatientConsentGrantedEvent.d.ts.map