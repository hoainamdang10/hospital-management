/**
 * Remove Staff Certification Use Case
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

export interface RemoveStaffCertificationRequest {
  staffId: string;
  certificationId: string;
  removedBy: string;
  removedByRole: string;
  reason?: string;
  requestMetadata?: {
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
  };
}

export interface RemoveStaffCertificationResponse {
  success: boolean;
  message: string;
  data?: {
    staffId: string;
    certificationId: string;
    removedAt: string;
  };
  errors?: string[];
}

/**
 * Remove Staff Certification Use Case
 * Removes a certification from a staff member's profile
 */
export class RemoveStaffCertificationUseCase {
  constructor(
    private staffRepository: IProviderStaffRepository,
    private logger: ILogger,
    private auditService?: IAuditService,
  ) {}

  async execute(
    request: RemoveStaffCertificationRequest,
  ): Promise<RemoveStaffCertificationResponse> {
    try {
      this.logger.info("Removing staff certification", {
        staffId: request.staffId,
        certificationId: request.certificationId,
        removedBy: request.removedBy,
      });

      // Validate request
      const validationErrors = this.validateRequest(request);
      if (validationErrors.length > 0) {
        return {
          success: false,
          message: "Dữ liệu xóa chứng chỉ không hợp lệ",
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

      // Find certification
      const certification = staff.certifications.find(
        (c) => c.id === request.certificationId,
      );

      if (!certification) {
        return {
          success: false,
          message: "Không tìm thấy chứng chỉ",
          errors: ["CERTIFICATION_NOT_FOUND"],
        };
      }

      // Remove certification using domain method
      staff.removeCertification(request.certificationId);

      // Update staff in repository
      await this.staffRepository.update(staff);

      // Audit log
      if (this.auditService && this.auditService.logAction) {
        await this.auditService.logAction({
          action: "REMOVE_STAFF_CERTIFICATION",
          entityType: "ProviderStaff",
          entityId: staff.id,
          performedBy: request.removedBy,
          performedByRole: request.removedByRole,
          metadata: {
            certificationId: certification.id,
            certificationName: certification.certificationName,
            issuingOrganization: certification.issuingOrganization,
            reason: request.reason,
            ipAddress: request.requestMetadata?.ipAddress,
            userAgent: request.requestMetadata?.userAgent,
          },
          timestamp: new Date(),
        });
      }

      this.logger.info("Staff certification removed successfully", {
        staffId: request.staffId,
        certificationId: request.certificationId,
        removedBy: request.removedBy,
      });

      return {
        success: true,
        message: "Xóa chứng chỉ thành công",
        data: {
          staffId: staff.id,
          certificationId: request.certificationId,
          removedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      this.logger.error("Error removing staff certification", {
        error: error instanceof Error ? error.message : "Unknown error",
        staffId: request.staffId,
        certificationId: request.certificationId,
      });

      return {
        success: false,
        message: "Lỗi khi xóa chứng chỉ nhân viên",
        errors: [error instanceof Error ? error.message : "UNKNOWN_ERROR"],
      };
    }
  }

  private validateRequest(request: RemoveStaffCertificationRequest): string[] {
    const errors: string[] = [];

    if (!request.staffId || request.staffId.trim().length === 0) {
      errors.push("Staff ID không được để trống");
    }

    if (
      !request.certificationId ||
      request.certificationId.trim().length === 0
    ) {
      errors.push("Certification ID không được để trống");
    }

    if (!request.removedBy || request.removedBy.trim().length === 0) {
      errors.push("Người xóa chứng chỉ không được để trống");
    }

    if (!request.removedByRole || request.removedByRole.trim().length === 0) {
      errors.push("Vai trò người xóa chứng chỉ không được để trống");
    }

    // Only ADMIN or SUPER_ADMIN can remove certifications
    const allowedRoles = ["ADMIN", "SUPER_ADMIN"];
    const removerRole = request.removedByRole
      ? request.removedByRole.toUpperCase()
      : "";
    if (!allowedRoles.includes(removerRole)) {
      errors.push("Chỉ ADMIN hoặc SUPER_ADMIN mới có quyền xóa chứng chỉ");
    }

    return errors;
  }
}
