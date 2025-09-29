/**
 * Register Patient Command - CQRS Pattern
 * Command for registering a new patient in the system
 * 
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance CQRS, DDD, HIPAA
 */

import { Command, ValidationResult, ValidationError } from '../../base/command';
import { PersonalInfo } from '../../../domain/value-objects/personal-info';
import { ContactInfo } from '../../../domain/value-objects/contact-info';
import { MedicalInfo } from '../../../domain/value-objects/medical-info';
import { EmergencyContact } from '../../../domain/value-objects/emergency-contact';
import { InsuranceInfo } from '../../../domain/value-objects/insurance-info';

export interface RegisterPatientCommandData {
  personalInfo: {
    fullName: string;
    dateOfBirth: Date;
    gender: 'male' | 'female' | 'other';
    nationalId?: string;
    nationality?: string;
    occupation?: string;
    maritalStatus?: 'single' | 'married' | 'divorced' | 'widowed';
  };
  contactInfo: {
    phoneNumber: string;
    email?: string;
    address?: {
      street: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
    preferredContactMethod?: 'phone' | 'email' | 'sms';
  };
  medicalInfo: {
    bloodType?: string;
    allergies?: string[];
    chronicConditions?: string[];
    currentMedications?: any[];
    medicalHistory?: string;
    familyMedicalHistory?: string;
    smokingStatus?: 'never' | 'former' | 'current';
    alcoholConsumption?: 'never' | 'occasional' | 'regular' | 'heavy';
    exerciseFrequency?: 'never' | 'rarely' | 'sometimes' | 'regularly' | 'daily';
  };
  emergencyContact?: {
    fullName: string;
    relationship: string;
    phoneNumber: string;
    alternatePhoneNumber?: string;
    email?: string;
    address?: string;
    isPrimary?: boolean;
  };
  insuranceInfo?: {
    provider: string;
    policyNumber: string;
    groupNumber?: string;
    subscriberName: string;
    subscriberDateOfBirth: Date;
    relationshipToSubscriber: 'self' | 'spouse' | 'child' | 'other';
    effectiveDate: Date;
    expirationDate?: Date;
    copayAmount?: number;
    deductibleAmount?: number;
    coverageType: 'basic' | 'standard' | 'premium' | 'comprehensive';
    isActive?: boolean;
  };
  registrationSource?: 'walk_in' | 'online' | 'referral' | 'emergency';
  consentGiven: boolean;
  privacyPolicyAccepted: boolean;
}

/**
 * Register Patient Command
 * Contains all data needed to register a new patient
 */
export class RegisterPatientCommand extends Command {
  private readonly data: RegisterPatientCommandData;

  constructor(
    data: RegisterPatientCommandData,
    userId?: string,
    correlationId?: string,
    metadata?: Record<string, any>
  ) {
    super('RegisterPatient', userId, correlationId, metadata);
    this.data = data;
  }

  /**
   * Validate command data
   */
  public async validate(): Promise<ValidationResult> {
    const errors: ValidationError[] = [];

    // Validate consent requirements
    if (!this.data.consentGiven) {
      errors.push({
        field: 'consentGiven',
        message: 'Bệnh nhân phải đồng ý với việc xử lý dữ liệu y tế',
        code: 'CONSENT_REQUIRED'
      });
    }

    if (!this.data.privacyPolicyAccepted) {
      errors.push({
        field: 'privacyPolicyAccepted',
        message: 'Bệnh nhân phải chấp nhận chính sách bảo mật',
        code: 'PRIVACY_POLICY_REQUIRED'
      });
    }

    // Validate personal info
    try {
      PersonalInfo.create(
        this.data.personalInfo.fullName,
        this.data.personalInfo.dateOfBirth,
        this.data.personalInfo.gender as any,
        this.data.personalInfo.nationalId,
        this.data.personalInfo.nationality,
        this.data.personalInfo.occupation,
        this.data.personalInfo.maritalStatus
      );
    } catch (error) {
      errors.push({
        field: 'personalInfo',
        message: error instanceof Error ? error.message : 'Thông tin cá nhân không hợp lệ',
        code: 'INVALID_PERSONAL_INFO'
      });
    }

    // Validate contact info
    try {
      ContactInfo.create(
        this.data.contactInfo.phoneNumber,
        this.data.contactInfo.email,
        this.data.contactInfo.address,
        this.data.contactInfo.preferredContactMethod
      );
    } catch (error) {
      errors.push({
        field: 'contactInfo',
        message: error instanceof Error ? error.message : 'Thông tin liên hệ không hợp lệ',
        code: 'INVALID_CONTACT_INFO'
      });
    }

    // Validate medical info
    try {
      MedicalInfo.create(
        this.data.medicalInfo.bloodType as any,
        this.data.medicalInfo.allergies || [],
        this.data.medicalInfo.chronicConditions || [],
        this.data.medicalInfo.currentMedications || [],
        this.data.medicalInfo.medicalHistory,
        this.data.medicalInfo.familyMedicalHistory,
        this.data.medicalInfo.smokingStatus,
        this.data.medicalInfo.alcoholConsumption,
        this.data.medicalInfo.exerciseFrequency
      );
    } catch (error) {
      errors.push({
        field: 'medicalInfo',
        message: error instanceof Error ? error.message : 'Thông tin y tế không hợp lệ',
        code: 'INVALID_MEDICAL_INFO'
      });
    }

    // Validate emergency contact if provided
    if (this.data.emergencyContact) {
      try {
        EmergencyContact.create(
          this.data.emergencyContact.fullName,
          this.data.emergencyContact.relationship,
          this.data.emergencyContact.phoneNumber,
          this.data.emergencyContact.alternatePhoneNumber,
          this.data.emergencyContact.email,
          this.data.emergencyContact.address,
          this.data.emergencyContact.isPrimary
        );
      } catch (error) {
        errors.push({
          field: 'emergencyContact',
          message: error instanceof Error ? error.message : 'Thông tin người liên hệ khẩn cấp không hợp lệ',
          code: 'INVALID_EMERGENCY_CONTACT'
        });
      }
    }

    // Validate insurance info if provided
    if (this.data.insuranceInfo) {
      try {
        InsuranceInfo.create(
          this.data.insuranceInfo.provider,
          this.data.insuranceInfo.policyNumber,
          this.data.insuranceInfo.subscriberName,
          this.data.insuranceInfo.subscriberDateOfBirth,
          this.data.insuranceInfo.relationshipToSubscriber,
          this.data.insuranceInfo.effectiveDate,
          this.data.insuranceInfo.coverageType,
          this.data.insuranceInfo.groupNumber,
          this.data.insuranceInfo.expirationDate,
          this.data.insuranceInfo.copayAmount,
          this.data.insuranceInfo.deductibleAmount,
          this.data.insuranceInfo.isActive
        );
      } catch (error) {
        errors.push({
          field: 'insuranceInfo',
          message: error instanceof Error ? error.message : 'Thông tin bảo hiểm không hợp lệ',
          code: 'INVALID_INSURANCE_INFO'
        });
      }
    }

    // Business rule validations
    await this.validateBusinessRules(errors);

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate business rules
   */
  private async validateBusinessRules(errors: ValidationError[]): Promise<void> {
    // Check age restrictions
    const age = this.calculateAge(this.data.personalInfo.dateOfBirth);
    
    // Minor patients must have emergency contact
    if (age < 18 && !this.data.emergencyContact) {
      errors.push({
        field: 'emergencyContact',
        message: 'Bệnh nhân dưới 18 tuổi phải có thông tin người liên hệ khẩn cấp',
        code: 'MINOR_REQUIRES_EMERGENCY_CONTACT'
      });
    }

    // Validate phone number uniqueness (would check database in real implementation)
    // This is a placeholder for business rule validation
    
    // Validate national ID uniqueness if provided
    if (this.data.personalInfo.nationalId) {
      // Would check database for existing national ID
    }

    // Validate insurance policy if patient is not self-subscriber
    if (this.data.insuranceInfo && this.data.insuranceInfo.relationshipToSubscriber !== 'self') {
      if (this.data.insuranceInfo.subscriberName === this.data.personalInfo.fullName) {
        errors.push({
          field: 'insuranceInfo.subscriberName',
          message: 'Tên người được bảo hiểm không thể giống tên bệnh nhân khi mối quan hệ không phải là "bản thân"',
          code: 'INVALID_SUBSCRIBER_RELATIONSHIP'
        });
      }
    }
  }

  /**
   * Calculate age from date of birth
   */
  private calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    let age = today.getFullYear() - dateOfBirth.getFullYear();
    const monthDiff = today.getMonth() - dateOfBirth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
      age--;
    }

    return age;
  }

  /**
   * Get command payload
   */
  public getPayload(): RegisterPatientCommandData {
    return this.data;
  }

  /**
   * Check if command contains PHI
   */
  public containsPHI(): boolean {
    return true; // Patient registration always contains PHI
  }

  /**
   * Get patient ID (null for registration as patient doesn't exist yet)
   */
  public getPatientId(): string | null {
    return null;
  }

  /**
   * Get command description
   */
  public getDescription(): string {
    return `Đăng ký bệnh nhân mới: ${this.data.personalInfo.fullName}`;
  }

  /**
   * Get personal info data
   */
  public getPersonalInfo(): RegisterPatientCommandData['personalInfo'] {
    return this.data.personalInfo;
  }

  /**
   * Get contact info data
   */
  public getContactInfo(): RegisterPatientCommandData['contactInfo'] {
    return this.data.contactInfo;
  }

  /**
   * Get medical info data
   */
  public getMedicalInfo(): RegisterPatientCommandData['medicalInfo'] {
    return this.data.medicalInfo;
  }

  /**
   * Get emergency contact data
   */
  public getEmergencyContact(): RegisterPatientCommandData['emergencyContact'] | undefined {
    return this.data.emergencyContact;
  }

  /**
   * Get insurance info data
   */
  public getInsuranceInfo(): RegisterPatientCommandData['insuranceInfo'] | undefined {
    return this.data.insuranceInfo;
  }

  /**
   * Get registration source
   */
  public getRegistrationSource(): string {
    return this.data.registrationSource || 'walk_in';
  }

  /**
   * Check if consent was given
   */
  public isConsentGiven(): boolean {
    return this.data.consentGiven;
  }

  /**
   * Check if privacy policy was accepted
   */
  public isPrivacyPolicyAccepted(): boolean {
    return this.data.privacyPolicyAccepted;
  }
}
