/**
 * GetStaffByDepartmentUseCase - Application Use Case
 * V2 Clean Architecture + DDD Implementation
 * Retrieves all staff members in a specific department
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards, HIPAA
 */

import { BaseHealthcareUseCase, ValidationResult } from '@shared/application/base/base-healthcare-use-case';
import { IProviderStaffRepository } from '../../domain/repositories/IProviderStaffRepository';
import { StaffType } from '../../domain/aggregates/ProviderStaff';
import { ILogger } from '../interfaces/ILogger';

export interface GetStaffByDepartmentRequest {
  departmentId: string;
  includeInactive?: boolean;
  staffType?: StaffType;
  requestedBy: string;
  requestedByRole: string;
  requestMetadata?: {
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
  };
}

export interface GetStaffByDepartmentResponse {
  success: boolean;
  message: string;
  errors?: string[];
  data?: {
    department: string;
    totalStaff: number;
    activeStaff: number;
    staff: Array<{
      id: string;
      userId: string;
      staffType: StaffType;
      fullName: string;
      title: string;
      position: string;
      specializations: string[];
      yearsOfExperience: number;
      status: string;
      isActive: boolean;
    }>;
  };
}

/**
 * Get Staff By Department Use Case
 * Retrieves all staff members in a specific department
 */
export class GetStaffByDepartmentUseCase extends BaseHealthcareUseCase<GetStaffByDepartmentRequest, GetStaffByDepartmentResponse> {
  constructor(
    private readonly staffRepository: IProviderStaffRepository,
    private readonly logger: ILogger
  ) {
    super();
  }

  /**
   * Execute get staff by department
   */
  protected async executeImpl(request: GetStaffByDepartmentRequest): Promise<GetStaffByDepartmentResponse> {
    try {
      this.logger.info('Getting staff by department', {
        departmentId: request.departmentId,
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

      // 2. Get staff by department
      let staff = await this.staffRepository.findByDepartment(request.departmentId);

      // 3. Filter by staff type if provided
      if (request.staffType) {
        staff = staff.filter(s => s.staffType === request.staffType);
      }

      // 4. Filter inactive staff if not requested
      if (!request.includeInactive) {
        staff = staff.filter(s => s.isActive);
      }

      // 5. Calculate statistics
      const totalStaff = staff.length;
      const activeStaff = staff.filter(s => s.isActive).length;

      // 6. Prepare response data
      const staffData = staff.map(s => ({
        id: s.id,
        userId: s.userId,
        staffType: s.staffType,
        fullName: s.personalInfo.fullName,
        title: s.professionalInfo.title,
        position: s.professionalInfo.position,
        specializations: s.getActiveSpecializations().map(spec => spec.name),
        yearsOfExperience: s.getTotalExperience(),
        status: s.status,
        isActive: s.isActive
      }));

      // 7. HIPAA audit logging
      await this.auditDepartmentStaffAccess(request, totalStaff);

      this.logger.info('Staff by department retrieved successfully', {
        departmentId: request.departmentId,
        totalStaff,
        activeStaff,
        requestedBy: request.requestedBy
      });

      return {
        success: true,
        message: 'Lấy danh sách nhân viên theo phòng ban thành công',
        data: {
          department: request.departmentId,
          totalStaff,
          activeStaff,
          staff: staffData
        }
      };

    } catch (error) {
      this.logger.error('Error getting staff by department', {
        departmentId: request.departmentId,
        requestedBy: request.requestedBy,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        message: 'Lỗi hệ thống khi lấy danh sách nhân viên theo phòng ban'
      };
    }
  }

  /**
   * Validate request
   */
  protected override async validateRequest(request: GetStaffByDepartmentRequest): Promise<ValidationResult> {
    const errors: string[] = [];

    // Department ID validation
    if (!request.departmentId || request.departmentId.trim().length === 0) {
      errors.push('ID phòng ban không được để trống');
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
   * HIPAA audit logging for department staff access
   */
  private async auditDepartmentStaffAccess(
    request: GetStaffByDepartmentRequest,
    resultsCount: number
  ): Promise<void> {
    this.logger.info('HIPAA Audit: Department staff access', {
      action: 'DEPARTMENT_STAFF_ACCESS',
      departmentId: request.departmentId,
      requestedBy: request.requestedBy,
      requestedByRole: request.requestedByRole,
      resultsCount,
      includeInactive: request.includeInactive,
      staffType: request.staffType,
      timestamp: new Date().toISOString(),
      ipAddress: request.requestMetadata?.ipAddress,
      userAgent: request.requestMetadata?.userAgent,
      sessionId: request.requestMetadata?.sessionId,
      complianceLevel: 'hipaa'
    });
  }
}

