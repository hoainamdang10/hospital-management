/**
 * Suspend Staff Use Case
 * Suspends active staff member
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { BaseHealthcareUseCase, ValidationResult } from '@shared/application/base/base-healthcare-use-case';
import { IProviderStaffRepository } from '../../domain/repositories/IProviderStaffRepository';
import { ILogger } from '../interfaces/ILogger';
import { StaffId } from '../../domain/value-objects/StaffId';

export interface SuspendStaffRequest {
  staffId: string;
  reason: string;
  suspensionStartDate?: string;
  suspensionEndDate?: string;
  requestedBy: string;
  requestedByRole: string;
  requestMetadata?: {
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
  };
}

export interface SuspendStaffResponse {
  staffId: string;
  status: string;
  isActive: boolean;
  reason: string;
  suspendedAt: Date;
}

export class SuspendStaffUseCase extends BaseHealthcareUseCase<
  SuspendStaffRequest,
  SuspendStaffResponse
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
  protected override async validateRequest(request: SuspendStaffRequest): Promise<ValidationResult> {
    const errors: string[] = [];

    // Validate staffId
    if (!request.staffId || request.staffId.trim().length === 0) {
      errors.push('ID nhân viên không được để trống');
    } else if (!request.staffId.match(/^[A-Z]{3}-[A-Z]{4}-\d{6}-\d{3}$/)) {
      errors.push('ID nhân viên không hợp lệ');
    }

    // Validate reason
    if (!request.reason || request.reason.trim().length === 0) {
      errors.push('Lý do tạm ngưng không được để trống');
    } else if (request.reason.trim().length < 10) {
      errors.push('Lý do tạm ngưng phải có ít nhất 10 ký tự');
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

  protected async executeImpl(request: SuspendStaffRequest): Promise<SuspendStaffResponse> {
    const { staffId, reason, requestedBy } = request;

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

    // Suspend staff (domain logic will validate business rules)
    staff.suspend(reason, requestedBy);

    // Save staff (will publish domain events)
    await this.staffRepository.update(staff);

    // HIPAA audit logging
    this.logger.info('Staff suspended', {
      staffId: staff.staffIdValue,
      oldStatus: 'active',
      newStatus: 'suspended',
      reason,
      suspendedBy: requestedBy,
      timestamp: new Date().toISOString(),
      metadata: request.requestMetadata
    });

    return {
      staffId: staff.staffIdValue,
      status: staff.status,
      isActive: staff.isActive,
      reason,
      suspendedAt: new Date()
    };
  }
}

