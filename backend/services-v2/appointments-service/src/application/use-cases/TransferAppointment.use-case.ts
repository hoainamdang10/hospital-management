/**
 * Transfer Appointment Use Case - Application Layer
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

export interface TransferAppointmentRequest {
  appointmentId: string;
  newDoctorId: string;
  reason: string;
  transferredBy: string;
  notifyPatient?: boolean;
  notifyOldDoctor?: boolean;
  notifyNewDoctor?: boolean;
}

export interface TransferAppointmentResponse {
  success: boolean;
  message: string;
  appointment?: {
    appointmentId: string;
    patientId: string;
    oldDoctorId: string;
    newDoctorId: string;
    appointmentDate: string;
    appointmentTime: string;
    status: string;
  };
  errors?: string[];
}

/**
 * Transfer Appointment Use Case
 * 
 * Business Rules:
 * 1. Find alternative doctor
 * 2. Check new doctor availability
 * 3. Transfer appointment
 * 4. Notify both doctors & patient
 * 5. Update queue if needed
 * 6. Maintain appointment history
 */
export class TransferAppointmentUseCase extends BaseHealthcareUseCase<
  TransferAppointmentRequest,
  TransferAppointmentResponse
> {
  constructor(
    private readonly appointmentRepository: IAppointmentRepository,
    private readonly authorizationService: IAuthorizationService
  ) {
    super();
  }

  protected async executeInternal(
    request: TransferAppointmentRequest
  ): Promise<TransferAppointmentResponse> {
    try {
      // 1. Find appointment (need to get before authorization check)
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
      const canTransfer = await this.authorizationService.canTransferAppointment(
        request.transferredBy,
        request.appointmentId,
        {
          patientId: appointment.patientId,
          doctorId: appointment.doctorId,
        }
      );

      if (!canTransfer) {
        throw new AuthorizationError(
          'You are not authorized to transfer this appointment',
          request.transferredBy,
          'transfer_appointment',
          request.appointmentId
        );
      }

      // 3. Validate can transfer
      const validationError = this.validateTransfer(appointment, request.newDoctorId);
      if (validationError) {
        return {
          success: false,
          message: validationError,
          errors: [validationError]
        };
      }

      // 3. Check new doctor availability
      const isAvailable = await this.checkDoctorAvailability(
        request.newDoctorId,
        appointment.timeSlot.appointmentDate,
        appointment.timeSlot.appointmentTime
      );

      if (!isAvailable) {
        return {
          success: false,
          message: 'Bác sĩ mới không khả dụng vào thời gian này',
          errors: ['New doctor not available']
        };
      }

      // 4. Store old doctor ID before transfer
      const oldDoctorId = appointment.getDoctorId();
      
      // 5. Transfer appointment using aggregate business method
      appointment.transfer(
        request.newDoctorId,
        request.reason,
        request.transferredBy
      );

      // 6. Save
      await this.appointmentRepository.save(appointment);

      // 7. Return success response
      return {
        success: true,
        message: 'Chuyển lịch hẹn thành công',
        appointment: {
          appointmentId: appointment.getAppointmentId().value,
          patientId: appointment.getPatientId() || '',
          oldDoctorId,
          newDoctorId: request.newDoctorId,
          appointmentDate: appointment.getTimeSlot().appointmentDate,
          appointmentTime: appointment.getTimeSlot().appointmentTime,
          status: appointment.getStatus()
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Chuyển lịch hẹn thất bại',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Validate if appointment can be transferred
   */
  private validateTransfer(appointment: any, newDoctorId: string): string | null {
    // Cannot transfer to same doctor
    if (appointment.doctorId === newDoctorId || appointment.getDoctorId?.() === newDoctorId) {
      return 'Không thể chuyển cho cùng bác sĩ';
    }

    // Cannot transfer completed appointments
    if (appointment.getStatus() === AppointmentStatus.COMPLETED) {
      return 'Không thể chuyển lịch hẹn đã hoàn thành';
    }

    // Cannot transfer cancelled appointments
    if (appointment.getStatus() === AppointmentStatus.CANCELLED) {
      return 'Không thể chuyển lịch hẹn đã hủy';
    }

    // Cannot transfer no-show appointments
    if (appointment.getStatus() === AppointmentStatus.NO_SHOW) {
      return 'Không thể chuyển lịch hẹn no-show';
    }

    return null;
  }

  /**
   * Check if new doctor is available
   */
  private async checkDoctorAvailability(
    doctorId: string,
    date: string,
    time: string
  ): Promise<boolean> {
    try {
      const appointmentDateTime = new Date(`${date}T${time}`);
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      // Get doctor's appointments on that day
      const existingAppointments = await this.appointmentRepository.findByTimeSlot(
        doctorId,
        startOfDay,
        endOfDay
      );

      // Check for conflicts
      for (const existing of existingAppointments) {
        if (existing.getStatus() === AppointmentStatus.CANCELLED || existing.getStatus() === AppointmentStatus.NO_SHOW) {
          continue;
        }

        const existingTime = new Date(
          `${existing.timeSlot.appointmentDate}T${existing.timeSlot.appointmentTime}`
        );

        const existingEndTime = new Date(existingTime.getTime() + existing.durationMinutes * 60000);
        const newEndTime = new Date(appointmentDateTime.getTime() + 30 * 60000);

        // Check for overlap
        if (
          (appointmentDateTime >= existingTime && appointmentDateTime < existingEndTime) ||
          (newEndTime > existingTime && newEndTime <= existingEndTime) ||
          (appointmentDateTime <= existingTime && newEndTime >= existingEndTime)
        ) {
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Error checking doctor availability:', error);
      return false;
    }
  }

  async authorize(request: TransferAppointmentRequest, userId: string): Promise<boolean> {
    // Authorization enforced in executeInternal() via authorizationService.canTransferAppointment()
    return !!userId;
  }

  involvesPHI(request: TransferAppointmentRequest): boolean {
    return true;
  }

  getPatientId(request: TransferAppointmentRequest): string | null {
    // Will be retrieved from appointment
    return null;
  }
}

