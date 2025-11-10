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

export class PatientRegisteredEvent extends DomainEvent {
  public readonly patientUserId: string;
  private readonly contactInfo?: PatientRegisteredEventContactInfo;
  private readonly insurance?: PatientRegisteredEventInsuranceInfo | null;
  private readonly emergencyContacts?: PatientRegisteredEventEmergencyContact[];

  constructor(
    public readonly patientId: string,
    patientUserId: string,
    public readonly fullName: string,
    public readonly dateOfBirth: Date,
    public readonly gender: 'male' | 'female' | 'other',
    public readonly nationalId: string,
    additionalData?: PatientRegisteredEventAdditionalData,
    correlationId?: string,
    causationId?: string,
    userIdForAudit?: string
  ) {
    const eventData: PatientRegisteredEventData = {
      patientId,
      userId: patientUserId,
      personalInfo: {
        fullName,
        dateOfBirth,
        gender,
        nationalId
      },
      contactInfo: additionalData?.contactInfo,
      insurance: additionalData?.insurance ?? null,
      emergencyContacts: additionalData?.emergencyContacts,
      registeredAt: new Date()
    };

    super(
      'PatientRegistered',
      patientId,
      'Patient',
      eventData,
      1,
      correlationId,
      causationId,
      userIdForAudit
    );

    this.patientUserId = patientUserId;
    this.contactInfo = additionalData?.contactInfo;
    this.insurance = additionalData?.insurance ?? null;
    this.emergencyContacts = additionalData?.emergencyContacts;
  }

  public getEventData(): PatientRegisteredEventData {
    return {
      patientId: this.patientId,
      userId: this.patientUserId,
      personalInfo: {
        fullName: this.fullName,
        dateOfBirth: this.dateOfBirth,
        gender: this.gender,
        nationalId: this.nationalId
      },
      contactInfo: this.contactInfo,
      insurance: this.insurance,
      emergencyContacts: this.emergencyContacts,
      registeredAt: this.occurredAt
    };
  }

  public containsPHI(): boolean {
    return true;
  }

  public getPatientId(): string | null {
    return this.patientId;
  }

  public getPayload(): PatientRegisteredEventData {
    return this.getEventData();
  }
}
