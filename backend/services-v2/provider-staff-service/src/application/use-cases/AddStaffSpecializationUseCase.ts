/**
 * AddStaffSpecializationUseCase - Application Use Case
 * V2 Clean Architecture + DDD Implementation
 * Adds new specialization to staff member
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards, HIPAA
 */

import { BaseHealthcareUseCase, ValidationResult } from '../../../../shared/application/base/base-healthcare-use-case';
import { IProviderStaffRepository } from '../../domain/repositories/IProviderStaffRepository';
import { StaffId } from '../../domain/value-objects/StaffId';
import { Specialization } from '../../domain/entities/Specialization';
import { ILogger } from '../interfaces/ILogger';

export interface AddStaffSpecializationRequest {
  staffId: string;
  code: string; // Specialization code (e.g., 'CARDIO', 'NEURO')
  name: string; // Specialization name (e.g., 'Tim mạch', 'Thần kinh')
  description?: string;
  isActive?: boolean;
  addedBy: string;
  addedByRole: string;
  requestMetadata?: {
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
  };
}

export interface AddStaffSpecializationResponse {
  success: boolean;
  message: string;
  errors?: string[];
  data?: {
    staffId: string;
    specializationId: string;
    code: string;
    name: string;
    description?: string;
    isActive: boolean;
  };
}

/**
 * Use Case: Add Staff Specialization
 * Adds a new specialization to a staff member
 */
export class AddStaffSpecializationUseCase extends BaseHealthcareUseCase<
  AddStaffSpecializationRequest,
  AddStaffSpecializationResponse
> {
  constructor(
    private readonly staffRepository: IProviderStaffRepository,
    private readonly logger: ILogger
  ) {
    super();
  }

  protected async executeImpl(
    request: AddStaffSpecializationRequest
  ): Promise<AddStaffSpecializationResponse> {
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

      // 3. Create new specialization
      const specialization = Specialization.create({
        code: request.code,
        name: request.name,
        description: request.description,
        isActive: request.isActive !== undefined ? request.isActive : true
      });

      // 4. Add specialization to staff
      try {
        staff.addSpecialization(specialization);
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Không thể thêm chuyên khoa'
        };
      }

      // 5. Save to repository
      await this.staffRepository.save(staff);

      // 6. Publish domain events (if aggregate supports it)
      // Note: ProviderStaff aggregate will publish events internally

      this.logger.info('Staff specialization added successfully', {
        staffId: request.staffId,
        specializationId: specialization.id,
        code: specialization.code,
        addedBy: request.addedBy
      });

      return {
        success: true,
        message: 'Thêm chuyên khoa thành công',
        data: {
          staffId: request.staffId,
          specializationId: specialization.id,
          code: specialization.code,
          name: specialization.name,
          description: specialization.description,
          isActive: specialization.isActive
        }
      };

    } catch (error) {
      this.logger.error('Error adding staff specialization', {
        error: error instanceof Error ? error.message : 'Unknown error',
        staffId: request.staffId
      });

      return {
        success: false,
        message: error instanceof Error ? error.message : 'Lỗi hệ thống khi thêm chuyên khoa'
      };
    }
  }

  protected override async validateRequest(request: AddStaffSpecializationRequest): Promise<ValidationResult> {
    const errors: string[] = [];

    if (!request.staffId) {
      errors.push('Staff ID không được để trống');
    }

    if (!request.code) {
      errors.push('Mã chuyên khoa không được để trống');
    } else if (request.code.trim().length === 0) {
      errors.push('Mã chuyên khoa không được để trống');
    }

    if (!request.name) {
      errors.push('Tên chuyên khoa không được để trống');
    } else if (request.name.trim().length === 0) {
      errors.push('Tên chuyên khoa không được để trống');
    }

    if (!request.addedBy) {
      errors.push('Người thêm không được để trống');
    }

    if (!request.addedByRole) {
      errors.push('Vai trò người thêm không được để trống');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
