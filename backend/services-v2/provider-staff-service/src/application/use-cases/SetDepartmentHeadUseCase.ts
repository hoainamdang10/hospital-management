/**
 * Set Department Head Use Case
 * Provider/Staff Service V2
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD
 */

import { IProviderStaffRepository } from "../../domain/repositories/IProviderStaffRepository";
import { StaffId } from "../../domain/value-objects/StaffId";
import { ILogger } from "../interfaces/ILogger";
import { IAuditService } from "../interfaces/IAuditService";

export interface SetDepartmentHeadRequest {
  staffId: string;
  departmentId: string;
  assignedBy: string;
  assignedByRole: string;
  requestMetadata?: {
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
  };
}

export interface SetDepartmentHeadResponse {
  success: boolean;
  message: string;
  data?: {
    staffId: string;
    departmentId: string;
    isHead: boolean;
  };
  errors?: string[];
}

/**
 * Set Department Head Use Case
 * Sets a staff member as the head of a department
 * Removes isHead flag from all other staff in the same department
 */
export class SetDepartmentHeadUseCase {
  constructor(
    private staffRepository: IProviderStaffRepository,
    private logger: ILogger,
    private auditService?: IAuditService,
  ) {}

  async execute(
    request: SetDepartmentHeadRequest,
  ): Promise<SetDepartmentHeadResponse> {
    try {
      this.logger.info("Setting department head", {
        staffId: request.staffId,
        departmentId: request.departmentId,
        assignedBy: request.assignedBy,
      });

      // Validate request
      const validationErrors = this.validateRequest(request);
      if (validationErrors.length > 0) {
        return {
          success: false,
          message: "Dữ liệu không hợp lệ",
          errors: validationErrors,
        };
      }

      // Get staff by ID
      const staffId = StaffId.fromString(request.staffId);
      const staff = await this.staffRepository.findById(staffId);
      if (!staff) {
        return {
          success: false,
          message: "Không tìm thấy nhân viên",
          errors: ["STAFF_NOT_FOUND"],
        };
      }

      // Check if staff is active
      if (!staff.isActive) {
        return {
          success: false,
          message: "Nhân viên không hoạt động, không thể đặt làm trưởng khoa",
          errors: ["STAFF_INACTIVE"],
        };
      }

      // Check if staff is assigned to this department
      const departmentAssignment = staff.departmentAssignments.find(
        (assignment) => assignment.departmentId === request.departmentId
      );

      if (!departmentAssignment) {
        return {
          success: false,
          message: "Nhân viên không thuộc khoa này",
          errors: ["STAFF_NOT_IN_DEPARTMENT"],
        };
      }

      // Step 1: Remove isHead flag from all staff in this department
      const allStaffInDepartment = await this.staffRepository.findByDepartment(
        request.departmentId
      );

      for (const otherStaff of allStaffInDepartment) {
        const otherAssignment = otherStaff.departmentAssignments.find(
          (assignment) => assignment.departmentId === request.departmentId
        );
        if (otherAssignment && otherAssignment.isHead) {
          otherAssignment.isHead = false;
          await this.staffRepository.update(otherStaff);
        }
      }

      // Step 2: Set isHead=true for the selected staff
      departmentAssignment.isHead = true;
      await this.staffRepository.update(staff);

      // Audit log
      if (this.auditService && this.auditService.logAction) {
        await this.auditService.logAction({
          action: "SET_DEPARTMENT_HEAD",
          entityType: "ProviderStaff",
          entityId: staff.id,
          performedBy: request.assignedBy,
          performedByRole: request.assignedByRole,
          metadata: {
            departmentId: request.departmentId,
            ipAddress: request.requestMetadata?.ipAddress,
            userAgent: request.requestMetadata?.userAgent,
          },
          timestamp: new Date(),
        });
      }

      this.logger.info("Department head set successfully", {
        staffId: request.staffId,
        departmentId: request.departmentId,
        assignedBy: request.assignedBy,
      });

      return {
        success: true,
        message: "Đã đặt làm trưởng khoa thành công",
        data: {
          staffId: staff.id,
          departmentId: request.departmentId,
          isHead: true,
        },
      };
    } catch (error: any) {
      this.logger.error("Failed to set department head", {
        staffId: request.staffId,
        departmentId: request.departmentId,
        error: error.message,
        stack: error.stack,
      });

      return {
        success: false,
        message: "Không thể đặt trưởng khoa. Vui lòng thử lại sau.",
        errors: ["INTERNAL_ERROR"],
      };
    }
  }

  private validateRequest(request: SetDepartmentHeadRequest): string[] {
    const errors: string[] = [];

    if (!request.staffId || request.staffId.trim().length === 0) {
      errors.push("staffId là bắt buộc");
    }

    if (!request.departmentId || request.departmentId.trim().length === 0) {
      errors.push("departmentId là bắt buộc");
    }

    if (!request.assignedBy || request.assignedBy.trim().length === 0) {
      errors.push("assignedBy là bắt buộc");
    }

    if (!request.assignedByRole || request.assignedByRole.trim().length === 0) {
      errors.push("assignedByRole là bắt buộc");
    }

    return errors;
  }
}
