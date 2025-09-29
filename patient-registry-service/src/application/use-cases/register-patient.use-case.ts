/**
 * Register Patient Use Case - Application Layer
 * Complete patient registration workflow with healthcare compliance
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, HIPAA, FHIR R4, Vietnamese Healthcare
 */

import { BaseHealthcareUseCase, ValidationResult, ValidationError } from '../../../shared/application/use-cases/base/use-case.interface';
import { Patient, PatientStatus, RegistrationSource, InsuranceInfo, MedicalInfo } from '../../domain/aggregates/patient.aggregate';
import { PersonalInfo, Gender, MaritalStatus } from '../../domain/value-objects/personal-info';
import { ContactInfo, Address, EmergencyContact } from '../../domain/value-objects/contact-info';
import { IPatientRepository } from '../../domain/repositories/patient.repository';
import { IDomainEventPublisher } from '../../../shared/domain/base/domain-event';
import { IEventStore } from '../../../shared/infrastructure/event-store/event-store.interface';

export interface RegisterPatientRequest {
  // Personal Information
  personalInfo: {
    fullName: string;
    dateOfBirth: string; // ISO date string
    gender: 'male' | 'female' | 'other';
    nationalId?: string;
    ethnicity?: string;
    religion?: string;
    occupation?: string;
    maritalStatus?: 'single' | 'married' | 'divorced' | 'widowed' | 'separated';
  };

  // Contact Information
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

  // Medical Information (Optional)
  medicalInfo?: {
    bloodType?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
    allergies?: string[];
    chronicConditions?: string[];
    currentMedications?: Array<{
      name: string;
      dosage: string;
      frequency: string;
      prescribedBy?: string;
      startDate?: string; // ISO date string
    }>;
    familyHistory?: string[];
    surgicalHistory?: string[];
  };

  // Insurance Information (Optional)
  insuranceInfo?: {
    provider: string;
    policyNumber: string;
    subscriberName: string;
    subscriberDateOfBirth: string; // ISO date string
    relationshipToSubscriber: 'self' | 'spouse' | 'child' | 'other';
    effectiveDate: string; // ISO date string
    expirationDate?: string; // ISO date string
    groupNumber?: string;
    copayAmount?: number;
    deductibleAmount?: number;
  };

  // Registration Metadata
  registrationSource?: 'WALK_IN' | 'ONLINE' | 'REFERRAL' | 'EMERGENCY';
  notes?: string;
  preferredLanguage?: string;
  consentToTreatment: boolean;
  consentToDataSharing?: boolean;

  // User context
  userId: string;
  correlationId?: string;
}

export interface RegisterPatientResponse {
  success: boolean;
  patientId: string;
  message: string;
  fhirComplianceScore: number;
  warnings: string[];
  recommendations: string[];
  nextSteps: string[];
}

/**
 * Register Patient Use Case
 * Orchestrates complete patient registration workflow
 */
export class RegisterPatientUseCase extends BaseHealthcareUseCase<RegisterPatientRequest, RegisterPatientResponse> {
  constructor(
    private readonly patientRepository: IPatientRepository,
    private readonly eventPublisher: IDomainEventPublisher,
    private readonly eventStore: IEventStore
  ) {
    super();
  }

  /**
   * Execute patient registration
   */
  protected async executeInternal(request: RegisterPatientRequest): Promise<RegisterPatientResponse> {
    // 1. Create value objects
    const personalInfo = this.createPersonalInfo(request.personalInfo);
    const contactInfo = this.createContactInfo(request.contactInfo);
    const medicalInfo = request.medicalInfo ? this.createMedicalInfo(request.medicalInfo) : undefined;
    const insuranceInfo = request.insuranceInfo ? this.createInsuranceInfo(request.insuranceInfo) : undefined;

    // 2. Check for duplicate patients
    await this.checkForDuplicates(personalInfo, contactInfo);

    // 3. Create patient aggregate
    const patient = Patient.create(
      personalInfo,
      contactInfo,
      request.userId,
      (request.registrationSource as RegistrationSource) || RegistrationSource.WALK_IN,
      medicalInfo,
      insuranceInfo,
      request.notes,
      request.preferredLanguage || 'vi',
      request.consentToTreatment,
      request.consentToDataSharing || false
    );

    // 4. Persist patient
    await this.patientRepository.save(patient);

    // 5. Handle domain events
    const events = patient.getUncommittedEvents();
    if (events.length > 0) {
      // Store events in event store
      await this.eventStore.saveEvents(
        patient.id,
        'Patient',
        events,
        patient.version
      );

      // Publish domain events
      for (const event of events) {
        await this.eventPublisher.publish(event);
      }

      // Mark events as committed
      patient.markEventsAsCommitted();
    }

    // 6. Generate response
    return this.generateResponse(patient, request);
  }

  /**
   * Validate request
   */
  async validate(request: RegisterPatientRequest): Promise<ValidationResult> {
    const errors: ValidationError[] = [];

    // Validate personal info
    const personalInfoErrors = this.validatePersonalInfo(request.personalInfo);
    errors.push(...personalInfoErrors);

    // Validate contact info
    const contactInfoErrors = this.validateContactInfo(request.contactInfo);
    errors.push(...contactInfoErrors);

    // Validate medical info if provided
    if (request.medicalInfo) {
      const medicalInfoErrors = this.validateMedicalInfo(request.medicalInfo);
      errors.push(...medicalInfoErrors);
    }

    // Validate insurance info if provided
    if (request.insuranceInfo) {
      const insuranceInfoErrors = this.validateInsuranceInfo(request.insuranceInfo);
      errors.push(...insuranceInfoErrors);
    }

    // Validate consent
    if (!request.consentToTreatment) {
      errors.push({
        field: 'consentToTreatment',
        message: 'Bệnh nhân phải đồng ý điều trị để được đăng ký',
        code: 'CONSENT_REQUIRED',
        severity: 'error'
      });
    }

    // Validate user context
    if (!request.userId) {
      errors.push({
        field: 'userId',
        message: 'Thông tin người đăng ký là bắt buộc',
        code: 'USER_ID_REQUIRED',
        severity: 'error'
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Check authorization
   */
  async authorize(request: RegisterPatientRequest, userId: string): Promise<boolean> {
    // Check if user has permission to register patients
    // This would typically check against user roles/permissions
    // For now, assume all authenticated users can register patients
    return userId === request.userId;
  }

  /**
   * Check if involves PHI
   */
  involvesPHI(request: RegisterPatientRequest): boolean {
    return true; // Patient registration always involves PHI
  }

  /**
   * Get patient ID (not available until after creation)
   */
  getPatientId(request: RegisterPatientRequest): string | null {
    return null; // Patient ID is generated during execution
  }

  /**
   * Private helper methods
   */

  private createPersonalInfo(personalInfoData: RegisterPatientRequest['personalInfo']): PersonalInfo {
    return PersonalInfo.create(
      personalInfoData.fullName,
      new Date(personalInfoData.dateOfBirth),
      personalInfoData.gender as Gender,
      personalInfoData.nationalId,
      personalInfoData.ethnicity,
      personalInfoData.religion,
      personalInfoData.occupation,
      personalInfoData.maritalStatus as MaritalStatus
    );
  }

  private createContactInfo(contactInfoData: RegisterPatientRequest['contactInfo']): ContactInfo {
    const address: Address | undefined = contactInfoData.address ? {
      street: contactInfoData.address.street,
      ward: contactInfoData.address.ward,
      district: contactInfoData.address.district,
      city: contactInfoData.address.city,
      province: contactInfoData.address.province,
      postalCode: contactInfoData.address.postalCode,
      country: contactInfoData.address.country
    } : undefined;

    const emergencyContact: EmergencyContact | undefined = contactInfoData.emergencyContact ? {
      name: contactInfoData.emergencyContact.name,
      relationship: contactInfoData.emergencyContact.relationship,
      phone: contactInfoData.emergencyContact.phone,
      email: contactInfoData.emergencyContact.email,
      address: contactInfoData.emergencyContact.address
    } : undefined;

    return ContactInfo.create(
      contactInfoData.phone,
      contactInfoData.email,
      address,
      emergencyContact
    );
  }

  private createMedicalInfo(medicalInfoData: NonNullable<RegisterPatientRequest['medicalInfo']>): MedicalInfo {
    return {
      bloodType: medicalInfoData.bloodType,
      allergies: medicalInfoData.allergies || [],
      chronicConditions: medicalInfoData.chronicConditions || [],
      currentMedications: (medicalInfoData.currentMedications || []).map(med => ({
        name: med.name,
        dosage: med.dosage,
        frequency: med.frequency,
        prescribedBy: med.prescribedBy,
        startDate: med.startDate ? new Date(med.startDate) : undefined
      })),
      familyHistory: medicalInfoData.familyHistory,
      surgicalHistory: medicalInfoData.surgicalHistory
    };
  }

  private createInsuranceInfo(insuranceInfoData: NonNullable<RegisterPatientRequest['insuranceInfo']>): InsuranceInfo {
    return {
      provider: insuranceInfoData.provider,
      policyNumber: insuranceInfoData.policyNumber,
      subscriberName: insuranceInfoData.subscriberName,
      subscriberDateOfBirth: new Date(insuranceInfoData.subscriberDateOfBirth),
      relationshipToSubscriber: insuranceInfoData.relationshipToSubscriber,
      effectiveDate: new Date(insuranceInfoData.effectiveDate),
      expirationDate: insuranceInfoData.expirationDate ? new Date(insuranceInfoData.expirationDate) : undefined,
      groupNumber: insuranceInfoData.groupNumber,
      copayAmount: insuranceInfoData.copayAmount,
      deductibleAmount: insuranceInfoData.deductibleAmount
    };
  }

  private async checkForDuplicates(personalInfo: PersonalInfo, contactInfo: ContactInfo): Promise<void> {
    // Check by national ID
    if (personalInfo.nationalId) {
      const existingByNationalId = await this.patientRepository.findByNationalId(personalInfo.nationalId);
      if (existingByNationalId) {
        throw new Error(`Bệnh nhân với CCCD/CMND ${personalInfo.nationalId} đã tồn tại trong hệ thống`);
      }
    }

    // Check by phone number
    if (contactInfo.phone) {
      const existingByPhone = await this.patientRepository.findByPhone(contactInfo.phone);
      if (existingByPhone && existingByPhone.length > 0) {
        // Allow multiple patients with same phone (family members)
        // But warn if same name + phone
        const duplicateName = existingByPhone.find(p => 
          p.personalInfo.fullName.toLowerCase() === personalInfo.fullName.toLowerCase()
        );
        if (duplicateName) {
          throw new Error(`Bệnh nhân với tên ${personalInfo.fullName} và số điện thoại ${contactInfo.phone} đã tồn tại`);
        }
      }
    }

    // Check by email
    if (contactInfo.email) {
      const existingByEmail = await this.patientRepository.findByEmail(contactInfo.email);
      if (existingByEmail) {
        throw new Error(`Bệnh nhân với email ${contactInfo.email} đã tồn tại trong hệ thống`);
      }
    }
  }

  private generateResponse(patient: Patient, request: RegisterPatientRequest): RegisterPatientResponse {
    const warnings: string[] = [];
    const recommendations: string[] = [];
    const nextSteps: string[] = [];

    // Generate warnings
    if (!patient.contactInfo.emergencyContact) {
      warnings.push('Chưa có thông tin người liên hệ khẩn cấp');
      recommendations.push('Cập nhật thông tin người liên hệ khẩn cấp');
    }

    if (!patient.hasValidInsurance()) {
      warnings.push('Chưa có thông tin bảo hiểm y tế hợp lệ');
      recommendations.push('Cập nhật thông tin bảo hiểm y tế');
    }

    if (!patient.medicalInfo?.bloodType) {
      recommendations.push('Cập nhật thông tin nhóm máu');
    }

    if (patient.fhirComplianceScore < 85) {
      warnings.push(`Điểm tuân thủ FHIR: ${patient.fhirComplianceScore}% (khuyến nghị >= 85%)`);
      recommendations.push('Hoàn thiện thông tin để tăng điểm tuân thủ FHIR');
    }

    // Generate next steps
    nextSteps.push('Tạo lịch hẹn khám đầu tiên');
    
    if (patient.isPediatric()) {
      nextSteps.push('Lập kế hoạch tiêm chủng cho trẻ em');
    }

    if (patient.isElderly()) {
      nextSteps.push('Đánh giá sức khỏe toàn diện cho người cao tuổi');
    }

    return {
      success: true,
      patientId: patient.patientId.value,
      message: `Đăng ký bệnh nhân thành công. Mã bệnh nhân: ${patient.patientId.value}`,
      fhirComplianceScore: patient.fhirComplianceScore,
      warnings,
      recommendations,
      nextSteps
    };
  }

  /**
   * Validation helper methods
   */

  private validatePersonalInfo(personalInfo: RegisterPatientRequest['personalInfo']): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!personalInfo.fullName?.trim()) {
      errors.push({
        field: 'personalInfo.fullName',
        message: 'Họ và tên không được để trống',
        code: 'FULL_NAME_REQUIRED',
        severity: 'error'
      });
    }

    if (!personalInfo.dateOfBirth) {
      errors.push({
        field: 'personalInfo.dateOfBirth',
        message: 'Ngày sinh không được để trống',
        code: 'DATE_OF_BIRTH_REQUIRED',
        severity: 'error'
      });
    } else {
      const birthDate = new Date(personalInfo.dateOfBirth);
      if (birthDate > new Date()) {
        errors.push({
          field: 'personalInfo.dateOfBirth',
          message: 'Ngày sinh không thể là ngày trong tương lai',
          code: 'INVALID_DATE_OF_BIRTH',
          severity: 'error'
        });
      }
    }

    if (!personalInfo.gender) {
      errors.push({
        field: 'personalInfo.gender',
        message: 'Giới tính không được để trống',
        code: 'GENDER_REQUIRED',
        severity: 'error'
      });
    }

    return errors;
  }

  private validateContactInfo(contactInfo: RegisterPatientRequest['contactInfo']): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!contactInfo.phone && !contactInfo.email && !contactInfo.emergencyContact) {
      errors.push({
        field: 'contactInfo',
        message: 'Phải có ít nhất một phương thức liên lạc',
        code: 'CONTACT_METHOD_REQUIRED',
        severity: 'error'
      });
    }

    return errors;
  }

  private validateMedicalInfo(medicalInfo: NonNullable<RegisterPatientRequest['medicalInfo']>): ValidationError[] {
    const errors: ValidationError[] = [];

    // Validate blood type if provided
    if (medicalInfo.bloodType) {
      const validBloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
      if (!validBloodTypes.includes(medicalInfo.bloodType)) {
        errors.push({
          field: 'medicalInfo.bloodType',
          message: 'Nhóm máu không hợp lệ',
          code: 'INVALID_BLOOD_TYPE',
          severity: 'error'
        });
      }
    }

    return errors;
  }

  private validateInsuranceInfo(insuranceInfo: NonNullable<RegisterPatientRequest['insuranceInfo']>): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!insuranceInfo.provider?.trim()) {
      errors.push({
        field: 'insuranceInfo.provider',
        message: 'Nhà cung cấp bảo hiểm không được để trống',
        code: 'INSURANCE_PROVIDER_REQUIRED',
        severity: 'error'
      });
    }

    if (!insuranceInfo.policyNumber?.trim()) {
      errors.push({
        field: 'insuranceInfo.policyNumber',
        message: 'Số hợp đồng bảo hiểm không được để trống',
        code: 'POLICY_NUMBER_REQUIRED',
        severity: 'error'
      });
    }

    // Validate dates
    if (insuranceInfo.effectiveDate && insuranceInfo.expirationDate) {
      const effectiveDate = new Date(insuranceInfo.effectiveDate);
      const expirationDate = new Date(insuranceInfo.expirationDate);
      
      if (expirationDate <= effectiveDate) {
        errors.push({
          field: 'insuranceInfo.expirationDate',
          message: 'Ngày hết hạn phải sau ngày có hiệu lực',
          code: 'INVALID_INSURANCE_DATES',
          severity: 'error'
        });
      }
    }

    return errors;
  }
}
