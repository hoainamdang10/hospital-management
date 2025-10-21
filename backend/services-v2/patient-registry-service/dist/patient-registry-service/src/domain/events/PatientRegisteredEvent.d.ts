/**
 * PatientRegisteredEvent - Domain Event
 * Published when a new patient is registered
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture
 */
import { DomainEvent } from '../../../../shared/domain/base/domain-event';
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
    readonly patientId: string;
    readonly fullName: string;
    readonly dateOfBirth: Date;
    readonly gender: 'male' | 'female' | 'other';
    readonly nationalId: string;
    readonly patientUserId: string;
    constructor(patientId: string, patientUserId: string, fullName: string, dateOfBirth: Date, gender: 'male' | 'female' | 'other', nationalId: string, correlationId?: string, causationId?: string, userIdForAudit?: string);
    getEventData(): PatientRegisteredEventData;
    containsPHI(): boolean;
    getPatientId(): string | null;
    getPayload(): PatientRegisteredEventData;
}
//# sourceMappingURL=PatientRegisteredEvent.d.ts.map