/**
 * Get Patient Healthcare Info Query - CQRS Pattern
 * Query for retrieving patient healthcare information from read model
 * 
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance CQRS, Performance Optimization, HIPAA
 */

import { Query, ValidationResult, ValidationError } from '../../base/query';

export interface GetPatientHealthcareInfoQueryParams {
  patientId: string;
  includeFullMedicalHistory?: boolean;
  includeFHIRCompliance?: boolean;
  includeInsuranceDetails?: boolean;
  includeEmergencyContact?: boolean;
  includeAppointmentHistory?: boolean;
  accessReason?: string; // Required for HIPAA compliance
}

export interface PatientHealthcareInfoResult {
  // Basic patient information
  patientId: string;
  fullName: string;
  dateOfBirth: Date;
  age: number;
  gender: string;
  phoneNumber: string;
  email?: string;
  status: string;

  // Medical information
  bloodType?: string;
  allergies: string[];
  chronicConditions: string[];
  currentMedications: any[];
  medicalHistory?: string;

  // Healthcare metrics
  totalAppointments: number;
  completedAppointments: number;
  lastAppointmentDate?: Date;
  totalMedicalRecords: number;
  lastMedicalRecordDate?: Date;

  // FHIR compliance (if requested)
  fhirCompliance?: {
    score: number;
    lastValidated: Date;
    status: 'compliant' | 'non_compliant';
  };

  // Emergency contact (if requested)
  emergencyContact?: {
    fullName: string;
    relationship: string;
    phoneNumber: string;
    alternatePhoneNumber?: string;
    email?: string;
  };

  // Insurance information (if requested)
  insuranceInfo?: {
    provider: string;
    policyNumber: string;
    coverageType: string;
    isActive: boolean;
    expirationDate?: Date;
  };

  // Appointment history (if requested)
  appointmentHistory?: {
    upcoming: number;
    completed: number;
    cancelled: number;
    nextAppointmentDate?: Date;
  };

  // Audit information
  lastUpdated: Date;
  lastSyncAt: Date;
}

/**
 * Get Patient Healthcare Info Query
 * Retrieves comprehensive patient healthcare information
 */
export class GetPatientHealthcareInfoQuery extends Query<PatientHealthcareInfoResult> {
  private readonly params: GetPatientHealthcareInfoQueryParams;

  constructor(
    params: GetPatientHealthcareInfoQueryParams,
    userId?: string,
    correlationId?: string,
    metadata?: Record<string, any>
  ) {
    super('GetPatientHealthcareInfo', userId, correlationId, metadata);
    this.params = params;
  }

  /**
   * Validate query parameters
   */
  public async validate(): Promise<ValidationResult> {
    const errors: ValidationError[] = [];

    // Validate patient ID
    if (!this.params.patientId) {
      errors.push({
        field: 'patientId',
        message: 'Patient ID là bắt buộc',
        code: 'PATIENT_ID_REQUIRED'
      });
    } else if (!this.isValidPatientId(this.params.patientId)) {
      errors.push({
        field: 'patientId',
        message: 'Patient ID không hợp lệ',
        code: 'INVALID_PATIENT_ID'
      });
    }

    // Validate access reason for HIPAA compliance
    if (!this.params.accessReason) {
      errors.push({
        field: 'accessReason',
        message: 'Lý do truy cập dữ liệu y tế là bắt buộc để tuân thủ HIPAA',
        code: 'ACCESS_REASON_REQUIRED'
      });
    } else if (this.params.accessReason.trim().length < 10) {
      errors.push({
        field: 'accessReason',
        message: 'Lý do truy cập phải có ít nhất 10 ký tự',
        code: 'ACCESS_REASON_TOO_SHORT'
      });
    }

    // Validate user permissions (would check against actual permissions in real implementation)
    if (!this.userId) {
      errors.push({
        field: 'userId',
        message: 'User ID là bắt buộc để truy cập dữ liệu bệnh nhân',
        code: 'USER_ID_REQUIRED'
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate patient ID format
   */
  private isValidPatientId(patientId: string): boolean {
    // Patient ID format: PAT-YYYYMM-XXX
    const patientIdPattern = /^PAT-\d{6}-\d{3}$/;
    return patientIdPattern.test(patientId);
  }

  /**
   * Get query parameters
   */
  public getParameters(): GetPatientHealthcareInfoQueryParams {
    return this.params;
  }

  /**
   * Check if query accesses PHI
   */
  public accessesPHI(): boolean {
    return true; // Patient healthcare info always contains PHI
  }

  /**
   * Get patient ID
   */
  public getPatientId(): string {
    return this.params.patientId;
  }

  /**
   * Get query description
   */
  public getDescription(): string {
    return `Truy xuất thông tin y tế của bệnh nhân ${this.params.patientId}. Lý do: ${this.params.accessReason}`;
  }

  /**
   * Get cache key for result caching
   */
  public getCacheKey(): string {
    // Create cache key based on patient ID and requested data
    const keyParts = [
      'patient_healthcare',
      this.params.patientId,
      this.params.includeFullMedicalHistory ? 'full_history' : 'basic',
      this.params.includeFHIRCompliance ? 'fhir' : '',
      this.params.includeInsuranceDetails ? 'insurance' : '',
      this.params.includeEmergencyContact ? 'emergency' : '',
      this.params.includeAppointmentHistory ? 'appointments' : ''
    ].filter(part => part.length > 0);

    return keyParts.join('_');
  }

  /**
   * Get cache TTL (shorter for healthcare data)
   */
  public getCacheTTL(): number {
    // Healthcare data should have shorter cache TTL
    if (this.params.includeAppointmentHistory) {
      return 60; // 1 minute for appointment data
    }
    if (this.params.includeFHIRCompliance) {
      return 300; // 5 minutes for FHIR compliance data
    }
    return 180; // 3 minutes for general healthcare data
  }

  /**
   * Get patient ID from parameters
   */
  public getPatientIdFromParams(): string {
    return this.params.patientId;
  }

  /**
   * Get access reason
   */
  public getAccessReason(): string {
    return this.params.accessReason || '';
  }

  /**
   * Check if full medical history is requested
   */
  public includeFullMedicalHistory(): boolean {
    return this.params.includeFullMedicalHistory || false;
  }

  /**
   * Check if FHIR compliance is requested
   */
  public includeFHIRCompliance(): boolean {
    return this.params.includeFHIRCompliance || false;
  }

  /**
   * Check if insurance details are requested
   */
  public includeInsuranceDetails(): boolean {
    return this.params.includeInsuranceDetails || false;
  }

  /**
   * Check if emergency contact is requested
   */
  public includeEmergencyContact(): boolean {
    return this.params.includeEmergencyContact || false;
  }

  /**
   * Check if appointment history is requested
   */
  public includeAppointmentHistory(): boolean {
    return this.params.includeAppointmentHistory || false;
  }

  /**
   * Get data sensitivity level
   */
  public getDataSensitivityLevel(): 'basic' | 'sensitive' | 'highly_sensitive' {
    if (this.params.includeFullMedicalHistory || this.params.includeInsuranceDetails) {
      return 'highly_sensitive';
    }
    if (this.params.includeEmergencyContact || this.params.includeFHIRCompliance) {
      return 'sensitive';
    }
    return 'basic';
  }

  /**
   * Get required permissions for this query
   */
  public getRequiredPermissions(): string[] {
    const permissions: string[] = ['read_patient_basic_info'];

    if (this.params.includeFullMedicalHistory) {
      permissions.push('read_patient_medical_history');
    }
    if (this.params.includeInsuranceDetails) {
      permissions.push('read_patient_insurance');
    }
    if (this.params.includeEmergencyContact) {
      permissions.push('read_patient_emergency_contact');
    }
    if (this.params.includeFHIRCompliance) {
      permissions.push('read_patient_fhir_compliance');
    }
    if (this.params.includeAppointmentHistory) {
      permissions.push('read_patient_appointments');
    }

    return permissions;
  }

  /**
   * Get HIPAA audit information
   */
  public getHIPAAAuditInfo(): {
    accessReason: string;
    dataAccessed: string[];
    sensitivityLevel: string;
    requiresPatientNotification: boolean;
  } {
    const dataAccessed: string[] = ['basic_info'];

    if (this.params.includeFullMedicalHistory) dataAccessed.push('medical_history');
    if (this.params.includeInsuranceDetails) dataAccessed.push('insurance_info');
    if (this.params.includeEmergencyContact) dataAccessed.push('emergency_contact');
    if (this.params.includeFHIRCompliance) dataAccessed.push('fhir_compliance');
    if (this.params.includeAppointmentHistory) dataAccessed.push('appointment_history');

    return {
      accessReason: this.params.accessReason || '',
      dataAccessed,
      sensitivityLevel: this.getDataSensitivityLevel(),
      requiresPatientNotification: this.getDataSensitivityLevel() === 'highly_sensitive',
    };
  }
}
