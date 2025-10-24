/**
 * Terminate Staff Use Case
 * Terminates staff member contract
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { BaseHealthcareUseCase, ValidationResult } from '../../../../shared/application/base/base-healthcare-use-case';
import { IProviderStaffRepository } from '../../domain/repositories/IProviderStaffRepository';
import { ILogger } from '../interfaces/ILogger';
import { StaffId } from '../../domain/value-objects/StaffId';

export interface TerminateStaffRequest {
  staffId: string;
  reason: string;
  terminationDate?: string; // ISO date string
  requestedBy: string;
  requestedByRole: string;
  requestMetadata?: {
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
  };
}

export interface TerminateStaffResponse {
  staffId: string;
  status: string;
  isActive: boolean;
  reason: string;
  terminationDate: Date;
  terminatedAt: Date;
}

export class TerminateStaffUseCase extends BaseHealthcareUseCase<
  TerminateStaffRequest,
  TerminateStaffResponse
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
  protected override async validateRequest(request: TerminateStaffRequest): Promise<ValidationResult> {
    const errors: string[] = [];

    // Validate staffId
    if (!request.staffId || request.staffId.trim().length === 0) {
      errors.push('ID nhân viên không được để trống');
    } else if (!request.staffId.match(/^[A-Z]{3}-[A-Z]{4}-\d{6}-\d{3}$/)) {
      errors.push('ID nhân viên không hợp lệ');
    }

    // Validate reason
    if (!request.reason || request.reason.trim().length === 0) {
      errors.push('Lý do chấm dứt hợp đồng không được để trống');
    } else if (request.reason.trim().length < 10) {
      errors.push('Lý do chấm dứt hợp đồng phải có ít nhất 10 ký tự');
    }

    // Validate terminationDate (if provided)
    if (request.terminationDate) {
      const terminationDate = new Date(request.terminationDate);
      if (isNaN(terminationDate.getTime())) {
        errors.push('Ngày chấm dứt hợp đồng không hợp lệ');
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

  protected async executeImpl(request: TerminateStaffRequest): Promise<TerminateStaffResponse> {
    const { staffId, reason, terminationDate, requestedBy } = request;

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

    // Parse termination date
    const parsedTerminationDate = terminationDate ? new Date(terminationDate) : undefined;

    // Terminate staff (domain logic will validate business rules)
    staff.terminate(reason, requestedBy, parsedTerminationDate);

    // Save staff (will publish domain events)
    await this.staffRepository.update(staff);

    // HIPAA audit logging
    this.logger.info('Staff terminated', {
      staffId: staff.staffIdValue,
      oldStatus: staff.status,
      newStatus: 'terminated',
      reason,
      terminationDate: parsedTerminationDate?.toISOString(),
      terminatedBy: requestedBy,
      timestamp: new Date().toISOString(),
      metadata: request.requestMetadata
    });

    return {
      staffId: staff.staffIdValue,
      status: staff.status,
      isActive: staff.isActive,
      reason,
      terminationDate: parsedTerminationDate || new Date(),
      terminatedAt: new Date()
    };
  }
}

