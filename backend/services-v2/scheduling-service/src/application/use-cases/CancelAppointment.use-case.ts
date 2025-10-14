/**
 * Cancel Appointment Use Case - Application Layer
 * V3 Clean Architecture + DDD Implementation
 *
 * @author Hospital Management Team
 * @version 3.0.0
 * @compliance Clean Architecture, DDD, HIPAA
 */

import { BaseHealthcareUseCase } from '@shared/application/use-cases/base/use-case.interface';
import { IAppointmentRepository } from '../../infrastructure/persistence/SupabaseAppointmentRepository';

export interface CancelAppointmentRequest {
  appointmentId: string;
  cancellationReason: string;
  cancelledBy: string;
}

export interface CancelAppointmentResponse {
  success: boolean;
  message: string;
  errors?: string[];
}

/**
 * Cancel Appointment Use Case
 */
export class CancelAppointmentUseCase extends BaseHealthcareUseCase<
  CancelAppointmentRequest,
  CancelAppointmentResponse
> {
  constructor(
    private readonly appointmentRepository: IAppointmentRepository
  ) {
    super();
  }

  protected async executeInternal(
    request: CancelAppointmentRequest
  ): Promise<CancelAppointmentResponse> {
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

      // 2. Cancel appointment
      appointment.cancel(request.cancellationReason, request.cancelledBy);

      // 3. Save
      await this.appointmentRepository.save(appointment);

      return {
        success: true,
        message: 'Hủy lịch hẹn thành công'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Hủy lịch hẹn thất bại',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  async authorize(request: CancelAppointmentRequest, userId: string): Promise<boolean> {
    return !!userId;
  }

  involvesPHI(request: CancelAppointmentRequest): boolean {
    return true;
  }

  getPatientId(request: CancelAppointmentRequest): string | null {
    return null; // Would need to fetch appointment first
  }
}

