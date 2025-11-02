/**
 * Mark As No-Show Use Case - Application Layer
 * V3 Clean Architecture + DDD Implementation
 *
 * @author Hospital Management Team
 * @version 3.0.0
 * @compliance Clean Architecture, DDD, HIPAA, Vietnamese Healthcare Standards
 */

import { BaseHealthcareUseCase } from '@shared/application/use-cases/base/use-case.interface';
import { IAppointmentRepository } from '../../domain/repositories/IAppointmentRepository';
import { AppointmentNoShowEvent } from '../../domain/events/AppointmentNoShowEvent';
import { IAuthorizationService, AuthorizationError, UserRole } from '../services/IAuthorizationService';

export interface MarkAsNoShowRequest {
  appointmentId: string;
  markedBy: string;
  reason?: string;
  applyPenalty?: boolean; // Apply no-show penalty
  notifyPatient?: boolean;
}

export interface MarkAsNoShowResponse {
  success: boolean;
  message: string;
  appointment?: {
    appointmentId: string;
    patientId: string;
    doctorId: string;
    status: string;
    noShowPenalty?: {
      amount: number;
      description: string;
    };
  };
  errors?: string[];
}

/**
 * Mark As No-Show Use Case
 * 
 * Business Rules:
 * 1. Only SCHEDULED or CONFIRMED appointments can be marked as no-show
 * 2. Can only mark as no-show after appointment time has passed
 * 3. Must wait at least 15 minutes after appointment time
 * 4. Records no-show timestamp
 * 5. Optionally applies penalty fee
 * 6. Emits event to Identity Service to track patient no-show history
 * 7. Releases time slot for other patients
 * 8. Notifies patient about no-show
 */
export class MarkAsNoShowUseCase extends BaseHealthcareUseCase<
  MarkAsNoShowRequest,
  MarkAsNoShowResponse
> {
  private readonly MIN_MINUTES_AFTER_APPOINTMENT = 15;
  private readonly NO_SHOW_PENALTY_FEE = 100000; // 100,000 VND

  constructor(
    private readonly appointmentRepository: IAppointmentRepository,
    private readonly authorizationService: IAuthorizationService
  ) {
    super();
  }

  protected async executeInternal(
    request: MarkAsNoShowRequest
  ): Promise<MarkAsNoShowResponse> {
    try {
      // 1. Authorization check - only staff can mark as no-show
      const hasRole = await this.authorizationService.hasAnyRole(
        request.markedBy,
        [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE]
      );

      if (!hasRole) {
        throw new AuthorizationError(
          'You are not authorized to mark appointments as no-show',
          request.markedBy,
          'mark_no_show',
          request.appointmentId
        );
      }

      // 2. Find appointment
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

      // 2. Validate can mark as no-show
      const validationError = this.validateNoShow(appointment);
      if (validationError) {
        return {
          success: false,
          message: validationError,
          errors: [validationError]
        };
      }

      // 3. Mark as no-show (emits AppointmentNoShowEvent in aggregate)
      appointment.markAsNoShow(request.markedBy);

      // 4. Calculate penalty if applicable
      let penalty = undefined;
      if (request.applyPenalty !== false) {
        penalty = {
          amount: this.NO_SHOW_PENALTY_FEE,
          description: 'Phí phạt không đến khám'
        };

        // Penalty integration with billing service:
        // The AppointmentNoShowEvent emitted by the aggregate will be consumed
        // by the billing service, which will create an invoice for the penalty.
        // The billing service should listen to: appointments.appointment.no_show
        // and automatically create a penalty invoice with the standard fee.
      }

      // 5. Save (domain events will be published by repository)
      await this.appointmentRepository.save(appointment);

      // 6. Return success response
      return {
        success: true,
        message: 'Đã đánh dấu bệnh nhân không đến khám',
        appointment: {
          appointmentId: appointment.appointmentId.value,
          patientId: appointment.patientId,
          doctorId: appointment.doctorId,
          status: appointment.status,
          noShowPenalty: penalty
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Đánh dấu no-show thất bại',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Validate if appointment can be marked as no-show
   */
  private validateNoShow(appointment: any): string | null {
    // Check status
    if (appointment.status !== 'scheduled' && appointment.status !== 'confirmed') {
      return `Không thể đánh dấu no-show cho lịch hẹn với trạng thái ${appointment.status}`;
    }

    // Check if already checked in
    if (appointment.getCheckedInAt && appointment.getCheckedInAt()) {
      return 'Bệnh nhân đã check-in, không thể đánh dấu no-show';
    }

    // Check if appointment time has passed
    const appointmentDateTime = new Date(
      `${appointment.timeSlot.appointmentDate}T${appointment.timeSlot.appointmentTime}`
    );
    const now = new Date();
    const minutesSinceAppointment = (now.getTime() - appointmentDateTime.getTime()) / (1000 * 60);

    if (minutesSinceAppointment < 0) {
      return 'Chưa đến giờ hẹn, không thể đánh dấu no-show';
    }

    if (minutesSinceAppointment < this.MIN_MINUTES_AFTER_APPOINTMENT) {
      return `Phải đợi ít nhất ${this.MIN_MINUTES_AFTER_APPOINTMENT} phút sau giờ hẹn`;
    }

    return null;
  }

  async authorize(request: MarkAsNoShowRequest, userId: string): Promise<boolean> {
    // Authorization enforced in executeInternal() via authorizationService.hasAnyRole()
    return !!userId;
  }

  involvesPHI(request: MarkAsNoShowRequest): boolean {
    return true;
  }

  getPatientId(request: MarkAsNoShowRequest): string | null {
    // Will be retrieved from appointment
    return null;
  }
}

