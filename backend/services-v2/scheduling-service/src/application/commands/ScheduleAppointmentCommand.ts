/**
 * Schedule Appointment Command - Application Layer
 * V2 Clean Architecture + CQRS Implementation
 * Command for scheduling new appointments with Vietnamese healthcare validation
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS, Command Pattern, Vietnamese Healthcare Standards
 */

import { Command } from '../../../shared/application/base/command';
import { AppointmentType, AppointmentPriority } from '../../domain/value-objects/AppointmentId';

export interface PatientInfoCommand {
  patientId: string;
  fullName: string;
  phone: string;
  dateOfBirth: string;
  nationalId: string;
  email?: string;
  address?: string;
  emergencyContact?: string;
  insuranceNumber?: string;
  insuranceType?: 'BHYT' | 'BHTN' | 'PRIVATE' | 'NONE';
}

export interface ProviderInfoCommand {
  providerId: string;
  fullName: string;
  specialization: string;
  department: string;
  licenseNumber: string;
}

export interface TimeSlotCommand {
  startTime: string; // ISO string
  endTime: string;   // ISO string
  roomId?: string;
}

export interface AppointmentDetailsCommand {
  reason: string;
  symptoms?: string;
  notes?: string;
  preparationInstructions?: string;
  estimatedDuration: number; // in minutes
  requiresPreparation: boolean;
  isFollowUp: boolean;
  previousAppointmentId?: string;
  urgencyLevel: 'routine' | 'urgent' | 'emergency';
  specialRequirements?: string[];
  interpreterRequired?: boolean;
  wheelchairAccessible?: boolean;
  fasting?: boolean;
  medicationRestrictions?: string[];
}

export interface ScheduleAppointmentCommandData {
  appointmentType: AppointmentType;
  priority: AppointmentPriority;
  patient: PatientInfoCommand;
  provider: ProviderInfoCommand;
  timeSlot: TimeSlotCommand;
  details: AppointmentDetailsCommand;
  preferences?: {
    preferredLanguage?: 'vi' | 'en';
    reminderPreferences?: {
      sms: boolean;
      email: boolean;
      call: boolean;
    };
    specialRequirements?: string[];
  };
  scheduledBy: string;
}

/**
 * Schedule Appointment Command
 * Command to schedule a new appointment with comprehensive Vietnamese healthcare validation
 */
export class ScheduleAppointmentCommand extends Command<ScheduleAppointmentCommandData> {
  
  constructor(
    data: ScheduleAppointmentCommandData,
    correlationId?: string,
    userId?: string
  ) {
    super(data, correlationId, userId);
    this.validateCommand();
  }

  /**
   * Create basic consultation appointment command
   */
  public static createConsultation(
    patientId: string,
    providerId: string,
    startTime: string,
    endTime: string,
    reason: string,
    scheduledBy: string,
    correlationId?: string
  ): ScheduleAppointmentCommand {
    const data: ScheduleAppointmentCommandData = {
      appointmentType: AppointmentType.CONSULTATION,
      priority: AppointmentPriority.NORMAL,
      patient: {
        patientId,
        fullName: '', // Would be populated by handler
        phone: '',
        dateOfBirth: '',
        nationalId: ''
      },
      provider: {
        providerId,
        fullName: '', // Would be populated by handler
        specialization: '',
        department: '',
        licenseNumber: ''
      },
      timeSlot: {
        startTime,
        endTime
      },
      details: {
        reason,
        estimatedDuration: 30,
        requiresPreparation: false,
        isFollowUp: false,
        urgencyLevel: 'routine'
      },
      scheduledBy
    };

    return new ScheduleAppointmentCommand(data, correlationId, scheduledBy);
  }

  /**
   * Create emergency appointment command
   */
  public static createEmergency(
    patientId: string,
    providerId: string,
    startTime: string,
    reason: string,
    symptoms: string,
    scheduledBy: string,
    correlationId?: string
  ): ScheduleAppointmentCommand {
    const startDateTime = new Date(startTime);
    const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // 1 hour

    const data: ScheduleAppointmentCommandData = {
      appointmentType: AppointmentType.EMERGENCY,
      priority: AppointmentPriority.EMERGENCY,
      patient: {
        patientId,
        fullName: '',
        phone: '',
        dateOfBirth: '',
        nationalId: ''
      },
      provider: {
        providerId,
        fullName: '',
        specialization: '',
        department: 'EMER',
        licenseNumber: ''
      },
      timeSlot: {
        startTime,
        endTime: endDateTime.toISOString()
      },
      details: {
        reason,
        symptoms,
        estimatedDuration: 60,
        requiresPreparation: false,
        isFollowUp: false,
        urgencyLevel: 'emergency'
      },
      scheduledBy
    };

    return new ScheduleAppointmentCommand(data, correlationId, scheduledBy);
  }

  /**
   * Create follow-up appointment command
   */
  public static createFollowUp(
    patientId: string,
    providerId: string,
    startTime: string,
    endTime: string,
    reason: string,
    previousAppointmentId: string,
    scheduledBy: string,
    correlationId?: string
  ): ScheduleAppointmentCommand {
    const data: ScheduleAppointmentCommandData = {
      appointmentType: AppointmentType.FOLLOW_UP,
      priority: AppointmentPriority.NORMAL,
      patient: {
        patientId,
        fullName: '',
        phone: '',
        dateOfBirth: '',
        nationalId: ''
      },
      provider: {
        providerId,
        fullName: '',
        specialization: '',
        department: '',
        licenseNumber: ''
      },
      timeSlot: {
        startTime,
        endTime
      },
      details: {
        reason,
        estimatedDuration: 30,
        requiresPreparation: false,
        isFollowUp: true,
        previousAppointmentId,
        urgencyLevel: 'routine'
      },
      scheduledBy
    };

    return new ScheduleAppointmentCommand(data, correlationId, scheduledBy);
  }

  /**
   * Create surgery appointment command
   */
  public static createSurgery(
    patientId: string,
    providerId: string,
    startTime: string,
    endTime: string,
    surgeryType: string,
    preparationInstructions: string,
    roomId: string,
    scheduledBy: string,
    correlationId?: string
  ): ScheduleAppointmentCommand {
    const data: ScheduleAppointmentCommandData = {
      appointmentType: AppointmentType.SURGERY,
      priority: AppointmentPriority.HIGH,
      patient: {
        patientId,
        fullName: '',
        phone: '',
        dateOfBirth: '',
        nationalId: ''
      },
      provider: {
        providerId,
        fullName: '',
        specialization: '',
        department: 'SURG',
        licenseNumber: ''
      },
      timeSlot: {
        startTime,
        endTime,
        roomId
      },
      details: {
        reason: surgeryType,
        preparationInstructions,
        estimatedDuration: 120,
        requiresPreparation: true,
        isFollowUp: false,
        urgencyLevel: 'urgent'
      },
      scheduledBy
    };

    return new ScheduleAppointmentCommand(data, correlationId, scheduledBy);
  }

  // Getters for easy access
  public get appointmentType(): AppointmentType {
    return this.data.appointmentType;
  }

  public get priority(): AppointmentPriority {
    return this.data.priority;
  }

  public get patient(): PatientInfoCommand {
    return this.data.patient;
  }

  public get provider(): ProviderInfoCommand {
    return this.data.provider;
  }

  public get timeSlot(): TimeSlotCommand {
    return this.data.timeSlot;
  }

  public get details(): AppointmentDetailsCommand {
    return this.data.details;
  }

  public get scheduledBy(): string {
    return this.data.scheduledBy;
  }

  public get preferences(): typeof this.data.preferences {
    return this.data.preferences;
  }

  /**
   * Get start time as Date object
   */
  public getStartTime(): Date {
    return new Date(this.data.timeSlot.startTime);
  }

  /**
   * Get end time as Date object
   */
  public getEndTime(): Date {
    return new Date(this.data.timeSlot.endTime);
  }

  /**
   * Check if appointment is emergency
   */
  public isEmergency(): boolean {
    return this.data.priority === AppointmentPriority.EMERGENCY ||
           this.data.details.urgencyLevel === 'emergency';
  }

  /**
   * Check if appointment requires preparation
   */
  public requiresPreparation(): boolean {
    return this.data.details.requiresPreparation;
  }

  /**
   * Check if appointment is follow-up
   */
  public isFollowUp(): boolean {
    return this.data.details.isFollowUp;
  }

  /**
   * Get estimated duration in minutes
   */
  public getEstimatedDuration(): number {
    return this.data.details.estimatedDuration;
  }

  /**
   * Validate command data
   */
  protected validateCommand(): void {
    // Basic validation
    if (!this.data.patient.patientId) {
      throw new Error('Mã bệnh nhân không được để trống');
    }

    if (!this.data.provider.providerId) {
      throw new Error('Mã bác sĩ không được để trống');
    }

    if (!this.data.timeSlot.startTime || !this.data.timeSlot.endTime) {
      throw new Error('Thời gian bắt đầu và kết thúc không được để trống');
    }

    if (!this.data.details.reason || this.data.details.reason.trim().length < 3) {
      throw new Error('Lý do khám phải có ít nhất 3 ký tự');
    }

    if (!this.data.scheduledBy) {
      throw new Error('Người lên lịch không được để trống');
    }

    // Time validation
    const startTime = new Date(this.data.timeSlot.startTime);
    const endTime = new Date(this.data.timeSlot.endTime);

    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      throw new Error('Định dạng thời gian không hợp lệ');
    }

    if (startTime >= endTime) {
      throw new Error('Thời gian bắt đầu phải trước thời gian kết thúc');
    }

    if (startTime <= new Date()) {
      throw new Error('Không thể đặt lịch hẹn trong quá khứ');
    }

    // Duration validation
    const durationMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
    if (durationMinutes < 5) {
      throw new Error('Thời gian cuộc hẹn tối thiểu là 5 phút');
    }

    if (durationMinutes > 480) { // 8 hours
      throw new Error('Thời gian cuộc hẹn tối đa là 8 giờ');
    }

    // Business hours validation (8:00 - 17:00)
    const startHour = startTime.getHours();
    if (startHour < 8 || startHour >= 17) {
      throw new Error('Chỉ có thể đặt lịch hẹn trong giờ làm việc (8:00 - 17:00)');
    }

    // Follow-up validation
    if (this.data.details.isFollowUp && !this.data.details.previousAppointmentId) {
      throw new Error('Cuộc hẹn tái khám phải có mã cuộc hẹn trước đó');
    }

    // Emergency validation
    if (this.data.priority === AppointmentPriority.EMERGENCY) {
      if (!this.data.details.symptoms) {
        throw new Error('Cuộc hẹn cấp cứu phải có mô tả triệu chứng');
      }
    }

    // Surgery validation
    if (this.data.appointmentType === AppointmentType.SURGERY) {
      if (!this.data.details.preparationInstructions) {
        throw new Error('Cuộc hẹn phẫu thuật phải có hướng dẫn chuẩn bị');
      }
      if (!this.data.timeSlot.roomId) {
        throw new Error('Cuộc hẹn phẫu thuật phải có phòng mổ');
      }
    }

    // Estimated duration validation
    if (this.data.details.estimatedDuration <= 0) {
      throw new Error('Thời gian dự kiến phải lớn hơn 0');
    }

    if (this.data.details.estimatedDuration !== durationMinutes) {
      // Allow some tolerance (±5 minutes)
      const tolerance = 5;
      if (Math.abs(this.data.details.estimatedDuration - durationMinutes) > tolerance) {
        throw new Error('Thời gian dự kiến không khớp với thời gian đặt lịch');
      }
    }
  }
}
