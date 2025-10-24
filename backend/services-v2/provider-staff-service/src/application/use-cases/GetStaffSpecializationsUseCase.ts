/**
 * GetStaffSpecializationsUseCase - Application Use Case
 * V2 Clean Architecture + DDD Implementation
 * Retrieves staff specializations
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards, HIPAA
 */

import { BaseHealthcareUseCase, ValidationResult } from '../../../../shared/application/base/base-healthcare-use-case';
import { IProviderStaffRepository } from '../../domain/repositories/IProviderStaffRepository';
import { StaffId } from '../../domain/value-objects/StaffId';
import { ILogger } from '../interfaces/ILogger';

export interface GetStaffSpecializationsRequest {
  staffId: string;
  requestedBy: string;
  requestedByRole: string;
  includeInactive?: boolean;
  requestMetadata?: {
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
  };
}

export interface GetStaffSpecializationsResponse {
  success: boolean;
  message: string;
  errors?: string[];
  data?: {
    staffId: string;
    specializations: Array<{
      id: string;
      code: string;
      name: string;
      description?: string;
      isActive: boolean;
      createdAt: string;
      updatedAt: string;
    }>;
  };
}

/**
 * Use Case: Get Staff Specializations
 * Retrieves specializations for a staff member
 */
export class GetStaffSpecializationsUseCase extends BaseHealthcareUseCase<
  GetStaffSpecializationsRequest,
  GetStaffSpecializationsResponse
> {
  constructor(
    private readonly staffRepository: IProviderStaffRepository,
    private readonly logger: ILogger
  ) {
    super();
  }

  protected async executeImpl(
    request: GetStaffSpecializationsRequest
  ): Promise<GetStaffSpecializationsResponse> {
    try {
      // 1. Validate request
      const validation = await this.validateRequest(request);
      if (!validation.isValid) {
        return {
          success: false,
          message: 'Dữ liệu đầu vào không hợp lệ',
          errors: validation.errors
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

      // 3. Get specializations
      let specializations = staff.specializations;

      // Filter inactive if requested
      if (!request.includeInactive) {
        specializations = specializations.filter(s => s.isActive);
      }

      // 4. Format response
      const specializationsData = specializations.map(s => ({
        id: s.id,
        code: s.code,
        name: s.name,
        description: s.description,
        isActive: s.isActive,
        createdAt: s.toPersistence().created_at,
        updatedAt: s.toPersistence().updated_at
      }));

      this.logger.info('Staff specializations retrieved successfully', {
        staffId: request.staffId,
        specializationsCount: specializationsData.length,
        requestedBy: request.requestedBy
      });

      return {
        success: true,
        message: 'Lấy danh sách chuyên khoa thành công',
        data: {
          staffId: request.staffId,
          specializations: specializationsData
        }
      };

    } catch (error) {
      this.logger.error('Error getting staff specializations', {
        error: error instanceof Error ? error.message : 'Unknown error',
        staffId: request.staffId
      });

      return {
        success: false,
        message: 'Lỗi hệ thống khi lấy danh sách chuyên khoa'
      };
    }
  }

  protected override async validateRequest(request: GetStaffSpecializationsRequest): Promise<ValidationResult> {
    const errors: string[] = [];

    if (!request.staffId) {
      errors.push('Staff ID không được để trống');
    }

    if (!request.requestedBy) {
      errors.push('Người yêu cầu không được để trống');
    }

    if (!request.requestedByRole) {
      errors.push('Vai trò người yêu cầu không được để trống');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
