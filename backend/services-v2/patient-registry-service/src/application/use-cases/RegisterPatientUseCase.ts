/**
 * RegisterPatientUseCase - Application Use Case
 * V2 Clean Architecture + DDD Implementation
 * Handles patient registration with Vietnamese healthcare compliance
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards, HIPAA
 */

import { BaseHealthcareUseCase } from '../../../../shared/application/base/base-healthcare-use-case';
import { IPatientRepository } from '../../domain/repositories/IPatientRepository';
import { Patient } from '../../domain/aggregates/Patient';
import { PersonalInfo } from '../../domain/value-objects/PersonalInfo';
import { ContactInfo } from '../../domain/value-objects/ContactInfo';
import { MedicalInfo } from '../../domain/value-objects/MedicalInfo';
import { InsuranceInfo } from '../../domain/entities/InsuranceInfo';
import { IEventBus } from '../../../../shared/events/event-bus.interface';
import { ILogger } from '../../../../shared/infrastructure/logging/logger.interface';

export interface RegisterPatientRequest {
  userId: string;
  personalInfo: {
    fullName: string;
    dateOfBirth: string;
    gender: 'male' | 'female' | 'other';
    nationalId: string; // CMND/CCCD
    nationality: string;
    ethnicity?: string;
    occupation?: string;
    maritalStatus?: string;
  };
  contactInfo: {
    phoneNumber: string;
    email?: string;
    address: {
      street: string;
      ward: string;
      district: string;
      city: string;
      province: string;
      postalCode?: string;
      country: string;
    };
  };
  medicalInfo: {
    bloodType?: string;
    allergies?: string[];
    chronicConditions?: string[];
    currentMedications?: string[];
    emergencyMedicalInfo?: string;
  };
  insuranceInfo?: {
    provider: string;
    policyNumber: string;
    groupNumber?: string;
    validFrom: string;
    validTo: string;
    coverageType: string;
    isVietnameseInsurance: boolean;
    bhytNumber?: string; // Vietnamese social health insurance
  };
  emergencyContacts: Array<{
    name: string;
    relationship: string;
    phoneNumber: string;
    email?: string;
    address?: string;
  }>;
  requestedBy: string;
  requestMetadata?: {
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
  };
}

export interface RegisterPatientResponse {
  success: boolean;
  patientId?: string;
  message: string;
  errors?: string[];
  data?: {
    patient: {
      id: string;
      userId: string;
      fullName: string;
      registrationDate: string;
      isActive: boolean;
    };
  };
}

/**
 * Register Patient Use Case
 * Handles complete patient registration process with Vietnamese healthcare compliance
 */
export class RegisterPatientUseCase extends BaseHealthcareUseCase<RegisterPatientRequest, RegisterPatientResponse> {
  constructor(
    private readonly patientRepository: IPatientRepository,
    private readonly eventBus: IEventBus,
    private readonly logger: ILogger
  ) {
    super();
  }

  /**
   * Execute patient registration
   */
  protected async executeImpl(request: RegisterPatientRequest): Promise<RegisterPatientResponse> {
    try {
      this.logger.info('Starting patient registration', {
        userId: request.userId,
        requestedBy: request.requestedBy
      });

      // 1. Validate request
      const validationResult = await this.validateRequest(request);
      if (!validationResult.isValid) {
        return {
          success: false,
          message: 'Dữ liệu đăng ký không hợp lệ',
          errors: validationResult.errors
        };
      }

      // 2. Check if patient already exists for this user
      const existingPatient = await this.patientRepository.findByUserId(request.userId);
      if (existingPatient) {
        return {
          success: false,
          message: 'Bệnh nhân đã được đăng ký cho tài khoản này'
        };
      }

      // 3. Check for duplicate national ID
      const duplicatePatient = await this.patientRepository.findByNationalId(request.personalInfo.nationalId);
      if (duplicatePatient) {
        return {
          success: false,
          message: 'CMND/CCCD đã được sử dụng cho bệnh nhân khác'
        };
      }

      // 4. Create value objects
      const personalInfo = PersonalInfo.create({
        fullName: request.personalInfo.fullName,
        dateOfBirth: new Date(request.personalInfo.dateOfBirth),
        gender: request.personalInfo.gender,
        nationalId: request.personalInfo.nationalId,
        nationality: request.personalInfo.nationality,
        ethnicity: request.personalInfo.ethnicity,
        occupation: request.personalInfo.occupation,
        maritalStatus: request.personalInfo.maritalStatus
      });

      const contactInfo = ContactInfo.create({
        phoneNumber: request.contactInfo.phoneNumber,
        email: request.contactInfo.email,
        address: request.contactInfo.address
      });

      const medicalInfo = MedicalInfo.create({
        bloodType: request.medicalInfo.bloodType,
        allergies: request.medicalInfo.allergies || [],
        chronicConditions: request.medicalInfo.chronicConditions || [],
        currentMedications: request.medicalInfo.currentMedications || [],
        emergencyMedicalInfo: request.medicalInfo.emergencyMedicalInfo
      });

      // 5. Create insurance info if provided
      let insuranceInfo: InsuranceInfo | undefined;
      if (request.insuranceInfo) {
        insuranceInfo = InsuranceInfo.create({
          provider: request.insuranceInfo.provider,
          policyNumber: request.insuranceInfo.policyNumber,
          groupNumber: request.insuranceInfo.groupNumber,
          validFrom: new Date(request.insuranceInfo.validFrom),
          validTo: new Date(request.insuranceInfo.validTo),
          coverageType: request.insuranceInfo.coverageType,
          isVietnameseInsurance: request.insuranceInfo.isVietnameseInsurance,
          bhytNumber: request.insuranceInfo.bhytNumber
        });
      }

      // 6. Create patient aggregate
      const patient = Patient.create(
        request.userId,
        personalInfo,
        contactInfo,
        medicalInfo,
        insuranceInfo
      );

      // 7. Add emergency contacts
      for (const contact of request.emergencyContacts) {
        patient.addEmergencyContact(
          contact.name,
          contact.relationship,
          contact.phoneNumber,
          contact.email,
          contact.address
        );
      }

      // 8. Vietnamese healthcare compliance validation
      if (!patient.isVietnameseHealthcareCompliant()) {
        return {
          success: false,
          message: 'Thông tin bệnh nhân không đáp ứng tiêu chuẩn y tế Việt Nam'
        };
      }

      // 9. HIPAA compliance validation
      if (!patient.isHIPAACompliant()) {
        this.logger.warn('Patient registration lacks HIPAA compliance', {
          patientId: patient.id.value,
          userId: request.userId
        });
      }

      // 10. Save patient
      await this.patientRepository.save(patient);

      // 11. Publish domain events
      await this.publishDomainEvents(patient);

      // 12. HIPAA audit logging
      await this.auditPatientRegistration(patient, request);

      this.logger.info('Patient registration completed successfully', {
        patientId: patient.id.value,
        userId: request.userId,
        requestedBy: request.requestedBy
      });

      return {
        success: true,
        patientId: patient.id.value,
        message: 'Đăng ký bệnh nhân thành công',
        data: {
          patient: {
            id: patient.id.value,
            userId: patient.userId,
            fullName: patient.personalInfo.fullName,
            registrationDate: patient.registrationDate.toISOString(),
            isActive: patient.isActive
          }
        }
      };

    } catch (error) {
      this.logger.error('Error during patient registration', {
        userId: request.userId,
        requestedBy: request.requestedBy,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        message: 'Lỗi hệ thống khi đăng ký bệnh nhân'
      };
    }
  }

  /**
   * Validate registration request
   */
  private async validateRequest(request: RegisterPatientRequest): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // User ID validation
    if (!request.userId || request.userId.trim().length === 0) {
      errors.push('ID người dùng không được để trống');
    }

    // Personal info validation
    if (!request.personalInfo.fullName || request.personalInfo.fullName.trim().length === 0) {
      errors.push('Họ tên không được để trống');
    }

    if (!request.personalInfo.dateOfBirth) {
      errors.push('Ngày sinh không được để trống');
    } else {
      const birthDate = new Date(request.personalInfo.dateOfBirth);
      const today = new Date();
      if (birthDate >= today) {
        errors.push('Ngày sinh phải trước ngày hiện tại');
      }
      if (today.getFullYear() - birthDate.getFullYear() > 150) {
        errors.push('Tuổi không hợp lệ');
      }
    }

    if (!request.personalInfo.nationalId || request.personalInfo.nationalId.trim().length === 0) {
      errors.push('CMND/CCCD không được để trống');
    }

    // Contact info validation
    if (!request.contactInfo.phoneNumber || request.contactInfo.phoneNumber.trim().length === 0) {
      errors.push('Số điện thoại không được để trống');
    }

    if (!request.contactInfo.address.street || request.contactInfo.address.street.trim().length === 0) {
      errors.push('Địa chỉ không được để trống');
    }

    // Emergency contacts validation
    if (!request.emergencyContacts || request.emergencyContacts.length === 0) {
      errors.push('Phải có ít nhất một liên hệ khẩn cấp');
    }

    // Requested by validation
    if (!request.requestedBy || request.requestedBy.trim().length === 0) {
      errors.push('Thông tin người yêu cầu không được để trống');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Publish domain events
   */
  private async publishDomainEvents(patient: Patient): Promise<void> {
    const events = patient.getUncommittedEvents();
    
    for (const event of events) {
      await this.eventBus.publish(event);
    }
    
    patient.markEventsAsCommitted();
  }

  /**
   * HIPAA audit logging for patient registration
   */
  private async auditPatientRegistration(patient: Patient, request: RegisterPatientRequest): Promise<void> {
    // This would integrate with audit service
    this.logger.info('HIPAA Audit: Patient registration', {
      action: 'PATIENT_REGISTRATION',
      patientId: patient.id.value,
      userId: request.userId,
      requestedBy: request.requestedBy,
      timestamp: new Date().toISOString(),
      ipAddress: request.requestMetadata?.ipAddress,
      userAgent: request.requestMetadata?.userAgent,
      sessionId: request.requestMetadata?.sessionId,
      dataAccessed: 'patient_personal_info,patient_contact_info,patient_medical_info',
      complianceLevel: 'hipaa'
    });
  }
}
