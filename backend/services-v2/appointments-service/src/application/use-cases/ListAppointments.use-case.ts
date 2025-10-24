/**
 * List Appointments Use Case - Application Layer
 * V3 Clean Architecture + DDD Implementation
 *
 * @author Hospital Management Team
 * @version 3.0.0
 */

import { BaseHealthcareUseCase } from '@shared/application/use-cases/base/use-case.interface';
import { IAppointmentRepository } from '../../domain/repositories/IAppointmentRepository';

export interface ListAppointmentsRequest {
  patientId?: string;
  doctorId?: string;
  startDate?: string;
  endDate?: string;
}

export interface ListAppointmentsResponse {
  success: boolean;
  message: string;
  appointments?: Array<{
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
    consultationFee: number;
  }>;
  total?: number;
  errors?: string[];
}

export class ListAppointmentsUseCase extends BaseHealthcareUseCase<
  ListAppointmentsRequest,
  ListAppointmentsResponse
> {
  constructor(
    private readonly appointmentRepository: IAppointmentRepository
  ) {
    super();
  }

  protected async executeInternal(
    request: ListAppointmentsRequest
  ): Promise<ListAppointmentsResponse> {
    try {
      let appointments;

      if (request.patientId) {
        appointments = await this.appointmentRepository.findByPatientId(
          request.patientId
        );
      } else if (request.doctorId) {
        appointments = await this.appointmentRepository.findByDoctorId(
          request.doctorId
        );
      } else if (request.startDate && request.endDate) {
        appointments = await this.appointmentRepository.findByDateRange(
          new Date(request.startDate),
          new Date(request.endDate)
        );
      } else {
        return {
          success: false,
          message: 'Vui lòng cung cấp patientId, doctorId hoặc date range',
          errors: ['Missing filter criteria']
        };
      }

      return {
        success: true,
        message: 'Lấy danh sách lịch hẹn thành công',
        appointments: appointments.map((apt: any) => ({
          id: apt.id,
          appointmentId: apt.appointmentId.value,
          patientId: apt.patientId,
          doctorId: apt.doctorId,
          appointmentDate: apt.timeSlot.appointmentDate,
          appointmentTime: apt.timeSlot.appointmentTime,
          durationMinutes: apt.durationMinutes,
          type: apt.type,
          priority: apt.priority,
          status: apt.status,
          consultationFee: apt.consultationFee
        })),
        total: appointments.length
      };
    } catch (error) {
      return {
        success: false,
        message: 'Lấy danh sách lịch hẹn thất bại',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  async authorize(request: ListAppointmentsRequest, userId: string): Promise<boolean> {
    return !!userId;
  }

  involvesPHI(request: ListAppointmentsRequest): boolean {
    return true;
  }

  getPatientId(request: ListAppointmentsRequest): string | null {
    return request.patientId || null;
  }
}

