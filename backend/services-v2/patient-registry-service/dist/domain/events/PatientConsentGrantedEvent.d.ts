/**
 * PatientConsentGrantedEvent - Domain Event
 * Published when patient grants consent
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture, HIPAA
 */
import { DomainEvent } from '../../shared/domain/base/domain-event';
import { Patient } from '../aggregates/Patient';
import { PatientConsent } from '../entities/PatientConsent';
export declare class PatientConsentGrantedEvent extends DomainEvent {
    readonly patient: Patient;
    readonly consent: PatientConsent;
    readonly grantedBy: string;
    constructor(patient: Patient, consent: PatientConsent, grantedBy: string);
    getPayload(): any;
}
//# sourceMappingURL=PatientConsentGrantedEvent.d.ts.map