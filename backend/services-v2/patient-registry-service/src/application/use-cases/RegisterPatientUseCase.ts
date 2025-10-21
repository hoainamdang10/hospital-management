/**
 * RegisterPatientUseCase - Application Use Case
 *
 * Handles patient registration with Vietnamese healthcare compliance
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards, HIPAA
 */

import { IPatientRepository } from '../../domain/repositories/IPatientRepository';
import { Patient } from '../../domain/aggregates/Patient';
import { PersonalInfo } from '../../domain/value-objects/PersonalInfo';
import { ContactInfo, Address } from '../../domain/value-objects/ContactInfo';
import { BasicMedicalInfo, BloodType } from '../../domain/value-objects/BasicMedicalInfo';
import { InsuranceInfo } from '../../domain/entities/InsuranceInfo';
import { EmergencyContact } from '../../domain/entities/EmergencyContact';
import { IEventBus } from '@shared/infrastructure/event-bus/EventBus';
import { ILogger } from '@shared/application/services/logger.interface';

export interface RegisterPatientRequest {
  userId: string;
  personalInfo: {
    fullName: string;
    dateOfBirth: string;  // ISO date string
    gender: 'male' | 'female' | 'other';
    nationalId: string;  // CMND/CCCD
    nationality: string;
    ethnicity?: string;
    occupation?: string;
    maritalStatus?: string;
  };
  contactInfo: {
    primaryPhone: string;
    secondaryPhone?: string;
    email?: string;
    preferredContactMethod: 'phone' | 'email' | 'sms';
    address: {
      street: string;
      ward: string;
      district: string;
      city: string;
      postalCode?: string;
      country: string;
    };
  };
  basicMedicalInfo?: {
    bloodType?: BloodType;
    knownAllergies?: string[];
    emergencyMedicalInfo?: string;
  };
  insuranceInfo?: {
    provider: string;
    policyNumber: string;
    groupNumber?: string;
    validFrom: string;  // ISO date string
    validTo: string;  // ISO date string
    coverageType: 'BHYT' | 'BHTN' | 'private' | 'self_pay';
    isVietnameseInsurance: boolean;
    bhytNumber?: string;
    isPrimary: boolean;
  };
  emergencyContacts: Array<{
    name: string;
    relationship: string;
    primaryPhone: string;
    secondaryPhone?: string;
    email?: string;
    address?: string;
    isPrimary: boolean;
  }>;
  requestedBy: string;
}

export interface RegisterPatientResponse {
  success: boolean;
  patientId?: string;
  message: string;
  errors?: string[];
}

export class RegisterPatientUseCase {
  constructor(
    private readonly patientRepository: IPatientRepository,
    private readonly eventBus: IEventBus,
    private readonly logger: ILogger
  ) {}

  async execute(request: RegisterPatientRequest): Promise<RegisterPatientResponse> {
    try {
      this.logger.info('Starting patient registration', {
        userId: request.userId,
        requestedBy: request.requestedBy
      });

      // 1. Validate user exists (should be done by caller or Identity Service)

      // 2. Check if patient already exists
      const existingPatient = await this.patientRepository.findByUserId(request.userId);
      if (existingPatient) {
        this.logger.warn('Patient registration failed: user already has profile', {
          userId: request.userId
        });
        return {
          success: false,
          message: 'Người dùng đã có hồ sơ bệnh nhân',
          errors: ['USER_ALREADY_HAS_PATIENT_PROFILE']
        };
      }

      // 3. Check if national ID already exists
      const existingByNationalId = await this.patientRepository.findByNationalId(
        request.personalInfo.nationalId
      );
      if (existingByNationalId) {
        return {
          success: false,
          message: 'CMND/CCCD đã tồn tại trong hệ thống',
          errors: ['NATIONAL_ID_ALREADY_EXISTS']
        };
      }

      // 4. Check if BHYT number already exists (if provided)
      if (request.insuranceInfo?.bhytNumber) {
        const existingByBHYT = await this.patientRepository.findByBHYTNumber(
          request.insuranceInfo.bhytNumber
        );
        if (existingByBHYT) {
          return {
            success: false,
            message: 'Số BHYT đã tồn tại trong hệ thống',
            errors: ['BHYT_NUMBER_ALREADY_EXISTS']
          };
        }
      }

      // 5. Create value objects
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
        primaryPhone: request.contactInfo.primaryPhone,
        secondaryPhone: request.contactInfo.secondaryPhone,
        email: request.contactInfo.email,
        preferredContactMethod: request.contactInfo.preferredContactMethod,
        address: request.contactInfo.address as Address
      });

      const basicMedicalInfo = request.basicMedicalInfo
        ? BasicMedicalInfo.create({
          bloodType: request.basicMedicalInfo.bloodType,
          knownAllergies: request.basicMedicalInfo.knownAllergies || [],
          emergencyMedicalInfo: request.basicMedicalInfo.emergencyMedicalInfo
        })
        : BasicMedicalInfo.createEmpty();

      // 6. Create insurance info entity (if provided)
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
          bhytNumber: request.insuranceInfo.bhytNumber,
          isPrimary: request.insuranceInfo.isPrimary,
          isActive: true
        });
      }

      // 7. Create emergency contact entities
      const emergencyContacts = request.emergencyContacts.map(contact =>
        EmergencyContact.create(
          contact.name,
          contact.relationship,
          contact.primaryPhone,
          contact.secondaryPhone,
          contact.email,
          contact.address,
          contact.isPrimary
        )
      );

      // 8. Register patient (create aggregate)
      const patient = Patient.register(
        request.userId,
        personalInfo,
        contactInfo,
        basicMedicalInfo,
        insuranceInfo,
        emergencyContacts,
        request.requestedBy
      );

      // 9. Save to repository
      await this.patientRepository.save(patient);

      // 10. Publish domain events
      await this.publishDomainEvents(patient);

      // 11. HIPAA audit logging
      await this.auditPatientRegistration(patient, request);

      this.logger.info('Patient registration completed successfully', {
        patientId: patient.getPatientId(),
        userId: request.userId,
        requestedBy: request.requestedBy
      });

      // 12. Return success response
      return {
        success: true,
        patientId: patient.getPatientId() || '',
        message: 'Đăng ký bệnh nhân thành công'
      };

    } catch (error) {
      // Handle validation errors
      if (error instanceof Error) {
        this.logger.error('Patient registration failed', {
          userId: request.userId,
          error: error.message,
          stack: error.stack
        });
        return {
          success: false,
          message: 'Đăng ký bệnh nhân thất bại',
          errors: ['REGISTRATION_FAILED', error.message]
        };
      }

      // Handle unexpected errors
      this.logger.error('Unexpected error during patient registration', {
        userId: request.userId,
        error: 'UNEXPECTED_ERROR'
      });
      return {
        success: false,
        message: 'Đã xảy ra lỗi không mong muốn',
        errors: ['UNEXPECTED_ERROR']
      };
    }
  }

  /**
   * Publish domain events
   */
  private async publishDomainEvents(patient: Patient): Promise<void> {
    try {
      const events = patient.getUncommittedEvents();

      for (const event of events) {
        await this.eventBus.publish(event);
      }

      patient.markEventsAsCommitted();
    } catch (error) {
      this.logger.warn('Event publishing failed, but patient was saved', {
        patientId: patient.getPatientId(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * HIPAA audit logging for patient registration
   */
  private async auditPatientRegistration(
    patient: Patient,
    request: RegisterPatientRequest
  ): Promise<void> {
    this.logger.info('HIPAA Audit: Patient registration', {
      action: 'PATIENT_REGISTRATION',
      patientId: patient.getPatientId(),
      userId: request.userId,
      requestedBy: request.requestedBy,
      timestamp: new Date().toISOString(),
      dataAccessed: 'patient_personal_info,patient_contact_info,patient_medical_info,insurance_info',
      complianceLevel: 'hipaa'
    });
  }
}

