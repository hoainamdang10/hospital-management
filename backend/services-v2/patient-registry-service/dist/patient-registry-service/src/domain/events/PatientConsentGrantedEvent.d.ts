/**
 * PatientConsentGrantedEvent - Domain Event
 * Published when patient grants consent
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture, HIPAA
 */
import { DomainEvent } from '../../../../shared/domain/base/domain-event';
export interface PatientConsentGrantedEventData {
    patientId: string;
    consentId: string;
    consentType: string;
    grantedBy: string;
    grantedAt: Date;
}
export declare class PatientConsentGrantedEvent extends DomainEvent {
    readonly patientId: string;
    readonly consentId: string;
    readonly consentType: string;
    readonly grantedBy: string;
    constructor(patientId: string, consentId: string, consentType: string, grantedBy: string, correlationId?: string, causationId?: string, userIdForAudit?: string);
    getEventData(): PatientConsentGrantedEventData;
    containsPHI(): boolean;
    getPatientId(): string | null;
    getPayload(): PatientConsentGrantedEventData;
}
//# sourceMappingURL=PatientConsentGrantedEvent.d.ts.map