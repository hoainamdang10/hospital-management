/**
 * Reschedule Appointment Use Case - Application Layer
 * V3 Clean Architecture + DDD Implementation
 *
 * @author Hospital Management Team
 * @version 3.0.0
 * @compliance Clean Architecture, DDD, HIPAA, Vietnamese Healthcare Standards
 */

import { BaseHealthcareUseCase } from '@shared/application/use-cases/base/use-case.interface';
import { IAppointmentRepository } from '../../domain/repositories/IAppointmentRepository';
import { TimeSlot } from '../../domain/value-objects/TimeSlot.vo';
import { AppointmentStatus, Appointment } from '../../domain/aggregates/Appointment.aggregate';
import { IAuthorizationService, AuthorizationError } from '../services/IAuthorizationService';
import { IReminderService } from '../services/IReminderService';

export interface RescheduleAppointmentRequest {
  appointmentId: string;
  newAppointmentDate: string; // YYYY-MM-DD
  newAppointmentTime: string; // HH:MM:SS
  reason: string;
  rescheduledBy: string;
  notifyPatient?: boolean;
  notifyDoctor?: boolean;
}

export interface RescheduleAppointmentResponse {
  success: boolean;
  message: string;
  appointment?: {
    appointmentId: string;
    oldDate: string;
    oldTime: string;
    newDate: string;
    newTime: string;
    status: string;
  };
  errors?: string[];
}

/**
 * Reschedule Appointment Use Case
 * 
 * Business Rules:
 * 1. Cannot reschedule completed/cancelled appointments
 * 2. Cannot reschedule to past time
 * 3. Cannot reschedule within 2 hours of appointment time (configurable)
 * 4. New time slot must be available
 * 5. Must provide reason for rescheduling
 * 6. Cancels old reminders and creates new ones
 * 7. Notifies patient and doctor
 */
export class RescheduleAppointmentUseCase extends BaseHealthcareUseCase<
  RescheduleAppointmentRequest,
  RescheduleAppointmentResponse
> {
  private readonly MIN_HOURS_BEFORE_RESCHEDULE = 2;

  constructor(
    private readonly appointmentRepository: IAppointmentRepository,
    private readonly authorizationService: IAuthorizationService,
    private readonly reminderService: IReminderService
  ) {
    super();
  }

  protected async executeInternal(
    request: RescheduleAppointmentRequest
  ): Promise<RescheduleAppointmentResponse> {
    try {
      // 1. Find appointment
      const appointment = await this.appointmentRepository.findByAppointmentId(
        request.appointmentId
      );

      if (!appointment) {
        return {
          success: false,
          message: 'Không tìm thấy lịch hẹn',
          errors: ['Appointment not found']
        };
      }

      // 2. Validate can reschedule
      const validationError = this.validateReschedule(appointment, request);
      if (validationError) {
        return {
          success: false,
          message: validationError,
          errors: [validationError]
        };
      }

      // 3. Create new time slot
      const newTimeSlot = TimeSlot.create(
        request.newAppointmentDate,
        request.newAppointmentTime
      );

      // 4. Check if new time slot is available
      const isAvailable = await this.checkTimeSlotAvailability(
        appointment.doctorId,
        newTimeSlot,
        request.appointmentId
      );

      if (!isAvailable) {
        return {
          success: false,
          message: 'Khung thời gian mới không khả dụng',
          errors: ['Time slot not available']
        };
      }

      // 5. Authorization check
      const canReschedule = await this.authorizationService.canRescheduleAppointment(
        request.rescheduledBy,
        request.appointmentId,
        {
          patientId: appointment.patientId,
          doctorId: appointment.doctorId,
        }
      );

      if (!canReschedule) {
        throw new AuthorizationError(
          'You are not authorized to reschedule this appointment',
          request.rescheduledBy,
          'reschedule_appointment',
          request.appointmentId
        );
      }

      // 6. Store old time for response
      const oldDate = appointment.timeSlot.appointmentDate;
      const oldTime = appointment.timeSlot.appointmentTime;

      // 7. Reschedule appointment (domain event will be emitted)
      appointment.reschedule(
        newTimeSlot,
        request.reason,
        request.rescheduledBy
      );

      // 8. Save (triggers domain events → Event handler → Outbox → Worker → Scheduler)
      await this.appointmentRepository.save(appointment);

      // 9. Cancel old reminders and schedule new ones
      try {
        // Cancel old reminders
        await this.reminderService.cancelReminders(request.appointmentId);
        
        // Schedule new reminders for the new time
        const newDateTime = new Date(`${request.newAppointmentDate}T${request.newAppointmentTime}`);
        await this.reminderService.scheduleReminders(
          appointment.appointmentId.value,
          appointment.patientId,
          newDateTime,
          appointment.priority
        );
        console.log(`[RescheduleAppointment] Reminders rescheduled for appointment ${request.appointmentId}`);
      } catch (reminderError) {
        // Log but don't fail the reschedule
        console.error('[RescheduleAppointment] Failed to reschedule reminders:', reminderError);
      }

      // 10. Domain events emitted → AppointmentRescheduledSchedulerHandler → Outbox → Worker
      //     No direct HTTP call needed - pure event-driven architecture

      // 11. Return success response
      return {
        success: true,
        message: 'Đổi lịch hẹn thành công',
        appointment: {
          appointmentId: appointment.appointmentId.value,
          oldDate,
          oldTime,
          newDate: request.newAppointmentDate,
          newTime: request.newAppointmentTime,
          status: appointment.status
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Đổi lịch hẹn thất bại',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }



  /**
   * Validate if appointment can be rescheduled
   */
  private validateReschedule(
    appointment: any,
    request: RescheduleAppointmentRequest
  ): string | null {
    // Check status
    if (appointment.status === 'COMPLETED') {
      return 'Không thể đổi lịch hẹn đã hoàn thành';
    }

    if (appointment.getStatus() === AppointmentStatus.CANCELLED) {
      return 'Không thể đổi lịch hẹn đã hủy';
    }

    // Check if too close to appointment time
    const appointmentDateTime = new Date(
      `${appointment.timeSlot.appointmentDate}T${appointment.timeSlot.appointmentTime}`
    );
    const now = new Date();
    const hoursUntilAppointment = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilAppointment < this.MIN_HOURS_BEFORE_RESCHEDULE) {
      return `Không thể đổi lịch trong vòng ${this.MIN_HOURS_BEFORE_RESCHEDULE} giờ trước giờ hẹn`;
    }

    // Check if new time is in the past
    const newDateTime = new Date(
      `${request.newAppointmentDate}T${request.newAppointmentTime}`
    );
    if (newDateTime <= now) {
      return 'Không thể đổi lịch sang thời gian trong quá khứ';
    }

    // Check if new time is too soon (at least 1 hour from now)
    const hoursUntilNewAppointment = (newDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (hoursUntilNewAppointment < 1) {
      return 'Lịch hẹn mới phải cách ít nhất 1 giờ từ bây giờ';
    }

    // Check if reason is provided
    if (!request.reason || request.reason.trim().length < 3) {
      return 'Vui lòng cung cấp lý do đổi lịch (tối thiểu 3 ký tự)';
    }

    return null;
  }

  /**
   * Check if time slot is available for doctor
   */
  private async checkTimeSlotAvailability(
    doctorId: string,
    timeSlot: TimeSlot,
    excludeAppointmentId: string
  ): Promise<boolean> {
    try {
      // Get appointments for doctor on the new date
      const startOfDay = new Date(timeSlot.appointmentDate);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(timeSlot.appointmentDate);
      endOfDay.setHours(23, 59, 59, 999);

      const existingAppointments = await this.appointmentRepository.findByTimeSlot(
        doctorId,
        startOfDay,
        endOfDay
      );

      // Check for conflicts (excluding current appointment)
      const newAppointmentTime = new Date(
        `${timeSlot.appointmentDate}T${timeSlot.appointmentTime}`
      );

      for (const existing of existingAppointments) {
        // Skip the appointment being rescheduled
        if (existing.appointmentId.value === excludeAppointmentId) {
          continue;
        }

        // Skip cancelled/no-show appointments
        if (existing.getStatus() === AppointmentStatus.CANCELLED || existing.getStatus() === AppointmentStatus.NO_SHOW) {
          continue;
        }

        const existingTime = new Date(
          `${existing.timeSlot.appointmentDate}T${existing.timeSlot.appointmentTime}`
        );

        const existingEndTime = new Date(existingTime.getTime() + existing.durationMinutes * 60000);
        const newEndTime = new Date(newAppointmentTime.getTime() + 30 * 60000); // Assume 30 min default

        // Check for overlap
        if (
          (newAppointmentTime >= existingTime && newAppointmentTime < existingEndTime) ||
          (newEndTime > existingTime && newEndTime <= existingEndTime) ||
          (newAppointmentTime <= existingTime && newEndTime >= existingEndTime)
        ) {
          return false; // Conflict found
        }
      }

      return true; // No conflicts
    } catch (error) {
      console.error('Error checking time slot availability:', error);
      return false;
    }
  }

  async authorize(request: RescheduleAppointmentRequest, userId: string): Promise<boolean> {
    // Authorization enforced in executeInternal() via authorizationService.canRescheduleAppointment()
    return !!userId;
  }

  involvesPHI(request: RescheduleAppointmentRequest): boolean {
    return true;
  }

  getPatientId(request: RescheduleAppointmentRequest): string | null {
    // Will be retrieved from appointment
    return null;
  }
}

