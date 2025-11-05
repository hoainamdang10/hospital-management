/**
 * RemoveStaffSpecializationUseCase - Application Use Case
 * V2 Clean Architecture + DDD Implementation
 * Removes specialization from staff member
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards, HIPAA
 */

import { BaseHealthcareUseCase, ValidationResult } from '@shared/application/base/base-healthcare-use-case';
import { IProviderStaffRepository } from '../../domain/repositories/IProviderStaffRepository';
import { StaffId } from '../../domain/value-objects/StaffId';
import { ILogger } from '../interfaces/ILogger';

export interface RemoveStaffSpecializationRequest {
  staffId: string;
  specializationCode: string;
  removedBy: string;
  removedByRole: string;
  requestMetadata?: {
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
  };
}

export interface RemoveStaffSpecializationResponse {
  success: boolean;
  message: string;
  errors?: string[];
}

/**
 * Use Case: Remove Staff Specialization
 * Removes a specialization from a staff member
 */
export class RemoveStaffSpecializationUseCase extends BaseHealthcareUseCase<
  RemoveStaffSpecializationRequest,
  RemoveStaffSpecializationResponse
> {
  constructor(
    private readonly staffRepository: IProviderStaffRepository,
    private readonly logger: ILogger
  ) {
    super();
  }

  protected async executeImpl(
    request: RemoveStaffSpecializationRequest
  ): Promise<RemoveStaffSpecializationResponse> {
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

      // 3. Remove specialization from staff
      try {
        staff.removeSpecialization(request.specializationCode);
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Không thể xóa chuyên khoa'
        };
      }

      // 4. Save to repository
      await this.staffRepository.save(staff);

      // 5. Publish domain events (if aggregate supports it)
      // Note: ProviderStaff aggregate will publish events internally

      this.logger.info('Staff specialization removed successfully', {
        staffId: request.staffId,
        specializationCode: request.specializationCode,
        removedBy: request.removedBy
      });

      return {
        success: true,
        message: 'Xóa chuyên khoa thành công'
      };

    } catch (error) {
      this.logger.error('Error removing staff specialization', {
        error: error instanceof Error ? error.message : 'Unknown error',
        staffId: request.staffId
      });

      return {
        success: false,
        message: error instanceof Error ? error.message : 'Lỗi hệ thống khi xóa chuyên khoa'
      };
    }
  }

  protected override async validateRequest(request: RemoveStaffSpecializationRequest): Promise<ValidationResult> {
    const errors: string[] = [];

    if (!request.staffId) {
      errors.push('Staff ID không được để trống');
    }

    if (!request.specializationCode) {
      errors.push('Mã chuyên khoa không được để trống');
    }

    if (!request.removedBy) {
      errors.push('Người xóa không được để trống');
    }

    if (!request.removedByRole) {
      errors.push('Vai trò người xóa không được để trống');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
