/**
 * Verify Staff Credential Use Case
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

export interface VerifyStaffCredentialRequest {
  staffId: string;
  credentialId: string;
  verifiedBy: string;
  verifiedByRole: string;
  requestMetadata?: {
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
  };
}

export interface VerifyStaffCredentialResponse {
  success: boolean;
  message: string;
  data?: {
    staffId: string;
    credentialId: string;
    credentialNumber: string;
    verifiedAt: string;
    verifiedBy: string;
  };
  errors?: string[];
}

/**
 * Verify Staff Credential Use Case
 * Verifies a staff member's credential
 */
export class VerifyStaffCredentialUseCase {
  constructor(
    private staffRepository: IProviderStaffRepository,
    private logger: ILogger,
    private auditService?: IAuditService
  ) {}

  async execute(request: VerifyStaffCredentialRequest): Promise<VerifyStaffCredentialResponse> {
    try {
      this.logger.info('Verifying staff credential', {
        staffId: request.staffId,
        credentialId: request.credentialId,
        verifiedBy: request.verifiedBy
      });

      // Validate request
      const validationErrors = this.validateRequest(request);
      if (validationErrors.length > 0) {
        return {
          success: false,
          message: 'Dữ liệu xác thực chứng chỉ không hợp lệ',
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

      // Find credential by ID
      const credential = staff.credentials.find(c => c.id === request.credentialId);
      if (!credential) {
        return {
          success: false,
          message: 'Không tìm thấy chứng chỉ',
          errors: ['CREDENTIAL_NOT_FOUND']
        };
      }

      // Check if credential is already verified
      if (credential.isValid) {
        return {
          success: false,
          message: 'Chứng chỉ đã được xác thực trước đó',
          errors: ['CREDENTIAL_ALREADY_VERIFIED']
        };
      }

      // Check if credential is expired
      if (credential.isExpired()) {
        return {
          success: false,
          message: 'Chứng chỉ đã hết hạn, không thể xác thực',
          errors: ['CREDENTIAL_EXPIRED']
        };
      }

      // Verify credential
      credential.verify(request.verifiedBy);

      // Update staff in repository
      await this.staffRepository.update(staff);

      // Audit log
      if (this.auditService && this.auditService.logAction) {
        await this.auditService.logAction({
          action: 'VERIFY_STAFF_CREDENTIAL',
          entityType: 'ProviderStaff',
          entityId: staff.id,
          performedBy: request.verifiedBy,
          performedByRole: request.verifiedByRole,
          metadata: {
            credentialId: credential.id,
            credentialNumber: credential.credentialNumber,
            credentialType: credential.credentialType,
            ipAddress: request.requestMetadata?.ipAddress,
            userAgent: request.requestMetadata?.userAgent
          },
          timestamp: new Date()
        });
      }

      this.logger.info('Staff credential verified successfully', {
        staffId: request.staffId,
        credentialId: credential.id,
        verifiedBy: request.verifiedBy
      });

      return {
        success: true,
        message: 'Xác thực chứng chỉ thành công',
        data: {
          staffId: staff.id,
          credentialId: credential.id,
          credentialNumber: credential.credentialNumber,
          verifiedAt: new Date().toISOString(),
          verifiedBy: request.verifiedBy
        }
      };

    } catch (error) {
      this.logger.error('Error verifying staff credential', {
        error: error instanceof Error ? error.message : 'Unknown error',
        staffId: request.staffId,
        credentialId: request.credentialId
      });

      return {
        success: false,
        message: 'Lỗi khi xác thực chứng chỉ nhân viên',
        errors: [error instanceof Error ? error.message : 'UNKNOWN_ERROR']
      };
    }
  }

  private validateRequest(request: VerifyStaffCredentialRequest): string[] {
    const errors: string[] = [];

    if (!request.staffId || request.staffId.trim().length === 0) {
      errors.push('Staff ID không được để trống');
    }

    if (!request.credentialId || request.credentialId.trim().length === 0) {
      errors.push('Credential ID không được để trống');
    }

    if (!request.verifiedBy || request.verifiedBy.trim().length === 0) {
      errors.push('Người xác thực không được để trống');
    }

    if (!request.verifiedByRole || request.verifiedByRole.trim().length === 0) {
      errors.push('Vai trò người xác thực không được để trống');
    }

    // Only ADMIN or SUPER_ADMIN can verify credentials
    const allowedRoles = ['ADMIN', 'SUPER_ADMIN'];
    if (!allowedRoles.includes(request.verifiedByRole)) {
      errors.push('Chỉ ADMIN hoặc SUPER_ADMIN mới có quyền xác thực chứng chỉ');
    }

    return errors;
  }
}

