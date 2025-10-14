/**
 * Confirm Appointment Use Case - Application Layer
 * V3 Clean Architecture + DDD Implementation
 *
 * @author Hospital Management Team
 * @version 3.0.0
 */

import { BaseHealthcareUseCase } from '@shared/application/use-cases/base/use-case.interface';
import { IAppointmentRepository } from '../../infrastructure/persistence/SupabaseAppointmentRepository';

export interface ConfirmAppointmentRequest {
  appointmentId: string;
  confirmedBy: string;
}

export interface ConfirmAppointmentResponse {
  success: boolean;
  message: string;
  errors?: string[];
}

export class ConfirmAppointmentUseCase extends BaseHealthcareUseCase<
  ConfirmAppointmentRequest,
  ConfirmAppointmentResponse
> {
  constructor(
    private readonly appointmentRepository: IAppointmentRepository
  ) {
    super();
  }

  protected async executeInternal(
    request: ConfirmAppointmentRequest
  ): Promise<ConfirmAppointmentResponse> {
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

      appointment.confirm(request.confirmedBy);
      await this.appointmentRepository.save(appointment);

      return {
        success: true,
        message: 'Xác nhận lịch hẹn thành công'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Xác nhận lịch hẹn thất bại',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  async authorize(request: ConfirmAppointmentRequest, userId: string): Promise<boolean> {
    return !!userId;
  }

  involvesPHI(request: ConfirmAppointmentRequest): boolean {
    return true;
  }

  getPatientId(request: ConfirmAppointmentRequest): string | null {
    return null;
  }
}

