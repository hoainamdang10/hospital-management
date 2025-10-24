/**
 * Activate Staff Use Case
 * Activates inactive or suspended staff member
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { BaseHealthcareUseCase, ValidationResult } from '../../../../shared/application/base/base-healthcare-use-case';
import { IProviderStaffRepository } from '../../domain/repositories/IProviderStaffRepository';
import { ILogger } from '../interfaces/ILogger';
import { StaffId } from '../../domain/value-objects/StaffId';

export interface ActivateStaffRequest {
  staffId: string;
  requestedBy: string;
  requestedByRole: string;
  requestMetadata?: {
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
  };
}

export interface ActivateStaffResponse {
  staffId: string;
  status: string;
  isActive: boolean;
  activatedAt: Date;
}

export class ActivateStaffUseCase extends BaseHealthcareUseCase<
  ActivateStaffRequest,
  ActivateStaffResponse
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
  protected override async validateRequest(request: ActivateStaffRequest): Promise<ValidationResult> {
    const errors: string[] = [];

    // Validate staffId
    if (!request.staffId || request.staffId.trim().length === 0) {
      errors.push('ID nhân viên không được để trống');
    } else if (!request.staffId.match(/^[A-Z]{3}-[A-Z]{4}-\d{6}-\d{3}$/)) {
      errors.push('ID nhân viên không hợp lệ');
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

  protected async executeImpl(request: ActivateStaffRequest): Promise<ActivateStaffResponse> {
    const { staffId, requestedBy, requestedByRole } = request;

    // Validate request
    if (!requestedBy || requestedBy.trim().length === 0) {
      throw new Error('Người yêu cầu không được để trống');
    }

    if (!requestedByRole || requestedByRole.trim().length === 0) {
      throw new Error('Vai trò người yêu cầu không được để trống');
    }

    // Parse staffId (will throw if invalid)
    const parsedStaffId = StaffId.fromString(staffId);

    // Get staff by ID
    const staff = await this.staffRepository.findById(parsedStaffId);
    if (!staff) {
      throw new Error('Không tìm thấy nhân viên');
    }

    // Activate staff (domain logic will validate business rules)
    staff.activate(requestedBy);

    // Save staff (will publish domain events)
    await this.staffRepository.update(staff);

    // HIPAA audit logging
    this.logger.info('Staff activated', {
      staffId: staff.id,
      oldStatus: staff.status,
      newStatus: 'active',
      activatedBy: requestedBy,
      timestamp: new Date().toISOString(),
      metadata: request.requestMetadata
    });

    return {
      staffId: staff.staffIdValue,
      status: staff.status,
      isActive: staff.isActive,
      activatedAt: new Date()
    };
  }
}

