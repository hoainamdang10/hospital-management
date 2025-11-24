/**
 * Cancel Appointment Use Case - Application Layer
 * V3 Clean Architecture + DDD Implementation
 *
 * @author Hospital Management Team
 * @version 3.0.0
 * @compliance Clean Architecture, DDD, HIPAA
 */

import { BaseHealthcareUseCase } from "@shared/application/use-cases/base/use-case.interface";
import { IAppointmentRepository } from "../../domain/repositories/IAppointmentRepository";
import {
  IAuthorizationService,
  AuthorizationError,
} from "../services/IAuthorizationService";
import { IReminderService } from "../services/IReminderService";
import { AppointmentCancelledEvent } from "../../domain/events/AppointmentCancelledEvent";
import { IEventPublisher } from "../services/IEventPublisher";

export interface CancelAppointmentRequest {
  appointmentId: string;
  cancellationReason: string;
  cancelledBy: string;
}

export interface CancelAppointmentResponse {
  success: boolean;
  message: string;
  errors?: string[];
  cancellationPolicy?: {
    penaltyApplied: boolean;
    refundEligible: boolean;
    rescheduleAllowed: boolean;
    penaltyAmount?: number;
    refundPercentage?: number;
    hoursNotice: number;
    estimatedRefundAmount?: number;
    consultationFee: number;
  };
}

/**
 * Cancel Appointment Use Case
 */
export class CancelAppointmentUseCase extends BaseHealthcareUseCase<
  CancelAppointmentRequest,
  CancelAppointmentResponse
> {
  constructor(
    private readonly appointmentRepository: IAppointmentRepository,
    private readonly authorizationService: IAuthorizationService,
    private readonly reminderService: IReminderService,
    private readonly eventPublisher?: IEventPublisher,
  ) {
    super();
  }

  protected async executeInternal(
    request: CancelAppointmentRequest,
  ): Promise<CancelAppointmentResponse> {
    try {
      // 0. Validate cancellation reason
      if (
        !request.cancellationReason ||
        request.cancellationReason.trim() === ""
      ) {
        return {
          success: false,
          message: "Lý do hủy là bắt buộc",
          errors: ["Cancellation reason is required"],
        };
      }

      // 1. Find appointment
      const appointment = await this.appointmentRepository.findByAppointmentId(
        request.appointmentId,
      );

      if (!appointment) {
        return {
          success: false,
          message: "Không tìm thấy lịch hẹn",
          errors: ["Appointment not found"],
        };
      }

      // 2. Authorization check
      const canCancel = await this.authorizationService.canCancelAppointment(
        request.cancelledBy,
        request.appointmentId,
        {
          patientId: appointment.patientId,
          doctorId: appointment.doctorId,
        },
      );

      if (!canCancel) {
        throw new AuthorizationError(
          "You are not authorized to cancel this appointment",
          request.cancelledBy,
          "cancel_appointment",
          request.appointmentId,
        );
      }

      // 3. Cancel appointment (domain event will be emitted)
      appointment.cancel(request.cancellationReason, request.cancelledBy);

      // 4. Save (triggers domain events → Event handler → Outbox → Worker → Scheduler)
      await this.appointmentRepository.save(appointment);

      // 5. Cancel all reminders for this appointment
      try {
        await this.reminderService.cancelReminders(request.appointmentId);
        console.log(
          `[CancelAppointment] Reminders cancelled for appointment ${request.appointmentId}`,
        );
      } catch (reminderError) {
        // Log but don't fail the cancellation
        console.error(
          "[CancelAppointment] Failed to cancel reminders:",
          reminderError,
        );
      }

      // 6. Domain events emitted → AppointmentCancelledSchedulerHandler → Outbox → Worker
      //    No direct HTTP call needed - pure event-driven architecture

      // 7. Calculate cancellation policy for immediate frontend feedback
      const startTime = new Date(
        `${appointment.timeSlot.appointmentDate}T${appointment.timeSlot.appointmentTime}`,
      );
      const hoursNotice = Math.max(
        0,
        (startTime.getTime() - Date.now()) / (1000 * 60 * 60),
      );
      const policy =
        AppointmentCancelledEvent.calculateCancellationPolicy(hoursNotice);
      const consultationFee = appointment.getConsultationFee();
      const estimatedRefundAmount =
        policy.refundEligible && policy.refundPercentage
          ? (consultationFee * policy.refundPercentage) / 100
          : 0;

      return {
        success: true,
        message: "Hủy lịch hẹn thành công",
        cancellationPolicy: {
          ...policy,
          hoursNotice,
          estimatedRefundAmount,
          consultationFee,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: "Hủy lịch hẹn thất bại",
        errors: [error instanceof Error ? error.message : "Unknown error"],
      };
    }
  }

  async authorize(
    request: CancelAppointmentRequest,
    userId: string,
  ): Promise<boolean> {
    return !!userId;
  }

  involvesPHI(request: CancelAppointmentRequest): boolean {
    return true;
  }

  getPatientId(request: CancelAppointmentRequest): string | null {
    return null; // Would need to fetch appointment first
  }
}
