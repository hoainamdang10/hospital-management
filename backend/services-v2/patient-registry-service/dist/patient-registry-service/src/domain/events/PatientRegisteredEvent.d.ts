/**
 * PatientRegisteredEvent - Domain Event
 * Published when a new patient is registered
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture
 */
import { DomainEvent } from '@shared/domain/base/domain-event';
import { Patient } from '../aggregates/Patient';
export interface PatientRegisteredEventData {
    patientId: string;
    userId: string;
    personalInfo: {
        fullName: string;
        dateOfBirth: Date;
        gender: 'male' | 'female' | 'other';
        nationalId: string;
    };
    registeredAt: Date;
}
export declare class PatientRegisteredEvent extends DomainEvent {
    readonly patient: Patient;
    constructor(patient: Patient);
    getEventData(): PatientRegisteredEventData;
    containsPHI(): boolean;
    getPatientId(): string | null;
    getPayload(): PatientRegisteredEventData;
}
//# sourceMappingURL=PatientRegisteredEvent.d.ts.map