/**
 * Cancel Appointment Use Case - Application Layer
 * V2 Clean Architecture + DDD + CQRS Implementation
 * Vietnamese healthcare appointment cancellation
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, CQRS, Vietnamese Healthcare Standards
 */

import { BaseHealthcareUseCase } from '../../../shared/application/use-cases/base/use-case.interface';
import { Appointment } from '../../domain/aggregates/scheduling.aggregate';
import { ISchedulingRepository } from '../interfaces/ISchedulingRepository';
import { IEventBus } from '../interfaces/IEventBus';
import { ILogger } from '../../../shared/infrastructure/logging/logger.interface';
import { IAuthorizationService } from '../../../shared/application/services/authorization.service.interface';
import { IAuditService } from '../../../shared/application/services/audit.service.interface';

export interface CancelAppointmentRequest {
  appointmentId: string;
  reason: string;
  cancelledBy: string;
  notifyPatient?: boolean;
  notifyProvider?: boolean;
  refundRequired?: boolean;
  cancellationFee?: number;
}

export interface CancelAppointmentResponse {
  success: boolean;
  message: string;
  appointment?: Appointment;
  validationResults?: {
    errors: string[];
    warnings: string[];
    recommendations: string[];
  };
  integrationEvents?: {
    notificationSent: boolean;
    calendarUpdated: boolean;
    refundProcessed: boolean;
  };
  nextSteps?: string[];
}

export interface CancelAppointmentUseCaseDependencies {
  schedulingRepository: ISchedulingRepository;
  eventBus: IEventBus;
  logger: ILogger;
  authorizationService: IAuthorizationService;
  auditService: IAuditService;
}

/**
 * Cancel Appointment Use Case
 * Handles appointment cancellation with Vietnamese healthcare compliance
 */
export class CancelAppointmentUseCase implements BaseHealthcareUseCase<CancelAppointmentRequest, CancelAppointmentResponse> {
  constructor(private dependencies: CancelAppointmentUseCaseDependencies) {}

  /**
   * Execute the use case
   */
  async execute(request: CancelAppointmentRequest): Promise<CancelAppointmentResponse> {
    const { schedulingRepository, eventBus, logger, authorizationService, auditService } = this.dependencies;

    try {
      // 1. Validate request
      logger.info('Validating cancel appointment request', { 
        appointmentId: request.appointmentId,
        cancelledBy: request.cancelledBy,
        reason: request.reason
      });

      const validation = this.validateRequest(request);
      if (!validation.isValid) {
        logger.warn('Request validation failed', { 
          appointmentId: request.appointmentId,
          errors: validation.errors 
        });

        return {
          success: false,
          message: `Hủy lịch hẹn thất bại: ${validation.errors.join(', ')}`,
          validationResults: {
            errors: validation.errors,
            warnings: validation.warnings,
            recommendations: validation.recommendations
          }
        };
      }

      // 2. Find appointment
      logger.info('Finding appointment to cancel', { 
        appointmentId: request.appointmentId
      });

      const appointment = await schedulingRepository.findByAppointmentId(request.appointmentId);
      if (!appointment) {
        logger.warn('Appointment not found', { 
          appointmentId: request.appointmentId
        });

        return {
          success: false,
          message: 'Không tìm thấy lịch hẹn',
          validationResults: {
            errors: ['APPOINTMENT_NOT_FOUND'],
            warnings: [],
            recommendations: ['Vui lòng kiểm tra lại mã lịch hẹn']
          }
        };
      }

      // 3. Authorization check
      logger.info('Checking authorization for appointment cancellation', { 
        appointmentId: request.appointmentId,
        cancelledBy: request.cancelledBy,
        patientId: appointment.patient.patientId
      });

      const isAuthorized = await authorizationService.canCancelAppointment(
        request.cancelledBy,
        appointment.patient.patientId,
        appointment.provider.providerId
      );

      if (!isAuthorized) {
        logger.warn('Authorization failed for appointment cancellation', { 
          appointmentId: request.appointmentId,
          cancelledBy: request.cancelledBy
        });

        return {
          success: false,
          message: 'Không có quyền hủy lịch hẹn này'
        };
      }

      // 4. Business rule validation
      const businessValidation = this.validateBusinessRules(appointment, request);
      if (!businessValidation.isValid) {
        logger.warn('Business rule validation failed', { 
          appointmentId: request.appointmentId,
          errors: businessValidation.errors
        });

        return {
          success: false,
          message: `Không thể hủy lịch hẹn: ${businessValidation.errors.join(', ')}`,
          validationResults: {
            errors: businessValidation.errors,
            warnings: businessValidation.warnings,
            recommendations: businessValidation.recommendations
          }
        };
      }

      // 5. Cancel appointment
      logger.info('Cancelling appointment', { 
        appointmentId: request.appointmentId,
        cancelledBy: request.cancelledBy
      });

      appointment.cancel(request.cancelledBy, request.reason);

      // 6. Save appointment
      await schedulingRepository.save(appointment);

      // 7. Publish domain events
      logger.info('Publishing domain events', { 
        appointmentId: request.appointmentId,
        eventCount: appointment.getUncommittedEvents().length
      });

      const events = appointment.getUncommittedEvents();
      for (const event of events) {
        await eventBus.publish(event);
      }
      appointment.markEventsAsCommitted();

      // 8. Audit logging
      await auditService.logAppointmentCancelled(
        request.appointmentId,
        request.cancelledBy,
        'Appointment cancelled successfully',
        {
          reason: request.reason,
          patientId: appointment.patient.patientId,
          providerId: appointment.provider.providerId,
          originalStartTime: appointment.timeSlot.startTime.toISOString()
        }
      );

      // 9. Generate response
      logger.info('Appointment cancelled successfully', { 
        appointmentId: request.appointmentId,
        cancelledBy: request.cancelledBy
      });

      return {
        success: true,
        message: 'Lịch hẹn đã được hủy thành công',
        appointment: appointment,
        integrationEvents: {
          notificationSent: request.notifyPatient || request.notifyProvider || false,
          calendarUpdated: true,
          refundProcessed: request.refundRequired || false
        },
        nextSteps: [
          'Thông báo hủy lịch đã được gửi đến bệnh nhân và bác sĩ',
          'Khung thời gian đã được giải phóng cho lịch hẹn khác',
          request.refundRequired ? 'Hoàn tiền sẽ được xử lý trong 3-5 ngày làm việc' : ''
        ].filter(step => step !== '')
      };

    } catch (error) {
      logger.error('Error cancelling appointment', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        appointmentId: request.appointmentId,
        cancelledBy: request.cancelledBy,
        stack: error instanceof Error ? error.stack : undefined
      });

      return {
        success: false,
        message: 'Có lỗi xảy ra khi hủy lịch hẹn',
        validationResults: {
          errors: [error instanceof Error ? error.message : 'UNKNOWN_ERROR'],
          warnings: [],
          recommendations: ['Vui lòng thử lại sau hoặc liên hệ hỗ trợ']
        }
      };
    }
  }

  /**
   * Validate cancellation request
   */
  private validateRequest(request: CancelAppointmentRequest): { isValid: boolean; errors: string[]; warnings: string[]; recommendations: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    if (!request.appointmentId) {
      errors.push('Mã lịch hẹn là bắt buộc');
    }

    if (!request.reason) {
      errors.push('Lý do hủy là bắt buộc');
    }

    if (!request.cancelledBy) {
      errors.push('Thông tin người hủy là bắt buộc');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      recommendations
    };
  }

  /**
   * Validate business rules for cancellation
   */
  private validateBusinessRules(appointment: Appointment, request: CancelAppointmentRequest): { isValid: boolean; errors: string[]; warnings: string[]; recommendations: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Check if appointment is already cancelled
    if (appointment.status === 'CANCELLED') {
      errors.push('Lịch hẹn đã được hủy trước đó');
    }

    // Check if appointment is completed
    if (appointment.status === 'COMPLETED') {
      errors.push('Không thể hủy lịch hẹn đã hoàn thành');
    }

    // Check if appointment is in progress
    if (appointment.status === 'IN_PROGRESS') {
      errors.push('Không thể hủy lịch hẹn đang diễn ra');
    }

    // Check cancellation timing (Vietnamese healthcare rules)
    const now = new Date();
    const appointmentTime = appointment.timeSlot.startTime;
    const hoursUntilAppointment = (appointmentTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilAppointment < 2) {
      warnings.push('Hủy lịch trong vòng 2 tiếng có thể phát sinh phí');
      recommendations.push('Liên hệ trực tiếp với phòng khám để được hỗ trợ');
    }

    if (hoursUntilAppointment < 0) {
      errors.push('Không thể hủy lịch hẹn đã qua');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      recommendations
    };
  }

  /**
   * Check if this use case involves PHI (Protected Health Information)
   */
  involvesPHI(request: CancelAppointmentRequest): boolean {
    return true; // Appointment cancellation always involves PHI
  }
}
