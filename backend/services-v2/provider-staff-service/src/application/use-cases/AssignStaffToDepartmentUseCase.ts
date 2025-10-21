/**
 * Assign Staff To Department Use Case
 * Provider/Staff Service V2
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD
 */

import { IProviderStaffRepository } from '../../domain/repositories/IProviderStaffRepository';
import { StaffId } from '../../domain/value-objects/StaffId';
import { ILogger } from '../interfaces/ILogger';
import { IAuditService } from '../interfaces/IAuditService';
import { DepartmentAssignment } from '../../domain/entities/DepartmentAssignment';

export interface AssignStaffToDepartmentRequest {
  staffId: string;
  departmentId: string;
  departmentName: string;
  role: string;
  isPrimary?: boolean;
  startDate?: Date;
  assignedBy: string;
  assignedByRole: string;
  requestMetadata?: {
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
  };
}

export interface AssignStaffToDepartmentResponse {
  success: boolean;
  message: string;
  data?: {
    staffId: string;
    departmentId: string;
    departmentName: string;
    role: string;
    isPrimary: boolean;
    startDate: string;
  };
  errors?: string[];
}

/**
 * Assign Staff To Department Use Case
 * Assigns a staff member to a department with a specific role
 */
export class AssignStaffToDepartmentUseCase {
  constructor(
    private staffRepository: IProviderStaffRepository,
    private logger: ILogger,
    private auditService?: IAuditService
  ) {}

  async execute(request: AssignStaffToDepartmentRequest): Promise<AssignStaffToDepartmentResponse> {
    try {
      this.logger.info('Assigning staff to department', {
        staffId: request.staffId,
        departmentId: request.departmentId,
        assignedBy: request.assignedBy
      });

      // Validate request
      const validationErrors = this.validateRequest(request);
      if (validationErrors.length > 0) {
        return {
          success: false,
          message: 'Dữ liệu phân công không hợp lệ',
          errors: validationErrors
        };
      }

      // Get staff by ID
      const staffId = StaffId.fromString(request.staffId);
      const staff = await this.staffRepository.findById(staffId);
      if (!staff) {
        return {
          success: false,
          message: 'Không tìm thấy nhân viên',
          errors: ['STAFF_NOT_FOUND']
        };
      }

      // Check if staff is active
      if (!staff.isActive) {
        return {
          success: false,
          message: 'Nhân viên không hoạt động, không thể phân công',
          errors: ['STAFF_INACTIVE']
        };
      }

      // Create department assignment
      const assignment = DepartmentAssignment.create({
        departmentId: request.departmentId,
        departmentName: request.departmentName,
        role: request.role,
        isPrimary: request.isPrimary || false,
        startDate: request.startDate || new Date(),
        isActive: true
      });

      // Assign to department (this will replace existing assignment to same department)
      staff.assignToDepartment(assignment);

      // Update staff in repository
      await this.staffRepository.update(staff);

      // Audit log
      if (this.auditService) {
        await this.auditService.logAction({
          action: 'ASSIGN_STAFF_TO_DEPARTMENT',
          entityType: 'ProviderStaff',
          entityId: staff.id,
          performedBy: request.assignedBy,
          performedByRole: request.assignedByRole,
          metadata: {
            departmentId: request.departmentId,
            departmentName: request.departmentName,
            role: request.role,
            isPrimary: request.isPrimary,
            ipAddress: request.requestMetadata?.ipAddress,
            userAgent: request.requestMetadata?.userAgent
          },
          timestamp: new Date()
        });
      }

      this.logger.info('Staff assigned to department successfully', {
        staffId: request.staffId,
        departmentId: request.departmentId,
        assignedBy: request.assignedBy
      });

      return {
        success: true,
        message: 'Phân công nhân viên thành công',
        data: {
          staffId: staff.id,
          departmentId: assignment.departmentId,
          departmentName: assignment.departmentName,
          role: assignment.role,
          isPrimary: request.isPrimary || false,
          startDate: assignment.startDate.toISOString()
        }
      };

    } catch (error) {
      this.logger.error('Error assigning staff to department', {
        error: error instanceof Error ? error.message : 'Unknown error',
        staffId: request.staffId,
        departmentId: request.departmentId
      });

      return {
        success: false,
        message: 'Lỗi khi phân công nhân viên',
        errors: [error instanceof Error ? error.message : 'UNKNOWN_ERROR']
      };
    }
  }

  private validateRequest(request: AssignStaffToDepartmentRequest): string[] {
    const errors: string[] = [];

    if (!request.staffId || request.staffId.trim().length === 0) {
      errors.push('Staff ID không được để trống');
    }

    if (!request.departmentId || request.departmentId.trim().length === 0) {
      errors.push('Department ID không được để trống');
    }

    if (!request.departmentName || request.departmentName.trim().length === 0) {
      errors.push('Tên khoa/phòng ban không được để trống');
    }

    if (!request.role || request.role.trim().length === 0) {
      errors.push('Vai trò trong khoa/phòng ban không được để trống');
    }

    if (!request.assignedBy || request.assignedBy.trim().length === 0) {
      errors.push('Người phân công không được để trống');
    }

    if (!request.assignedByRole || request.assignedByRole.trim().length === 0) {
      errors.push('Vai trò người phân công không được để trống');
    }

    // Only ADMIN or SUPER_ADMIN can assign staff to departments
    const allowedRoles = ['ADMIN', 'SUPER_ADMIN'];
    if (!allowedRoles.includes(request.assignedByRole)) {
      errors.push('Chỉ ADMIN hoặc SUPER_ADMIN mới có quyền phân công nhân viên');
    }

    // Validate start date if provided
    if (request.startDate && request.startDate > new Date()) {
      // Allow future start dates for planned assignments
      this.logger.info('Future start date provided for department assignment', {
        startDate: request.startDate
      });
    }

    return errors;
  }
}

