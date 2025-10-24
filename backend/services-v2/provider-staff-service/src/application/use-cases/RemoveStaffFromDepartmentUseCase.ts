/**
 * Remove Staff From Department Use Case
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

export interface RemoveStaffFromDepartmentRequest {
  staffId: string;
  departmentId: string;
  endDate?: Date;
  removedBy: string;
  removedByRole: string;
  reason?: string;
  requestMetadata?: {
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
  };
}

export interface RemoveStaffFromDepartmentResponse {
  success: boolean;
  message: string;
  data?: {
    staffId: string;
    departmentId: string;
    endDate: string;
  };
  errors?: string[];
}

/**
 * Remove Staff From Department Use Case
 * Removes a staff member from a department assignment
 */
export class RemoveStaffFromDepartmentUseCase {
  constructor(
    private staffRepository: IProviderStaffRepository,
    private logger: ILogger,
    private auditService?: IAuditService
  ) {}

  async execute(request: RemoveStaffFromDepartmentRequest): Promise<RemoveStaffFromDepartmentResponse> {
    try {
      this.logger.info('Removing staff from department', {
        staffId: request.staffId,
        departmentId: request.departmentId,
        removedBy: request.removedBy
      });

      // Validate request
      const validationErrors = this.validateRequest(request);
      if (validationErrors.length > 0) {
        return {
          success: false,
          message: 'Dữ liệu xóa phân công không hợp lệ',
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

      // Find department assignment
      const assignment = staff.departmentAssignments.find(
        a => a.departmentId === request.departmentId && a.isActive
      );

      if (!assignment) {
        return {
          success: false,
          message: 'Không tìm thấy phân công khoa/phòng ban',
          errors: ['DEPARTMENT_ASSIGNMENT_NOT_FOUND']
        };
      }

      // End the assignment
      const endDate = request.endDate || new Date();
      assignment.end(endDate);

      // Update staff in repository
      await this.staffRepository.update(staff);

      // Audit log
      if (this.auditService && this.auditService.logAction) {
        await this.auditService.logAction({
          action: 'REMOVE_STAFF_FROM_DEPARTMENT',
          entityType: 'ProviderStaff',
          entityId: staff.id,
          performedBy: request.removedBy,
          performedByRole: request.removedByRole,
          metadata: {
            departmentId: request.departmentId,
            endDate: endDate.toISOString(),
            reason: request.reason,
            ipAddress: request.requestMetadata?.ipAddress,
            userAgent: request.requestMetadata?.userAgent
          },
          timestamp: new Date()
        });
      }

      this.logger.info('Staff removed from department successfully', {
        staffId: request.staffId,
        departmentId: request.departmentId,
        removedBy: request.removedBy
      });

      return {
        success: true,
        message: 'Xóa phân công nhân viên thành công',
        data: {
          staffId: staff.id,
          departmentId: request.departmentId,
          endDate: endDate.toISOString()
        }
      };

    } catch (error) {
      this.logger.error('Error removing staff from department', {
        error: error instanceof Error ? error.message : 'Unknown error',
        staffId: request.staffId,
        departmentId: request.departmentId
      });

      return {
        success: false,
        message: 'Lỗi khi xóa phân công nhân viên',
        errors: [error instanceof Error ? error.message : 'UNKNOWN_ERROR']
      };
    }
  }

  private validateRequest(request: RemoveStaffFromDepartmentRequest): string[] {
    const errors: string[] = [];

    if (!request.staffId || request.staffId.trim().length === 0) {
      errors.push('Staff ID không được để trống');
    }

    if (!request.departmentId || request.departmentId.trim().length === 0) {
      errors.push('Department ID không được để trống');
    }

    if (!request.removedBy || request.removedBy.trim().length === 0) {
      errors.push('Người xóa phân công không được để trống');
    }

    if (!request.removedByRole || request.removedByRole.trim().length === 0) {
      errors.push('Vai trò người xóa phân công không được để trống');
    }

    // Only ADMIN or SUPER_ADMIN can remove staff from departments
    const allowedRoles = ['ADMIN', 'SUPER_ADMIN'];
    if (!allowedRoles.includes(request.removedByRole)) {
      errors.push('Chỉ ADMIN hoặc SUPER_ADMIN mới có quyền xóa phân công nhân viên');
    }

    // Validate end date if provided
    if (request.endDate && request.endDate > new Date()) {
      errors.push('Ngày kết thúc không thể trong tương lai');
    }

    return errors;
  }
}

