/**
 * Patient Registered Event - Domain Layer
 * Healthcare domain event with HIPAA compliance
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance HIPAA, Event Sourcing, FHIR R4
 */

import { HealthcareDomainEvent } from '../../../shared/domain/base/domain-event';
import { PatientId } from '../value-objects/patient-id';
import { PersonalInfo } from '../value-objects/personal-info';
import { ContactInfo } from '../value-objects/contact-info';

export interface PatientRegisteredEventData {
  patientId: string;
  personalInfo: {
    fullName: string;
    dateOfBirth: string;
    gender: string;
    nationalId?: string;
    ethnicity?: string;
    religion?: string;
    occupation?: string;
    maritalStatus?: string;
  };
  contactInfo: {
    phone?: string;
    email?: string;
    address?: {
      street: string;
      ward: string;
      district: string;
      city: string;
      province: string;
      postalCode?: string;
      country: string;
    };
    emergencyContact?: {
      name: string;
      relationship: string;
      phone: string;
      email?: string;
      address?: string;
    };
  };
  registrationDate: string;
  registeredBy: string;
  registrationSource: 'WALK_IN' | 'ONLINE' | 'REFERRAL' | 'EMERGENCY';
  insuranceInfo?: {
    provider: string;
    policyNumber: string;
    subscriberName: string;
    effectiveDate: string;
    expirationDate?: string;
  };
  medicalInfo?: {
    bloodType?: string;
    allergies: string[];
    chronicConditions: string[];
    currentMedications: Array<{
      name: string;
      dosage: string;
      frequency: string;
    }>;
  };
  fhirCompliance: {
    score: number;
    missingFields: string[];
    recommendations: string[];
  };
}

/**
 * Patient Registered Domain Event
 * Raised when a new patient is successfully registered in the system
 */
export class PatientRegisteredEvent extends HealthcareDomainEvent {
  constructor(
    patientId: string,
    eventData: PatientRegisteredEventData,
    userId: string,
    correlationId?: string
  ) {
    super(
      'PatientRegistered',
      patientId,
      'Patient',
      eventData,
      1,
      correlationId,
      undefined,
      userId,
      {
        source: 'healthcare-domain',
        priority: 'high',
        publishExternal: true,
        retryable: true,
        complianceLevel: 'HIPAA',
        tags: ['patient', 'registration', 'healthcare', 'phi']
      }
    );
  }

  /**
   * Create from Patient aggregate data
   */
  public static create(
    patientId: PatientId,
    personalInfo: PersonalInfo,
    contactInfo: ContactInfo,
    registeredBy: string,
    registrationSource: 'WALK_IN' | 'ONLINE' | 'REFERRAL' | 'EMERGENCY',
    insuranceInfo?: any,
    medicalInfo?: any,
    correlationId?: string
  ): PatientRegisteredEvent {
    const eventData: PatientRegisteredEventData = {
      patientId: patientId.value,
      personalInfo: {
        fullName: personalInfo.fullName,
        dateOfBirth: personalInfo.dateOfBirth.toISOString(),
        gender: personalInfo.gender,
        nationalId: personalInfo.nationalId,
        ethnicity: personalInfo.ethnicity,
        religion: personalInfo.religion,
        occupation: personalInfo.occupation,
        maritalStatus: personalInfo.maritalStatus
      },
      contactInfo: {
        phone: contactInfo.phone,
        email: contactInfo.email,
        address: contactInfo.address,
        emergencyContact: contactInfo.emergencyContact
      },
      registrationDate: new Date().toISOString(),
      registeredBy,
      registrationSource,
      insuranceInfo,
      medicalInfo,
      fhirCompliance: PatientRegisteredEvent.calculateFHIRCompliance(personalInfo, contactInfo, medicalInfo)
    };

    return new PatientRegisteredEvent(
      patientId.value,
      eventData,
      registeredBy,
      correlationId
    );
  }

  /**
   * Calculate FHIR R4 compliance score
   */
  private static calculateFHIRCompliance(
    personalInfo: PersonalInfo,
    contactInfo: ContactInfo,
    medicalInfo?: any
  ): { score: number; missingFields: string[]; recommendations: string[] } {
    let score = 0;
    const missingFields: string[] = [];
    const recommendations: string[] = [];

    // Required FHIR Patient fields (40 points)
    if (personalInfo.fullName) score += 10;
    else missingFields.push('name');

    if (personalInfo.gender) score += 10;
    else missingFields.push('gender');

    if (personalInfo.dateOfBirth) score += 10;
    else missingFields.push('birthDate');

    if (personalInfo.nationalId) score += 10;
    else missingFields.push('identifier');

    // Contact information (30 points)
    if (contactInfo.phone || contactInfo.email) score += 15;
    else {
      missingFields.push('telecom');
      recommendations.push('Thêm thông tin liên lạc (điện thoại hoặc email)');
    }

    if (contactInfo.hasCompleteAddress) score += 15;
    else {
      missingFields.push('address');
      recommendations.push('Hoàn thiện địa chỉ đầy đủ');
    }

    // Emergency contact (10 points)
    if (contactInfo.emergencyContact) score += 10;
    else recommendations.push('Thêm thông tin người liên hệ khẩn cấp');

    // Medical information (20 points)
    if (medicalInfo?.bloodType) score += 5;
    else recommendations.push('Thêm thông tin nhóm máu');

    if (medicalInfo?.allergies && medicalInfo.allergies.length > 0) score += 5;
    else recommendations.push('Cập nhật thông tin dị ứng');

    if (medicalInfo?.chronicConditions && medicalInfo.chronicConditions.length > 0) score += 5;
    else recommendations.push('Cập nhật tiền sử bệnh');

    if (medicalInfo?.currentMedications && medicalInfo.currentMedications.length > 0) score += 5;
    else recommendations.push('Cập nhật thuốc đang sử dụng');

    return {
      score: Math.min(score, 100),
      missingFields,
      recommendations
    };
  }

  /**
   * Get event data
   */
  public getEventData(): PatientRegisteredEventData {
    return this.eventData as PatientRegisteredEventData;
  }

  /**
   * Get patient ID from event
   */
  public getPatientId(): string {
    return this.getEventData().patientId;
  }

  /**
   * Get registration source
   */
  public getRegistrationSource(): string {
    return this.getEventData().registrationSource;
  }

  /**
   * Get FHIR compliance score
   */
  public getFHIRComplianceScore(): number {
    return this.getEventData().fhirCompliance.score;
  }

  /**
   * Check if patient registration is FHIR compliant (>= 80%)
   */
  public isFHIRCompliant(): boolean {
    return this.getFHIRComplianceScore() >= 80;
  }

  /**
   * Get missing FHIR fields
   */
  public getMissingFHIRFields(): string[] {
    return this.getEventData().fhirCompliance.missingFields;
  }

  /**
   * Get FHIR recommendations
   */
  public getFHIRRecommendations(): string[] {
    return this.getEventData().fhirCompliance.recommendations;
  }

  /**
   * Check if patient is pediatric
   */
  public isPediatricPatient(): boolean {
    const birthDate = new Date(this.getEventData().personalInfo.dateOfBirth);
    const age = new Date().getFullYear() - birthDate.getFullYear();
    return age < 18;
  }

  /**
   * Check if patient is elderly
   */
  public isElderlyPatient(): boolean {
    const birthDate = new Date(this.getEventData().personalInfo.dateOfBirth);
    const age = new Date().getFullYear() - birthDate.getFullYear();
    return age >= 65;
  }

  /**
   * Check if patient has emergency contact
   */
  public hasEmergencyContact(): boolean {
    return !!this.getEventData().contactInfo.emergencyContact;
  }

  /**
   * Check if patient has insurance
   */
  public hasInsurance(): boolean {
    return !!this.getEventData().insuranceInfo;
  }

  /**
   * Anonymize event data for non-PHI use
   */
  public anonymize(): Partial<PatientRegisteredEventData> {
    const eventData = this.getEventData();
    
    return {
      patientId: this.maskPatientId(eventData.patientId),
      personalInfo: {
        fullName: this.maskName(eventData.personalInfo.fullName),
        dateOfBirth: this.maskDateOfBirth(eventData.personalInfo.dateOfBirth),
        gender: eventData.personalInfo.gender,
        nationalId: eventData.personalInfo.nationalId ? this.maskNationalId(eventData.personalInfo.nationalId) : undefined,
        ethnicity: eventData.personalInfo.ethnicity,
        religion: eventData.personalInfo.religion,
        occupation: eventData.personalInfo.occupation,
        maritalStatus: eventData.personalInfo.maritalStatus
      },
      contactInfo: {
        phone: eventData.contactInfo.phone ? this.maskPhone(eventData.contactInfo.phone) : undefined,
        email: eventData.contactInfo.email ? this.maskEmail(eventData.contactInfo.email) : undefined,
        address: eventData.contactInfo.address ? {
          ...eventData.contactInfo.address,
          street: this.maskStreet(eventData.contactInfo.address.street)
        } : undefined
      },
      registrationDate: eventData.registrationDate,
      registeredBy: 'SYSTEM',
      registrationSource: eventData.registrationSource,
      fhirCompliance: eventData.fhirCompliance
    };
  }

  /**
   * Helper methods for anonymization
   */
  private maskPatientId(patientId: string): string {
    const parts = patientId.split('-');
    return `PAT-${parts[1]}-***`;
  }

  private maskName(name: string): string {
    const parts = name.split(' ');
    return parts.map(part => part.charAt(0) + '*'.repeat(Math.max(0, part.length - 1))).join(' ');
  }

  private maskDateOfBirth(dateOfBirth: string): string {
    const date = new Date(dateOfBirth);
    return new Date(date.getFullYear(), 0, 1).toISOString();
  }

  private maskNationalId(nationalId: string): string {
    return nationalId.substring(0, 3) + '*'.repeat(Math.max(0, nationalId.length - 3));
  }

  private maskPhone(phone: string): string {
    return phone.substring(0, 3) + '*'.repeat(Math.max(0, phone.length - 6)) + phone.substring(Math.max(3, phone.length - 3));
  }

  private maskEmail(email: string): string {
    const [localPart, domain] = email.split('@');
    const maskedLocal = localPart.charAt(0) + '*'.repeat(Math.max(0, localPart.length - 2)) + localPart.charAt(localPart.length - 1);
    return maskedLocal + '@' + domain;
  }

  private maskStreet(street: string): string {
    return street.charAt(0) + '*'.repeat(Math.max(0, street.length - 1));
  }

  /**
   * Convert to FHIR AuditEvent
   */
  public toFHIRAuditEvent(): any {
    return {
      resourceType: 'AuditEvent',
      type: {
        system: 'http://terminology.hl7.org/CodeSystem/audit-event-type',
        code: 'rest',
        display: 'RESTful Operation'
      },
      subtype: [{
        system: 'http://hl7.org/fhir/restful-interaction',
        code: 'create',
        display: 'create'
      }],
      action: 'C',
      recorded: this.occurredAt.toISOString(),
      outcome: '0',
      agent: [{
        type: {
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/extra-security-role-type',
            code: 'humanuser',
            display: 'human user'
          }]
        },
        who: {
          identifier: {
            value: this.userId
          }
        },
        requestor: true
      }],
      source: {
        site: 'Hospital Management System',
        identifier: {
          value: 'hospital-management-v2'
        }
      },
      entity: [{
        what: {
          identifier: {
            value: this.getPatientId()
          }
        },
        type: {
          system: 'http://terminology.hl7.org/CodeSystem/audit-entity-type',
          code: '1',
          display: 'Person'
        },
        role: {
          system: 'http://terminology.hl7.org/CodeSystem/object-role',
          code: '1',
          display: 'Patient'
        }
      }]
    };
  }

  /**
   * Create from JSON (for event sourcing)
   */
  public static fromJSON(data: any): PatientRegisteredEvent {
    return new PatientRegisteredEvent(
      data.aggregateId,
      data.eventData,
      data.userId,
      data.correlationId
    );
  }
}
