/**
 * Schedule Appointment Command - Application Layer
 * CQRS command for scheduling new appointments with healthcare validation
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance CQRS, Healthcare Standards, Vietnamese Validation
 */

import { Command } from '../../../shared/application/commands/command';
import { AppointmentType, AppointmentPriority } from '../../domain/value-objects/appointment-id';

export interface PatientInfoCommand {
  patientId: string;
  fullName: string;
  phone: string;
  email?: string;
  dateOfBirth: string; // ISO string
  nationalId: string;
}

export interface ProviderInfoCommand {
  providerId: string;
  fullName: string;
  specialization: string;
  department: string;
  licenseNumber: string;
}

export interface AppointmentDetailsCommand {
  reason: string;
  symptoms?: string;
  notes?: string;
  preparationInstructions?: string;
  estimatedDuration?: number; // minutes
  requiresPreparation?: boolean;
  isFollowUp?: boolean;
  previousAppointmentId?: string;
}

export interface TimeSlotCommand {
  startTime: string; // ISO string
  endTime: string;   // ISO string
  roomId?: string;
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
 * Command to schedule a new appointment with comprehensive validation
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
   * Create basic consultation appointment
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
        isFollowUp: false
      },
      scheduledBy
    };

    return new ScheduleAppointmentCommand(data, correlationId, scheduledBy);
  }

  /**
   * Create emergency appointment
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
    const endDateTime = new Date(startDateTime.getTime() + (60 * 60 * 1000)); // 1 hour

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
        isFollowUp: false
      },
      scheduledBy
    };

    return new ScheduleAppointmentCommand(data, correlationId, scheduledBy);
  }

  /**
   * Create follow-up appointment
   */
  public static createFollowUp(
    patientId: string,
    providerId: string,
    startTime: string,
    endTime: string,
    previousAppointmentId: string,
    reason: string,
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
        estimatedDuration: 15,
        requiresPreparation: false,
        isFollowUp: true,
        previousAppointmentId
      },
      scheduledBy
    };

    return new ScheduleAppointmentCommand(data, correlationId, scheduledBy);
  }

  /**
   * Create surgery appointment
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
        isFollowUp: false
      },
      scheduledBy
    };

    return new ScheduleAppointmentCommand(data, correlationId, scheduledBy);
  }

  /**
   * Getters
   */
  get appointmentType(): AppointmentType {
    return this.data.appointmentType;
  }

  get priority(): AppointmentPriority {
    return this.data.priority;
  }

  get patient(): PatientInfoCommand {
    return this.data.patient;
  }

  get provider(): ProviderInfoCommand {
    return this.data.provider;
  }

  get timeSlot(): TimeSlotCommand {
    return this.data.timeSlot;
  }

  get details(): AppointmentDetailsCommand {
    return this.data.details;
  }

  get preferences(): any {
    return this.data.preferences;
  }

  get scheduledBy(): string {
    return this.data.scheduledBy;
  }

  /**
   * Business methods
   */

  /**
   * Check if appointment is emergency
   */
  public isEmergency(): boolean {
    return this.data.appointmentType === AppointmentType.EMERGENCY ||
           this.data.priority === AppointmentPriority.EMERGENCY;
  }

  /**
   * Check if appointment is urgent
   */
  public isUrgent(): boolean {
    return this.data.priority === AppointmentPriority.URGENT ||
           this.data.priority === AppointmentPriority.EMERGENCY;
  }

  /**
   * Check if appointment requires surgery
   */
  public requiresSurgery(): boolean {
    return this.data.appointmentType === AppointmentType.SURGERY;
  }

  /**
   * Check if appointment is follow-up
   */
  public isFollowUp(): boolean {
    return this.data.details.isFollowUp === true;
  }

  /**
   * Get estimated duration
   */
  public getEstimatedDuration(): number {
    return this.data.details.estimatedDuration || this.getDefaultDuration();
  }

  /**
   * Get appointment start time
   */
  public getStartTime(): Date {
    return new Date(this.data.timeSlot.startTime);
  }

  /**
   * Get appointment end time
   */
  public getEndTime(): Date {
    return new Date(this.data.timeSlot.endTime);
  }

  /**
   * Get duration in minutes
   */
  public getDurationMinutes(): number {
    const start = this.getStartTime();
    const end = this.getEndTime();
    return Math.floor((end.getTime() - start.getTime()) / (1000 * 60));
  }

  /**
   * Check if appointment is within business hours
   */
  public isWithinBusinessHours(): boolean {
    const startTime = this.getStartTime();
    const hour = startTime.getHours();
    const dayOfWeek = startTime.getDay();
    
    // Vietnamese healthcare business hours
    if (dayOfWeek === 0) return false; // Sunday
    if (dayOfWeek === 6) return hour >= 7 && hour < 12; // Saturday morning only
    return hour >= 7 && hour < 17; // Monday to Friday
  }

  /**
   * Check if appointment can be scheduled online
   */
  public canScheduleOnline(): boolean {
    const onlineSchedulableTypes = [
      AppointmentType.CONSULTATION,
      AppointmentType.FOLLOW_UP,
      AppointmentType.HEALTH_CHECK,
      AppointmentType.VACCINATION
    ];

    return onlineSchedulableTypes.includes(this.data.appointmentType) &&
           this.data.priority !== AppointmentPriority.EMERGENCY;
  }

  /**
   * Get scheduling restrictions
   */
  public getSchedulingRestrictions(): string[] {
    const restrictions: string[] = [];

    if (this.requiresSurgery()) {
      restrictions.push('Cần xác nhận từ bác sĩ phẫu thuật');
      restrictions.push('Cần chuẩn bị trước phẫu thuật');
      restrictions.push('Chỉ lên lịch trong giờ hành chính');
    }

    if (this.isEmergency()) {
      restrictions.push('Ưu tiên cao nhất');
      restrictions.push('Có thể thay đổi lịch khác');
      restrictions.push('Cần sẵn sàng 24/7');
    }

    if (this.data.appointmentType === AppointmentType.DIAGNOSTIC) {
      restrictions.push('Cần chuẩn bị theo yêu cầu');
      restrictions.push('Có thể cần nhịn ăn');
    }

    if (!this.isWithinBusinessHours() && !this.isEmergency()) {
      restrictions.push('Ngoài giờ hành chính, cần phê duyệt đặc biệt');
    }

    return restrictions;
  }

  /**
   * Get appointment type in Vietnamese
   */
  public getAppointmentTypeVietnamese(): string {
    const typeMap = {
      [AppointmentType.CONSULTATION]: 'Khám bệnh',
      [AppointmentType.FOLLOW_UP]: 'Tái khám',
      [AppointmentType.SURGERY]: 'Phẫu thuật',
      [AppointmentType.EMERGENCY]: 'Cấp cứu',
      [AppointmentType.DIAGNOSTIC]: 'Chẩn đoán',
      [AppointmentType.THERAPY]: 'Điều trị',
      [AppointmentType.VACCINATION]: 'Tiêm chủng',
      [AppointmentType.HEALTH_CHECK]: 'Khám sức khỏe'
    };

    return typeMap[this.data.appointmentType] || this.data.appointmentType;
  }

  /**
   * Get priority in Vietnamese
   */
  public getPriorityVietnamese(): string {
    const priorityMap = {
      [AppointmentPriority.LOW]: 'Thấp',
      [AppointmentPriority.NORMAL]: 'Bình thường',
      [AppointmentPriority.HIGH]: 'Cao',
      [AppointmentPriority.URGENT]: 'Khẩn cấp',
      [AppointmentPriority.EMERGENCY]: 'Cấp cứu'
    };

    return priorityMap[this.data.priority] || this.data.priority;
  }

  /**
   * Private validation methods
   */

  private validateCommand(): void {
    const errors: string[] = [];

    // Validate appointment type and priority
    if (!this.data.appointmentType) {
      errors.push('Loại cuộc hẹn không được để trống');
    }

    if (!this.data.priority) {
      errors.push('Mức độ ưu tiên không được để trống');
    }

    // Validate patient info
    this.validatePatientInfo(errors);

    // Validate provider info
    this.validateProviderInfo(errors);

    // Validate time slot
    this.validateTimeSlot(errors);

    // Validate appointment details
    this.validateAppointmentDetails(errors);

    // Validate business rules
    this.validateBusinessRules(errors);

    if (errors.length > 0) {
      throw new Error(`Lỗi validation command: ${errors.join(', ')}`);
    }
  }

  private validatePatientInfo(errors: string[]): void {
    if (!this.data.patient.patientId) {
      errors.push('ID bệnh nhân không được để trống');
    }

    // Other patient validations would be done by the use case
    // when it fetches complete patient info
  }

  private validateProviderInfo(errors: string[]): void {
    if (!this.data.provider.providerId) {
      errors.push('ID bác sĩ không được để trống');
    }

    // Other provider validations would be done by the use case
    // when it fetches complete provider info
  }

  private validateTimeSlot(errors: string[]): void {
    if (!this.data.timeSlot.startTime) {
      errors.push('Thời gian bắt đầu không được để trống');
    }

    if (!this.data.timeSlot.endTime) {
      errors.push('Thời gian kết thúc không được để trống');
    }

    if (this.data.timeSlot.startTime && this.data.timeSlot.endTime) {
      const startTime = new Date(this.data.timeSlot.startTime);
      const endTime = new Date(this.data.timeSlot.endTime);

      if (startTime >= endTime) {
        errors.push('Thời gian bắt đầu phải trước thời gian kết thúc');
      }

      if (startTime <= new Date()) {
        errors.push('Không thể đặt lịch cho thời gian đã qua');
      }

      // Validate minimum duration (5 minutes)
      const durationMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
      if (durationMinutes < 5) {
        errors.push('Thời gian cuộc hẹn tối thiểu là 5 phút');
      }

      // Validate maximum duration (8 hours)
      if (durationMinutes > 480) {
        errors.push('Thời gian cuộc hẹn tối đa là 8 giờ');
      }
    }
  }

  private validateAppointmentDetails(errors: string[]): void {
    if (!this.data.details.reason || this.data.details.reason.trim().length === 0) {
      errors.push('Lý do khám không được để trống');
    }

    if (this.data.details.estimatedDuration && this.data.details.estimatedDuration <= 0) {
      errors.push('Thời gian dự kiến phải lớn hơn 0');
    }

    if (this.data.details.isFollowUp && !this.data.details.previousAppointmentId) {
      errors.push('Cuộc hẹn tái khám phải có ID cuộc hẹn trước');
    }
  }

  private validateBusinessRules(errors: string[]): void {
    // Surgery appointments must have room
    if (this.requiresSurgery() && !this.data.timeSlot.roomId) {
      errors.push('Cuộc hẹn phẫu thuật phải có phòng');
    }

    // Emergency appointments must be urgent or emergency priority
    if (this.data.appointmentType === AppointmentType.EMERGENCY &&
        this.data.priority !== AppointmentPriority.URGENT &&
        this.data.priority !== AppointmentPriority.EMERGENCY) {
      errors.push('Cuộc hẹn cấp cứu phải có mức độ ưu tiên khẩn cấp hoặc cấp cứu');
    }

    // Validate scheduled by
    if (!this.data.scheduledBy || this.data.scheduledBy.trim().length === 0) {
      errors.push('Người lên lịch không được để trống');
    }
  }

  private getDefaultDuration(): number {
    const durationMap = {
      [AppointmentType.CONSULTATION]: 30,
      [AppointmentType.FOLLOW_UP]: 15,
      [AppointmentType.SURGERY]: 120,
      [AppointmentType.EMERGENCY]: 60,
      [AppointmentType.DIAGNOSTIC]: 45,
      [AppointmentType.THERAPY]: 60,
      [AppointmentType.VACCINATION]: 10,
      [AppointmentType.HEALTH_CHECK]: 45
    };

    return durationMap[this.data.appointmentType] || 30;
  }
}
