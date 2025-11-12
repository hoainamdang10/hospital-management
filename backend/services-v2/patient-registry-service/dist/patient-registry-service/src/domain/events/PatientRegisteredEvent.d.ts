/**
 * PatientRegisteredEvent - Domain Event
 * Published when a new patient is registered
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture
 */
import { DomainEvent } from '@shared/domain/base/domain-event';
export interface PatientRegisteredEventData {
    patientId: string;
    userId: string;
    personalInfo: {
        fullName: string;
        dateOfBirth: Date;
        gender: 'male' | 'female' | 'other';
        nationalId: string;
    };
    contactInfo?: PatientRegisteredEventContactInfo;
    insurance?: PatientRegisteredEventInsuranceInfo | null;
    emergencyContacts?: PatientRegisteredEventEmergencyContact[];
    registeredAt: Date;
}
export interface PatientRegisteredEventAddress {
    street?: string;
    ward?: string;
    district?: string;
    city?: string;
    province?: string;
    postalCode?: string;
    country?: string;
}
export interface PatientRegisteredEventContactInfo {
    primaryPhone?: string;
    secondaryPhone?: string;
    email?: string;
    address?: PatientRegisteredEventAddress;
    preferredContactMethod?: 'phone' | 'email' | 'sms';
}
export interface PatientRegisteredEventInsuranceInfo {
    provider: string;
    policyNumber: string;
    coverageType: 'BHYT' | 'BHTN' | 'private' | 'self_pay';
    validFrom: Date;
    validTo: Date;
    bhytNumber?: string;
    isPrimary?: boolean;
    isActive?: boolean;
    isVietnameseInsurance?: boolean;
    groupNumber?: string;
}
export interface PatientRegisteredEventEmergencyContact {
    id?: string;
    name: string;
    relationship: string;
    primaryPhone: string;
    secondaryPhone?: string;
    email?: string;
    address?: string;
    isPrimary?: boolean;
    isActive?: boolean;
}
export interface PatientRegisteredEventAdditionalData {
    contactInfo?: PatientRegisteredEventContactInfo;
    insurance?: PatientRegisteredEventInsuranceInfo | null;
    emergencyContacts?: PatientRegisteredEventEmergencyContact[];
}
export declare class PatientRegisteredEvent extends DomainEvent {
    readonly patientId: string;
    readonly fullName: string;
    readonly dateOfBirth: Date;
    readonly gender: 'male' | 'female' | 'other';
    readonly nationalId: string;
    readonly patientUserId: string;
    private readonly contactInfo?;
    private readonly insurance?;
    private readonly emergencyContacts?;
    constructor(patientId: string, patientUserId: string, fullName: string, dateOfBirth: Date, gender: 'male' | 'female' | 'other', nationalId: string, additionalData?: PatientRegisteredEventAdditionalData, correlationId?: string, causationId?: string, userIdForAudit?: string);
    getEventData(): PatientRegisteredEventData;
    containsPHI(): boolean;
    getPatientId(): string | null;
    getPayload(): PatientRegisteredEventData;
}
//# sourceMappingURL=PatientRegisteredEvent.d.ts.map