/**
 * AddStaffCredentialUseCase - Application Use Case
 * V2 Clean Architecture + DDD Implementation
 * Handles adding new credentials to staff profile
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards, HIPAA
 */

import { BaseHealthcareUseCase, ValidationResult } from '../../../../shared/application/base/base-healthcare-use-case';
import { IProviderStaffRepository } from '../../domain/repositories/IProviderStaffRepository';
import { StaffId } from '../../domain/value-objects/StaffId';
import { StaffCredential } from '../../domain/entities/StaffCredential';
import { ILogger } from '../interfaces/ILogger';

export interface AddStaffCredentialRequest {
  staffId: string;
  credentialNumber: string;
  credentialType: string; // 'license', 'certificate', 'registration'
  issuingAuthority: string;
  issueDate: string; // ISO date string
  expiryDate?: string; // ISO date string
  requestedBy: string;
  requestedByRole: string;
  requestMetadata?: {
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
  };
}

export interface AddStaffCredentialResponse {
  success: boolean;
  message: string;
  data?: {
    staffId: string;
    credentialId: string;
    credentialNumber: string;
    credentialType: string;
    issuingAuthority: string;
    issueDate: string;
    expiryDate?: string;
    isValid: boolean;
  };
  errors?: string[];
}

export class AddStaffCredentialUseCase extends BaseHealthcareUseCase<
  AddStaffCredentialRequest,
  AddStaffCredentialResponse
> {
  constructor(
    private readonly staffRepository: IProviderStaffRepository,
    private readonly logger: ILogger
  ) {
    super();
  }

  /**
   * Execute add staff credential
   */
  protected async executeImpl(request: AddStaffCredentialRequest): Promise<AddStaffCredentialResponse> {
    try {
      this.logger.info('Adding staff credential', {
        staffId: request.staffId,
        credentialType: request.credentialType,
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
          message: 'Nhân viên không hoạt động, không thể thêm chứng chỉ',
          errors: ['STAFF_INACTIVE']
        };
      }

      // 4. Create credential entity
      const credential = StaffCredential.create({
        credentialNumber: request.credentialNumber,
        credentialType: request.credentialType,
        issuingAuthority: request.issuingAuthority,
        issueDate: new Date(request.issueDate),
        expiryDate: request.expiryDate ? new Date(request.expiryDate) : undefined
      });

      // 5. Add credential to staff aggregate
      staff.addCredential(credential);

      // 6. Save staff (will publish domain events)
      await this.staffRepository.update(staff);

      this.logger.info('Staff credential added successfully', {
        staffId: request.staffId,
        credentialId: credential.id,
        credentialNumber: credential.credentialNumber
      });

      // 7. HIPAA audit logging
      await this.auditCredentialAddition(request, credential.id);

      return {
        success: true,
        message: 'Thêm chứng chỉ thành công',
        data: {
          staffId: staff.id,
          credentialId: credential.id,
          credentialNumber: credential.credentialNumber,
          credentialType: credential.credentialType,
          issuingAuthority: credential.issuingAuthority,
          issueDate: credential.issueDate.toISOString(),
          expiryDate: credential.expiryDate?.toISOString(),
          isValid: credential.isValid
        }
      };
    } catch (error) {
      this.logger.error('Failed to add staff credential', {
        staffId: request.staffId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        message: error instanceof Error ? error.message : 'Lỗi không xác định khi thêm chứng chỉ',
        errors: ['ADD_CREDENTIAL_FAILED']
      };
    }
  }

  /**
   * Validate request
   */
  protected override async validateRequest(request: AddStaffCredentialRequest): Promise<ValidationResult> {
    const errors: string[] = [];

    // Validate staffId
    if (!request.staffId || request.staffId.trim().length === 0) {
      errors.push('ID nhân viên không được để trống');
    }

    // Validate credentialNumber
    if (!request.credentialNumber || request.credentialNumber.trim().length === 0) {
      errors.push('Số chứng chỉ không được để trống');
    }

    // Validate credentialType
    const validTypes = ['license', 'certificate', 'registration'];
    if (!request.credentialType || !validTypes.includes(request.credentialType)) {
      errors.push('Loại chứng chỉ không hợp lệ (license, certificate, registration)');
    }

    // Validate issuingAuthority
    if (!request.issuingAuthority || request.issuingAuthority.trim().length === 0) {
      errors.push('Cơ quan cấp không được để trống');
    }

    // Validate issueDate
    if (!request.issueDate) {
      errors.push('Ngày cấp không được để trống');
    } else {
      const issueDate = new Date(request.issueDate);
      if (isNaN(issueDate.getTime())) {
        errors.push('Ngày cấp không hợp lệ');
      } else if (issueDate > new Date()) {
        errors.push('Ngày cấp không thể trong tương lai');
      }
    }

    // Validate expiryDate (if provided)
    if (request.expiryDate) {
      const expiryDate = new Date(request.expiryDate);
      const issueDate = new Date(request.issueDate);
      
      if (isNaN(expiryDate.getTime())) {
        errors.push('Ngày hết hạn không hợp lệ');
      } else if (expiryDate <= issueDate) {
        errors.push('Ngày hết hạn phải sau ngày cấp');
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
   * HIPAA audit logging for credential addition
   */
  private async auditCredentialAddition(
    request: AddStaffCredentialRequest,
    credentialId: string
  ): Promise<void> {
    this.logger.info('HIPAA Audit: Staff credential added', {
      action: 'ADD_STAFF_CREDENTIAL',
      staffId: request.staffId,
      credentialId,
      credentialType: request.credentialType,
      requestedBy: request.requestedBy,
      requestedByRole: request.requestedByRole,
      timestamp: new Date().toISOString(),
      ipAddress: request.requestMetadata?.ipAddress,
      userAgent: request.requestMetadata?.userAgent,
      sessionId: request.requestMetadata?.sessionId
    });
  }
}
