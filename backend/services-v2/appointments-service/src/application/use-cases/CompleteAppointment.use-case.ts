/**
 * Complete Appointment Use Case - Application Layer
 * V3 Clean Architecture + DDD Implementation
 *
 * @author Hospital Management Team
 * @version 3.0.0
 */

import { BaseHealthcareUseCase } from '@shared/application/use-cases/base/use-case.interface';
import { IAppointmentRepository } from '../../domain/repositories/IAppointmentRepository';
import { IAuthorizationService, AuthorizationError } from '../services/IAuthorizationService';

export interface CompleteAppointmentRequest {
  appointmentId: string;
  completedBy: string; // Doctor/Nurse ID
}

export interface CompleteAppointmentResponse {
  success: boolean;
  message: string;
  errors?: string[];
}

export class CompleteAppointmentUseCase extends BaseHealthcareUseCase<
  CompleteAppointmentRequest,
  CompleteAppointmentResponse
> {
  constructor(
    private readonly appointmentRepository: IAppointmentRepository,
    private readonly authorizationService: IAuthorizationService
  ) {
    super();
  }

  protected async executeInternal(
    request: CompleteAppointmentRequest
  ): Promise<CompleteAppointmentResponse> {
    try {
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

      // Authorization check - Only doctors/nurses can complete
      const canComplete = await this.authorizationService.canCompleteAppointment(
        request.completedBy,
        request.appointmentId,
        {
          patientId: appointment.patientId,
          doctorId: appointment.doctorId,
        }
      );

      if (!canComplete) {
        throw new AuthorizationError(
          'You are not authorized to complete this appointment. Only doctors and nurses can complete appointments.',
          request.completedBy,
          'complete_appointment',
          request.appointmentId
        );
      }

      appointment.complete();
      await this.appointmentRepository.save(appointment);

      return {
        success: true,
        message: 'Hoàn thành lịch hẹn thành công'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Hoàn thành lịch hẹn thất bại',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  async authorize(request: CompleteAppointmentRequest, userId: string): Promise<boolean> {
    return !!userId;
  }

  involvesPHI(request: CompleteAppointmentRequest): boolean {
    return true;
  }

  getPatientId(request: CompleteAppointmentRequest): string | null {
    return null;
  }
}

