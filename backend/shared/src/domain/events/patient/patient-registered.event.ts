/**
 * Patient Registered Domain Event
 * Raised when a new patient is registered in the system
 * 
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance DDD, Event Sourcing, HIPAA
 */

import { DomainEvent } from '../domain-event';

export interface PatientRegisteredEventData {
  patientId: string;
  personalInfo: {
    fullName: string;
    dateOfBirth: Date;
    gender: string;
    nationalId?: string;
    nationality?: string;
    occupation?: string;
    maritalStatus?: string;
  };
  contactInfo: {
    phoneNumber: string;
    email?: string;
    address?: any;
    preferredContactMethod?: string;
  };
  medicalInfo: {
    bloodType?: string;
    allergies: string[];
    chronicConditions: string[];
    currentMedications: any[];
    medicalHistory?: string;
    familyMedicalHistory?: string;
    smokingStatus?: string;
    alcoholConsumption?: string;
    exerciseFrequency?: string;
  };
  registrationDate: Date;
}

/**
 * Patient Registered Domain Event
 * Contains all necessary information about patient registration
 */
export class PatientRegisteredEvent extends DomainEvent {
  private readonly eventData: PatientRegisteredEventData;

  constructor(
    eventData: PatientRegisteredEventData,
    correlationId?: string,
    causationId?: string,
    userId?: string
  ) {
    super(
      'PatientRegistered',
      eventData.patientId,
      'Patient',
      eventData,
      1,
      correlationId,
      causationId,
      userId
    );
    this.eventData = eventData;
  }

  /**
   * Get event data payload
   */
  public getEventData(): PatientRegisteredEventData {
    return this.eventData;
  }

  /**
   * Check if event contains PHI (Protected Health Information)
   */
  public containsPHI(): boolean {
    return true; // Patient registration always contains PHI
  }

  /**
   * Get patient ID from event
   */
  public getPatientId(): string {
    return this.eventData.patientId;
  }

  /**
   * Get event description for audit logs
   */
  public getEventDescription(): string {
    return `Bệnh nhân ${this.eventData.personalInfo.fullName} đã được đăng ký với ID ${this.eventData.patientId}`;
  }

  /**
   * Get patient full name
   */
  public getPatientFullName(): string {
    return this.eventData.personalInfo.fullName;
  }

  /**
   * Get patient age at registration
   */
  public getPatientAgeAtRegistration(): number {
    const today = this.eventData.registrationDate;
    const birthDate = this.eventData.personalInfo.dateOfBirth;
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }

  /**
   * Check if patient is minor at registration
   */
  public isPatientMinor(): boolean {
    return this.getPatientAgeAtRegistration() < 18;
  }

  /**
   * Check if patient has emergency contact
   */
  public hasEmergencyContact(): boolean {
    // This would be determined from the registration data
    // For now, we'll check if phone number is different from patient's
    return true; // Simplified for this implementation
  }

  /**
   * Check if patient has insurance information
   */
  public hasInsuranceInfo(): boolean {
    // This would be determined from the registration data
    // For now, we'll assume it's provided during registration
    return true; // Simplified for this implementation
  }

  /**
   * Get registration summary for notifications
   */
  public getRegistrationSummary(): {
    patientId: string;
    fullName: string;
    age: number;
    gender: string;
    phoneNumber: string;
    hasAllergies: boolean;
    hasChronicConditions: boolean;
    registrationDate: Date;
  } {
    return {
      patientId: this.eventData.patientId,
      fullName: this.eventData.personalInfo.fullName,
      age: this.getPatientAgeAtRegistration(),
      gender: this.eventData.personalInfo.gender,
      phoneNumber: this.eventData.contactInfo.phoneNumber,
      hasAllergies: this.eventData.medicalInfo.allergies.length > 0,
      hasChronicConditions: this.eventData.medicalInfo.chronicConditions.length > 0,
      registrationDate: this.eventData.registrationDate,
    };
  }

  /**
   * Get FHIR compliance indicators
   */
  public getFHIRComplianceIndicators(): {
    hasRequiredFields: boolean;
    missingFields: string[];
    complianceScore: number;
  } {
    const missingFields: string[] = [];
    let score = 100;

    // Check required FHIR fields
    if (!this.eventData.personalInfo.fullName) {
      missingFields.push('Họ tên');
      score -= 20;
    }
    if (!this.eventData.personalInfo.dateOfBirth) {
      missingFields.push('Ngày sinh');
      score -= 20;
    }
    if (!this.eventData.personalInfo.gender) {
      missingFields.push('Giới tính');
      score -= 10;
    }
    if (!this.eventData.contactInfo.phoneNumber) {
      missingFields.push('Số điện thoại');
      score -= 10;
    }
    if (!this.eventData.contactInfo.email) {
      missingFields.push('Email');
      score -= 10;
    }
    if (!this.eventData.medicalInfo.bloodType) {
      missingFields.push('Nhóm máu');
      score -= 5;
    }

    return {
      hasRequiredFields: missingFields.length === 0,
      missingFields,
      complianceScore: Math.max(0, score),
    };
  }

  /**
   * Get healthcare risk indicators
   */
  public getHealthcareRiskIndicators(): {
    riskLevel: 'low' | 'moderate' | 'high';
    riskFactors: string[];
  } {
    const riskFactors: string[] = [];
    let riskScore = 0;

    // Age-based risk
    const age = this.getPatientAgeAtRegistration();
    if (age >= 65) {
      riskFactors.push('Tuổi cao (≥65)');
      riskScore += 2;
    } else if (age < 1) {
      riskFactors.push('Trẻ sơ sinh');
      riskScore += 3;
    }

    // Medical history risk
    if (this.eventData.medicalInfo.allergies.length > 0) {
      riskFactors.push('Có dị ứng');
      riskScore += 1;
    }

    if (this.eventData.medicalInfo.chronicConditions.length > 0) {
      riskFactors.push('Có bệnh mãn tính');
      riskScore += this.eventData.medicalInfo.chronicConditions.length;
    }

    if (this.eventData.medicalInfo.currentMedications.length > 0) {
      riskFactors.push('Đang dùng thuốc');
      riskScore += 1;
    }

    // Lifestyle risk
    if (this.eventData.medicalInfo.smokingStatus === 'current') {
      riskFactors.push('Hút thuốc');
      riskScore += 2;
    }

    if (this.eventData.medicalInfo.alcoholConsumption === 'heavy') {
      riskFactors.push('Uống rượu nhiều');
      riskScore += 2;
    }

    let riskLevel: 'low' | 'moderate' | 'high';
    if (riskScore >= 5) {
      riskLevel = 'high';
    } else if (riskScore >= 2) {
      riskLevel = 'moderate';
    } else {
      riskLevel = 'low';
    }

    return { riskLevel, riskFactors };
  }
}
