/**
 * Scheduling Controller - Presentation Layer
 * V2 Clean Architecture + DDD Implementation
 * Main controller for appointment scheduling operations
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, RESTful API, Vietnamese Healthcare Standards
 */

import { Request, Response, NextFunction } from 'express';
import { ScheduleAppointmentUseCase, ScheduleAppointmentRequest, ScheduleAppointmentResponse } from '../../application/use-cases/ScheduleAppointmentUseCase';
import { RescheduleAppointmentUseCase, RescheduleAppointmentRequest, RescheduleAppointmentResponse } from '../../application/use-cases/RescheduleAppointmentUseCase';
import { CancelAppointmentUseCase, CancelAppointmentRequest, CancelAppointmentResponse } from '../../application/use-cases/CancelAppointmentUseCase';
import { CheckAvailabilityUseCase, CheckAvailabilityRequest, CheckAvailabilityResponse } from '../../application/use-cases/CheckAvailabilityUseCase';
import { AppointmentType, AppointmentPriority } from '../../domain/value-objects/AppointmentId';
import { AppointmentReason } from '../../domain/value-objects/AppointmentDetails';
import { ILogger } from '../../../shared/infrastructure/logging/logger.interface';

export interface SchedulingControllerDependencies {
  scheduleAppointmentUseCase: ScheduleAppointmentUseCase;
  rescheduleAppointmentUseCase: RescheduleAppointmentUseCase;
  cancelAppointmentUseCase: CancelAppointmentUseCase;
  checkAvailabilityUseCase: CheckAvailabilityUseCase;
  logger: ILogger;
}

/**
 * Scheduling Controller
 * Handles HTTP requests for appointment scheduling operations with Vietnamese healthcare compliance
 */
export class SchedulingController {
  private readonly scheduleAppointmentUseCase: ScheduleAppointmentUseCase;
  private readonly rescheduleAppointmentUseCase: RescheduleAppointmentUseCase;
  private readonly cancelAppointmentUseCase: CancelAppointmentUseCase;
  private readonly checkAvailabilityUseCase: CheckAvailabilityUseCase;
  private readonly logger: ILogger;

  constructor(dependencies: SchedulingControllerDependencies) {
    this.scheduleAppointmentUseCase = dependencies.scheduleAppointmentUseCase;
    this.rescheduleAppointmentUseCase = dependencies.rescheduleAppointmentUseCase;
    this.cancelAppointmentUseCase = dependencies.cancelAppointmentUseCase;
    this.checkAvailabilityUseCase = dependencies.checkAvailabilityUseCase;
    this.logger = dependencies.logger;
  }

  /**
   * Schedule new appointment
   * POST /api/v1/appointments
   */
  public scheduleAppointment = async (req: Request, res: Response): Promise<void> => {
    const requestId = req.headers['x-request-id'] as string || 'unknown';

    try {
      this.logger.info('Schedule appointment request received', {
        requestId,
        userId: req.user?.id,
        body: req.body
      });

      // Map HTTP request to Use Case request
      const useCaseRequest: ScheduleAppointmentRequest = {
        // Patient Information
        patientId: req.body.patient.patientId,
        patientName: req.body.patient.fullName,
        patientPhone: req.body.patient.phone,
        patientDateOfBirth: req.body.patient.dateOfBirth,
        patientNationalId: req.body.patient.nationalId,
        patientEmail: req.body.patient.email,
        patientAddress: req.body.patient.address,
        patientEmergencyContact: req.body.patient.emergencyContact,
        patientInsuranceNumber: req.body.patient.insuranceNumber,
        patientInsuranceType: req.body.patient.insuranceType,

        // Provider Information
        providerId: req.body.provider.providerId,
        providerName: req.body.provider.fullName,
        department: req.body.provider.department || req.body.departmentName,
        departmentCode: req.body.departmentCode,

        // Appointment Details
        appointmentType: req.body.appointment.appointmentType as AppointmentType,
        priority: req.body.appointment.priority as AppointmentPriority,
        startTime: new Date(req.body.appointment.startTime),
        endTime: new Date(req.body.appointment.endTime),
        roomId: req.body.appointment.roomId,
        reason: req.body.appointment.reason,
        reasonCode: req.body.appointment.reasonCode as AppointmentReason,
        symptoms: req.body.appointment.symptoms,
        notes: req.body.appointment.notes,
        preparationInstructions: req.body.appointment.preparationInstructions,
        estimatedDuration: req.body.appointment.estimatedDuration,
        requiresPreparation: req.body.appointment.requiresPreparation,
        isFollowUp: req.body.appointment.isFollowUp,
        previousAppointmentId: req.body.appointment.previousAppointmentId,
        urgencyLevel: req.body.appointment.urgencyLevel,
        specialRequirements: req.body.appointment.specialRequirements,
        interpreterRequired: req.body.appointment.interpreterRequired,
        wheelchairAccessible: req.body.appointment.wheelchairAccessible,
        fasting: req.body.appointment.fasting,
        medicationRestrictions: req.body.appointment.medicationRestrictions,

        // System Information
        createdBy: req.user?.id || req.body.createdBy || 'system'
      };

      // Execute use case
      const result = await this.scheduleAppointmentUseCase.execute(useCaseRequest);

      if (!result.success) {
        this.logger.warn('Schedule appointment failed', {
          requestId,
          message: result.message,
          validationResults: result.validationResults
        });

        res.status(400).json(this.createErrorResponse(
          result.message,
          'SCHEDULE_APPOINTMENT_FAILED',
          requestId,
          result.validationResults?.errors
        ));
        return;
      }

      // Return success response
      this.logger.info('Appointment scheduled successfully', {
        requestId,
        appointmentId: result.appointmentId
      });

      res.status(201).json(this.createSuccessResponse(
        {
          appointmentId: result.appointmentId,
          appointment: result.appointment ? {
            id: result.appointment.id,
            appointmentId: result.appointment.appointmentId.value,
            patientId: result.appointment.patient.patientId,
            providerId: result.appointment.provider.providerId,
            startTime: result.appointment.timeSlot.startTime,
            endTime: result.appointment.timeSlot.endTime,
            status: result.appointment.status,
            reason: result.appointment.details.reason,
            estimatedDuration: result.appointment.details.estimatedDuration,
            createdAt: result.appointment.createdAt,
            createdBy: result.appointment.createdBy
          } : undefined,
          integrationEvents: result.integrationEvents,
          nextSteps: result.nextSteps
        },
        result.message,
        requestId
      ));

    } catch (error) {
      this.logger.error('Error scheduling appointment', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });

      res.status(500).json(this.createErrorResponse(
        this.getVietnameseErrorMessage(error),
        'INTERNAL_SERVER_ERROR',
        requestId
      ));
    }
  };

        // Schedule appointment through application service
        const appointment = await this.schedulingService.scheduleAppointment(
          appointmentId,
          patientInfo,
          providerInfo,
          timeSlot,
          appointmentDetails,
          requestDto.appointment.roomId,
          userId
        );

        // Create response
        const responseDto: ScheduleAppointmentResponseDto = {
          success: true,
          message: 'Đặt lịch hẹn thành công',
          data: {
            appointment: {
              id: appointment.id,
              appointmentId: appointment.appointmentId.value,
              patientId: appointment.patient.patientId,
              patientName: appointment.patient.fullName,
              providerId: appointment.provider.providerId,
              providerName: appointment.provider.fullName,
              startTime: appointment.timeSlot.startTime.toISOString(),
              endTime: appointment.timeSlot.endTime.toISOString(),
              status: appointment.status,
              roomId: appointment.roomId,
              reason: appointment.details.reason,
              estimatedDuration: appointment.details.estimatedDuration,
              urgencyLevel: appointment.details.urgencyLevel,
              createdAt: appointment.createdAt.toISOString(),
              createdBy: appointment.createdBy
            },
            nextSteps: [
              'Bệnh nhân sẽ nhận được SMS xác nhận trong vòng 5 phút',
              'Vui lòng đến trước giờ hẹn 15 phút để làm thủ tục',
              'Mang theo CMND/CCCD và thẻ bảo hiểm (nếu có)'
            ],
            reminders: {
              smsReminder: true,
              emailReminder: !!requestDto.patient.email,
              reminderTimes: [
                new Date(appointment.timeSlot.startTime.getTime() - 24 * 60 * 60 * 1000).toISOString(), // 1 day before
                new Date(appointment.timeSlot.startTime.getTime() - 2 * 60 * 60 * 1000).toISOString()   // 2 hours before
              ]
            },
            qrCode: `QR-${appointment.appointmentId.value}`,
            appointmentUrl: `/appointments/${appointment.id}`
          }
        };

        res.status(201).json(responseDto);

      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Reschedule existing appointment
   * PUT /api/v1/scheduling/appointments/:appointmentId/reschedule
   */
  public rescheduleAppointment = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const { appointmentId } = req.params;
      const requestDto: RescheduleAppointmentRequestDto = req.body;
      const userId = req.user?.id || requestDto.rescheduledBy || 'system';

      try {
        // Create new time slot
        const newTimeSlot = TimeSlot.create(
          new Date(requestDto.newStartTime),
          new Date(requestDto.newEndTime),
          TimeSlotStatus.AVAILABLE
        );

        // Reschedule appointment through application service
        const appointment = await this.schedulingService.rescheduleAppointment(
          appointmentId,
          newTimeSlot,
          requestDto.reason,
          requestDto.newRoomId,
          userId
        );

        // Create response
        const responseDto: RescheduleAppointmentResponseDto = {
          success: true,
          message: 'Thay đổi lịch hẹn thành công',
          data: {
            appointmentId: appointment.appointmentId.value,
            oldStartTime: appointment.previousTimeSlot?.startTime.toISOString() || '',
            oldEndTime: appointment.previousTimeSlot?.endTime.toISOString() || '',
            newStartTime: appointment.timeSlot.startTime.toISOString(),
            newEndTime: appointment.timeSlot.endTime.toISOString(),
            status: appointment.status,
            rescheduledAt: appointment.updatedAt.toISOString(),
            rescheduledBy: userId,
            reason: requestDto.reason,
            notificationsSent: {
              patient: requestDto.notifyPatient !== false,
              provider: requestDto.notifyProvider !== false,
              channels: ['sms', 'email'].filter(channel => 
                (channel === 'sms') || 
                (channel === 'email' && appointment.patient.email)
              )
            }
          }
        };

        res.status(200).json(responseDto);

      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Check availability
   * GET /api/v1/scheduling/availability
   */
  public checkAvailability = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const requestDto: CheckAvailabilityRequestDto = req.query as any;

      try {
        // Check availability through application service
        const availability = await this.schedulingService.checkAvailability(
          requestDto.providerId,
          requestDto.departmentCode,
          new Date(requestDto.date),
          requestDto.startTime ? new Date(requestDto.startTime) : undefined,
          requestDto.endTime ? new Date(requestDto.endTime) : undefined,
          requestDto.appointmentType,
          requestDto.duration,
          requestDto.includeUnavailable
        );

        // Create response
        const responseDto: CheckAvailabilityResponseDto = {
          success: true,
          message: 'Kiểm tra lịch trống thành công',
          data: {
            date: requestDto.date,
            providerId: requestDto.providerId,
            providerName: availability.providerName,
            departmentCode: requestDto.departmentCode,
            departmentName: availability.departmentName,
            totalSlots: availability.totalSlots,
            availableSlots: availability.availableSlots,
            bookedSlots: availability.bookedSlots,
            blockedSlots: availability.blockedSlots,
            slots: availability.slots.map(slot => ({
              startTime: slot.startTime.toISOString(),
              endTime: slot.endTime.toISOString(),
              duration: slot.duration,
              status: slot.status,
              providerId: slot.providerId,
              providerName: slot.providerName,
              department: slot.department,
              roomId: slot.roomId,
              roomName: slot.roomName,
              appointmentId: slot.appointmentId,
              notes: slot.notes,
              conflictReason: slot.conflictReason
            })),
            recommendations: availability.recommendations ? {
              alternativeTimes: availability.recommendations.alternativeTimes.map(time => time.toISOString()),
              alternativeProviders: availability.recommendations.alternativeProviders.map(provider => ({
                providerId: provider.providerId,
                providerName: provider.providerName,
                department: provider.department,
                nextAvailableTime: provider.nextAvailableTime.toISOString()
              })),
              nextAvailableDate: availability.recommendations.nextAvailableDate.toISOString().split('T')[0]
            } : undefined
          }
        };

        res.status(200).json(responseDto);

      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Get appointment details
   * GET /api/v1/scheduling/appointments/:appointmentId
   */
  public getAppointmentDetails = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const { appointmentId } = req.params;

      try {
        // Get appointment details through application service
        const appointment = await this.schedulingService.getAppointmentDetails(appointmentId);

        if (!appointment) {
          throw new NotFoundError('Cuộc hẹn');
        }

        // Create response
        const responseDto: AppointmentDetailsResponseDto = {
          success: true,
          message: 'Lấy thông tin cuộc hẹn thành công',
          data: {
            id: appointment.id,
            appointmentId: appointment.appointmentId.value,
            patient: {
              patientId: appointment.patient.patientId,
              fullName: appointment.patient.fullName,
              phone: appointment.patient.phone,
              email: appointment.patient.email,
              insuranceNumber: appointment.patient.insuranceNumber,
              insuranceType: appointment.patient.insuranceType
            },
            provider: {
              providerId: appointment.provider.providerId,
              fullName: appointment.provider.fullName,
              specialization: appointment.provider.specialization,
              department: appointment.provider.department,
              phone: appointment.provider.phone,
              email: appointment.provider.email
            },
            appointment: {
              startTime: appointment.timeSlot.startTime.toISOString(),
              endTime: appointment.timeSlot.endTime.toISOString(),
              status: appointment.status,
              roomId: appointment.roomId,
              roomName: appointment.roomName,
              reason: appointment.details.reason,
              symptoms: appointment.details.symptoms,
              notes: appointment.details.notes,
              estimatedDuration: appointment.details.estimatedDuration,
              urgencyLevel: appointment.details.urgencyLevel,
              specialRequirements: appointment.details.specialRequirements,
              preparationInstructions: appointment.details.preparationInstructions
            },
            timeline: {
              createdAt: appointment.createdAt.toISOString(),
              createdBy: appointment.createdBy,
              confirmedAt: appointment.confirmedAt?.toISOString(),
              confirmedBy: appointment.confirmedBy,
              completedAt: appointment.completedAt?.toISOString(),
              completedBy: appointment.completedBy,
              cancelledAt: appointment.cancelledAt?.toISOString(),
              cancelledBy: appointment.cancelledBy,
              cancellationReason: appointment.cancellationReason
            },
            reminders: {
              sent: appointment.remindersSent || 0,
              scheduled: appointment.remindersScheduled || 2,
              lastSent: appointment.lastReminderSent?.toISOString(),
              nextScheduled: appointment.nextReminderScheduled?.toISOString()
            }
          }
        };

        res.status(200).json(responseDto);

      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Cancel appointment
   * DELETE /api/v1/scheduling/appointments/:appointmentId
   */
  public cancelAppointment = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const { appointmentId } = req.params;
      const { reason } = req.body;
      const userId = req.user?.id || 'system';

      try {
        // Cancel appointment through application service
        await this.schedulingService.cancelAppointment(appointmentId, reason, userId);

        // Create response
        const responseDto: SuccessResponseDto = {
          success: true,
          message: 'Hủy lịch hẹn thành công',
          data: {
            appointmentId,
            cancelledAt: new Date().toISOString(),
            cancelledBy: userId,
            reason
          },
          timestamp: new Date().toISOString(),
          path: req.path,
          method: req.method,
          statusCode: 200
        };

        res.status(200).json(responseDto);

      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Confirm appointment
   * POST /api/v1/scheduling/appointments/:appointmentId/confirm
   */
  public confirmAppointment = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const { appointmentId } = req.params;
      const userId = req.user?.id || 'system';

      try {
        // Confirm appointment through application service
        const appointment = await this.schedulingService.confirmAppointment(appointmentId, userId);

        // Create response
        const responseDto: SuccessResponseDto = {
          success: true,
          message: 'Xác nhận lịch hẹn thành công',
          data: {
            appointmentId: appointment.appointmentId.value,
            status: appointment.status,
            confirmedAt: appointment.confirmedAt?.toISOString(),
            confirmedBy: appointment.confirmedBy
          },
          timestamp: new Date().toISOString(),
          path: req.path,
          method: req.method,
          statusCode: 200
        };

        res.status(200).json(responseDto);

      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Cancel appointment
   * DELETE /api/v1/appointments/:appointmentId
   */
  public cancelAppointment = async (req: Request, res: Response): Promise<void> => {
    const requestId = req.headers['x-request-id'] as string || 'unknown';

    try {
      this.logger.info('Cancel appointment request received', {
        requestId,
        appointmentId: req.params.appointmentId,
        userId: req.user?.id
      });

      // Map HTTP request to Use Case request
      const useCaseRequest: CancelAppointmentRequest = {
        appointmentId: req.params.appointmentId,
        reason: req.body.reason || 'Cancelled by user',
        cancelledBy: req.user?.id || req.body.cancelledBy || 'system',
        notifyPatient: req.body.notifyPatient !== false,
        notifyProvider: req.body.notifyProvider !== false,
        refundRequired: req.body.refundRequired || false,
        cancellationFee: req.body.cancellationFee
      };

      // Execute use case
      const result = await this.cancelAppointmentUseCase.execute(useCaseRequest);

      if (!result.success) {
        this.logger.warn('Cancel appointment failed', {
          requestId,
          appointmentId: req.params.appointmentId,
          message: result.message,
          validationResults: result.validationResults
        });

        res.status(400).json(this.createErrorResponse(
          result.message,
          'CANCEL_APPOINTMENT_FAILED',
          requestId,
          result.validationResults?.errors
        ));
        return;
      }

      // Return success response
      this.logger.info('Appointment cancelled successfully', {
        requestId,
        appointmentId: req.params.appointmentId
      });

      res.status(200).json(this.createSuccessResponse(
        {
          appointmentId: req.params.appointmentId,
          integrationEvents: result.integrationEvents,
          nextSteps: result.nextSteps
        },
        result.message,
        requestId
      ));

    } catch (error) {
      this.logger.error('Error cancelling appointment', {
        requestId,
        appointmentId: req.params.appointmentId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });

      res.status(500).json(this.createErrorResponse(
        this.getVietnameseErrorMessage(error),
        'INTERNAL_SERVER_ERROR',
        requestId
      ));
    }
  };

  /**
   * Check availability
   * GET /api/v1/appointments/availability
   */
  public checkAvailability = async (req: Request, res: Response): Promise<void> => {
    const requestId = req.headers['x-request-id'] as string || 'unknown';

    try {
      this.logger.info('Check availability request received', {
        requestId,
        query: req.query,
        userId: req.user?.id
      });

      // Map HTTP request to Use Case request
      const useCaseRequest: CheckAvailabilityRequest = {
        providerId: req.query.providerId as string,
        departmentCode: req.query.departmentCode as string,
        date: new Date(req.query.date as string),
        startTime: req.query.startTime ? new Date(req.query.startTime as string) : undefined,
        endTime: req.query.endTime ? new Date(req.query.endTime as string) : undefined,
        appointmentType: req.query.appointmentType as string,
        duration: req.query.duration ? parseInt(req.query.duration as string) : undefined,
        includeUnavailable: req.query.includeUnavailable === 'true'
      };

      // Execute use case
      const result = await this.checkAvailabilityUseCase.execute(useCaseRequest);

      if (!result.success) {
        this.logger.warn('Check availability failed', {
          requestId,
          message: result.message
        });

        res.status(400).json(this.createErrorResponse(
          result.message,
          'CHECK_AVAILABILITY_FAILED',
          requestId
        ));
        return;
      }

      // Return success response
      this.logger.info('Availability checked successfully', {
        requestId,
        availableSlots: result.data?.availableSlots || 0
      });

      res.status(200).json(this.createSuccessResponse(
        result.data,
        result.message,
        requestId
      ));

    } catch (error) {
      this.logger.error('Error checking availability', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });

      res.status(500).json(this.createErrorResponse(
        this.getVietnameseErrorMessage(error),
        'INTERNAL_SERVER_ERROR',
        requestId
      ));
    }
  };

  /**
   * Create success response following established pattern
   */
  private createSuccessResponse(data: any, message: string, requestId: string): any {
    return {
      success: true,
      message,
      data,
      requestId,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Create error response following established pattern
   */
  private createErrorResponse(message: string, code: string, requestId: string, errors?: string[]): any {
    return {
      success: false,
      message,
      code,
      errors,
      requestId,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get Vietnamese error message following established pattern
   */
  private getVietnameseErrorMessage(error: any): string {
    if (error instanceof Error) {
      // Map common error messages to Vietnamese
      const errorMappings: { [key: string]: string } = {
        'Appointment not found': 'Không tìm thấy lịch hẹn',
        'Validation failed': 'Dữ liệu không hợp lệ',
        'Unauthorized': 'Không có quyền truy cập',
        'Database connection failed': 'Lỗi kết nối cơ sở dữ liệu',
        'Internal server error': 'Lỗi hệ thống nội bộ',
        'Time slot not available': 'Khung thời gian không khả dụng',
        'Provider not available': 'Bác sĩ không có lịch',
        'Appointment conflict': 'Xung đột lịch hẹn'
      };

      // Check if error message has Vietnamese translation
      for (const [english, vietnamese] of Object.entries(errorMappings)) {
        if (error.message.includes(english)) {
          return vietnamese;
        }
      }

      // If error message is already in Vietnamese, return as is
      if (this.isVietnamese(error.message)) {
        return error.message;
      }

      return error.message;
    }

    return 'Lỗi không xác định';
  }

  /**
   * Check if text is in Vietnamese
   */
  private isVietnamese(text: string): boolean {
    const vietnameseChars = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
    return vietnameseChars.test(text);
  }
}
