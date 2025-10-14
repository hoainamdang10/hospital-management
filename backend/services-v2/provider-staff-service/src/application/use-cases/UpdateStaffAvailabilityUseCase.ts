/**
 * UpdateStaffAvailabilityUseCase - Application Use Case
 * V2 Clean Architecture + DDD Implementation
 * Updates staff availability for scheduling
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards, HIPAA
 */

import { BaseHealthcareUseCase } from '../../../../shared/application/base/base-healthcare-use-case';
import { IProviderStaffRepository } from '../../domain/repositories/IProviderStaffRepository';
import { ProviderStaff } from '../../domain/aggregates/ProviderStaff';
import { StaffId } from '../../domain/value-objects/StaffId';
import { StaffAvailability } from '../../domain/entities/StaffAvailability';
import { ILogger } from '../interfaces/ILogger';

export interface UpdateStaffAvailabilityRequest {
  staffId: string;
  availability: {
    date: string;
    timeSlots: Array<{
      startTime: string;
      endTime: string;
      isAvailable: boolean;
      reason?: string;
    }>;
  };
  updatedBy: string;
  updatedByRole: string;
  requestMetadata?: {
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
  };
}

export interface UpdateStaffAvailabilityResponse {
  success: boolean;
  message: string;
  errors?: string[];
  data?: {
    staffId: string;
    date: string;
    updatedAt: string;
  };
}

/**
 * Update Staff Availability Use Case
 */
export class UpdateStaffAvailabilityUseCase extends BaseHealthcareUseCase<UpdateStaffAvailabilityRequest, UpdateStaffAvailabilityResponse> {
  constructor(
    private readonly staffRepository: IProviderStaffRepository,
    private readonly logger: ILogger
  ) {
    super();
  }

  protected async executeImpl(request: UpdateStaffAvailabilityRequest): Promise<UpdateStaffAvailabilityResponse> {
    try {
      this.logger.info('Updating staff availability', {
        staffId: request.staffId,
        date: request.availability.date,
        updatedBy: request.updatedBy
      });

      // Validate request
      const validationResult = this.validateRequest(request);
      if (!validationResult.isValid) {
        return {
          success: false,
          message: 'Yêu cầu không hợp lệ',
          errors: validationResult.errors
        };
      }

      // Find staff
      const staffId = StaffId.fromString(request.staffId);
      const staff = await this.staffRepository.findById(staffId);

      if (!staff) {
        return {
          success: false,
          message: 'Không tìm thấy thông tin nhân viên'
        };
      }

      // Check authorization
      if (!this.checkAuthorization(staff, request)) {
        return {
          success: false,
          message: 'Không có quyền cập nhật lịch trống của nhân viên này'
        };
      }

      // Create availability entries
      const availabilityDate = new Date(request.availability.date);
      
      for (const slot of request.availability.timeSlots) {
        const availability = StaffAvailability.create({
          date: availabilityDate,
          startTime: slot.startTime,
          endTime: slot.endTime,
          isAvailable: slot.isAvailable,
          reason: slot.reason
        });

        staff.updateAvailability(availability);
      }

      // Update metadata
      staff.props.updatedAt = new Date();
      staff.props.updatedBy = request.updatedBy;

      // Save
      await this.staffRepository.save(staff);

      // Audit logging
      await this.auditAvailabilityUpdate(staff, request);

      this.logger.info('Staff availability updated successfully', {
        staffId: staff.id.value,
        date: request.availability.date,
        updatedBy: request.updatedBy
      });

      return {
        success: true,
        message: 'Cập nhật lịch trống thành công',
        data: {
          staffId: staff.id.value,
          date: request.availability.date,
          updatedAt: staff.props.updatedAt.toISOString()
        }
      };

    } catch (error) {
      this.logger.error('Error updating staff availability', {
        staffId: request.staffId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        message: 'Lỗi hệ thống khi cập nhật lịch trống'
      };
    }
  }

  private validateRequest(request: UpdateStaffAvailabilityRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!request.staffId?.trim()) {
      errors.push('ID nhân viên không được để trống');
    }

    if (!request.availability) {
      errors.push('Thông tin lịch trống không được để trống');
    } else {
      if (!request.availability.date) {
        errors.push('Ngày không được để trống');
      }
      if (!request.availability.timeSlots || request.availability.timeSlots.length === 0) {
        errors.push('Phải có ít nhất một khung giờ');
      }
    }

    if (!request.updatedBy?.trim()) {
      errors.push('Thông tin người cập nhật không được để trống');
    }

    return { isValid: errors.length === 0, errors };
  }

  private checkAuthorization(staff: ProviderStaff, request: UpdateStaffAvailabilityRequest): boolean {
    const { updatedBy, updatedByRole } = request;
    
    // Staff can update their own availability
    if (staff.userId === updatedBy) {
      return true;
    }

    // Admin, HR, department head can update
    return ['admin', 'hr', 'department_head'].includes(updatedByRole);
  }

  private async auditAvailabilityUpdate(
    staff: ProviderStaff,
    request: UpdateStaffAvailabilityRequest
  ): Promise<void> {
    this.logger.info('HIPAA Audit: Staff availability update', {
      action: 'STAFF_AVAILABILITY_UPDATE',
      staffId: staff.id.value,
      date: request.availability.date,
      slotsCount: request.availability.timeSlots.length,
      updatedBy: request.updatedBy,
      updatedByRole: request.updatedByRole,
      timestamp: new Date().toISOString(),
      ipAddress: request.requestMetadata?.ipAddress,
      complianceLevel: 'hipaa'
    });
  }
}

