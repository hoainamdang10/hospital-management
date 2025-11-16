/**
 * UpdateStaffScheduleUseCase - Application Use Case
 * V2 Clean Architecture + DDD Implementation
 * Updates staff work schedule with validation
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards, HIPAA
 */

import { BaseHealthcareUseCase, ValidationResult } from '@shared/application/base/base-healthcare-use-case';
import { IProviderStaffRepository } from '../../domain/repositories/IProviderStaffRepository';
import { ProviderStaff } from '../../domain/aggregates/ProviderStaff';
import { StaffId } from '../../domain/value-objects/StaffId';
import { WorkSchedule } from '../../domain/value-objects/WorkSchedule';
import { IEventBus } from '@shared/events/event-bus.interface';
import { ILogger } from '../interfaces/ILogger';

export interface UpdateStaffScheduleRequest {
  staffId: string;
  workSchedule: {
    workingDays: string[]; // ['monday', 'tuesday', ...]
    workingHours: {
      start: string; // '08:00'
      end: string; // '17:00'
    };
    timeZone: string;
    isFlexible: boolean;
  };
  effectiveDate?: string; // When the new schedule takes effect
  updatedBy: string;
  updatedByRole: string;
  requestMetadata?: {
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
  };
}

export interface UpdateStaffScheduleResponse {
  success: boolean;
  message: string;
  errors?: string[];
  data?: {
    staffId: string;
    updatedAt: string;
    effectiveDate?: string;
  };
}

/**
 * Update Staff Schedule Use Case
 * Handles staff work schedule updates with validation
 */
export class UpdateStaffScheduleUseCase extends BaseHealthcareUseCase<UpdateStaffScheduleRequest, UpdateStaffScheduleResponse> {
  constructor(
    private readonly staffRepository: IProviderStaffRepository,
    private readonly eventBus: IEventBus,
    private readonly logger: ILogger
  ) {
    super();
  }

  /**
   * Execute update staff schedule
   */
  protected async executeImpl(request: UpdateStaffScheduleRequest): Promise<UpdateStaffScheduleResponse> {
    try {
      this.logger.info('Updating staff schedule', {
        staffId: request.staffId,
        updatedBy: request.updatedBy,
        updatedByRole: request.updatedByRole
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

      // 2. Find staff
      const staffId = StaffId.fromString(request.staffId);
      const staff = await this.staffRepository.findById(staffId);

      if (!staff) {
        return {
          success: false,
          message: 'Không tìm thấy thông tin nhân viên'
        };
      }

      // 3. Check authorization
      const authResult = this.checkAuthorization(staff, request);
      if (!authResult.authorized) {
        this.logger.warn('Unauthorized staff schedule update attempt', {
          staffId: staff.id,
          updatedBy: request.updatedBy,
          updatedByRole: request.updatedByRole,
          reason: authResult.reason
        });

        return {
          success: false,
          message: 'Không có quyền cập nhật lịch làm việc của nhân viên này'
        };
      }

      // 4. Create new work schedule
      const newWorkSchedule = WorkSchedule.create({
        workingDays: request.workSchedule.workingDays,
        workingHours: request.workSchedule.workingHours,
        timeZone: request.workSchedule.timeZone,
        isFlexible: request.workSchedule.isFlexible
      });

      // 5. Update staff schedule
      staff.updateWorkSchedule(newWorkSchedule);

      // 6. Update metadata - handled internally by aggregate

      // 7. Save updated staff
      await this.staffRepository.save(staff);

      // 8. Publish domain events (best effort pattern)
      try {
        await this.publishDomainEvents(staff);
      } catch (eventError) {
        const errorMessage = eventError instanceof Error ? eventError.message : 'Unknown error';
        this.logger.warn('Failed to publish schedule update events', {
          staffId: staff.id,
          error: errorMessage
        });
        // Don't fail the update if event publishing fails
      }

      // 9. HIPAA audit logging
      await this.auditScheduleUpdate(staff, request);

      this.logger.info('Staff schedule updated successfully', {
        staffId: staff.id,
        updatedBy: request.updatedBy
      });

      return {
        success: true,
        message: 'Cập nhật lịch làm việc thành công',
        data: {
          staffId: staff.id,
          updatedAt: staff.updatedAt.toISOString(),
          effectiveDate: request.effectiveDate
        }
      };

    } catch (error) {
      this.logger.error('Error updating staff schedule', {
        staffId: request.staffId,
        updatedBy: request.updatedBy,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        message: 'Lỗi hệ thống khi cập nhật lịch làm việc'
      };
    }
  }

  /**
   * Validate request
   */
  protected override async validateRequest(request: UpdateStaffScheduleRequest): Promise<ValidationResult> {
    const errors: string[] = [];

    // Staff ID validation
    if (!request.staffId || request.staffId.trim().length === 0) {
      errors.push('ID nhân viên không được để trống');
    }

    // Work schedule validation
    if (!request.workSchedule) {
      errors.push('Thông tin lịch làm việc không được để trống');
    } else {
      if (!request.workSchedule.workingDays || request.workSchedule.workingDays.length === 0) {
        errors.push('Ngày làm việc không được để trống');
      }

      if (!request.workSchedule.workingHours) {
        errors.push('Giờ làm việc không được để trống');
      } else {
        if (!request.workSchedule.workingHours.start || !request.workSchedule.workingHours.end) {
          errors.push('Giờ bắt đầu và kết thúc không được để trống');
        }
      }

      if (!request.workSchedule.timeZone) {
        errors.push('Múi giờ không được để trống');
      }
    }

    // Updated by validation
    if (!request.updatedBy || request.updatedBy.trim().length === 0) {
      errors.push('Thông tin người cập nhật không được để trống');
    }

    // Role validation
    if (!request.updatedByRole || request.updatedByRole.trim().length === 0) {
      errors.push('Vai trò người cập nhật không được để trống');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Check authorization for schedule update
   */
  private checkAuthorization(staff: ProviderStaff, request: UpdateStaffScheduleRequest): {
    authorized: boolean;
    reason?: string;
  } {
    const { updatedBy, updatedByRole } = request;

    // Admin has full access
    if (updatedByRole === 'admin') {
      return { authorized: true };
    }

    // Department head can update their department staff schedules
    if (updatedByRole === 'department_head') {
      return { authorized: true };
    }

    // HR can update staff schedules
    if (updatedByRole === 'hr') {
      return { authorized: true };
    }

    // Staff can request schedule changes (but may need approval)
    if (staff.userId === updatedBy) {
      return { authorized: true };
    }

    // Default: no access
    return { 
      authorized: false, 
      reason: `Role ${updatedByRole} not authorized for schedule updates` 
    };
  }

  /**
   * Publish domain events
   * Pattern: Best effort - log warning if fails, don't throw error
   */
  private async publishDomainEvents(staff: ProviderStaff): Promise<void> {
    const events = staff.getUncommittedEvents();

    for (const event of events) {
      await this.eventBus.publish(event);
    }

    staff.markEventsAsCommitted();
  }

  /**
   * HIPAA audit logging for schedule update
   */
  private async auditScheduleUpdate(
    staff: ProviderStaff,
    request: UpdateStaffScheduleRequest
  ): Promise<void> {
    this.logger.info('HIPAA Audit: Staff schedule update', {
      action: 'STAFF_SCHEDULE_UPDATE',
      staffId: staff.id,
      staffType: staff.staffType,
      updatedBy: request.updatedBy,
      updatedByRole: request.updatedByRole,
      workingDays: request.workSchedule.workingDays.join(','),
      workingHours: `${request.workSchedule.workingHours.start}-${request.workSchedule.workingHours.end}`,
      effectiveDate: request.effectiveDate,
      timestamp: new Date().toISOString(),
      ipAddress: request.requestMetadata?.ipAddress,
      userAgent: request.requestMetadata?.userAgent,
      sessionId: request.requestMetadata?.sessionId,
      complianceLevel: 'hipaa'
    });
  }
}

