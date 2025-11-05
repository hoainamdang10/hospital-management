/**
 * RemoveStaffCredentialUseCase - Application Use Case
 * V2 Clean Architecture + DDD Implementation
 * Handles removing credentials from staff profile
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards, HIPAA
 */

import { BaseHealthcareUseCase, ValidationResult } from '@shared/application/base/base-healthcare-use-case';
import { IProviderStaffRepository } from '../../domain/repositories/IProviderStaffRepository';
import { StaffId } from '../../domain/value-objects/StaffId';
import { ILogger } from '../interfaces/ILogger';

export interface RemoveStaffCredentialRequest {
  staffId: string;
  credentialNumber: string;
  reason?: string;
  requestedBy: string;
  requestedByRole: string;
  requestMetadata?: {
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
  };
}

export interface RemoveStaffCredentialResponse {
  success: boolean;
  message: string;
  data?: {
    staffId: string;
    credentialNumber: string;
    removedAt: string;
  };
  errors?: string[];
}

export class RemoveStaffCredentialUseCase extends BaseHealthcareUseCase<
  RemoveStaffCredentialRequest,
  RemoveStaffCredentialResponse
> {
  constructor(
    private readonly staffRepository: IProviderStaffRepository,
    private readonly logger: ILogger
  ) {
    super();
  }

  /**
   * Execute remove staff credential
   */
  protected async executeImpl(request: RemoveStaffCredentialRequest): Promise<RemoveStaffCredentialResponse> {
    try {
      this.logger.info('Removing staff credential', {
        staffId: request.staffId,
        credentialNumber: request.credentialNumber,
        requestedBy: request.requestedBy
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

      // 2. Get staff by ID
      const staffId = StaffId.create(request.staffId);
      const staff = await this.staffRepository.findById(staffId);

      if (!staff) {
        return {
          success: false,
          message: 'Không tìm thấy nhân viên',
          errors: ['STAFF_NOT_FOUND']
        };
      }

      // 3. Check if staff is active
      if (!staff.isActive) {
        return {
          success: false,
          message: 'Nhân viên không hoạt động, không thể xóa chứng chỉ',
          errors: ['STAFF_INACTIVE']
        };
      }

      // 4. Remove credential from staff aggregate
      // This will throw error if it's the only valid credential
      staff.removeCredential(request.credentialNumber);

      // 5. Save staff
      await this.staffRepository.update(staff);

      this.logger.info('Staff credential removed successfully', {
        staffId: request.staffId,
        credentialNumber: request.credentialNumber,
        reason: request.reason
      });

      // 6. HIPAA audit logging
      await this.auditCredentialRemoval(request);

      return {
        success: true,
        message: 'Xóa chứng chỉ thành công',
        data: {
          staffId: staff.id,
          credentialNumber: request.credentialNumber,
          removedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      this.logger.error('Failed to remove staff credential', {
        staffId: request.staffId,
        credentialNumber: request.credentialNumber,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        message: error instanceof Error ? error.message : 'Lỗi không xác định khi xóa chứng chỉ',
        errors: ['REMOVE_CREDENTIAL_FAILED']
      };
    }
  }

  /**
   * Validate request
   */
  protected override async validateRequest(request: RemoveStaffCredentialRequest): Promise<ValidationResult> {
    const errors: string[] = [];

    // Validate staffId
    if (!request.staffId || request.staffId.trim().length === 0) {
      errors.push('ID nhân viên không được để trống');
    }

    // Validate credentialNumber
    if (!request.credentialNumber || request.credentialNumber.trim().length === 0) {
      errors.push('Số chứng chỉ không được để trống');
    }

    // Validate requestedBy
    if (!request.requestedBy || request.requestedBy.trim().length === 0) {
      errors.push('Người yêu cầu không được để trống');
    }

    // Validate requestedByRole
    if (!request.requestedByRole || request.requestedByRole.trim().length === 0) {
      errors.push('Vai trò người yêu cầu không được để trống');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * HIPAA audit logging for credential removal
   */
  private async auditCredentialRemoval(request: RemoveStaffCredentialRequest): Promise<void> {
    this.logger.info('HIPAA Audit: Staff credential removed', {
      action: 'REMOVE_STAFF_CREDENTIAL',
      staffId: request.staffId,
      credentialNumber: request.credentialNumber,
      reason: request.reason,
      requestedBy: request.requestedBy,
      requestedByRole: request.requestedByRole,
      timestamp: new Date().toISOString(),
      ipAddress: request.requestMetadata?.ipAddress,
      userAgent: request.requestMetadata?.userAgent,
      sessionId: request.requestMetadata?.sessionId
    });
  }
}
