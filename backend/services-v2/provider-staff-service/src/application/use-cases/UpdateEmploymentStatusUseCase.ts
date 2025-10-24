/**
 * Update Employment Status Use Case
 * Updates staff employment type (full_time, part_time, contract, intern, volunteer)
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { BaseHealthcareUseCase, ValidationResult } from '../../../../shared/application/base/base-healthcare-use-case';
import { IProviderStaffRepository } from '../../domain/repositories/IProviderStaffRepository';
import { ILogger } from '../interfaces/ILogger';
import { StaffId } from '../../domain/value-objects/StaffId';
import { EmploymentType } from '../../domain/aggregates/ProviderStaff';

export interface UpdateEmploymentStatusRequest {
  staffId: string;
  employmentType: EmploymentType;
  contractEndDate?: string; // ISO date string
  requestedBy: string;
  requestedByRole: string;
  requestMetadata?: {
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
  };
}

export interface UpdateEmploymentStatusResponse {
  staffId: string;
  employmentType: EmploymentType;
  contractEndDate?: Date;
  updatedAt: Date;
}

export class UpdateEmploymentStatusUseCase extends BaseHealthcareUseCase<
  UpdateEmploymentStatusRequest,
  UpdateEmploymentStatusResponse
> {
  constructor(
    private readonly staffRepository: IProviderStaffRepository,
    private readonly logger: ILogger
  ) {
    super();
  }

  /**
   * Validate request
   */
  protected override async validateRequest(request: UpdateEmploymentStatusRequest): Promise<ValidationResult> {
    const errors: string[] = [];

    // Validate staffId
    if (!request.staffId || request.staffId.trim().length === 0) {
      errors.push('ID nhân viên không được để trống');
    } else if (!request.staffId.match(/^[A-Z]{3}-[A-Z]{4}-\d{6}-\d{3}$/)) {
      errors.push('ID nhân viên không hợp lệ');
    }

    // Validate employmentType
    const validTypes = ['full_time', 'part_time', 'contract', 'intern', 'volunteer'];
    if (!request.employmentType || request.employmentType.trim().length === 0) {
      errors.push('Loại hình làm việc không được để trống');
    } else if (!validTypes.includes(request.employmentType)) {
      errors.push('Loại hình làm việc không hợp lệ');
    }

    // Validate contractEndDate (if provided)
    if (request.contractEndDate) {
      const contractEndDate = new Date(request.contractEndDate);
      if (isNaN(contractEndDate.getTime())) {
        errors.push('Ngày kết thúc hợp đồng không hợp lệ');
      } else if (contractEndDate <= new Date()) {
        errors.push('Ngày kết thúc hợp đồng phải trong tương lai');
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

  protected async executeImpl(request: UpdateEmploymentStatusRequest): Promise<UpdateEmploymentStatusResponse> {
    const { staffId, employmentType, contractEndDate, requestedBy } = request;

    // Validate request
    const validation = await this.validateRequest(request);
    if (!validation.isValid) {
      throw new Error(validation.errors?.[0] || 'Validation failed');
    }

    // Parse staffId
    const parsedStaffId = StaffId.fromString(staffId);

    // Get staff by ID
    const staff = await this.staffRepository.findById(parsedStaffId);
    if (!staff) {
      throw new Error('Không tìm thấy nhân viên');
    }

    // Parse contract end date
    const parsedContractEndDate = contractEndDate ? new Date(contractEndDate) : undefined;

    // Update employment status (domain logic will validate business rules)
    staff.updateEmploymentStatus(employmentType, requestedBy, parsedContractEndDate);

    // Save staff (will publish domain events)
    await this.staffRepository.update(staff);

    // HIPAA audit logging
    this.logger.info('Staff employment status updated', {
      staffId: staff.staffIdValue,
      oldEmploymentType: staff.employmentType,
      newEmploymentType: employmentType,
      contractEndDate: parsedContractEndDate?.toISOString(),
      updatedBy: requestedBy,
      timestamp: new Date().toISOString(),
      metadata: request.requestMetadata
    });

    return {
      staffId: staff.staffIdValue,
      employmentType: staff.employmentType,
      contractEndDate: parsedContractEndDate,
      updatedAt: new Date()
    };
  }
}

