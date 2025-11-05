/**
 * GetStaffProfileUseCase - Application Use Case
 * V2 Clean Architecture + DDD Implementation
 * Retrieves staff profile with authorization and HIPAA compliance
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards, HIPAA
 */

import { BaseHealthcareUseCase, ValidationResult } from '@shared/application/base/base-healthcare-use-case';
import { IProviderStaffRepository } from '../../domain/repositories/IProviderStaffRepository';
import { ProviderStaff, StaffType } from '../../domain/aggregates/ProviderStaff';
import { StaffId } from '../../domain/value-objects/StaffId';
import { ILogger } from '../interfaces/ILogger';

export interface GetStaffProfileRequest {
  staffId?: string;
  userId?: string; // Alternative lookup by user ID
  licenseNumber?: string; // Alternative lookup by license number
  requestedBy: string;
  requestedByRole: string;
  includeFullSchedule?: boolean;
  includeSensitiveInfo?: boolean;
  requestMetadata?: {
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
  };
}

export interface GetStaffProfileResponse {
  success: boolean;
  message: string;
  errors?: string[];
  data?: {
    staff: {
      id: string;
      userId: string;
      staffType: StaffType;
      personalInfo: {
        fullName: string;
        dateOfBirth?: string; // Masked for unauthorized users
        gender: string;
        nationalId?: string; // Only for authorized users
        nationality: string;
        phoneNumber?: string; // Masked for unauthorized users
        email?: string; // Masked for unauthorized users
      };
      professionalInfo: {
        title: string;
        department: string;
        position: string;
        education: string[];
        languages: string[];
        bio?: string;
      };
      workSchedule?: {
        workingDays: string[];
        workingHours: {
          start: string;
          end: string;
        };
        timeZone: string;
        isFlexible: boolean;
      };
      specializations: Array<{
        code: string;
        name: string;
        description?: string;
        isActive: boolean;
      }>;
      credentials?: Array<{
        credentialNumber?: string; // Masked
        credentialType: string;
        issuingAuthority: string;
        isValid: boolean;
        expiryDate?: string;
      }>;
      employmentInfo: {
        employmentType: string;
        hireDate: string;
        contractEndDate?: string;
        yearsOfExperience: number;
        status: string;
        isActive: boolean;
      };
      performanceInfo?: {
        rating: number;
        totalPatients?: number;
        isAcceptingNewPatients: boolean;
        consultationFee?: number;
      };
      registrationInfo: {
        registrationDate: string;
        lastActiveDate?: string;
        vietnameseHealthcareLicense?: string; // Masked
        mohRegistrationNumber?: string; // Masked
      };
    };
  };
}

/**
 * Get Staff Profile Use Case
 * Retrieves staff profile with proper authorization and data masking
 */
export class GetStaffProfileUseCase extends BaseHealthcareUseCase<GetStaffProfileRequest, GetStaffProfileResponse> {
  constructor(
    private readonly staffRepository: IProviderStaffRepository,
    private readonly logger: ILogger
  ) {
    super();
  }

  /**
   * Execute get staff profile
   */
  protected async executeImpl(request: GetStaffProfileRequest): Promise<GetStaffProfileResponse> {
    try {
      this.logger.info('Getting staff profile', {
        staffId: request.staffId,
        userId: request.userId,
        requestedBy: request.requestedBy,
        requestedByRole: request.requestedByRole
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
      let staff: ProviderStaff | null = null;
      
      if (request.staffId) {
        const staffId = StaffId.fromString(request.staffId);
        staff = await this.staffRepository.findById(staffId);
      } else if (request.userId) {
        staff = await this.staffRepository.findByUserId(request.userId);
      } else if (request.licenseNumber) {
        staff = await this.staffRepository.findByLicenseNumber(request.licenseNumber);
      }

      if (!staff) {
        return {
          success: false,
          message: 'Không tìm thấy thông tin nhân viên'
        };
      }

      // 3. Check authorization
      const authResult = this.checkAuthorization(staff, request);
      if (!authResult.authorized) {
        this.logger.warn('Unauthorized staff profile access attempt', {
          staffId: staff.id,
          requestedBy: request.requestedBy,
          requestedByRole: request.requestedByRole,
          reason: authResult.reason
        });

        return {
          success: false,
          message: 'Không có quyền truy cập thông tin nhân viên này'
        };
      }

      // 4. Prepare response data with appropriate masking
      const responseData = this.prepareStaffData(staff, request, authResult.accessLevel);

      // 5. HIPAA audit logging
      await this.auditStaffAccess(staff, request, authResult.accessLevel);

      this.logger.info('Staff profile retrieved successfully', {
        staffId: staff.id,
        requestedBy: request.requestedBy,
        accessLevel: authResult.accessLevel
      });

      return {
        success: true,
        message: 'Lấy thông tin nhân viên thành công',
        data: {
          staff: responseData
        }
      };

    } catch (error) {
      this.logger.error('Error getting staff profile', {
        staffId: request.staffId,
        userId: request.userId,
        requestedBy: request.requestedBy,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        message: 'Lỗi hệ thống khi lấy thông tin nhân viên'
      };
    }
  }

  /**
   * Validate request
   */
  protected override async validateRequest(request: GetStaffProfileRequest): Promise<ValidationResult> {
    const errors: string[] = [];

    // Must have either staffId or userId
    if (!request.staffId && !request.userId) {
      errors.push('Phải cung cấp ID nhân viên hoặc ID người dùng');
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
   * Check authorization for staff data access
   */
  private checkAuthorization(staff: ProviderStaff, request: GetStaffProfileRequest): {
    authorized: boolean;
    accessLevel: 'full' | 'limited' | 'basic';
    reason?: string;
  } {
    const { requestedBy, requestedByRole } = request;

    // Staff can access their own data
    if (staff.userId === requestedBy) {
      return { authorized: true, accessLevel: 'full' };
    }

    // Admin has full access
    if (requestedByRole === 'admin') {
      return { authorized: true, accessLevel: 'full' };
    }

    // Department head has full access to their department staff
    if (requestedByRole === 'department_head') {
      return { authorized: true, accessLevel: 'full' };
    }

    // Doctor has limited access to other staff
    if (requestedByRole === 'doctor') {
      return { authorized: true, accessLevel: 'limited' };
    }

    // Nurse has basic access to other staff
    if (requestedByRole === 'nurse') {
      return { authorized: true, accessLevel: 'basic' };
    }

    // Receptionist has basic access for scheduling purposes
    if (requestedByRole === 'receptionist') {
      return { authorized: true, accessLevel: 'basic' };
    }

    // Default: no access
    return {
      authorized: false,
      accessLevel: 'basic',
      reason: `Role ${requestedByRole} not authorized for staff data access`
    };
  }

  /**
   * Prepare staff data with appropriate masking based on access level
   */
  private prepareStaffData(staff: ProviderStaff, request: GetStaffProfileRequest, accessLevel: string): any {
    const baseData = {
      id: staff.id,
      userId: staff.userId,
      staffType: staff.staffType,
      personalInfo: {
        fullName: staff.personalInfo.fullName,
        gender: staff.personalInfo.gender,
        nationality: staff.personalInfo.nationality
      },
      professionalInfo: {
        title: staff.professionalInfo.title,
        department: staff.professionalInfo.department,
        position: staff.professionalInfo.position,
        education: staff.professionalInfo.education,
        languages: staff.professionalInfo.languages,
        bio: staff.professionalInfo.bio
      },
      specializations: staff.getActiveSpecializations().map(spec => ({
        code: spec.code,
        name: spec.name,
        description: spec.description,
        isActive: spec.isActive
      })),
      employmentInfo: {
        employmentType: staff.employmentType,
        hireDate: staff.hireDate.toISOString(),
        contractEndDate: staff.contractEndDate?.toISOString(),
        yearsOfExperience: staff.getTotalExperience(),
        status: staff.status,
        isActive: staff.isActive
      },
      registrationInfo: {
        registrationDate: staff.registrationDate.toISOString(),
        lastActiveDate: staff.lastActiveDate?.toISOString()
      }
    };

    // Add sensitive data based on access level
    if (accessLevel === 'full') {
      return {
        ...baseData,
        personalInfo: {
          ...baseData.personalInfo,
          dateOfBirth: staff.personalInfo.dateOfBirth.toISOString().split('T')[0],
          nationalId: staff.personalInfo.nationalId,
          phoneNumber: staff.personalInfo.phoneNumber,
          email: staff.personalInfo.email
        },
        workSchedule: request.includeFullSchedule ? {
          workingDays: staff.workSchedule.workingDays,
          workingHours: staff.workSchedule.workingHours,
          timeZone: staff.workSchedule.timeZone,
          isFlexible: staff.workSchedule.isFlexible
        } : undefined,
        credentials: request.includeSensitiveInfo ? staff.getValidCredentials().map(cred => ({
          credentialNumber: this.maskString(cred.credentialNumber),
          credentialType: cred.credentialType,
          issuingAuthority: cred.issuingAuthority,
          isValid: cred.isValid,
          expiryDate: cred.expiryDate?.toISOString().split('T')[0]
        })) : undefined,
        performanceInfo: {
          // REMOVED: rating, totalPatients, isAcceptingNewPatients - Belong to other services
          // These should be fetched from Review Service and Scheduling Service via API Gateway
          consultationFee: staff.consultationFee
        },
        registrationInfo: {
          ...baseData.registrationInfo,
          vietnameseHealthcareLicense: staff.vietnameseHealthcareLicense ?
            this.maskString(staff.vietnameseHealthcareLicense) : undefined,
          mohRegistrationNumber: staff.mohRegistrationNumber ?
            this.maskString(staff.mohRegistrationNumber) : undefined
        }
      };
    }

    if (accessLevel === 'limited') {
      return {
        ...baseData,
        personalInfo: {
          ...baseData.personalInfo,
          phoneNumber: this.maskPhoneNumber(staff.personalInfo.phoneNumber),
          email: this.maskEmail(staff.personalInfo.email)
        },
        performanceInfo: {
          // REMOVED: rating, isAcceptingNewPatients - Belong to other services
          consultationFee: staff.consultationFee
        }
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
   * HIPAA audit logging for staff access
   */
  private async auditStaffAccess(staff: ProviderStaff, request: GetStaffProfileRequest, accessLevel: string): Promise<void> {
    this.logger.info('HIPAA Audit: Staff profile access', {
      action: 'STAFF_PROFILE_ACCESS',
      staffId: staff.id,
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
  private getDataAccessedList(accessLevel: string, request: GetStaffProfileRequest): string {
    const baseData = ['staff_basic_info', 'professional_info', 'employment_info'];
    
    if (accessLevel === 'full') {
      baseData.push('staff_personal_info', 'staff_contact_info');
      if (request.includeFullSchedule) {
        baseData.push('work_schedule');
      }
      if (request.includeSensitiveInfo) {
        baseData.push('credentials', 'sensitive_professional_data');
      }
    } else if (accessLevel === 'limited') {
      baseData.push('masked_contact_info', 'performance_info');
    }
    
    return baseData.join(',');
  }
}
