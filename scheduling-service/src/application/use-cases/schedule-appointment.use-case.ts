/**
 * Schedule Appointment Use Case - Application Layer
 * Use case for scheduling appointments with inter-service communication
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Healthcare Standards, Inter-Service Communication
 */

import { UseCase } from '../../../shared/application/use-cases/use-case';
import { ScheduleAppointmentCommand } from '../commands/schedule-appointment.command';
import { AppointmentResponseDto, AppointmentResponseMapper } from '../dtos/appointment-response.dto';
import { IAppointmentRepository } from '../../domain/repositories/appointment.repository';
import { Appointment, PatientInfo, ProviderInfo, AppointmentDetails } from '../../domain/aggregates/appointment.aggregate';
import { AppointmentId } from '../../domain/value-objects/appointment-id';
import { TimeSlot, TimeSlotStatus } from '../../domain/value-objects/time-slot';
import { IEventPublisher } from '../../../shared/domain/events/event-publisher.interface';
import { ILogger } from '../../../shared/infrastructure/logging/logger.interface';
import { IAuthorizationService } from '../../../shared/application/services/authorization.service.interface';
import { IAuditService } from '../../../shared/application/services/audit.service.interface';

// External service interfaces
export interface IPatientRegistryService {
  getPatient(patientId: string): Promise<PatientInfo | null>;
  validatePatientExists(patientId: string): Promise<boolean>;
  updatePatientAppointmentHistory(patientId: string, appointmentId: string): Promise<void>;
}

export interface IProviderStaffService {
  getProvider(providerId: string): Promise<ProviderInfo | null>;
  validateProviderAvailability(providerId: string, startTime: Date, endTime: Date): Promise<boolean>;
  bookProviderTimeSlot(providerId: string, startTime: Date, endTime: Date, appointmentId: string): Promise<void>;
  validateProviderCapabilities(providerId: string, appointmentType: string): Promise<boolean>;
}

export interface ScheduleAppointmentResult {
  success: boolean;
  appointmentId?: string;
  appointment?: AppointmentResponseDto;
  validationResults: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  };
  message: string;
  integrationResults?: {
    patientServiceResult: boolean;
    providerServiceResult: boolean;
    notificationServiceResult: boolean;
  };
}

export interface ScheduleAppointmentUseCaseDependencies {
  appointmentRepository: IAppointmentRepository;
  patientRegistryService: IPatientRegistryService;
  providerStaffService: IProviderStaffService;
  eventPublisher: IEventPublisher;
  logger: ILogger;
  authorizationService: IAuthorizationService;
  auditService: IAuditService;
}

/**
 * Schedule Appointment Use Case
 * Handles appointment scheduling with comprehensive validation and inter-service communication
 */
export class ScheduleAppointmentUseCase implements UseCase<ScheduleAppointmentCommand, ScheduleAppointmentResult> {
  
  constructor(private dependencies: ScheduleAppointmentUseCaseDependencies) {}

  /**
   * Execute appointment scheduling
   */
  async execute(command: ScheduleAppointmentCommand): Promise<ScheduleAppointmentResult> {
    const { 
      appointmentRepository, 
      patientRegistryService, 
      providerStaffService,
      eventPublisher,
      logger,
      authorizationService,
      auditService
    } = this.dependencies;

    try {
      logger.info('Starting appointment scheduling', {
        correlationId: command.correlationId,
        appointmentType: command.appointmentType,
        patientId: command.patient.patientId,
        providerId: command.provider.providerId,
        scheduledBy: command.scheduledBy
      });

      // Step 1: Authorization check
      const authResult = await this.checkAuthorization(command);
      if (!authResult.isAuthorized) {
        logger.warn('Authorization failed for appointment scheduling', {
          correlationId: command.correlationId,
          reason: authResult.reason,
          userId: command.userId
        });

        return {
          success: false,
          validationResults: {
            isValid: false,
            errors: [authResult.reason || 'Không có quyền lên lịch cuộc hẹn'],
            warnings: []
          },
          message: 'Không có quyền thực hiện thao tác này'
        };
      }

      // Step 2: Comprehensive validation
      const validationResult = await this.validateAppointmentRequest(command);
      if (!validationResult.isValid) {
        logger.warn('Appointment validation failed', {
          correlationId: command.correlationId,
          errors: validationResult.errors,
          warnings: validationResult.warnings
        });

        return {
          success: false,
          validationResults: validationResult,
          message: 'Dữ liệu cuộc hẹn không hợp lệ'
        };
      }

      // Step 3: Get complete patient information
      const patient = await this.getPatientInformation(command.patient.patientId);
      if (!patient) {
        logger.error('Patient not found', {
          correlationId: command.correlationId,
          patientId: command.patient.patientId
        });

        return {
          success: false,
          validationResults: {
            isValid: false,
            errors: ['Không tìm thấy thông tin bệnh nhân'],
            warnings: []
          },
          message: 'Bệnh nhân không tồn tại trong hệ thống'
        };
      }

      // Step 4: Get complete provider information
      const provider = await this.getProviderInformation(command.provider.providerId);
      if (!provider) {
        logger.error('Provider not found', {
          correlationId: command.correlationId,
          providerId: command.provider.providerId
        });

        return {
          success: false,
          validationResults: {
            isValid: false,
            errors: ['Không tìm thấy thông tin bác sĩ'],
            warnings: []
          },
          message: 'Bác sĩ không tồn tại trong hệ thống'
        };
      }

      // Step 5: Validate provider availability and capabilities
      const providerValidation = await this.validateProviderForAppointment(command, provider);
      if (!providerValidation.isValid) {
        logger.warn('Provider validation failed', {
          correlationId: command.correlationId,
          providerId: command.provider.providerId,
          errors: providerValidation.errors
        });

        return {
          success: false,
          validationResults: providerValidation,
          message: 'Bác sĩ không thể thực hiện cuộc hẹn này'
        };
      }

      // Step 6: Check for appointment conflicts
      const conflictCheck = await this.checkAppointmentConflicts(command);
      if (conflictCheck.hasConflicts) {
        logger.warn('Appointment conflicts detected', {
          correlationId: command.correlationId,
          conflicts: conflictCheck.conflicts
        });

        return {
          success: false,
          validationResults: {
            isValid: false,
            errors: conflictCheck.conflicts,
            warnings: []
          },
          message: 'Có xung đột lịch hẹn'
        };
      }

      // Step 7: Create appointment domain object
      const appointmentId = AppointmentId.create(
        command.appointmentType,
        provider.department,
        command.priority
      );

      const timeSlot = TimeSlot.create(
        command.getStartTime(),
        command.getEndTime(),
        TimeSlotStatus.AVAILABLE,
        provider.providerId,
        command.timeSlot.roomId
      );

      const appointmentDetails: AppointmentDetails = {
        reason: command.details.reason,
        symptoms: command.details.symptoms,
        notes: command.details.notes,
        preparationInstructions: command.details.preparationInstructions,
        estimatedDuration: command.getEstimatedDuration(),
        requiresPreparation: command.details.requiresPreparation || false,
        isFollowUp: command.isFollowUp(),
        previousAppointmentId: command.details.previousAppointmentId
      };

      const appointment = Appointment.create(
        appointmentId,
        patient,
        provider,
        timeSlot,
        appointmentDetails,
        command.timeSlot.roomId,
        command.scheduledBy
      );

      // Step 8: Save appointment
      await appointmentRepository.save(appointment);

      logger.info('Appointment saved successfully', {
        correlationId: command.correlationId,
        appointmentId: appointmentId.value,
        patientId: patient.patientId,
        providerId: provider.providerId
      });

      // Step 9: Inter-service communication
      const integrationResults = await this.performInterServiceCommunication(appointment, command);

      // Step 10: Publish domain events
      await this.publishDomainEvents(appointment);

      // Step 11: Audit logging
      await auditService.logAppointmentScheduled(
        appointmentId.value,
        command.scheduledBy,
        'Appointment scheduled successfully',
        {
          patientId: patient.patientId,
          providerId: provider.providerId,
          appointmentType: command.appointmentType,
          priority: command.priority,
          startTime: command.getStartTime().toISOString(),
          endTime: command.getEndTime().toISOString()
        }
      );

      // Step 12: Create response
      const appointmentDto = AppointmentResponseMapper.mapToDto(
        appointment,
        true, // includePatientInfo
        true, // includeProviderInfo
        true, // includeDetails
        false, // includeHistory
        false, // anonymizeData
        'standard' // accessLevel
      );

      logger.info('Appointment scheduling completed successfully', {
        correlationId: command.correlationId,
        appointmentId: appointmentId.value,
        integrationResults
      });

      return {
        success: true,
        appointmentId: appointmentId.value,
        appointment: appointmentDto,
        validationResults: {
          isValid: true,
          errors: [],
          warnings: validationResult.warnings
        },
        message: 'Lên lịch cuộc hẹn thành công',
        integrationResults
      };

    } catch (error) {
      logger.error('Error in schedule appointment use case', {
        correlationId: command.correlationId,
        error: error.message,
        stack: error.stack
      });

      return {
        success: false,
        validationResults: {
          isValid: false,
          errors: ['Lỗi hệ thống khi lên lịch cuộc hẹn'],
          warnings: []
        },
        message: 'Có lỗi xảy ra, vui lòng thử lại sau'
      };
    }
  }

  /**
   * Check authorization for appointment scheduling
   */
  private async checkAuthorization(command: ScheduleAppointmentCommand): Promise<{ isAuthorized: boolean; reason?: string }> {
    const { authorizationService } = this.dependencies;

    try {
      // Check basic permission
      const hasPermission = await authorizationService.hasPermission(
        command.userId || command.scheduledBy,
        'appointment:create'
      );

      if (!hasPermission) {
        return { isAuthorized: false, reason: 'Không có quyền tạo cuộc hẹn' };
      }

      // Check emergency appointment permission
      if (command.isEmergency()) {
        const hasEmergencyPermission = await authorizationService.hasPermission(
          command.userId || command.scheduledBy,
          'appointment:create:emergency'
        );

        if (!hasEmergencyPermission) {
          return { isAuthorized: false, reason: 'Không có quyền tạo cuộc hẹn cấp cứu' };
        }
      }

      // Check surgery appointment permission
      if (command.requiresSurgery()) {
        const hasSurgeryPermission = await authorizationService.hasPermission(
          command.userId || command.scheduledBy,
          'appointment:create:surgery'
        );

        if (!hasSurgeryPermission) {
          return { isAuthorized: false, reason: 'Không có quyền tạo cuộc hẹn phẫu thuật' };
        }
      }

      return { isAuthorized: true };

    } catch (error) {
      this.dependencies.logger.error('Authorization check failed', {
        error: error.message,
        userId: command.userId
      });

      return { isAuthorized: false, reason: 'Lỗi kiểm tra quyền hạn' };
    }
  }

  /**
   * Comprehensive validation of appointment request
   */
  private async validateAppointmentRequest(command: ScheduleAppointmentCommand): Promise<{ isValid: boolean; errors: string[]; warnings: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Business hours validation
    if (!command.isWithinBusinessHours() && !command.isEmergency()) {
      errors.push('Cuộc hẹn phải trong giờ làm việc (trừ cấp cứu)');
    }

    // Future time validation
    const now = new Date();
    const appointmentTime = command.getStartTime();
    
    if (appointmentTime <= now) {
      errors.push('Thời gian cuộc hẹn phải trong tương lai');
    }

    // Minimum advance booking (except emergency)
    if (!command.isEmergency()) {
      const hoursInAdvance = (appointmentTime.getTime() - now.getTime()) / (1000 * 60 * 60);
      if (hoursInAdvance < 1) {
        errors.push('Cuộc hẹn phải được đặt trước ít nhất 1 giờ');
      }
    }

    // Maximum advance booking
    const maxAdvanceDays = 90;
    const daysInAdvance = (appointmentTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    if (daysInAdvance > maxAdvanceDays) {
      warnings.push(`Cuộc hẹn được đặt quá xa (${Math.round(daysInAdvance)} ngày), tối đa ${maxAdvanceDays} ngày`);
    }

    // Duration validation
    const duration = command.getDurationMinutes();
    const expectedDuration = command.getEstimatedDuration();
    
    if (Math.abs(duration - expectedDuration) > 15) {
      warnings.push(`Thời gian cuộc hẹn (${duration} phút) khác với dự kiến (${expectedDuration} phút)`);
    }

    // Weekend validation
    const dayOfWeek = appointmentTime.getDay();
    if (dayOfWeek === 0 && !command.isEmergency()) { // Sunday
      errors.push('Không thể đặt lịch vào Chủ nhật (trừ cấp cứu)');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get complete patient information from Patient Registry Service
   */
  private async getPatientInformation(patientId: string): Promise<PatientInfo | null> {
    const { patientRegistryService, logger } = this.dependencies;

    try {
      const patient = await patientRegistryService.getPatient(patientId);
      
      if (!patient) {
        logger.warn('Patient not found in registry service', { patientId });
        return null;
      }

      logger.debug('Patient information retrieved', {
        patientId,
        fullName: patient.fullName
      });

      return patient;

    } catch (error) {
      logger.error('Error getting patient information', {
        patientId,
        error: error.message
      });

      return null;
    }
  }

  /**
   * Get complete provider information from Provider/Staff Service
   */
  private async getProviderInformation(providerId: string): Promise<ProviderInfo | null> {
    const { providerStaffService, logger } = this.dependencies;

    try {
      const provider = await providerStaffService.getProvider(providerId);
      
      if (!provider) {
        logger.warn('Provider not found in staff service', { providerId });
        return null;
      }

      logger.debug('Provider information retrieved', {
        providerId,
        fullName: provider.fullName,
        department: provider.department
      });

      return provider;

    } catch (error) {
      logger.error('Error getting provider information', {
        providerId,
        error: error.message
      });

      return null;
    }
  }

  /**
   * Validate provider for specific appointment
   */
  private async validateProviderForAppointment(
    command: ScheduleAppointmentCommand,
    provider: ProviderInfo
  ): Promise<{ isValid: boolean; errors: string[]; warnings: string[] }> {
    const { providerStaffService, logger } = this.dependencies;
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Check availability
      const isAvailable = await providerStaffService.validateProviderAvailability(
        provider.providerId,
        command.getStartTime(),
        command.getEndTime()
      );

      if (!isAvailable) {
        errors.push('Bác sĩ không có sẵn trong thời gian này');
      }

      // Check capabilities for appointment type
      const hasCapabilities = await providerStaffService.validateProviderCapabilities(
        provider.providerId,
        command.appointmentType
      );

      if (!hasCapabilities) {
        errors.push(`Bác sĩ không có khả năng thực hiện ${command.getAppointmentTypeVietnamese()}`);
      }

      // Department matching
      if (command.requiresSurgery() && !provider.department.includes('SURG')) {
        warnings.push('Cuộc hẹn phẫu thuật nhưng bác sĩ không thuộc khoa phẫu thuật');
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings
      };

    } catch (error) {
      logger.error('Error validating provider for appointment', {
        providerId: provider.providerId,
        appointmentType: command.appointmentType,
        error: error.message
      });

      return {
        isValid: false,
        errors: ['Lỗi kiểm tra thông tin bác sĩ'],
        warnings: []
      };
    }
  }

  /**
   * Check for appointment conflicts
   */
  private async checkAppointmentConflicts(command: ScheduleAppointmentCommand): Promise<{ hasConflicts: boolean; conflicts: string[] }> {
    const { appointmentRepository, logger } = this.dependencies;
    const conflicts: string[] = [];

    try {
      // Check patient conflicts (same time)
      const patientConflicts = await appointmentRepository.findPatientAppointmentsInTimeRange(
        command.patient.patientId,
        command.getStartTime(),
        command.getEndTime()
      );

      if (patientConflicts.length > 0) {
        conflicts.push('Bệnh nhân đã có cuộc hẹn khác trong thời gian này');
      }

      // Check provider conflicts
      const providerConflicts = await appointmentRepository.findProviderAppointmentsInTimeRange(
        command.provider.providerId,
        command.getStartTime(),
        command.getEndTime()
      );

      if (providerConflicts.length > 0) {
        conflicts.push('Bác sĩ đã có cuộc hẹn khác trong thời gian này');
      }

      // Check room conflicts (if room specified)
      if (command.timeSlot.roomId) {
        const roomConflicts = await appointmentRepository.findRoomAppointmentsInTimeRange(
          command.timeSlot.roomId,
          command.getStartTime(),
          command.getEndTime()
        );

        if (roomConflicts.length > 0) {
          conflicts.push('Phòng đã được sử dụng trong thời gian này');
        }
      }

      return {
        hasConflicts: conflicts.length > 0,
        conflicts
      };

    } catch (error) {
      logger.error('Error checking appointment conflicts', {
        error: error.message
      });

      return {
        hasConflicts: true,
        conflicts: ['Lỗi kiểm tra xung đột lịch hẹn']
      };
    }
  }

  /**
   * Perform inter-service communication
   */
  private async performInterServiceCommunication(
    appointment: Appointment,
    command: ScheduleAppointmentCommand
  ): Promise<any> {
    const { patientRegistryService, providerStaffService, logger } = this.dependencies;
    const results = {
      patientServiceResult: false,
      providerServiceResult: false,
      notificationServiceResult: false
    };

    try {
      // Update patient appointment history
      await patientRegistryService.updatePatientAppointmentHistory(
        appointment.patient.patientId,
        appointment.appointmentId.value
      );
      results.patientServiceResult = true;

      // Book provider time slot
      await providerStaffService.bookProviderTimeSlot(
        appointment.provider.providerId,
        appointment.timeSlot.startTime,
        appointment.timeSlot.endTime,
        appointment.appointmentId.value
      );
      results.providerServiceResult = true;

      // Notification service would be called via events
      results.notificationServiceResult = true;

      logger.info('Inter-service communication completed', {
        appointmentId: appointment.appointmentId.value,
        results
      });

    } catch (error) {
      logger.error('Error in inter-service communication', {
        appointmentId: appointment.appointmentId.value,
        error: error.message
      });
    }

    return results;
  }

  /**
   * Publish domain events
   */
  private async publishDomainEvents(appointment: Appointment): Promise<void> {
    const { eventPublisher, logger } = this.dependencies;

    try {
      const events = appointment.getDomainEvents();
      
      for (const event of events) {
        await eventPublisher.publish(event);
        logger.debug('Domain event published', {
          eventType: event.eventType,
          appointmentId: appointment.appointmentId.value
        });
      }

      appointment.clearDomainEvents();

    } catch (error) {
      logger.error('Error publishing domain events', {
        appointmentId: appointment.appointmentId.value,
        error: error.message
      });
    }
  }
}
