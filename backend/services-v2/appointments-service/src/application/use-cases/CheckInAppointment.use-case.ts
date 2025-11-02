/**
 * Check-In Appointment Use Case - Application Layer
 * V3 Clean Architecture + DDD Implementation
 *
 * @author Hospital Management Team
 * @version 3.0.0
 * @compliance Clean Architecture, DDD, HIPAA, Vietnamese Healthcare Standards
 */

import { BaseHealthcareUseCase } from '@shared/application/use-cases/base/use-case.interface';
import { IAppointmentRepository } from '../../domain/repositories/IAppointmentRepository';
import { AppointmentCheckedInEvent } from '../../domain/events/AppointmentCheckedInEvent';
import { IAuthorizationService, AuthorizationError } from '../services/IAuthorizationService';
import { IQueueRepository } from '../../domain/repositories/IQueueRepository';
import { QueuePriority } from '../../domain/entities/QueueEntry.entity';

export interface CheckInAppointmentRequest {
  appointmentId: string;
  checkedInBy: string;
  checkInTime?: Date; // Optional, defaults to now
  addToQueue?: boolean; // Auto add to waiting queue
}

export interface CheckInAppointmentResponse {
  success: boolean;
  message: string;
  appointment?: {
    appointmentId: string;
    patientId: string;
    doctorId: string;
    status: string;
    checkedInAt: Date;
    queuePosition?: number;
    estimatedWaitTime?: number;
  };
  errors?: string[];
}

/**
 * Check-In Appointment Use Case
 * 
 * Business Rules:
 * 1. Only CONFIRMED appointments can be checked in
 * 2. Cannot check in too early (more than 30 minutes before)
 * 3. Cannot check in too late (more than 30 minutes after)
 * 4. Updates status to CHECKED_IN
 * 5. Records check-in timestamp
 * 6. Optionally adds to waiting queue
 * 7. Notifies doctor of patient arrival
 */
export class CheckInAppointmentUseCase extends BaseHealthcareUseCase<
  CheckInAppointmentRequest,
  CheckInAppointmentResponse
> {
  private readonly MAX_EARLY_CHECKIN_MINUTES = 30;
  private readonly MAX_LATE_CHECKIN_MINUTES = 30;

  constructor(
    private readonly appointmentRepository: IAppointmentRepository,
    private readonly authorizationService: IAuthorizationService,
    private readonly queueRepository?: IQueueRepository // Optional for queue integration
  ) {
    super();
  }

  protected async executeInternal(
    request: CheckInAppointmentRequest
  ): Promise<CheckInAppointmentResponse> {
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
      const canCheckIn = await this.authorizationService.canCheckInAppointment(
        request.checkedInBy,
        request.appointmentId,
        {
          patientId: appointment.patientId,
          doctorId: appointment.doctorId,
        }
      );

      if (!canCheckIn) {
        throw new AuthorizationError(
          'You are not authorized to check in this appointment',
          request.checkedInBy,
          'checkin_appointment',
          request.appointmentId
        );
      }

      // 3. Validate can check in
      const validationError = this.validateCheckIn(appointment, request);
      if (validationError) {
        return {
          success: false,
          message: validationError,
          errors: [validationError]
        };
      }

      // 4. Check in appointment (emits AppointmentCheckedInEvent)
      const checkInTime = request.checkInTime || new Date();
      appointment.checkIn(checkInTime);

      // 5. Save (domain events will be published by repository)
      await this.appointmentRepository.save(appointment);

      // 6. Optionally add to queue
      let queuePosition: number | undefined;
      let estimatedWaitTime: number | undefined;

      if (request.addToQueue && this.queueRepository) {
        try {
          // Get or create queue for today
          const queue = await this.queueRepository.findOrCreateByDoctorAndDate(
            appointment.doctorId,
            checkInTime
          );

          // Add patient to queue with NORMAL priority (default for check-in)
          const entry = queue.addPatient(
            appointment.patientId,
            appointment.appointmentId.value,
            QueuePriority.NORMAL,
            checkInTime
          );

          // Save queue aggregate
          await this.queueRepository.save(queue);

          // Get position info
          const positionInfo = queue.getPatientPosition(appointment.patientId);
          if (positionInfo) {
            queuePosition = positionInfo.position;
            estimatedWaitTime = positionInfo.estimatedWaitMinutes;
          }
        } catch (queueError) {
          // Log error but don't fail check-in
          console.error('Failed to add patient to queue:', queueError);
          // Continue with check-in success
        }
      }

      // 7. Return success response
      return {
        success: true,
        message: request.addToQueue && queuePosition 
          ? `Check-in thành công. Vị trí trong hàng đợi: ${queuePosition}`
          : 'Check-in thành công',
        appointment: {
          appointmentId: appointment.appointmentId.value,
          patientId: appointment.patientId,
          doctorId: appointment.doctorId,
          status: appointment.status,
          checkedInAt: checkInTime,
          queuePosition,
          estimatedWaitTime
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Check-in thất bại',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Validate if appointment can be checked in
   */
  private validateCheckIn(
    appointment: any,
    request: CheckInAppointmentRequest
  ): string | null {
    // Check status - only CONFIRMED or SCHEDULED can check in
    if (appointment.status !== 'confirmed' && appointment.status !== 'scheduled') {
      return `Không thể check-in lịch hẹn với trạng thái ${appointment.status}`;
    }

    // Check if already checked in
    if (appointment.checkedInAt) {
      return 'Lịch hẹn đã được check-in';
    }

    // Check timing
    const appointmentDateTime = new Date(
      `${appointment.timeSlot.appointmentDate}T${appointment.timeSlot.appointmentTime}`
    );
    const checkInTime = request.checkInTime || new Date();
    const minutesDifference = (checkInTime.getTime() - appointmentDateTime.getTime()) / (1000 * 60);

    // Too early
    if (minutesDifference < -this.MAX_EARLY_CHECKIN_MINUTES) {
      return `Không thể check-in sớm hơn ${this.MAX_EARLY_CHECKIN_MINUTES} phút`;
    }

    // Too late
    if (minutesDifference > this.MAX_LATE_CHECKIN_MINUTES) {
      return `Không thể check-in muộn hơn ${this.MAX_LATE_CHECKIN_MINUTES} phút. Vui lòng liên hệ lễ tân`;
    }

    return null;
  }

  async authorize(request: CheckInAppointmentRequest, userId: string): Promise<boolean> {
    // Authorization enforced in executeInternal() via authorizationService.canCheckInAppointment()
    return !!userId;
  }

  involvesPHI(request: CheckInAppointmentRequest): boolean {
    return true;
  }

  getPatientId(request: CheckInAppointmentRequest): string | null {
    // Will be retrieved from appointment
    return null;
  }
}

