/**
 * Reschedule Appointment Use Case - Application Layer
 * V2 Clean Architecture + DDD + CQRS Implementation
 * Vietnamese healthcare appointment rescheduling
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, CQRS, Vietnamese Healthcare Standards
 */

import { BaseHealthcareUseCase } from '../../../shared/application/use-cases/base/use-case.interface';
import { Appointment } from '../../domain/aggregates/scheduling.aggregate';
import { TimeSlot } from '../../domain/value-objects/TimeSlot';
import { ISchedulingRepository } from '../interfaces/ISchedulingRepository';
import { IEventBus } from '../interfaces/IEventBus';
import { IAvailabilityService } from '../interfaces/IAvailabilityService';
import { ILogger } from '../../../shared/infrastructure/logging/logger.interface';
import { IAuthorizationService } from '../../../shared/application/services/authorization.service.interface';
import { IAuditService } from '../../../shared/application/services/audit.service.interface';

export interface RescheduleAppointmentRequest {
  appointmentId: string;
  newStartTime: Date;
  newEndTime: Date;
  newRoomId?: string;
  reason: string;
  rescheduledBy: string;
  notifyPatient?: boolean;
  notifyProvider?: boolean;
}

export interface RescheduleAppointmentResponse {
  success: boolean;
  message: string;
  appointment?: Appointment;
  validationResults?: {
    errors: string[];
    warnings: string[];
    recommendations: string[];
  };
  integrationEvents?: {
    notificationSent: boolean;
    calendarUpdated: boolean;
    reminderRescheduled: boolean;
  };
  nextSteps?: string[];
}

export interface RescheduleAppointmentUseCaseDependencies {
  schedulingRepository: ISchedulingRepository;
  eventBus: IEventBus;
  availabilityService: IAvailabilityService;
  logger: ILogger;
  authorizationService: IAuthorizationService;
  auditService: IAuditService;
}

/**
 * Reschedule Appointment Use Case
 * Handles appointment rescheduling with conflict checking and Vietnamese healthcare compliance
 */
export class RescheduleAppointmentUseCase implements BaseHealthcareUseCase<RescheduleAppointmentRequest, RescheduleAppointmentResponse> {
  constructor(private dependencies: RescheduleAppointmentUseCaseDependencies) {}
    private readonly eventBus: IEventBus,
    private readonly availabilityService: IAvailabilityService
  ) {}

  async execute(request: RescheduleAppointmentRequest): Promise<RescheduleAppointmentResponse> {
    try {
      // 1. Validate request
      this.validateRequest(request);

      // 2. Find existing appointment
      const appointment = await this.schedulingRepository.findById(request.appointmentId);
      if (!appointment) {
        return {
          success: false,
          message: 'Không tìm thấy cuộc hẹn',
          errors: ['APPOINTMENT_NOT_FOUND']
        };
      }

      // 3. Check if appointment can be rescheduled
      if (!appointment.canBeRescheduled()) {
        return {
          success: false,
          message: 'Cuộc hẹn không thể thay đổi lịch',
          errors: ['APPOINTMENT_CANNOT_BE_RESCHEDULED']
        };
      }

      // 4. Check new time slot availability
      const isAvailable = await this.availabilityService.checkAvailability(
        appointment.provider.providerId,
        request.newStartTime,
        request.newEndTime
      );

      if (!isAvailable) {
        return {
          success: false,
          message: 'Khung thời gian mới không khả dụng',
          errors: ['NEW_TIME_SLOT_NOT_AVAILABLE']
        };
      }

      // 5. Check for conflicts (excluding current appointment)
      const conflicts = await this.schedulingRepository.findConflicts(
        appointment.provider.providerId,
        request.newStartTime,
        request.newEndTime,
        request.appointmentId // Exclude current appointment
      );

      if (conflicts.length > 0) {
        return {
          success: false,
          message: 'Có xung đột lịch hẹn trong khung thời gian mới',
          errors: ['NEW_TIME_SLOT_CONFLICT']
        };
      }

      // 6. Check Vietnamese healthcare rescheduling rules
      const reschedulingValidation = this.validateVietnameseReschedulingRules(
        appointment.timeSlot.startTime,
        request.newStartTime
      );

      if (!reschedulingValidation.isValid) {
        return {
          success: false,
          message: reschedulingValidation.message,
          errors: reschedulingValidation.errors
        };
      }

      // 7. Create new time slot
      const newTimeSlot = TimeSlot.create(
        request.newStartTime,
        request.newEndTime,
        'available',
        appointment.provider.providerId,
        request.newRoomId || appointment.roomId
      );

      // 8. Store original time slot for response
      const originalStartTime = appointment.timeSlot.startTime;
      const originalEndTime = appointment.timeSlot.endTime;

      // 9. Reschedule appointment
      appointment.reschedule(newTimeSlot, request.reason, request.rescheduledBy);

      // 10. Save updated appointment
      await this.schedulingRepository.save(appointment);

      // 11. Publish domain events
      const events = appointment.getUncommittedEvents();
      for (const event of events) {
        await this.eventBus.publish(event);
      }
      appointment.markEventsAsCommitted();

      // 12. Generate response
      return {
        success: true,
        message: 'Cuộc hẹn đã được thay đổi lịch thành công',
        data: {
          appointmentId: appointment.appointmentId.value,
          oldStartTime: originalStartTime,
          oldEndTime: originalEndTime,
          newStartTime: appointment.timeSlot.startTime,
          newEndTime: appointment.timeSlot.endTime,
          status: appointment.status,
          rescheduledAt: appointment.updatedAt,
          rescheduledBy: request.rescheduledBy,
          reason: request.reason
        }
      };

    } catch (error) {
      return {
        success: false,
        message: 'Có lỗi xảy ra khi thay đổi lịch hẹn',
        errors: [error instanceof Error ? error.message : 'UNKNOWN_ERROR']
      };
    }
  }

  private validateRequest(request: RescheduleAppointmentRequest): void {
    if (!request.appointmentId) {
      throw new Error('Mã cuộc hẹn không được để trống');
    }

    if (!request.newStartTime || !request.newEndTime) {
      throw new Error('Thời gian mới không hợp lệ');
    }

    if (request.newStartTime >= request.newEndTime) {
      throw new Error('Thời gian bắt đầu phải trước thời gian kết thúc');
    }

    if (request.newStartTime <= new Date()) {
      throw new Error('Không thể đặt lịch hẹn trong quá khứ');
    }

    if (!request.reason || request.reason.trim().length < 3) {
      throw new Error('Lý do thay đổi lịch phải có ít nhất 3 ký tự');
    }

    if (!request.rescheduledBy) {
      throw new Error('Người thay đổi lịch không được để trống');
    }
  }

  private validateVietnameseReschedulingRules(
    originalStartTime: Date,
    newStartTime: Date
  ): { isValid: boolean; message: string; errors: string[] } {
    const now = new Date();
    const hoursUntilOriginal = (originalStartTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    const hoursUntilNew = (newStartTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    // Rule 1: Cannot reschedule less than 2 hours before original appointment
    if (hoursUntilOriginal < 2) {
      return {
        isValid: false,
        message: 'Không thể thay đổi lịch hẹn trong vòng 2 giờ trước giờ hẹn',
        errors: ['RESCHEDULE_TOO_LATE']
      };
    }

    // Rule 2: New appointment must be at least 1 hour from now
    if (hoursUntilNew < 1) {
      return {
        isValid: false,
        message: 'Lịch hẹn mới phải cách ít nhất 1 giờ từ bây giờ',
        errors: ['NEW_APPOINTMENT_TOO_SOON']
      };
    }

    // Rule 3: Cannot reschedule to more than 30 days in the future
    const daysUntilNew = hoursUntilNew / 24;
    if (daysUntilNew > 30) {
      return {
        isValid: false,
        message: 'Không thể đặt lịch hẹn quá 30 ngày trong tương lai',
        errors: ['NEW_APPOINTMENT_TOO_FAR']
      };
    }

    // Rule 4: Check business hours (8:00 AM - 5:00 PM)
    const newHour = newStartTime.getHours();
    if (newHour < 8 || newHour >= 17) {
      return {
        isValid: false,
        message: 'Lịch hẹn phải trong giờ làm việc (8:00 - 17:00)',
        errors: ['OUTSIDE_BUSINESS_HOURS']
      };
    }

    // Rule 5: No appointments on Sundays (Vietnamese healthcare standard)
    if (newStartTime.getDay() === 0) {
      return {
        isValid: false,
        message: 'Không thể đặt lịch hẹn vào Chủ nhật',
        errors: ['NO_SUNDAY_APPOINTMENTS']
      };
    }

    return {
      isValid: true,
      message: 'Lịch hẹn mới hợp lệ',
      errors: []
    };
  }
}
