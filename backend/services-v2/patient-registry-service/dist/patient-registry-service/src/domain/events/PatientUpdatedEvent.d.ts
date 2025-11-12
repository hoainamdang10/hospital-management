/**
 * PatientUpdatedEvent - Domain Event
 * Published when patient information is updated
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture
 */
import { DomainEvent } from '../../../../shared/domain/base/domain-event';
export interface PatientUpdatedEventData {
    patientId: string;
    identityUserId: string;
    updateType: string;
    updatedBy: string;
    updatedAt: Date;
    personalInfo?: {
        fullName?: string;
        dateOfBirth?: Date;
        gender?: 'male' | 'female' | 'other';
        citizenId?: string;
    };
    contactInfo?: {
        phoneNumber?: string;
        email?: string;
        address?: {
            street?: string;
            ward?: string;
            district?: string;
            city?: string;
            province?: string;
            country?: string;
        };
    };
}
export declare class PatientUpdatedEvent extends DomainEvent {
    readonly patientId: string;
    readonly identityUserId: string;
    readonly updateType: string;
    readonly updatedBy: string;
    readonly personalInfo?: PatientUpdatedEventData['personalInfo'];
    readonly contactInfo?: PatientUpdatedEventData['contactInfo'];
    constructor(patientId: string, identityUserId: string, // Identity Service user ID - renamed to avoid override
    updateType: string, updatedBy: string, personalInfo?: PatientUpdatedEventData['personalInfo'], contactInfo?: PatientUpdatedEventData['contactInfo'], correlationId?: string, causationId?: string, userIdForAudit?: string);
    getEventData(): PatientUpdatedEventData;
    containsPHI(): boolean;
    getPatientId(): string | null;
    getPayload(): PatientUpdatedEventData;
}
//# sourceMappingURL=PatientUpdatedEvent.d.ts.map