/**
 * Complete Appointment Use Case - Application Layer
 * V3 Clean Architecture + DDD Implementation
 *
 * @author Hospital Management Team
 * @version 3.0.0
 */

import { BaseHealthcareUseCase } from '@shared/application/use-cases/base/use-case.interface';
import { IAppointmentRepository } from '../../infrastructure/persistence/SupabaseAppointmentRepository';

export interface CompleteAppointmentRequest {
  appointmentId: string;
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
    private readonly appointmentRepository: IAppointmentRepository
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

