/**
 * GetExpiringCredentialsUseCase - Application Use Case
 * V2 Clean Architecture + DDD Implementation
 * Retrieves staff with credentials expiring within specified threshold
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards, HIPAA
 */

import { BaseHealthcareUseCase, ValidationResult } from '@shared/application/base/base-healthcare-use-case';
import { IProviderStaffRepository } from '../../domain/repositories/IProviderStaffRepository';
import { ILogger } from '../interfaces/ILogger';

export interface GetExpiringCredentialsRequest {
  daysThreshold?: number; // Default: 30 days
  staffType?: string; // Filter by staff type (optional)
  departmentId?: string; // Filter by department (optional)
  requestedBy: string;
  requestedByRole: string;
  requestMetadata?: {
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
  };
}

export interface ExpiringCredentialDTO {
  staffId: string;
  staffName: string;
  staffType: string;
  credentialId: string;
  credentialNumber: string;
  credentialType: string;
  issuingAuthority: string;
  issueDate: string;
  expiryDate: string;
  daysUntilExpiry: number;
  isExpired: boolean;
}

export interface GetExpiringCredentialsResponse {
  success: boolean;
  message: string;
  data?: {
    expiringCredentials: ExpiringCredentialDTO[];
    totalCount: number;
    daysThreshold: number;
    expiredCount: number;
    expiringSoonCount: number;
  };
  errors?: string[];
}

export class GetExpiringCredentialsUseCase extends BaseHealthcareUseCase<
  GetExpiringCredentialsRequest,
  GetExpiringCredentialsResponse
> {
  constructor(
    private readonly staffRepository: IProviderStaffRepository,
    private readonly logger: ILogger
  ) {
    super();
  }

  /**
   * Execute get expiring credentials
   */
  protected async executeImpl(request: GetExpiringCredentialsRequest): Promise<GetExpiringCredentialsResponse> {
    try {
      const daysThreshold = request.daysThreshold || 30;

      this.logger.info('Getting expiring credentials', {
        daysThreshold,
        staffType: request.staffType,
        departmentId: request.departmentId,
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

      // 2. Get all staff (with optional filters)
      const filters: any = {
        isActive: true
      };

      if (request.staffType) {
        filters.staffType = request.staffType;
      }

      const allStaff = await this.staffRepository.findAll(filters);

      // 3. Filter by department if specified
      let staffList = allStaff;
      if (request.departmentId) {
        staffList = allStaff.filter(staff => 
          staff.getCurrentDepartmentAssignments().some(d => d.departmentId === request.departmentId)
        );
      }

      // 4. Collect expiring credentials from all staff
      const expiringCredentials: ExpiringCredentialDTO[] = [];
      const now = new Date();

      for (const staff of staffList) {
        const staffExpiringCredentials = staff.getExpiringCredentials(daysThreshold);
        
        for (const credential of staffExpiringCredentials) {
          const daysUntilExpiry = credential.expiryDate 
            ? Math.ceil((credential.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
            : 0;

          expiringCredentials.push({
            staffId: staff.id,
            staffName: staff.personalInfo.fullName,
            staffType: staff.staffType,
            credentialId: credential.id,
            credentialNumber: credential.credentialNumber,
            credentialType: credential.credentialType,
            issuingAuthority: credential.issuingAuthority,
            issueDate: credential.issueDate.toISOString(),
            expiryDate: credential.expiryDate!.toISOString(),
            daysUntilExpiry,
            isExpired: credential.isExpired()
          });
        }
      }

      // 5. Sort by days until expiry (most urgent first)
      expiringCredentials.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);

      // 6. Calculate statistics
      const expiredCount = expiringCredentials.filter(c => c.isExpired).length;
      const expiringSoonCount = expiringCredentials.filter(c => !c.isExpired).length;

      this.logger.info('Expiring credentials retrieved successfully', {
        totalCount: expiringCredentials.length,
        expiredCount,
        expiringSoonCount,
        daysThreshold
      });

      // 7. HIPAA audit logging
      await this.auditExpiringCredentialsAccess(request, expiringCredentials.length);

      return {
        success: true,
        message: 'Lấy danh sách chứng chỉ sắp hết hạn thành công',
        data: {
          expiringCredentials,
          totalCount: expiringCredentials.length,
          daysThreshold,
          expiredCount,
          expiringSoonCount
        }
      };
    } catch (error) {
      this.logger.error('Failed to get expiring credentials', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        message: error instanceof Error ? error.message : 'Lỗi không xác định khi lấy danh sách chứng chỉ sắp hết hạn',
        errors: ['GET_EXPIRING_CREDENTIALS_FAILED']
      };
    }
  }

  /**
   * Validate request
   */
  protected override async validateRequest(request: GetExpiringCredentialsRequest): Promise<ValidationResult> {
    const errors: string[] = [];

    // Validate daysThreshold (if provided)
    if (request.daysThreshold !== undefined) {
      if (request.daysThreshold < 1 || request.daysThreshold > 365) {
        errors.push('Ngưỡng số ngày phải từ 1 đến 365');
      }
    }

    // Validate staffType (if provided)
    if (request.staffType) {
      const validTypes = ['doctor', 'nurse', 'technician', 'pharmacist', 'therapist', 'admin', 'receptionist'];
      if (!validTypes.includes(request.staffType)) {
        errors.push('Loại nhân viên không hợp lệ');
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
   * HIPAA audit logging for expiring credentials access
   */
  private async auditExpiringCredentialsAccess(
    request: GetExpiringCredentialsRequest,
    resultCount: number
  ): Promise<void> {
    this.logger.info('HIPAA Audit: Expiring credentials accessed', {
      action: 'GET_EXPIRING_CREDENTIALS',
      daysThreshold: request.daysThreshold || 30,
      staffType: request.staffType,
      departmentId: request.departmentId,
      resultCount,
      requestedBy: request.requestedBy,
      requestedByRole: request.requestedByRole,
      timestamp: new Date().toISOString(),
      ipAddress: request.requestMetadata?.ipAddress,
      userAgent: request.requestMetadata?.userAgent,
      sessionId: request.requestMetadata?.sessionId
    });
  }
}
