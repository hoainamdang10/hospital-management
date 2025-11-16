/**
 * Bulk Reschedule Appointments Use Case - Application Layer
 * V3 Clean Architecture + DDD Implementation
 *
 * @author Hospital Management Team
 * @version 3.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards
 */

import { BaseHealthcareUseCase } from '@shared/application/use-cases/base/use-case.interface';
import { IAppointmentRepository } from '../../domain/repositories/IAppointmentRepository';
import { AppointmentStatus } from '../../domain/aggregates/Appointment.aggregate';
import { IAuthorizationService, AuthorizationError } from '../services/IAuthorizationService';

export interface BulkRescheduleAppointmentsRequest {
  doctorId: string;
  date: string; // YYYY-MM-DD
  reason: string;
  rescheduledBy: string;
  suggestAlternatives?: boolean;
  alternativeDoctorIds?: string[];
}

export interface BulkRescheduleAppointmentsResponse {
  success: boolean;
  message: string;
  summary?: {
    totalAppointments: number;
    rescheduled: number;
    failed: number;
    pending: number;
  };
  appointments?: Array<{
    appointmentId: string;
    patientId: string;
    status: 'rescheduled' | 'failed' | 'pending_patient_confirmation';
    oldDate: string;
    oldTime: string;
    newDate?: string;
    newTime?: string;
    alternativeDoctorId?: string;
    error?: string;
  }>;
  errors?: string[];
}

/**
 * Bulk Reschedule Appointments Use Case
 * 
 * Business Rules:
 * 1. Get all appointments for doctor on specific date
 * 2. Find alternative slots (same doctor or alternative doctors)
 * 3. Suggest new times to patients
 * 4. Auto-reschedule if patient accepts
 * 5. Batch notifications
 * 6. Track rescheduling status
 */
export class BulkRescheduleAppointmentsUseCase extends BaseHealthcareUseCase<
  BulkRescheduleAppointmentsRequest,
  BulkRescheduleAppointmentsResponse
> {
  constructor(
    private readonly appointmentRepository: IAppointmentRepository,
    private readonly authorizationService: IAuthorizationService
  ) {
    super();
  }

  protected async executeInternal(
    request: BulkRescheduleAppointmentsRequest
  ): Promise<BulkRescheduleAppointmentsResponse> {
    try {
      // 1. Authorization check
      const canBulkReschedule = await this.authorizationService.canBulkReschedule(
        request.rescheduledBy,
        request.doctorId
      );

      if (!canBulkReschedule) {
        throw new AuthorizationError(
          'You are not authorized to bulk reschedule appointments for this doctor',
          request.rescheduledBy,
          'bulk_reschedule',
          request.doctorId
        );
      }

      // 2. Get all appointments for doctor on date
      const date = new Date(request.date);
      const appointments = await this.appointmentRepository.findByDoctorAndDate(
        request.doctorId,
        date
      );

      // Filter only scheduled/confirmed appointments
      const activeAppointments = appointments.filter(
        apt => apt.getStatus() === AppointmentStatus.SCHEDULED || apt.getStatus() === AppointmentStatus.CONFIRMED
      );

      if (activeAppointments.length === 0) {
        return {
          success: true,
          message: 'Không có lịch hẹn nào cần đổi',
          summary: {
            totalAppointments: 0,
            rescheduled: 0,
            failed: 0,
            pending: 0
          },
          appointments: []
        };
      }

      // 2. Process each appointment
      const results = [];
      let rescheduled = 0;
      let failed = 0;
      let pending = 0;

      for (const appointment of activeAppointments) {
        try {
          // For now, mark as pending patient confirmation
          // In real implementation, would find alternative slots and notify patient
          results.push({
            appointmentId: appointment.appointmentId.value,
            patientId: appointment.patientId,
            status: 'pending_patient_confirmation' as const,
            oldDate: appointment.timeSlot.appointmentDate,
            oldTime: appointment.timeSlot.appointmentTime
          });
          pending++;
        } catch (error) {
          results.push({
            appointmentId: appointment.appointmentId.value,
            patientId: appointment.patientId,
            status: 'failed' as const,
            oldDate: appointment.timeSlot.appointmentDate,
            oldTime: appointment.timeSlot.appointmentTime,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          failed++;
        }
      }

      // 3. Return summary
      return {
        success: true,
        message: `Đã xử lý ${activeAppointments.length} lịch hẹn`,
        summary: {
          totalAppointments: activeAppointments.length,
          rescheduled,
          failed,
          pending
        },
        appointments: results
      };
    } catch (error) {
      return {
        success: false,
        message: 'Đổi lịch hàng loạt thất bại',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  async authorize(request: BulkRescheduleAppointmentsRequest, userId: string): Promise<boolean> {
    // Authorization enforced in executeInternal() via authorizationService.canBulkReschedule()
    return !!userId;
  }

  involvesPHI(request: BulkRescheduleAppointmentsRequest): boolean {
    return true;
  }

  getPatientId(request: BulkRescheduleAppointmentsRequest): string | null {
    return null; // Multiple patients
  }
}

