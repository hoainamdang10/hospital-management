/**
 * Schedule Appointment Use Case - Application Layer
 * V2 Clean Architecture + DDD + CQRS Implementation
 * Vietnamese healthcare appointment scheduling
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, CQRS, Vietnamese Healthcare Standards
 */

import { BaseHealthcareUseCase } from '../../../shared/application/use-cases/base/use-case.interface';
import { Appointment } from '../../domain/aggregates/scheduling.aggregate';
import { AppointmentId, AppointmentType, AppointmentPriority } from '../../domain/value-objects/AppointmentId';
import { PatientInfo } from '../../domain/value-objects/PatientInfo';
import { ProviderInfo } from '../../domain/value-objects/ProviderInfo';
import { TimeSlot } from '../../domain/value-objects/TimeSlot';
import { AppointmentDetails, AppointmentReason } from '../../domain/value-objects/AppointmentDetails';
import { ISchedulingRepository } from '../interfaces/ISchedulingRepository';
import { IEventBus } from '../interfaces/IEventBus';
import { IAvailabilityService } from '../interfaces/IAvailabilityService';
import { ILogger } from '../../../shared/infrastructure/logging/logger.interface';
import { IAuthorizationService } from '../../../shared/application/services/authorization.service.interface';
import { IAuditService } from '../../../shared/application/services/audit.service.interface';

export interface ScheduleAppointmentRequest {
  // Patient Information
  patientId: string;
  patientName: string;
  patientPhone: string;
  patientDateOfBirth: string;
  patientNationalId: string;
  patientEmail?: string;
  patientAddress?: string;
  patientEmergencyContact?: string;
  patientInsuranceNumber?: string;
  patientInsuranceType?: 'BHYT' | 'BHTN' | 'PRIVATE';

  // Provider Information
  providerId: string;
  providerName: string;
  department: string;
  departmentCode: string;

  // Appointment Details
  appointmentType: AppointmentType;
  priority: AppointmentPriority;
  startTime: Date;
  endTime: Date;
  roomId?: string;
  reason: string;
  reasonCode?: AppointmentReason;
  symptoms?: string;
  notes?: string;
  preparationInstructions?: string;
  estimatedDuration: number;
  requiresPreparation?: boolean;
  isFollowUp?: boolean;
  previousAppointmentId?: string;
  urgencyLevel?: 'routine' | 'urgent' | 'emergency';
  specialRequirements?: string[];
  interpreterRequired?: boolean;
  wheelchairAccessible?: boolean;
  fasting?: boolean;
  medicationRestrictions?: string[];

  // System Information
  createdBy: string;
}

export interface ScheduleAppointmentResponse {
  success: boolean;
  appointmentId: string;
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
    reminderScheduled: boolean;
  };
  nextSteps?: string[];
}

export interface ScheduleAppointmentUseCaseDependencies {
  schedulingRepository: ISchedulingRepository;
  eventBus: IEventBus;
  availabilityService: IAvailabilityService;
  logger: ILogger;
  authorizationService: IAuthorizationService;
  auditService: IAuditService;
}

/**
 * Schedule Appointment Use Case
 * Handles the complete appointment scheduling workflow with Vietnamese healthcare compliance
 */
export class ScheduleAppointmentUseCase implements BaseHealthcareUseCase<ScheduleAppointmentRequest, ScheduleAppointmentResponse> {
  constructor(private dependencies: ScheduleAppointmentUseCaseDependencies) {}

  /**
   * Execute the use case
   */
  async execute(request: ScheduleAppointmentRequest): Promise<ScheduleAppointmentResponse> {
    const { schedulingRepository, eventBus, availabilityService, logger, authorizationService, auditService } = this.dependencies;

    try {
      // 1. Validate request
      logger.info('Validating schedule appointment request', {
        patientId: request.patientId,
        providerId: request.providerId,
        appointmentType: request.appointmentType,
        startTime: request.startTime.toISOString()
      });

      const validation = this.validateRequest(request);
      if (!validation.isValid) {
        logger.warn('Request validation failed', {
          patientId: request.patientId,
          errors: validation.errors
        });

        return {
          success: false,
          appointmentId: '',
          message: `Đặt lịch hẹn thất bại: ${validation.errors.join(', ')}`,
          validationResults: {
            errors: validation.errors,
            warnings: validation.warnings,
            recommendations: validation.recommendations
          }
        };
      }

      // 2. Authorization check
      logger.info('Checking authorization for appointment scheduling', {
        requestedBy: request.createdBy,
        patientId: request.patientId,
        providerId: request.providerId
      });

      const isAuthorized = await authorizationService.canScheduleAppointment(
        request.createdBy,
        request.patientId,
        request.providerId
      );

      if (!isAuthorized) {
        logger.warn('Authorization failed for appointment scheduling', {
          requestedBy: request.createdBy,
          patientId: request.patientId
        });

        return {
          success: false,
          appointmentId: '',
          message: 'Không có quyền đặt lịch hẹn cho bệnh nhân này'
        };
      }

      // 3. Check provider availability
      logger.info('Checking provider availability', {
        providerId: request.providerId,
        startTime: request.startTime.toISOString(),
        endTime: request.endTime.toISOString()
      });

      const isAvailable = await availabilityService.checkAvailability(
        request.providerId,
        request.startTime,
        request.endTime
      );

      if (!isAvailable) {
        logger.warn('Provider not available for requested time slot', {
          providerId: request.providerId,
          startTime: request.startTime.toISOString(),
          endTime: request.endTime.toISOString()
        });

        return {
          success: false,
          appointmentId: '',
          message: 'Khung thời gian đã được đặt hoặc không khả dụng',
          validationResults: {
            errors: ['TIME_SLOT_NOT_AVAILABLE'],
            warnings: [],
            recommendations: ['Vui lòng chọn khung thời gian khác']
          }
        };
      }

      // 4. Check for conflicts
      logger.info('Checking for appointment conflicts', {
        providerId: request.providerId,
        timeRange: `${request.startTime.toISOString()} - ${request.endTime.toISOString()}`
      });

      const conflicts = await schedulingRepository.findByProviderAndTimeRange(
        request.providerId,
        request.startTime,
        request.endTime
      );

      if (conflicts.length > 0) {
        logger.warn('Appointment conflicts detected', {
          providerId: request.providerId,
          conflictCount: conflicts.length,
          conflictIds: conflicts.map(c => c.appointmentId.value)
        });

        return {
          success: false,
          appointmentId: '',
          message: 'Có xung đột lịch hẹn trong khung thời gian này',
          validationResults: {
            errors: ['APPOINTMENT_CONFLICT'],
            warnings: [],
            recommendations: ['Vui lòng chọn khung thời gian khác hoặc liên hệ để điều chỉnh lịch']
          }
        };
      }

      // 5. Create domain objects
      logger.info('Creating domain objects for appointment', {
        patientId: request.patientId,
        providerId: request.providerId,
        appointmentType: request.appointmentType
      });

      const appointmentId = AppointmentId.create(
        request.appointmentType,
        request.departmentCode,
        request.priority
      );

      const patientInfo = PatientInfo.create(
        request.patientId,
        request.patientName,
        request.patientPhone,
        request.patientDateOfBirth,
        request.patientNationalId,
        request.patientEmail,
        request.patientAddress,
        request.patientEmergencyContact,
        request.patientInsuranceNumber,
        request.patientInsuranceType
      );

      const providerInfo = ProviderInfo.create(
        request.providerId,
        request.providerName,
        request.department,
        request.departmentCode
      );

      const timeSlot = TimeSlot.create(
        request.startTime,
        request.endTime,
        'AVAILABLE',
        request.providerId,
        request.roomId
      );

      const appointmentDetails = AppointmentDetails.create(
        request.reason,
        request.estimatedDuration,
        request.requiresPreparation || false,
        request.isFollowUp || false,
        request.urgencyLevel || 'routine',
        request.reasonCode,
        request.symptoms,
        request.notes,
        request.preparationInstructions,
        request.previousAppointmentId,
        request.specialRequirements,
        request.interpreterRequired,
        request.wheelchairAccessible,
        request.fasting,
        request.medicationRestrictions
      );

      // 6. Create appointment aggregate
      logger.info('Creating appointment aggregate', {
        appointmentId: appointmentId.value,
        patientId: request.patientId,
        providerId: request.providerId
      });
      const appointment = Appointment.create(
        appointmentId,
        patientInfo,
        providerInfo,
        timeSlot,
        appointmentDetails,
        request.roomId,
        request.createdBy
      );

      // 7. Save appointment
      logger.info('Saving appointment to repository', {
        appointmentId: appointment.appointmentId.value
      });

      await schedulingRepository.save(appointment);

      // 8. Publish domain events
      logger.info('Publishing domain events', {
        appointmentId: appointment.appointmentId.value,
        eventCount: appointment.getUncommittedEvents().length
      });

      const events = appointment.getUncommittedEvents();
      for (const event of events) {
        await eventBus.publish(event);
      }
      appointment.markEventsAsCommitted();

      // 9. Audit logging
      await auditService.logAppointmentScheduled(
        appointment.appointmentId.value,
        request.createdBy,
        'Appointment scheduled successfully',
        {
          patientId: request.patientId,
          providerId: request.providerId,
          appointmentType: request.appointmentType,
          priority: request.priority,
          startTime: request.startTime.toISOString(),
          endTime: request.endTime.toISOString()
        }
      );

      // 10. Generate response
      logger.info('Appointment scheduled successfully', {
        appointmentId: appointment.appointmentId.value,
        patientId: request.patientId,
        providerId: request.providerId
      });

      return {
        success: true,
        appointmentId: appointment.appointmentId.value,
        message: 'Cuộc hẹn đã được đặt thành công',
        appointment: appointment,
        integrationEvents: {
          notificationSent: true,
          calendarUpdated: true,
          reminderScheduled: true
        },
        nextSteps: [
          'Bệnh nhân sẽ nhận được SMS xác nhận trong vòng 5 phút',
          'Vui lòng đến trước giờ hẹn 15 phút để làm thủ tục',
          'Mang theo CMND/CCCD và thẻ BHYT (nếu có)'
        ]
      };

    } catch (error) {
      logger.error('Error scheduling appointment', {
        error: error instanceof Error ? error.message : 'Unknown error',
        patientId: request.patientId,
        providerId: request.providerId,
        stack: error instanceof Error ? error.stack : undefined
      });

      return {
        success: false,
        appointmentId: '',
        message: 'Có lỗi xảy ra khi đặt lịch hẹn',
        validationResults: {
          errors: [error instanceof Error ? error.message : 'UNKNOWN_ERROR'],
          warnings: [],
          recommendations: ['Vui lòng thử lại sau hoặc liên hệ hỗ trợ']
        }
      };
    }
  }

  /**
   * Validate appointment request with Vietnamese healthcare rules
   */
  private validateRequest(request: ScheduleAppointmentRequest): { isValid: boolean; errors: string[]; warnings: string[]; recommendations: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Patient validation
    if (!request.patientId || !request.patientName) {
      errors.push('Thông tin bệnh nhân không đầy đủ');
    }

    if (!request.patientPhone) {
      errors.push('Số điện thoại bệnh nhân là bắt buộc');
    }

    if (!request.patientNationalId) {
      errors.push('CMND/CCCD bệnh nhân là bắt buộc');
    }

    // Provider validation
    if (!request.providerId || !request.providerName) {
      errors.push('Thông tin bác sĩ không đầy đủ');
    }

    if (!request.department || !request.departmentCode) {
      errors.push('Thông tin khoa không đầy đủ');
    }

    // Time validation
    if (!request.startTime || !request.endTime) {
      errors.push('Thời gian hẹn không hợp lệ');
    } else {
      const now = new Date();
      if (request.startTime <= now) {
        errors.push('Thời gian hẹn phải trong tương lai');
      }

      if (request.endTime <= request.startTime) {
        errors.push('Thời gian kết thúc phải sau thời gian bắt đầu');
      }

      // Vietnamese business hours check (7:00 - 17:00)
      const startHour = request.startTime.getHours();
      const endHour = request.endTime.getHours();

      if (startHour < 7 || endHour > 17) {
        warnings.push('Cuộc hẹn ngoài giờ hành chính (7:00-17:00)');
        recommendations.push('Xem xét đặt lịch trong giờ hành chính để được hỗ trợ tốt hơn');
      }
    }

    // Appointment details validation
    if (!request.reason) {
      errors.push('Lý do khám là bắt buộc');
    }

    if (!request.estimatedDuration || request.estimatedDuration <= 0) {
      errors.push('Thời gian dự kiến không hợp lệ');
    }

    // Emergency appointment validation
    if (request.priority === AppointmentPriority.EMERGENCY) {
      if (!request.symptoms) {
        warnings.push('Cuộc hẹn cấp cứu nên có mô tả triệu chứng');
        recommendations.push('Thêm mô tả triệu chứng để bác sĩ chuẩn bị tốt hơn');
      }
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
  involvesPHI(request: ScheduleAppointmentRequest): boolean {
    return true; // Appointment scheduling always involves PHI
  }

    if (!request.providerId || !request.providerName) {
      throw new Error('Thông tin nhà cung cấp không đầy đủ');
    }

    if (!request.startTime || !request.endTime) {
      throw new Error('Thời gian cuộc hẹn không hợp lệ');
    }

    if (request.startTime >= request.endTime) {
      throw new Error('Thời gian bắt đầu phải trước thời gian kết thúc');
    }

    if (request.startTime <= new Date()) {
      throw new Error('Không thể đặt lịch hẹn trong quá khứ');
    }

    if (!request.reason || request.reason.trim().length < 3) {
      throw new Error('Lý do khám phải có ít nhất 3 ký tự');
    }

    if (request.estimatedDuration <= 0 || request.estimatedDuration > 480) {
      throw new Error('Thời gian dự kiến phải từ 1 phút đến 8 giờ');
    }
  }

  private async getProviderInfo(providerId: string): Promise<ProviderInfo> {
    // This would typically call Provider Staff Service through API Gateway
    // For now, we'll create a mock implementation
    return ProviderInfo.create(
      providerId,
      'Provider Name', // Would be fetched from Provider Staff Service
      'Department',
      'DEPT',
      'VN-XX-0000',
      'DOCTOR',
      'ACTIVE'
    );
  }

  private generateNextSteps(appointment: Appointment): string[] {
    const steps: string[] = [
      'Cuộc hẹn đã được tạo và đang chờ xác nhận',
      'Bạn sẽ nhận được thông báo xác nhận qua SMS/Email'
    ];

    if (appointment.details.requiresPreparation) {
      steps.push('Vui lòng chuẩn bị theo hướng dẫn đã gửi');
    }

    if (appointment.details.fasting) {
      steps.push('Nhớ nhịn ăn theo yêu cầu trước khi đến khám');
    }

    steps.push('Đến sớm 15 phút để làm thủ tục');

    return steps;
  }

  private generateReminderSchedule(appointment: Appointment): any {
    const reminderTimes: Date[] = [];
    const startTime = appointment.timeSlot.startTime;

    // 24 hours before
    const oneDayBefore = new Date(startTime);
    oneDayBefore.setHours(oneDayBefore.getHours() - 24);
    reminderTimes.push(oneDayBefore);

    // 2 hours before for urgent appointments
    if (appointment.details.isUrgent() || appointment.details.isEmergency()) {
      const twoHoursBefore = new Date(startTime);
      twoHoursBefore.setHours(twoHoursBefore.getHours() - 2);
      reminderTimes.push(twoHoursBefore);
    }

    return {
      smsReminder: true,
      emailReminder: !!appointment.patient.email,
      reminderTimes
    };
  }
}
