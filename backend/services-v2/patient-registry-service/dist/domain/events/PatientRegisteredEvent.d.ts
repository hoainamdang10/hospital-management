/**
 * PatientRegisteredEvent - Domain Event
 * Published when a new patient is registered
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture
 */
import { DomainEvent } from '../../../../shared/domain/base/domain-event';
import { PatientId } from '../value-objects/PatientId';
import { PersonalInfo } from '../value-objects/PersonalInfo';
export interface PatientRegisteredEventPayload {
    patientId: PatientId;
    userId: string;
    personalInfo: PersonalInfo;
    registrationDate: Date;
}
export declare class PatientRegisteredEvent extends DomainEvent {
    readonly patientId: PatientId;
    readonly userId: string;
    readonly personalInfo: PersonalInfo;
    readonly registrationDate: Date;
    constructor(patientId: PatientId, userId: string, personalInfo: PersonalInfo, registrationDate?: Date);
    /**
     * Get event payload for event bus
     */
    getPayload(): PatientRegisteredEventPayload;
    /**
     * Get event summary for logging
     */
    getSummaryForLogging(): object;
}
//# sourceMappingURL=PatientRegisteredEvent.d.ts.map