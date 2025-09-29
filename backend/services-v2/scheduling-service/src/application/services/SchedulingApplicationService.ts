/**
 * Scheduling Application Service - Application Layer
 * V2 Clean Architecture + DDD + CQRS Implementation
 * Orchestrates scheduling use cases and commands
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, CQRS, Vietnamese Healthcare Standards
 */

import { ScheduleAppointmentUseCase, ScheduleAppointmentRequest, ScheduleAppointmentResponse } from '../use-cases/ScheduleAppointmentUseCase';
import { RescheduleAppointmentUseCase, RescheduleAppointmentRequest, RescheduleAppointmentResponse } from '../use-cases/RescheduleAppointmentUseCase';
import { CheckAvailabilityUseCase, CheckAvailabilityRequest, CheckAvailabilityResponse } from '../use-cases/CheckAvailabilityUseCase';
import { ISchedulingRepository } from '../interfaces/ISchedulingRepository';
import { IEventBus } from '../interfaces/IEventBus';
import { IAvailabilityService } from '../interfaces/IAvailabilityService';
import { Appointment } from '../../domain/aggregates/scheduling.aggregate';

/**
 * Scheduling Application Service
 * Provides high-level operations for appointment scheduling
 */
export class SchedulingApplicationService {
  private readonly scheduleAppointmentUseCase: ScheduleAppointmentUseCase;
  private readonly rescheduleAppointmentUseCase: RescheduleAppointmentUseCase;
  private readonly checkAvailabilityUseCase: CheckAvailabilityUseCase;

  constructor(
    private readonly schedulingRepository: ISchedulingRepository,
    private readonly eventBus: IEventBus,
    private readonly availabilityService: IAvailabilityService
  ) {
    // Initialize use cases
    this.scheduleAppointmentUseCase = new ScheduleAppointmentUseCase(
      schedulingRepository,
      eventBus,
      availabilityService
    );

    this.rescheduleAppointmentUseCase = new RescheduleAppointmentUseCase(
      schedulingRepository,
      eventBus,
      availabilityService
    );

    this.checkAvailabilityUseCase = new CheckAvailabilityUseCase(
      schedulingRepository,
      availabilityService
    );
  }

  /**
   * Schedule a new appointment
   */
  async scheduleAppointment(request: ScheduleAppointmentRequest): Promise<ScheduleAppointmentResponse> {
    return await this.scheduleAppointmentUseCase.execute(request);
  }

  /**
   * Reschedule an existing appointment
   */
  async rescheduleAppointment(request: RescheduleAppointmentRequest): Promise<RescheduleAppointmentResponse> {
    return await this.rescheduleAppointmentUseCase.execute(request);
  }

  /**
   * Check provider/department availability
   */
  async checkAvailability(request: CheckAvailabilityRequest): Promise<CheckAvailabilityResponse> {
    return await this.checkAvailabilityUseCase.execute(request);
  }

  /**
   * Get appointment by ID
   */
  async getAppointmentById(appointmentId: string): Promise<Appointment | null> {
    return await this.schedulingRepository.findById(appointmentId);
  }

  /**
   * Get appointment by appointment ID
   */
  async getAppointmentByAppointmentId(appointmentId: string): Promise<Appointment | null> {
    return await this.schedulingRepository.findByAppointmentId(appointmentId);
  }

  /**
   * Get appointments by patient ID
   */
  async getAppointmentsByPatientId(patientId: string): Promise<Appointment[]> {
    return await this.schedulingRepository.findByPatientId(patientId);
  }

  /**
   * Get appointments by provider ID
   */
  async getAppointmentsByProviderId(providerId: string): Promise<Appointment[]> {
    return await this.schedulingRepository.findByProviderId(providerId);
  }

  /**
   * Get appointments by date range
   */
  async getAppointmentsByDateRange(startDate: Date, endDate: Date): Promise<Appointment[]> {
    return await this.schedulingRepository.findByDateRange(startDate, endDate);
  }

  /**
   * Confirm an appointment
   */
  async confirmAppointment(appointmentId: string, confirmedBy: string): Promise<{
    success: boolean;
    message: string;
    errors?: string[];
  }> {
    try {
      const appointment = await this.schedulingRepository.findById(appointmentId);
      if (!appointment) {
        return {
          success: false,
          message: 'Không tìm thấy cuộc hẹn',
          errors: ['APPOINTMENT_NOT_FOUND']
        };
      }

      appointment.confirm(confirmedBy);
      await this.schedulingRepository.save(appointment);

      // Publish events
      const events = appointment.getUncommittedEvents();
      for (const event of events) {
        await this.eventBus.publish(event);
      }
      appointment.markEventsAsCommitted();

      return {
        success: true,
        message: 'Cuộc hẹn đã được xác nhận thành công'
      };

    } catch (error) {
      return {
        success: false,
        message: 'Có lỗi xảy ra khi xác nhận cuộc hẹn',
        errors: [error instanceof Error ? error.message : 'UNKNOWN_ERROR']
      };
    }
  }

  /**
   * Cancel an appointment
   */
  async cancelAppointment(
    appointmentId: string, 
    reason: string, 
    cancelledBy: string
  ): Promise<{
    success: boolean;
    message: string;
    errors?: string[];
  }> {
    try {
      const appointment = await this.schedulingRepository.findById(appointmentId);
      if (!appointment) {
        return {
          success: false,
          message: 'Không tìm thấy cuộc hẹn',
          errors: ['APPOINTMENT_NOT_FOUND']
        };
      }

      appointment.cancel(reason, cancelledBy);
      await this.schedulingRepository.save(appointment);

      // Publish events
      const events = appointment.getUncommittedEvents();
      for (const event of events) {
        await this.eventBus.publish(event);
      }
      appointment.markEventsAsCommitted();

      return {
        success: true,
        message: 'Cuộc hẹn đã được hủy thành công'
      };

    } catch (error) {
      return {
        success: false,
        message: 'Có lỗi xảy ra khi hủy cuộc hẹn',
        errors: [error instanceof Error ? error.message : 'UNKNOWN_ERROR']
      };
    }
  }

  /**
   * Complete an appointment
   */
  async completeAppointment(
    appointmentId: string, 
    completedBy: string,
    notes?: string
  ): Promise<{
    success: boolean;
    message: string;
    errors?: string[];
  }> {
    try {
      const appointment = await this.schedulingRepository.findById(appointmentId);
      if (!appointment) {
        return {
          success: false,
          message: 'Không tìm thấy cuộc hẹn',
          errors: ['APPOINTMENT_NOT_FOUND']
        };
      }

      appointment.complete(completedBy, notes);
      await this.schedulingRepository.save(appointment);

      // Publish events
      const events = appointment.getUncommittedEvents();
      for (const event of events) {
        await this.eventBus.publish(event);
      }
      appointment.markEventsAsCommitted();

      return {
        success: true,
        message: 'Cuộc hẹn đã được hoàn thành thành công'
      };

    } catch (error) {
      return {
        success: false,
        message: 'Có lỗi xảy ra khi hoàn thành cuộc hẹn',
        errors: [error instanceof Error ? error.message : 'UNKNOWN_ERROR']
      };
    }
  }

  /**
   * Mark appointment as no-show
   */
  async markAsNoShow(
    appointmentId: string, 
    markedBy: string,
    reason?: string
  ): Promise<{
    success: boolean;
    message: string;
    errors?: string[];
  }> {
    try {
      const appointment = await this.schedulingRepository.findById(appointmentId);
      if (!appointment) {
        return {
          success: false,
          message: 'Không tìm thấy cuộc hẹn',
          errors: ['APPOINTMENT_NOT_FOUND']
        };
      }

      appointment.markAsNoShow(markedBy, reason);
      await this.schedulingRepository.save(appointment);

      // Publish events
      const events = appointment.getUncommittedEvents();
      for (const event of events) {
        await this.eventBus.publish(event);
      }
      appointment.markEventsAsCommitted();

      return {
        success: true,
        message: 'Cuộc hẹn đã được đánh dấu là không đến'
      };

    } catch (error) {
      return {
        success: false,
        message: 'Có lỗi xảy ra khi đánh dấu cuộc hẹn',
        errors: [error instanceof Error ? error.message : 'UNKNOWN_ERROR']
      };
    }
  }

  /**
   * Get appointment statistics
   */
  async getAppointmentStatistics(filters: any): Promise<any> {
    return await this.schedulingRepository.getStatistics(filters);
  }

  /**
   * Search appointments
   */
  async searchAppointments(filters: any): Promise<any> {
    return await this.schedulingRepository.search(filters);
  }
}
