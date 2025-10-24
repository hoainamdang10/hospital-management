/**
 * RegisterStaffUseCase - Application Use Case
 * V2 Clean Architecture + DDD Implementation
 * Handles provider staff registration with Vietnamese healthcare compliance
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards, HIPAA
 */

import { BaseHealthcareUseCase, ValidationResult } from '../../../../shared/application/base/base-healthcare-use-case';
import { IProviderStaffRepository } from '../../domain/repositories/IProviderStaffRepository';
import { ProviderStaff, StaffType, EmploymentType } from '../../domain/aggregates/ProviderStaff';
import { PersonalInfo } from '../../domain/value-objects/PersonalInfo';
import { ProfessionalInfo } from '../../domain/value-objects/ProfessionalInfo';
import { WorkSchedule } from '../../domain/value-objects/WorkSchedule';
import { Specialization } from '../../domain/entities/Specialization';
import { IEventBus } from '../../../../shared/events/event-bus.interface';
import { ILogger } from '../interfaces/ILogger';

export interface RegisterStaffRequest {
  userId: string;
  staffType: StaffType;
  personalInfo: {
    fullName: string;
    dateOfBirth: string;
    gender: 'male' | 'female' | 'other';
    nationalId: string; // CMND/CCCD
    nationality: string;
    phoneNumber: string;
    email?: string;
    address: {
      street: string;
      ward: string;
      district: string;
      city: string;
      province: string;
      country: string;
    };
  };
  professionalInfo: {
    title: string; // Dr., Nurse, etc.
    department: string;
    position: string;
    education: string[];
    languages: string[];
    bio?: string;
  };
  workSchedule: {
    workingDays: string[]; // ['monday', 'tuesday', ...]
    workingHours: {
      start: string; // '08:00'
      end: string; // '17:00'
    };
    timeZone: string;
    isFlexible: boolean;
  };
  licenseNumber: string;
  employmentType: EmploymentType;
  hireDate: string;
  contractEndDate?: string;
  yearsOfExperience: number;
  consultationFee?: number; // For doctors
  specializations?: Array<{
    code: string;
    name: string;
    description?: string;
    isActive: boolean;
  }>;
  vietnameseHealthcareLicense?: string;
  mohRegistrationNumber?: string; // Ministry of Health registration
  requestedBy: string;
  requestMetadata?: {
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
  };
}

export interface RegisterStaffResponse {
  success: boolean;
  staffId?: string;
  message: string;
  errors?: string[];
  warnings?: string[];
  data?: {
    staff: {
      id: string;
      userId: string;
      staffType: StaffType;
      fullName: string;
      licenseNumber: string;
      registrationDate: string;
      isActive: boolean;
    };
  };
}

/**
 * Register Staff Use Case
 * Handles complete staff registration process with Vietnamese healthcare compliance
 */
export class RegisterStaffUseCase extends BaseHealthcareUseCase<RegisterStaffRequest, RegisterStaffResponse> {
  constructor(
    private readonly staffRepository: IProviderStaffRepository,
    private readonly eventBus: IEventBus,
    private readonly logger: ILogger
  ) {
    super();
  }

  /**
   * Execute staff registration
   */
  protected async executeImpl(request: RegisterStaffRequest): Promise<RegisterStaffResponse> {
    try {
      this.logger.info('Starting staff registration', {
        userId: request.userId,
        staffType: request.staffType,
        requestedBy: request.requestedBy
      });

      const warnings: string[] = [];

      // 1. Validate request
      const validationResult = await this.validateRequest(request);
      if (!validationResult.isValid) {
        return {
          success: false,
          message: 'Dữ liệu đăng ký không hợp lệ',
          errors: validationResult.errors
        };
      }

      // 2. Check if staff already exists for this user
      const existingStaff = await this.staffRepository.findByUserId(request.userId);
      if (existingStaff) {
        return {
          success: false,
          message: 'Nhân viên đã được đăng ký cho tài khoản này'
        };
      }

      // 3. Check for duplicate license number
      const duplicateStaff = await this.staffRepository.findByLicenseNumber(request.licenseNumber);
      if (duplicateStaff) {
        return {
          success: false,
          message: 'Số giấy phép hành nghề đã được sử dụng'
        };
      }

      // 4. Create value objects
      const personalInfo = PersonalInfo.create({
        fullName: request.personalInfo.fullName,
        dateOfBirth: new Date(request.personalInfo.dateOfBirth),
        gender: request.personalInfo.gender,
        nationalId: request.personalInfo.nationalId,
        nationality: request.personalInfo.nationality,
        phoneNumber: request.personalInfo.phoneNumber,
        email: request.personalInfo.email,
        address: request.personalInfo.address
      });

      const professionalInfo = ProfessionalInfo.create({
        title: request.professionalInfo.title,
        department: request.professionalInfo.department,
        position: request.professionalInfo.position,
        education: request.professionalInfo.education,
        languages: request.professionalInfo.languages,
        bio: request.professionalInfo.bio
      });

      const workSchedule = WorkSchedule.create({
        workingDays: request.workSchedule.workingDays,
        workingHours: request.workSchedule.workingHours,
        timeZone: request.workSchedule.timeZone,
        isFlexible: request.workSchedule.isFlexible
      });

      // 5. Create specializations if provided
      const specializations: Specialization[] = [];
      if (request.specializations) {
        for (const spec of request.specializations) {
          specializations.push(Specialization.create({
            code: spec.code,
            name: spec.name,
            description: spec.description,
            isActive: spec.isActive
          }));
        }
      }

      // 6. Create staff aggregate
      const staff = ProviderStaff.create(
        request.userId,
        request.staffType,
        personalInfo,
        professionalInfo,
        workSchedule,
        request.licenseNumber,
        request.employmentType,
        new Date(request.hireDate),
        request.yearsOfExperience,
        specializations,
        request.vietnameseHealthcareLicense,
        request.mohRegistrationNumber
      );

      // 7. Set additional properties
      // Note: Direct props access should be replaced with public methods
      // For now, keeping minimal changes to avoid breaking functionality
      if (request.consultationFee && request.staffType === 'doctor') {
        staff.updateConsultationFee(request.consultationFee);
      }

      // 8. Vietnamese healthcare compliance validation
      if (!staff.isVietnameseHealthcareCompliant()) {
        return {
          success: false,
          message: 'Thông tin nhân viên không đáp ứng tiêu chuẩn y tế Việt Nam'
        };
      }

      // 9. HIPAA compliance validation
      if (!staff.isHIPAACompliant()) {
        this.logger.warn('Staff registration lacks HIPAA compliance', {
          staffId: staff.id,
          userId: request.userId
        });
      }

      // 10. Save staff
      await this.staffRepository.save(staff);

      // 11. Publish domain events (best effort)
      try {
        await this.publishDomainEvents(staff);
      } catch (eventError) {
        const errorMessage = eventError instanceof Error ? eventError.message : 'Unknown error';
        this.logger.warn('Failed to publish staff registration events', {
          staffId: staff.staffIdValue,
          userId: staff.userId,
          requestedBy: request.requestedBy,
          error: errorMessage
        });
        warnings.push('Không thể phát sự kiện đăng ký nhân viên, hệ thống sẽ thử lại sau.');
      }

      // 12. HIPAA audit logging
      await this.auditStaffRegistration(staff, request);

      this.logger.info('Staff registration completed successfully', {
        staffId: staff.id,
        userId: request.userId,
        staffType: request.staffType,
        requestedBy: request.requestedBy
      });

      return {
        success: true,
        staffId: staff.staffIdValue,
        message: 'Đăng ký nhân viên thành công',
        ...(warnings.length > 0 ? { warnings } : {}),
        data: {
          staff: {
            id: staff.staffIdValue,
            userId: staff.userId,
            staffType: staff.staffType,
            fullName: staff.personalInfo.fullName,
            licenseNumber: staff.licenseNumber,
            registrationDate: staff.registrationDate.toISOString(),
            isActive: staff.isActive
          }
        }
      };

    } catch (error) {
      this.logger.error('Error during staff registration', {
        userId: request.userId,
        staffType: request.staffType,
        requestedBy: request.requestedBy,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        message: 'Lỗi hệ thống khi đăng ký nhân viên'
      };
    }
  }

  /**
   * Validate registration request
   */
  protected override async validateRequest(request: RegisterStaffRequest): Promise<ValidationResult> {
    const errors: string[] = [];

    // User ID validation
    if (!request.userId || request.userId.trim().length === 0) {
      errors.push('ID người dùng không được để trống');
    }

    // Staff type validation
    const validStaffTypes: StaffType[] = ['doctor', 'nurse', 'technician', 'pharmacist', 'therapist', 'admin', 'receptionist'];
    if (!validStaffTypes.includes(request.staffType)) {
      errors.push('Loại nhân viên không hợp lệ');
    }

    // Personal info validation
    if (!request.personalInfo.fullName || request.personalInfo.fullName.trim().length === 0) {
      errors.push('Họ tên không được để trống');
    }

    if (!request.personalInfo.nationalId || request.personalInfo.nationalId.trim().length === 0) {
      errors.push('CMND/CCCD không được để trống');
    }

    if (!request.personalInfo.phoneNumber || request.personalInfo.phoneNumber.trim().length === 0) {
      errors.push('Số điện thoại không được để trống');
    }

    // Professional info validation
    if (!request.professionalInfo.title || request.professionalInfo.title.trim().length === 0) {
      errors.push('Chức danh không được để trống');
    }

    if (!request.professionalInfo.department || request.professionalInfo.department.trim().length === 0) {
      errors.push('Khoa/phòng ban không được để trống');
    }

    // License validation
    if (!request.licenseNumber || request.licenseNumber.trim().length === 0) {
      errors.push('Số giấy phép hành nghề không được để trống');
    }

    // Employment validation
    const validEmploymentTypes: EmploymentType[] = ['full_time', 'part_time', 'contract', 'intern', 'volunteer'];
    if (!validEmploymentTypes.includes(request.employmentType)) {
      errors.push('Loại hình tuyển dụng không hợp lệ');
    }

    // Date validation
    if (!request.hireDate) {
      errors.push('Ngày tuyển dụng không được để trống');
    } else {
      const hireDate = new Date(request.hireDate);
      if (hireDate > new Date()) {
        errors.push('Ngày tuyển dụng không thể trong tương lai');
      }
    }

    // Experience validation
    if (request.yearsOfExperience < 0) {
      errors.push('Số năm kinh nghiệm không được âm');
    }

    // Doctor-specific validation
    if (request.staffType === 'doctor') {
      if (!request.specializations || request.specializations.length === 0) {
        errors.push('Bác sĩ phải có ít nhất một chuyên khoa');
      }

      if (request.consultationFee !== undefined && request.consultationFee < 0) {
        errors.push('Phí khám không được âm');
      }
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
  private async publishDomainEvents(staff: ProviderStaff): Promise<void> {
    const events = staff.getUncommittedEvents();
    
    for (const event of events) {
      await this.eventBus.publish(event);
    }
    
    staff.markEventsAsCommitted();
  }

  /**
   * HIPAA audit logging for staff registration
   */
  private async auditStaffRegistration(staff: ProviderStaff, request: RegisterStaffRequest): Promise<void> {
    this.logger.info('HIPAA Audit: Staff registration', {
      action: 'STAFF_REGISTRATION',
      staffId: staff.id,
      userId: request.userId,
      staffType: request.staffType,
      requestedBy: request.requestedBy,
      timestamp: new Date().toISOString(),
      ipAddress: request.requestMetadata?.ipAddress,
      userAgent: request.requestMetadata?.userAgent,
      sessionId: request.requestMetadata?.sessionId,
      dataAccessed: 'staff_personal_info,staff_professional_info,staff_credentials',
      complianceLevel: 'hipaa'
    });
  }
}
