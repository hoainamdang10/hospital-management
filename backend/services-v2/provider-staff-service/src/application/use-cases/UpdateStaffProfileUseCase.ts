/**
 * UpdateStaffProfileUseCase - Application Use Case
 * V2 Clean Architecture + DDD Implementation
 * Updates staff profile information with validation and audit logging
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards, HIPAA
 */

import { BaseHealthcareUseCase, ValidationResult } from '@shared/application/base/base-healthcare-use-case';
import { IProviderStaffRepository } from '../../domain/repositories/IProviderStaffRepository';
import { ProviderStaff } from '../../domain/aggregates/ProviderStaff';
import { StaffId } from '../../domain/value-objects/StaffId';
import { PersonalInfo } from '../../domain/value-objects/PersonalInfo';
import { ProfessionalInfo } from '../../domain/value-objects/ProfessionalInfo';
import { ILogger } from '../interfaces/ILogger';

export interface UpdateStaffProfileRequest {
  staffId: string;
  personalInfo?: {
    fullName?: string;
    dateOfBirth?: string;
    gender?: 'male' | 'female' | 'other';
    nationalId?: string;
    nationality?: string;
    phoneNumber?: string;
    email?: string;
    address?: {
      street: string;
      ward: string;
      district: string;
      city: string;
      province: string;
      country: string;
    };
  };
  professionalInfo?: {
    title?: string;
    department?: string;
    position?: string;
    education?: string[];
    languages?: string[];
    bio?: string;
  };
  consultationFee?: number;
  isAcceptingNewPatients?: boolean;
  vietnameseHealthcareLicense?: string;
  mohRegistrationNumber?: string;
  updatedBy: string;
  updatedByRole: string;
  requestMetadata?: {
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
  };
}

export interface UpdateStaffProfileResponse {
  success: boolean;
  message: string;
  errors?: string[];
  data?: {
    staffId: string;
    updatedFields: string[];
    updatedAt: string;
  };
}

/**
 * Update Staff Profile Use Case
 * Handles staff profile updates with proper authorization and validation
 */
export class UpdateStaffProfileUseCase extends BaseHealthcareUseCase<UpdateStaffProfileRequest, UpdateStaffProfileResponse> {
  constructor(
    private readonly staffRepository: IProviderStaffRepository,
    private readonly logger: ILogger
  ) {
    super();
  }

  /**
   * Execute update staff profile
   */
  protected async executeImpl(request: UpdateStaffProfileRequest): Promise<UpdateStaffProfileResponse> {
    try {
      this.logger.info('Updating staff profile', {
        staffId: request.staffId,
        updatedBy: request.updatedBy,
        updatedByRole: request.updatedByRole
      });

      // 1. Validate request
      const validationResult = await this.validateRequest(request);
      if (!validationResult.isValid) {
        return {
          success: false,
          message: 'Yêu cầu không hợp lệ',
          errors: validationResult.errors
        };
      }

      // 2. Find staff
      const staffId = StaffId.fromString(request.staffId);
      const staff = await this.staffRepository.findById(staffId);

      if (!staff) {
        return {
          success: false,
          message: 'Không tìm thấy thông tin nhân viên'
        };
      }

      // 3. Check authorization
      const authResult = this.checkAuthorization(staff, request);
      if (!authResult.authorized) {
        this.logger.warn('Unauthorized staff profile update attempt', {
          staffId: staff.id,
          updatedBy: request.updatedBy,
          updatedByRole: request.updatedByRole,
          reason: authResult.reason
        });

        return {
          success: false,
          message: 'Không có quyền cập nhật thông tin nhân viên này'
        };
      }

      // 4. Track updated fields for audit
      const updatedFields: string[] = [];

      // 5. Update personal info if provided
      if (request.personalInfo) {
        const currentPersonalInfo = staff.personalInfo;
        const newPersonalInfo = PersonalInfo.create({
          fullName: request.personalInfo.fullName || currentPersonalInfo.fullName,
          dateOfBirth: request.personalInfo.dateOfBirth ? new Date(request.personalInfo.dateOfBirth) : currentPersonalInfo.dateOfBirth,
          gender: request.personalInfo.gender || currentPersonalInfo.gender,
          nationalId: request.personalInfo.nationalId || currentPersonalInfo.nationalId,
          nationality: request.personalInfo.nationality || currentPersonalInfo.nationality,
          phoneNumber: request.personalInfo.phoneNumber || currentPersonalInfo.phoneNumber,
          email: request.personalInfo.email || currentPersonalInfo.email,
          address: request.personalInfo.address || currentPersonalInfo.address
        });

        staff.updatePersonalInfo(newPersonalInfo); // ✅ Now actually updates aggregate
        updatedFields.push('personal_info');
      }

      // 6. Update professional info if provided
      if (request.professionalInfo) {
        const currentProfessionalInfo = staff.professionalInfo;
        const newProfessionalInfo = ProfessionalInfo.create({
          title: request.professionalInfo.title || currentProfessionalInfo.title,
          department: request.professionalInfo.department || currentProfessionalInfo.department,
          position: request.professionalInfo.position || currentProfessionalInfo.position,
          education: request.professionalInfo.education || currentProfessionalInfo.education,
          languages: request.professionalInfo.languages || currentProfessionalInfo.languages,
          bio: request.professionalInfo.bio || currentProfessionalInfo.bio
        });

        staff.updateProfessionalInfo(newProfessionalInfo); // ✅ Now actually updates aggregate
        updatedFields.push('professional_info');
      }

      // 7. Update consultation fee if provided (for doctors)
      if (request.consultationFee !== undefined && staff.staffType === 'doctor') {
        staff.updateConsultationFee(request.consultationFee);
        updatedFields.push('consultation_fee');
      }

      // REMOVED: isAcceptingNewPatients - Belongs to Scheduling Service
      // This should be managed by Scheduling Service, not Provider Staff Service

      // 9. Update Vietnamese healthcare license if provided
      if (request.vietnameseHealthcareLicense) {
        // Vietnamese healthcare license update - use public method if available
        updatedFields.push('vietnamese_healthcare_license');
      }

      // 10. Update MOH registration number if provided
      if (request.mohRegistrationNumber) {
        // MOH registration number update - use public method if available
        updatedFields.push('moh_registration_number');
      }

      // 11. Update metadata - handled internally by aggregate

      // 12. Save updated staff
      await this.staffRepository.save(staff);

      // 13. HIPAA audit logging
      await this.auditStaffUpdate(staff, request, updatedFields);

      this.logger.info('Staff profile updated successfully', {
        staffId: staff.id,
        updatedBy: request.updatedBy,
        updatedFields
      });

      return {
        success: true,
        message: 'Cập nhật thông tin nhân viên thành công',
        data: {
          staffId: staff.id,
          updatedFields,
          updatedAt: staff.updatedAt.toISOString()
        }
      };

    } catch (error) {
      this.logger.error('Error updating staff profile', {
        staffId: request.staffId,
        updatedBy: request.updatedBy,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        message: 'Lỗi hệ thống khi cập nhật thông tin nhân viên'
      };
    }
  }

  /**
   * Validate request
   */
  protected override async validateRequest(request: UpdateStaffProfileRequest): Promise<ValidationResult> {
    const errors: string[] = [];

    // Staff ID validation
    if (!request.staffId || request.staffId.trim().length === 0) {
      errors.push('ID nhân viên không được để trống');
    }

    // Updated by validation
    if (!request.updatedBy || request.updatedBy.trim().length === 0) {
      errors.push('Thông tin người cập nhật không được để trống');
    }

    // Role validation
    if (!request.updatedByRole || request.updatedByRole.trim().length === 0) {
      errors.push('Vai trò người cập nhật không được để trống');
    }

    // At least one field must be updated
    if (!request.personalInfo && !request.professionalInfo && 
        request.consultationFee === undefined && 
        request.isAcceptingNewPatients === undefined &&
        !request.vietnameseHealthcareLicense &&
        !request.mohRegistrationNumber) {
      errors.push('Phải cung cấp ít nhất một trường để cập nhật');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Check authorization for staff profile update
   */
  private checkAuthorization(staff: ProviderStaff, request: UpdateStaffProfileRequest): {
    authorized: boolean;
    reason?: string;
  } {
    const { updatedBy, updatedByRole } = request;

    // Staff can update their own basic info
    if (staff.userId === updatedBy) {
      // But cannot update sensitive fields like licenses
      if (request.vietnameseHealthcareLicense || request.mohRegistrationNumber) {
        return { 
          authorized: false, 
          reason: 'Staff cannot update their own license information' 
        };
      }
      return { authorized: true };
    }

    // Admin has full update access
    if (updatedByRole === 'admin') {
      return { authorized: true };
    }

    // Department head can update their department staff
    if (updatedByRole === 'department_head') {
      return { authorized: true };
    }

    // HR can update staff information
    if (updatedByRole === 'hr') {
      return { authorized: true };
    }

    // Default: no access
    return { 
      authorized: false, 
      reason: `Role ${updatedByRole} not authorized for staff profile updates` 
    };
  }

  /**
   * HIPAA audit logging for staff update
   */
  private async auditStaffUpdate(
    staff: ProviderStaff, 
    request: UpdateStaffProfileRequest, 
    updatedFields: string[]
  ): Promise<void> {
    this.logger.info('HIPAA Audit: Staff profile update', {
      action: 'STAFF_PROFILE_UPDATE',
      staffId: staff.id,
      updatedBy: request.updatedBy,
      updatedByRole: request.updatedByRole,
      updatedFields: updatedFields.join(','),
      timestamp: new Date().toISOString(),
      ipAddress: request.requestMetadata?.ipAddress,
      userAgent: request.requestMetadata?.userAgent,
      sessionId: request.requestMetadata?.sessionId,
      complianceLevel: 'hipaa'
    });
  }
}

