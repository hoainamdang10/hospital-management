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
export declare class PatientConsentGrantedEvent extends DomainEvent {
    readonly patientId: PatientId;
    readonly consentType: string;
    readonly grantedAt: Date;
    constructor(patientId: PatientId, consentType: string, grantedAt?: Date);
    /**
     * Get event payload for event bus
     */
    getPayload(): PatientConsentGrantedEventPayload;
    /**
     * Get event summary for logging
     */
    getSummaryForLogging(): object;
}
//# sourceMappingURL=PatientConsentGrantedEvent.d.ts.map