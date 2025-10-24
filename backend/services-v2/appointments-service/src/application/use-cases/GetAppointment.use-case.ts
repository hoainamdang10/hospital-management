/**
 * Get Appointment Use Case - Application Layer
 * V3 Clean Architecture + DDD Implementation
 *
 * @author Hospital Management Team
 * @version 3.0.0
 */

import { BaseHealthcareUseCase } from '@shared/application/use-cases/base/use-case.interface';
import { IAppointmentRepository } from '../../domain/repositories/IAppointmentRepository';

export interface GetAppointmentRequest {
  appointmentId: string;
}

export interface GetAppointmentResponse {
  success: boolean;
  message: string;
  appointment?: {
    id: string;
    appointmentId: string;
    patientId: string;
    doctorId: string;
    appointmentDate: string;
    appointmentTime: string;
    durationMinutes: number;
    type: string;
    priority: string;
    status: string;
    reason?: string;
    chiefComplaint?: string;
    symptoms?: string[];
    notes?: string;
    specialInstructions?: string;
    consultationFee: number;
    paymentStatus: string;
  };
  errors?: string[];
}

export class GetAppointmentUseCase extends BaseHealthcareUseCase<
  GetAppointmentRequest,
  GetAppointmentResponse
> {
  constructor(
    private readonly appointmentRepository: IAppointmentRepository
  ) {
    super();
  }

  protected async executeInternal(
    request: GetAppointmentRequest
  ): Promise<GetAppointmentResponse> {
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

      return {
        success: true,
        message: 'Lấy thông tin lịch hẹn thành công',
        appointment: {
          id: appointment.id,
          appointmentId: appointment.appointmentId.value,
          patientId: appointment.patientId,
          doctorId: appointment.doctorId,
          appointmentDate: appointment.timeSlot.appointmentDate,
          appointmentTime: appointment.timeSlot.appointmentTime,
          durationMinutes: appointment.durationMinutes,
          type: appointment.type,
          priority: appointment.priority,
          status: appointment.status,
          reason: appointment.details.reason,
          chiefComplaint: appointment.details.chiefComplaint,
          symptoms: appointment.details.symptoms,
          notes: appointment.details.notes,
          specialInstructions: appointment.details.specialInstructions,
          consultationFee: appointment.consultationFee,
          paymentStatus: appointment.paymentStatus
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Lấy thông tin lịch hẹn thất bại',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  async authorize(request: GetAppointmentRequest, userId: string): Promise<boolean> {
    return !!userId;
  }

  involvesPHI(request: GetAppointmentRequest): boolean {
    return true;
  }

  getPatientId(request: GetAppointmentRequest): string | null {
    return null;
  }
}

