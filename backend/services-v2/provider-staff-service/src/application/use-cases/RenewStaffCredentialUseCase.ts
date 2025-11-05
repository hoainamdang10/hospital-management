/**
 * RenewStaffCredentialUseCase - Application Use Case
 * V2 Clean Architecture + DDD Implementation
 * Handles renewing staff credentials with new expiry date
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards, HIPAA
 */

import { BaseHealthcareUseCase, ValidationResult } from '@shared/application/base/base-healthcare-use-case';
import { IProviderStaffRepository } from '../../domain/repositories/IProviderStaffRepository';
import { StaffId } from '../../domain/value-objects/StaffId';
import { ILogger } from '../interfaces/ILogger';

export interface RenewStaffCredentialRequest {
  staffId: string;
  credentialNumber: string;
  newExpiryDate: string; // ISO date string
  requestedBy: string;
  requestedByRole: string;
  requestMetadata?: {
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
  };
}

export interface RenewStaffCredentialResponse {
  success: boolean;
  message: string;
  data?: {
    staffId: string;
    credentialNumber: string;
    oldExpiryDate?: string;
    newExpiryDate: string;
    renewedAt: string;
    renewedBy: string;
  };
  errors?: string[];
}

export class RenewStaffCredentialUseCase extends BaseHealthcareUseCase<
  RenewStaffCredentialRequest,
  RenewStaffCredentialResponse
> {
  constructor(
    private readonly staffRepository: IProviderStaffRepository,
    private readonly logger: ILogger
  ) {
    super();
  }

  /**
   * Execute renew staff credential
   */
  protected async executeImpl(request: RenewStaffCredentialRequest): Promise<RenewStaffCredentialResponse> {
    try {
      this.logger.info('Renewing staff credential', {
        staffId: request.staffId,
        credentialNumber: request.credentialNumber,
        newExpiryDate: request.newExpiryDate,
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
          message: 'Nhân viên không hoạt động, không thể gia hạn chứng chỉ',
          errors: ['STAFF_INACTIVE']
        };
      }

      // 4. Get old expiry date before renewal
      const credential = staff.credentials.find(c => c.credentialNumber === request.credentialNumber);
      const oldExpiryDate = credential?.expiryDate;

      // 5. Renew credential in staff aggregate
      // This will throw error if credential doesn't exist or is revoked
      const newExpiryDate = new Date(request.newExpiryDate);
      staff.renewCredential(request.credentialNumber, newExpiryDate, request.requestedBy);

      // 6. Save staff (will publish domain events)
      await this.staffRepository.update(staff);

      this.logger.info('Staff credential renewed successfully', {
        staffId: request.staffId,
        credentialNumber: request.credentialNumber,
        oldExpiryDate: oldExpiryDate?.toISOString(),
        newExpiryDate: newExpiryDate.toISOString()
      });

      // 7. HIPAA audit logging
      await this.auditCredentialRenewal(request, oldExpiryDate);

      return {
        success: true,
        message: 'Gia hạn chứng chỉ thành công',
        data: {
          staffId: staff.id,
          credentialNumber: request.credentialNumber,
          oldExpiryDate: oldExpiryDate?.toISOString(),
          newExpiryDate: newExpiryDate.toISOString(),
          renewedAt: new Date().toISOString(),
          renewedBy: request.requestedBy
        }
      };
    } catch (error) {
      this.logger.error('Failed to renew staff credential', {
        staffId: request.staffId,
        credentialNumber: request.credentialNumber,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        message: error instanceof Error ? error.message : 'Lỗi không xác định khi gia hạn chứng chỉ',
        errors: ['RENEW_CREDENTIAL_FAILED']
      };
    }
  }

  /**
   * Validate request
   */
  protected override async validateRequest(request: RenewStaffCredentialRequest): Promise<ValidationResult> {
    const errors: string[] = [];

    // Validate staffId
    if (!request.staffId || request.staffId.trim().length === 0) {
      errors.push('ID nhân viên không được để trống');
    }

    // Validate credentialNumber
    if (!request.credentialNumber || request.credentialNumber.trim().length === 0) {
      errors.push('Số chứng chỉ không được để trống');
    }

    // Validate newExpiryDate
    if (!request.newExpiryDate) {
      errors.push('Ngày hết hạn mới không được để trống');
    } else {
      const newExpiryDate = new Date(request.newExpiryDate);
      
      if (isNaN(newExpiryDate.getTime())) {
        errors.push('Ngày hết hạn mới không hợp lệ');
      } else if (newExpiryDate <= new Date()) {
        errors.push('Ngày hết hạn mới phải trong tương lai');
      }
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
   * HIPAA audit logging for credential renewal
   */
  private async auditCredentialRenewal(
    request: RenewStaffCredentialRequest,
    oldExpiryDate?: Date
  ): Promise<void> {
    this.logger.info('HIPAA Audit: Staff credential renewed', {
      action: 'RENEW_STAFF_CREDENTIAL',
      staffId: request.staffId,
      credentialNumber: request.credentialNumber,
      oldExpiryDate: oldExpiryDate?.toISOString(),
      newExpiryDate: request.newExpiryDate,
      requestedBy: request.requestedBy,
      requestedByRole: request.requestedByRole,
      timestamp: new Date().toISOString(),
      ipAddress: request.requestMetadata?.ipAddress,
      userAgent: request.requestMetadata?.userAgent,
      sessionId: request.requestMetadata?.sessionId
    });
  }
}
