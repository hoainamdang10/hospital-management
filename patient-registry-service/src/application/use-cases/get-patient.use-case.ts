/**
 * Get Patient Use Case - Application Layer (Query Side)
 * CQRS Query implementation with healthcare compliance
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS, HIPAA, FHIR R4
 */

import { BaseHealthcareUseCase, ValidationResult, ValidationError } from '../../../shared/application/use-cases/base/use-case.interface';
import { Patient } from '../../domain/aggregates/patient.aggregate';
import { PatientId } from '../../domain/value-objects/patient-id';
import { IPatientRepository } from '../../domain/repositories/patient.repository';

export interface GetPatientRequest {
  patientId?: string;
  nationalId?: string;
  phone?: string;
  email?: string;
  includeInactive?: boolean;
  includeMedicalInfo?: boolean;
  includeInsuranceInfo?: boolean;
  anonymize?: boolean;
  userId: string;
  reason?: string; // Reason for accessing patient data (HIPAA requirement)
}

export interface PatientSummary {
  patientId: string;
  fullName: string;
  dateOfBirth: string;
  age: number;
  gender: string;
  phone?: string;
  email?: string;
  status: string;
  registrationDate: string;
  lastVisitDate?: string;
  fhirComplianceScore: number;
  hasValidInsurance: boolean;
  isPediatric: boolean;
  isElderly: boolean;
}

export interface DetailedPatientInfo extends PatientSummary {
  personalInfo: {
    fullName: string;
    dateOfBirth: string;
    age: number;
    ageGroup: string;
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
      formatted: string;
    };
    emergencyContact?: {
      name: string;
      relationship: string;
      phone: string;
      email?: string;
      address?: string;
    };
  };
  medicalInfo?: {
    bloodType?: string;
    allergies: string[];
    chronicConditions: string[];
    currentMedications: Array<{
      name: string;
      dosage: string;
      frequency: string;
      prescribedBy?: string;
      startDate?: string;
    }>;
    familyHistory?: string[];
    surgicalHistory?: string[];
  };
  insuranceInfo?: {
    provider: string;
    policyNumber: string;
    subscriberName: string;
    relationshipToSubscriber: string;
    effectiveDate: string;
    expirationDate?: string;
    isValid: boolean;
    daysUntilExpiration?: number;
  };
  registrationInfo: {
    registrationDate: string;
    registrationSource: string;
    registeredBy: string;
    lastVisitDate?: string;
    notes?: string;
    preferredLanguage: string;
    consentToTreatment: boolean;
    consentToDataSharing: boolean;
  };
  complianceInfo: {
    fhirComplianceScore: number;
    missingFields: string[];
    recommendations: string[];
  };
}

export interface GetPatientResponse {
  success: boolean;
  patient?: DetailedPatientInfo;
  summary?: PatientSummary;
  message: string;
  accessLogged: boolean;
}

/**
 * Get Patient Use Case (Query Side of CQRS)
 * Handles patient data retrieval with proper authorization and audit logging
 */
export class GetPatientUseCase extends BaseHealthcareUseCase<GetPatientRequest, GetPatientResponse> {
  constructor(
    private readonly patientRepository: IPatientRepository
  ) {
    super();
  }

  /**
   * Execute patient retrieval
   */
  protected async executeInternal(request: GetPatientRequest): Promise<GetPatientResponse> {
    // 1. Find patient by provided criteria
    const patient = await this.findPatient(request);

    if (!patient) {
      return {
        success: false,
        message: 'Không tìm thấy bệnh nhân với thông tin đã cung cấp',
        accessLogged: false
      };
    }

    // 2. Check if patient is active (unless explicitly including inactive)
    if (!request.includeInactive && !patient.isActive()) {
      return {
        success: false,
        message: `Bệnh nhân có trạng thái: ${patient.status}. Không thể truy cập thông tin.`,
        accessLogged: false
      };
    }

    // 3. Log access for HIPAA compliance
    await this.logPatientAccess(patient, request);

    // 4. Prepare response based on request parameters
    if (request.anonymize) {
      return {
        success: true,
        summary: this.createAnonymizedSummary(patient),
        message: 'Thông tin bệnh nhân (đã ẩn danh)',
        accessLogged: true
      };
    }

    const detailedInfo = this.createDetailedPatientInfo(patient, request);

    return {
      success: true,
      patient: detailedInfo,
      summary: this.createPatientSummary(patient),
      message: 'Lấy thông tin bệnh nhân thành công',
      accessLogged: true
    };
  }

  /**
   * Validate request
   */
  async validate(request: GetPatientRequest): Promise<ValidationResult> {
    const errors: ValidationError[] = [];

    // Must have at least one search criteria
    if (!request.patientId && !request.nationalId && !request.phone && !request.email) {
      errors.push({
        field: 'searchCriteria',
        message: 'Phải cung cấp ít nhất một tiêu chí tìm kiếm (mã bệnh nhân, CCCD, điện thoại, hoặc email)',
        code: 'SEARCH_CRITERIA_REQUIRED',
        severity: 'error'
      });
    }

    // Validate patient ID format if provided
    if (request.patientId) {
      try {
        PatientId.fromString(request.patientId);
      } catch (error) {
        errors.push({
          field: 'patientId',
          message: 'Mã bệnh nhân không đúng định dạng',
          code: 'INVALID_PATIENT_ID_FORMAT',
          severity: 'error'
        });
      }
    }

    // Validate user context
    if (!request.userId) {
      errors.push({
        field: 'userId',
        message: 'Thông tin người truy cập là bắt buộc',
        code: 'USER_ID_REQUIRED',
        severity: 'error'
      });
    }

    // HIPAA requirement: reason for access
    if (!request.reason && !request.anonymize) {
      errors.push({
        field: 'reason',
        message: 'Phải cung cấp lý do truy cập thông tin bệnh nhân (yêu cầu HIPAA)',
        code: 'ACCESS_REASON_REQUIRED',
        severity: 'warning'
      });
    }

    return {
      isValid: errors.filter(e => e.severity === 'error').length === 0,
      errors
    };
  }

  /**
   * Check authorization
   */
  async authorize(request: GetPatientRequest, userId: string): Promise<boolean> {
    // Check if user has permission to view patient data
    // This would typically check against user roles/permissions
    // For now, assume all authenticated users can view patients
    return userId === request.userId;
  }

  /**
   * Check if involves PHI
   */
  involvesPHI(request: GetPatientRequest): boolean {
    return !request.anonymize; // Only anonymized requests don't involve PHI
  }

  /**
   * Get patient ID from request
   */
  getPatientId(request: GetPatientRequest): string | null {
    return request.patientId || null;
  }

  /**
   * Private helper methods
   */

  private async findPatient(request: GetPatientRequest): Promise<Patient | null> {
    if (request.patientId) {
      return await this.patientRepository.findById(request.patientId);
    }

    if (request.nationalId) {
      return await this.patientRepository.findByNationalId(request.nationalId);
    }

    if (request.email) {
      return await this.patientRepository.findByEmail(request.email);
    }

    if (request.phone) {
      const patients = await this.patientRepository.findByPhone(request.phone);
      return patients.length > 0 ? patients[0] : null;
    }

    return null;
  }

  private async logPatientAccess(patient: Patient, request: GetPatientRequest): Promise<void> {
    // Log patient data access for HIPAA compliance
    // This would typically write to an audit log
    console.log(`HIPAA Audit: User ${request.userId} accessed patient ${patient.patientId.value} - Reason: ${request.reason || 'Not specified'}`);
    
    // In a real implementation, this would:
    // 1. Write to audit log table
    // 2. Include timestamp, user ID, patient ID, access reason, IP address
    // 3. Track what data was accessed (summary vs detailed)
    // 4. Monitor for unusual access patterns
  }

  private createPatientSummary(patient: Patient): PatientSummary {
    return {
      patientId: patient.patientId.value,
      fullName: patient.personalInfo.fullName,
      dateOfBirth: patient.personalInfo.dateOfBirth.toISOString().split('T')[0],
      age: patient.personalInfo.age,
      gender: patient.personalInfo.gender,
      phone: patient.contactInfo.phone,
      email: patient.contactInfo.email,
      status: patient.status,
      registrationDate: patient.registrationDate.toISOString().split('T')[0],
      lastVisitDate: patient.lastVisitDate?.toISOString().split('T')[0],
      fhirComplianceScore: patient.fhirComplianceScore,
      hasValidInsurance: patient.hasValidInsurance(),
      isPediatric: patient.isPediatric(),
      isElderly: patient.isElderly()
    };
  }

  private createAnonymizedSummary(patient: Patient): PatientSummary {
    const anonymizedPersonal = patient.personalInfo.anonymize();
    const anonymizedContact = patient.contactInfo.anonymize();

    return {
      patientId: patient.patientId.anonymize().value || 'PAT-******-***',
      fullName: anonymizedPersonal.fullName || 'Ẩn danh',
      dateOfBirth: anonymizedPersonal.dateOfBirth?.toISOString().split('T')[0] || '',
      age: patient.personalInfo.age,
      gender: patient.personalInfo.gender,
      phone: anonymizedContact.phone,
      email: anonymizedContact.email,
      status: patient.status,
      registrationDate: patient.registrationDate.toISOString().split('T')[0],
      lastVisitDate: patient.lastVisitDate?.toISOString().split('T')[0],
      fhirComplianceScore: patient.fhirComplianceScore,
      hasValidInsurance: patient.hasValidInsurance(),
      isPediatric: patient.isPediatric(),
      isElderly: patient.isElderly()
    };
  }

  private createDetailedPatientInfo(patient: Patient, request: GetPatientRequest): DetailedPatientInfo {
    const summary = this.createPatientSummary(patient);

    const detailedInfo: DetailedPatientInfo = {
      ...summary,
      personalInfo: {
        fullName: patient.personalInfo.fullName,
        dateOfBirth: patient.personalInfo.dateOfBirth.toISOString().split('T')[0],
        age: patient.personalInfo.age,
        ageGroup: patient.personalInfo.ageGroup,
        gender: patient.personalInfo.gender,
        nationalId: patient.personalInfo.nationalId,
        ethnicity: patient.personalInfo.ethnicity,
        religion: patient.personalInfo.religion,
        occupation: patient.personalInfo.occupation,
        maritalStatus: patient.personalInfo.maritalStatus
      },
      contactInfo: {
        phone: patient.contactInfo.phone,
        email: patient.contactInfo.email,
        address: patient.contactInfo.address ? {
          ...patient.contactInfo.address,
          formatted: patient.contactInfo.formattedAddress
        } : undefined,
        emergencyContact: patient.contactInfo.emergencyContact
      },
      registrationInfo: {
        registrationDate: patient.registrationDate.toISOString().split('T')[0],
        registrationSource: patient.registrationSource,
        registeredBy: patient.registeredBy,
        lastVisitDate: patient.lastVisitDate?.toISOString().split('T')[0],
        notes: patient.notes,
        preferredLanguage: patient.preferredLanguage,
        consentToTreatment: patient.consentToTreatment,
        consentToDataSharing: patient.consentToDataSharing
      },
      complianceInfo: {
        fhirComplianceScore: patient.fhirComplianceScore,
        missingFields: this.calculateMissingFHIRFields(patient),
        recommendations: this.generateFHIRRecommendations(patient)
      }
    };

    // Include medical info if requested and authorized
    if (request.includeMedicalInfo && patient.medicalInfo) {
      detailedInfo.medicalInfo = {
        bloodType: patient.medicalInfo.bloodType,
        allergies: patient.medicalInfo.allergies,
        chronicConditions: patient.medicalInfo.chronicConditions,
        currentMedications: patient.medicalInfo.currentMedications.map(med => ({
          name: med.name,
          dosage: med.dosage,
          frequency: med.frequency,
          prescribedBy: med.prescribedBy,
          startDate: med.startDate?.toISOString().split('T')[0]
        })),
        familyHistory: patient.medicalInfo.familyHistory,
        surgicalHistory: patient.medicalInfo.surgicalHistory
      };
    }

    // Include insurance info if requested and authorized
    if (request.includeInsuranceInfo && patient.insuranceInfo) {
      const daysUntilExpiration = patient.insuranceInfo.expirationDate
        ? Math.ceil((patient.insuranceInfo.expirationDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        : undefined;

      detailedInfo.insuranceInfo = {
        provider: patient.insuranceInfo.provider,
        policyNumber: patient.insuranceInfo.policyNumber,
        subscriberName: patient.insuranceInfo.subscriberName,
        relationshipToSubscriber: patient.insuranceInfo.relationshipToSubscriber,
        effectiveDate: patient.insuranceInfo.effectiveDate.toISOString().split('T')[0],
        expirationDate: patient.insuranceInfo.expirationDate?.toISOString().split('T')[0],
        isValid: patient.hasValidInsurance(),
        daysUntilExpiration
      };
    }

    return detailedInfo;
  }

  private calculateMissingFHIRFields(patient: Patient): string[] {
    const missingFields: string[] = [];

    if (!patient.personalInfo.nationalId) missingFields.push('identifier');
    if (!patient.contactInfo.phone && !patient.contactInfo.email) missingFields.push('telecom');
    if (!patient.contactInfo.hasCompleteAddress) missingFields.push('address');
    if (!patient.contactInfo.emergencyContact) missingFields.push('contact');
    if (!patient.medicalInfo?.bloodType) missingFields.push('bloodType');
    if (!patient.medicalInfo?.allergies?.length) missingFields.push('allergies');
    if (!patient.insuranceInfo) missingFields.push('coverage');

    return missingFields;
  }

  private generateFHIRRecommendations(patient: Patient): string[] {
    const recommendations: string[] = [];

    if (patient.fhirComplianceScore < 85) {
      recommendations.push('Hoàn thiện thông tin để đạt điểm tuân thủ FHIR >= 85%');
    }

    if (!patient.personalInfo.nationalId) {
      recommendations.push('Cập nhật số CCCD/CMND');
    }

    if (!patient.contactInfo.emergencyContact) {
      recommendations.push('Thêm thông tin người liên hệ khẩn cấp');
    }

    if (!patient.hasValidInsurance()) {
      recommendations.push('Cập nhật thông tin bảo hiểm y tế');
    }

    if (!patient.medicalInfo?.bloodType) {
      recommendations.push('Xác định nhóm máu');
    }

    if (patient.isPediatric() && !patient.medicalInfo?.vaccinationHistory?.length) {
      recommendations.push('Cập nhật lịch sử tiêm chủng');
    }

    return recommendations;
  }
}
