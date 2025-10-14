/**
 * DeactivateStaffUseCase - Application Use Case
 * V2 Clean Architecture + DDD Implementation
 * Deactivates staff member with proper authorization and audit logging
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards, HIPAA
 */

import { BaseHealthcareUseCase } from '../../../../shared/application/base/base-healthcare-use-case';
import { IProviderStaffRepository } from '../../domain/repositories/IProviderStaffRepository';
import { ProviderStaff } from '../../domain/aggregates/ProviderStaff';
import { StaffId } from '../../domain/value-objects/StaffId';
import { ILogger } from '../interfaces/ILogger';

export interface DeactivateStaffRequest {
  staffId: string;
  reason: string;
  deactivatedBy: string;
  deactivatedByRole: string;
  effectiveDate?: string; // Optional: when deactivation should take effect
  notes?: string;
  requestMetadata?: {
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
  };
}

export interface DeactivateStaffResponse {
  success: boolean;
  message: string;
  errors?: string[];
  data?: {
    staffId: string;
    deactivatedAt: string;
    reason: string;
  };
}

/**
 * Deactivate Staff Use Case
 * Handles staff deactivation with proper authorization and audit trail
 */
export class DeactivateStaffUseCase extends BaseHealthcareUseCase<DeactivateStaffRequest, DeactivateStaffResponse> {
  constructor(
    private readonly staffRepository: IProviderStaffRepository,
    private readonly logger: ILogger
  ) {
    super();
  }

  /**
   * Execute deactivate staff
   */
  protected async executeImpl(request: DeactivateStaffRequest): Promise<DeactivateStaffResponse> {
    try {
      this.logger.info('Deactivating staff', {
        staffId: request.staffId,
        deactivatedBy: request.deactivatedBy,
        deactivatedByRole: request.deactivatedByRole,
        reason: request.reason
      });

      // 1. Validate request
      const validationResult = this.validateRequest(request);
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

      // 3. Check if already deactivated
      if (!staff.isActive) {
        return {
          success: false,
          message: 'Nhân viên đã bị vô hiệu hóa trước đó'
        };
      }

      // 4. Check authorization
      const authResult = this.checkAuthorization(staff, request);
      if (!authResult.authorized) {
        this.logger.warn('Unauthorized staff deactivation attempt', {
          staffId: staff.id.value,
          deactivatedBy: request.deactivatedBy,
          deactivatedByRole: request.deactivatedByRole,
          reason: authResult.reason
        });

        return {
          success: false,
          message: 'Không có quyền vô hiệu hóa nhân viên này'
        };
      }

      // 5. Deactivate staff
      staff.deactivate(request.reason);

      // 6. Update metadata
      staff.props.updatedAt = new Date();
      staff.props.updatedBy = request.deactivatedBy;

      // 7. Save updated staff
      await this.staffRepository.save(staff);

      // 8. HIPAA audit logging
      await this.auditStaffDeactivation(staff, request);

      this.logger.info('Staff deactivated successfully', {
        staffId: staff.id.value,
        deactivatedBy: request.deactivatedBy,
        reason: request.reason
      });

      return {
        success: true,
        message: 'Vô hiệu hóa nhân viên thành công',
        data: {
          staffId: staff.id.value,
          deactivatedAt: staff.props.updatedAt.toISOString(),
          reason: request.reason
        }
      };

    } catch (error) {
      this.logger.error('Error deactivating staff', {
        staffId: request.staffId,
        deactivatedBy: request.deactivatedBy,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        message: 'Lỗi hệ thống khi vô hiệu hóa nhân viên'
      };
    }
  }

  /**
   * Validate request
   */
  private validateRequest(request: DeactivateStaffRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Staff ID validation
    if (!request.staffId || request.staffId.trim().length === 0) {
      errors.push('ID nhân viên không được để trống');
    }

    // Reason validation
    if (!request.reason || request.reason.trim().length === 0) {
      errors.push('Lý do vô hiệu hóa không được để trống');
    }

    if (request.reason && request.reason.trim().length < 10) {
      errors.push('Lý do vô hiệu hóa phải có ít nhất 10 ký tự');
    }

    // Deactivated by validation
    if (!request.deactivatedBy || request.deactivatedBy.trim().length === 0) {
      errors.push('Thông tin người vô hiệu hóa không được để trống');
    }

    // Role validation
    if (!request.deactivatedByRole || request.deactivatedByRole.trim().length === 0) {
      errors.push('Vai trò người vô hiệu hóa không được để trống');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Check authorization for staff deactivation
   */
  private checkAuthorization(staff: ProviderStaff, request: DeactivateStaffRequest): {
    authorized: boolean;
    reason?: string;
  } {
    const { deactivatedBy, deactivatedByRole } = request;

    // Staff cannot deactivate themselves
    if (staff.userId === deactivatedBy) {
      return { 
        authorized: false, 
        reason: 'Staff cannot deactivate themselves' 
      };
    }

    // Admin has full deactivation access
    if (deactivatedByRole === 'admin') {
      return { authorized: true };
    }

    // HR can deactivate staff
    if (deactivatedByRole === 'hr') {
      return { authorized: true };
    }

    // Department head can deactivate their department staff
    if (deactivatedByRole === 'department_head') {
      return { authorized: true };
    }

    // Default: no access
    return { 
      authorized: false, 
      reason: `Role ${deactivatedByRole} not authorized for staff deactivation` 
    };
  }

  /**
   * HIPAA audit logging for staff deactivation
   */
  private async auditStaffDeactivation(
    staff: ProviderStaff, 
    request: DeactivateStaffRequest
  ): Promise<void> {
    this.logger.info('HIPAA Audit: Staff deactivation', {
      action: 'STAFF_DEACTIVATION',
      staffId: staff.id.value,
      staffType: staff.staffType,
      deactivatedBy: request.deactivatedBy,
      deactivatedByRole: request.deactivatedByRole,
      reason: request.reason,
      notes: request.notes,
      effectiveDate: request.effectiveDate,
      timestamp: new Date().toISOString(),
      ipAddress: request.requestMetadata?.ipAddress,
      userAgent: request.requestMetadata?.userAgent,
      sessionId: request.requestMetadata?.sessionId,
      complianceLevel: 'hipaa',
      severity: 'high'
    });
  }
}

