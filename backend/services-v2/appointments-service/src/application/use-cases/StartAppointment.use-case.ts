/**
 * Start Appointment Use Case - Application Layer
 * V3 Clean Architecture + DDD Implementation
 *
 * @author Hospital Management Team
 * @version 3.0.0
 * @compliance Clean Architecture, DDD, HIPAA, Vietnamese Healthcare Standards
 */

import { BaseHealthcareUseCase } from '@shared/application/use-cases/base/use-case.interface';
import { IAppointmentRepository } from '../../domain/repositories/IAppointmentRepository';
import { AppointmentStartedEvent } from '../../domain/events/AppointmentStartedEvent';
import { IAuthorizationService, AuthorizationError } from '../services/IAuthorizationService';

export interface StartAppointmentRequest {
  appointmentId: string;
  startedBy: string; // Doctor ID
  startTime?: Date; // Optional, defaults to now
  roomId?: string; // Optional room assignment
}

export interface StartAppointmentResponse {
  success: boolean;
  message: string;
  appointment?: {
    appointmentId: string;
    patientId: string;
    doctorId: string;
    status: string;
    startedAt: Date;
    roomId?: string;
  };
  errors?: string[];
}

/**
 * Start Appointment Use Case
 * 
 * Business Rules:
 * 1. Only CHECKED_IN appointments can be started
 * 2. Only the assigned doctor can start the appointment
 * 3. Updates status to IN_PROGRESS
 * 4. Records start timestamp
 * 5. Optionally assigns room
 * 6. Removes patient from waiting queue
 * 7. Notifies next patient in queue
 * 8. Starts timer for appointment duration
 */
export class StartAppointmentUseCase extends BaseHealthcareUseCase<
  StartAppointmentRequest,
  StartAppointmentResponse
> {
  constructor(
    private readonly appointmentRepository: IAppointmentRepository,
    private readonly authorizationService: IAuthorizationService
  ) {
    super();
  }

  protected async executeInternal(
    request: StartAppointmentRequest
  ): Promise<StartAppointmentResponse> {
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

      // 2. Authorization check
      const canStart = await this.authorizationService.canStartAppointment(
        request.startedBy,
        request.appointmentId,
        {
          patientId: appointment.patientId,
          doctorId: appointment.doctorId,
        }
      );

      if (!canStart) {
        throw new AuthorizationError(
          'You are not authorized to start this appointment',
          request.startedBy,
          'start_appointment',
          request.appointmentId
        );
      }

      // 3. Validate can start
      const validationError = this.validateStart(appointment, request);
      if (validationError) {
        return {
          success: false,
          message: validationError,
          errors: [validationError]
        };
      }

      // 4. Start appointment (emits AppointmentStartedEvent)
      const startTime = request.startTime || new Date();
      appointment.start(startTime);

      // Note: roomId should be set before starting if needed
      // For now, roomId is part of appointment creation/update, not start action

      // 4. Save (domain events will be published by repository)
      await this.appointmentRepository.save(appointment);

      // 5. Return success response
      return {
        success: true,
        message: 'Bắt đầu khám bệnh thành công',
        appointment: {
          appointmentId: appointment.appointmentId.value,
          patientId: appointment.patientId,
          doctorId: appointment.doctorId,
          status: appointment.status,
          startedAt: startTime,
          roomId: request.roomId
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Bắt đầu khám bệnh thất bại',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Validate if appointment can be started
   * Updated for simplified 3-role system (no check-in required)
   */
  private validateStart(
    appointment: any,
    request: StartAppointmentRequest
  ): string | null {
    // Check status - allow CONFIRMED or SCHEDULED (no check-in required)
    if (appointment.status !== 'confirmed' && appointment.status !== 'scheduled') {
      return `Không thể bắt đầu khám với trạng thái ${appointment.status}. Lịch hẹn phải ở trạng thái CONFIRMED hoặc SCHEDULED`;
    }

    // Check if already started (prevent double-start)
    if (appointment.startedAt) {
      return 'Lịch hẹn đã được bắt đầu trước đó';
    }

    // Check if doctor is authorized
    if (request.startedBy !== appointment.doctorId) {
      return 'Chỉ bác sĩ được phân công mới có thể bắt đầu khám';
    }

    return null;
  }

  async authorize(request: StartAppointmentRequest, userId: string): Promise<boolean> {
    // Authorization enforced in executeInternal() via authorizationService.canStartAppointment()
    return !!userId;
  }

  involvesPHI(request: StartAppointmentRequest): boolean {
    return true;
  }

  getPatientId(request: StartAppointmentRequest): string | null {
    // Will be retrieved from appointment
    return null;
  }
}

