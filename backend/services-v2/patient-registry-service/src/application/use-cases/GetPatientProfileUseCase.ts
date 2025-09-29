/**
 * GetPatientProfileUseCase - Application Use Case
 * V2 Clean Architecture + DDD Implementation
 * Retrieves patient profile with authorization and HIPAA compliance
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards, HIPAA
 */

import { BaseHealthcareUseCase } from '../../../../shared/application/base/base-healthcare-use-case';
import { IPatientRepository } from '../../domain/repositories/IPatientRepository';
import { Patient } from '../../domain/aggregates/Patient';
import { PatientId } from '../../domain/value-objects/PatientId';
import { ILogger } from '../../../../shared/infrastructure/logging/logger.interface';

export interface GetPatientProfileRequest {
  patientId?: string;
  userId?: string; // Alternative lookup by user ID
  requestedBy: string;
  requestedByRole: string;
  includeFullMedicalHistory?: boolean;
  includeSensitiveInfo?: boolean;
  requestMetadata?: {
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
  };
}

export interface GetPatientProfileResponse {
  success: boolean;
  message: string;
  errors?: string[];
  data?: {
    patient: {
      id: string;
      userId: string;
      personalInfo: {
        fullName: string;
        dateOfBirth: string;
        age: number;
        gender: string;
        nationalId?: string; // Only for authorized users
        nationality: string;
        ethnicity?: string;
        occupation?: string;
        maritalStatus?: string;
      };
      contactInfo: {
        phoneNumber?: string; // Masked for unauthorized users
        email?: string; // Masked for unauthorized users
        address: {
          street?: string;
          ward?: string;
          district?: string;
          city: string;
          province: string;
          country: string;
        };
      };
      medicalInfo?: {
        bloodType?: string;
        allergies?: string[];
        chronicConditions?: string[];
        currentMedications?: string[];
        emergencyMedicalInfo?: string;
      };
      insuranceInfo?: {
        provider: string;
        policyNumber?: string; // Masked
        coverageType: string;
        isActive: boolean;
        isVietnameseInsurance: boolean;
        bhytNumber?: string; // Masked
      };
      emergencyContacts?: Array<{
        name: string;
        relationship: string;
        phoneNumber?: string; // Masked for unauthorized users
        email?: string;
      }>;
      registrationInfo: {
        registrationDate: string;
        lastVisitDate?: string;
        isActive: boolean;
      };
      statistics?: {
        totalVisits: number;
        activeConsents: number;
        medicalHistoryCount: number;
      };
    };
  };
}

/**
 * Get Patient Profile Use Case
 * Retrieves patient profile with proper authorization and data masking
 */
export class GetPatientProfileUseCase extends BaseHealthcareUseCase<GetPatientProfileRequest, GetPatientProfileResponse> {
  constructor(
    private readonly patientRepository: IPatientRepository,
    private readonly logger: ILogger
  ) {
    super();
  }

  /**
   * Execute get patient profile
   */
  protected async executeImpl(request: GetPatientProfileRequest): Promise<GetPatientProfileResponse> {
    try {
      this.logger.info('Getting patient profile', {
        patientId: request.patientId,
        userId: request.userId,
        requestedBy: request.requestedBy,
        requestedByRole: request.requestedByRole
      });

      // 1. Validate request
      const validationResult = this.validateRequest(request);
      if (!validationResult.isValid) {
        return {
          success: false,
          message: 'Yêu cầu không hợp lệ',
          errors: validationResult.errors
        };
      }

      // 2. Find patient
      let patient: Patient | null = null;
      
      if (request.patientId) {
        const patientId = PatientId.fromString(request.patientId);
        patient = await this.patientRepository.findById(patientId);
      } else if (request.userId) {
        patient = await this.patientRepository.findByUserId(request.userId);
      }

      if (!patient) {
        return {
          success: false,
          message: 'Không tìm thấy thông tin bệnh nhân'
        };
      }

      // 3. Check authorization
      const authResult = this.checkAuthorization(patient, request);
      if (!authResult.authorized) {
        this.logger.warn('Unauthorized patient profile access attempt', {
          patientId: patient.id.value,
          requestedBy: request.requestedBy,
          requestedByRole: request.requestedByRole,
          reason: authResult.reason
        });

        return {
          success: false,
          message: 'Không có quyền truy cập thông tin bệnh nhân này'
        };
      }

      // 4. Prepare response data with appropriate masking
      const responseData = this.preparePatientData(patient, request, authResult.accessLevel);

      // 5. HIPAA audit logging
      await this.auditPatientAccess(patient, request, authResult.accessLevel);

      this.logger.info('Patient profile retrieved successfully', {
        patientId: patient.id.value,
        requestedBy: request.requestedBy,
        accessLevel: authResult.accessLevel
      });

      return {
        success: true,
        message: 'Lấy thông tin bệnh nhân thành công',
        data: {
          patient: responseData
        }
      };

    } catch (error) {
      this.logger.error('Error getting patient profile', {
        patientId: request.patientId,
        userId: request.userId,
        requestedBy: request.requestedBy,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        message: 'Lỗi hệ thống khi lấy thông tin bệnh nhân'
      };
    }
  }

  /**
   * Validate request
   */
  private validateRequest(request: GetPatientProfileRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Must have either patientId or userId
    if (!request.patientId && !request.userId) {
      errors.push('Phải cung cấp ID bệnh nhân hoặc ID người dùng');
    }

    // Requested by validation
    if (!request.requestedBy || request.requestedBy.trim().length === 0) {
      errors.push('Thông tin người yêu cầu không được để trống');
    }

    // Role validation
    if (!request.requestedByRole || request.requestedByRole.trim().length === 0) {
      errors.push('Vai trò người yêu cầu không được để trống');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Check authorization for patient data access
   */
  private checkAuthorization(patient: Patient, request: GetPatientProfileRequest): {
    authorized: boolean;
    accessLevel: 'full' | 'limited' | 'basic';
    reason?: string;
  } {
    const { requestedBy, requestedByRole } = request;

    // Patient can access their own data
    if (patient.userId === requestedBy) {
      return { authorized: true, accessLevel: 'full' };
    }

    // Admin has full access
    if (requestedByRole === 'admin') {
      return { authorized: true, accessLevel: 'full' };
    }

    // Doctor has full access to their patients
    if (requestedByRole === 'doctor') {
      // In a real implementation, check if doctor is assigned to this patient
      return { authorized: true, accessLevel: 'full' };
    }

    // Nurse has limited access
    if (requestedByRole === 'nurse') {
      return { authorized: true, accessLevel: 'limited' };
    }

    // Receptionist has basic access
    if (requestedByRole === 'receptionist') {
      return { authorized: true, accessLevel: 'basic' };
    }

    // Default: no access
    return { 
      authorized: false, 
      reason: `Role ${requestedByRole} not authorized for patient data access` 
    };
  }

  /**
   * Prepare patient data with appropriate masking based on access level
   */
  private preparePatientData(patient: Patient, request: GetPatientProfileRequest, accessLevel: string): any {
    const baseData = {
      id: patient.id.value,
      userId: patient.userId,
      personalInfo: {
        fullName: patient.personalInfo.fullName,
        dateOfBirth: patient.personalInfo.dateOfBirth.toISOString().split('T')[0],
        age: patient.getAge(),
        gender: patient.personalInfo.gender,
        nationality: patient.personalInfo.nationality,
        ethnicity: patient.personalInfo.ethnicity,
        occupation: patient.personalInfo.occupation,
        maritalStatus: patient.personalInfo.maritalStatus
      },
      contactInfo: {
        address: {
          city: patient.contactInfo.address.city,
          province: patient.contactInfo.address.province,
          country: patient.contactInfo.address.country
        }
      },
      registrationInfo: {
        registrationDate: patient.registrationDate.toISOString(),
        lastVisitDate: patient.lastVisitDate?.toISOString(),
        isActive: patient.isActive
      }
    };

    // Add sensitive data based on access level
    if (accessLevel === 'full') {
      return {
        ...baseData,
        personalInfo: {
          ...baseData.personalInfo,
          nationalId: patient.personalInfo.nationalId
        },
        contactInfo: {
          ...baseData.contactInfo,
          phoneNumber: patient.contactInfo.phoneNumber,
          email: patient.contactInfo.email,
          address: {
            ...baseData.contactInfo.address,
            street: patient.contactInfo.address.street,
            ward: patient.contactInfo.address.ward,
            district: patient.contactInfo.address.district,
            postalCode: patient.contactInfo.address.postalCode
          }
        },
        medicalInfo: request.includeFullMedicalHistory ? {
          bloodType: patient.medicalInfo.bloodType,
          allergies: patient.medicalInfo.allergies,
          chronicConditions: patient.medicalInfo.chronicConditions,
          currentMedications: patient.medicalInfo.currentMedications,
          emergencyMedicalInfo: patient.medicalInfo.emergencyMedicalInfo
        } : undefined,
        insuranceInfo: patient.insuranceInfo ? {
          provider: patient.insuranceInfo.provider,
          policyNumber: this.maskString(patient.insuranceInfo.policyNumber),
          coverageType: patient.insuranceInfo.coverageType,
          isActive: patient.insuranceInfo.isActive(),
          isVietnameseInsurance: patient.insuranceInfo.isVietnameseInsurance(),
          bhytNumber: patient.insuranceInfo.bhytNumber ? this.maskString(patient.insuranceInfo.bhytNumber) : undefined
        } : undefined,
        emergencyContacts: patient.emergencyContacts.map(contact => ({
          name: contact.name,
          relationship: contact.relationship,
          phoneNumber: contact.phoneNumber,
          email: contact.email
        })),
        statistics: {
          totalVisits: patient.getTotalVisits(),
          activeConsents: patient.getActiveConsents().length,
          medicalHistoryCount: patient.medicalHistory.length
        }
      };
    }

    if (accessLevel === 'limited') {
      return {
        ...baseData,
        contactInfo: {
          ...baseData.contactInfo,
          phoneNumber: this.maskPhoneNumber(patient.contactInfo.phoneNumber),
          email: this.maskEmail(patient.contactInfo.email)
        },
        emergencyContacts: patient.emergencyContacts.map(contact => ({
          name: contact.name,
          relationship: contact.relationship,
          phoneNumber: this.maskPhoneNumber(contact.phoneNumber)
        }))
      };
    }

    // Basic access level
    return baseData;
  }

  /**
   * Mask sensitive string data
   */
  private maskString(value: string, visibleChars: number = 4): string {
    if (!value || value.length <= visibleChars) return '***';
    return value.substring(0, visibleChars) + '*'.repeat(value.length - visibleChars);
  }

  /**
   * Mask phone number
   */
  private maskPhoneNumber(phoneNumber?: string): string {
    if (!phoneNumber) return '';
    return phoneNumber.substring(0, 3) + '***' + phoneNumber.substring(phoneNumber.length - 2);
  }

  /**
   * Mask email address
   */
  private maskEmail(email?: string): string {
    if (!email) return '';
    const [username, domain] = email.split('@');
    return username.substring(0, 2) + '***@' + domain;
  }

  /**
   * HIPAA audit logging for patient access
   */
  private async auditPatientAccess(patient: Patient, request: GetPatientProfileRequest, accessLevel: string): Promise<void> {
    this.logger.info('HIPAA Audit: Patient profile access', {
      action: 'PATIENT_PROFILE_ACCESS',
      patientId: patient.id.value,
      requestedBy: request.requestedBy,
      requestedByRole: request.requestedByRole,
      accessLevel,
      timestamp: new Date().toISOString(),
      ipAddress: request.requestMetadata?.ipAddress,
      userAgent: request.requestMetadata?.userAgent,
      sessionId: request.requestMetadata?.sessionId,
      dataAccessed: this.getDataAccessedList(accessLevel, request),
      complianceLevel: 'hipaa'
    });
  }

  /**
   * Get list of data accessed for audit
   */
  private getDataAccessedList(accessLevel: string, request: GetPatientProfileRequest): string {
    const baseData = ['patient_basic_info', 'registration_info'];
    
    if (accessLevel === 'full') {
      baseData.push('patient_personal_info', 'patient_contact_info', 'emergency_contacts');
      if (request.includeFullMedicalHistory) {
        baseData.push('patient_medical_info', 'medical_history');
      }
      if (request.includeSensitiveInfo) {
        baseData.push('insurance_info', 'sensitive_personal_data');
      }
    } else if (accessLevel === 'limited') {
      baseData.push('masked_contact_info', 'emergency_contacts_limited');
    }
    
    return baseData.join(',');
  }
}
