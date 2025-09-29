/**
 * Appointment Aggregate - Domain Layer
 * Healthcare appointment aggregate root with business rules
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Healthcare Standards
 */

import { AggregateRoot } from '../../../shared/domain/base/aggregate-root';
import { AppointmentId, AppointmentType, AppointmentPriority } from '../value-objects/appointment-id';
import { TimeSlot, TimeSlotStatus } from '../value-objects/time-slot';
import { AppointmentScheduledEvent } from '../events/appointment-scheduled.event';
import { AppointmentCancelledEvent } from '../events/appointment-cancelled.event';
import { AppointmentRescheduledEvent } from '../events/appointment-rescheduled.event';

export enum AppointmentStatus {
  SCHEDULED = 'scheduled',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
  RESCHEDULED = 'rescheduled'
}

export interface PatientInfo {
  patientId: string;
  fullName: string;
  phone: string;
  email?: string;
  dateOfBirth: Date;
  nationalId: string;
}

export interface ProviderInfo {
  providerId: string;
  fullName: string;
  specialization: string;
  department: string;
  licenseNumber: string;
}

export interface AppointmentDetails {
  reason: string;
  symptoms?: string;
  notes?: string;
  preparationInstructions?: string;
  estimatedDuration: number; // minutes
  requiresPreparation: boolean;
  isFollowUp: boolean;
  previousAppointmentId?: string;
}

export interface AppointmentProps {
  appointmentId: AppointmentId;
  patient: PatientInfo;
  provider: ProviderInfo;
  timeSlot: TimeSlot;
  details: AppointmentDetails;
  status: AppointmentStatus;
  priority: AppointmentPriority;
  roomId?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  confirmedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
  remindersSent: number;
  lastReminderSent?: Date;
}

/**
 * Appointment Aggregate Root
 * Manages appointment lifecycle and business rules
 */
export class Appointment extends AggregateRoot<AppointmentProps> {
  
  private constructor(props: AppointmentProps, id?: string) {
    super(props, id);
  }

  /**
   * Create new appointment
   */
  public static create(
    appointmentId: AppointmentId,
    patient: PatientInfo,
    provider: ProviderInfo,
    timeSlot: TimeSlot,
    details: AppointmentDetails,
    roomId: string | undefined,
    createdBy: string
  ): Appointment {
    // Business rule validations
    Appointment.validateAppointmentCreation(patient, provider, timeSlot, details);

    const props: AppointmentProps = {
      appointmentId,
      patient,
      provider,
      timeSlot,
      details,
      status: AppointmentStatus.SCHEDULED,
      priority: appointmentId.priority,
      roomId,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy,
      remindersSent: 0
    };

    const appointment = new Appointment(props);

    // Domain event
    appointment.addDomainEvent(new AppointmentScheduledEvent(
      appointmentId.value,
      patient.patientId,
      provider.providerId,
      timeSlot.startTime,
      timeSlot.endTime,
      details.reason,
      appointmentId.appointmentType,
      appointmentId.priority,
      createdBy
    ));

    return appointment;
  }

  /**
   * Create from persistence
   */
  public static fromPersistence(data: any): Appointment {
    const appointmentId = AppointmentId.fromString(data.appointment_id);
    
    const timeSlot = TimeSlot.create(
      new Date(data.start_time),
      new Date(data.end_time),
      data.time_slot_status || TimeSlotStatus.BOOKED,
      data.provider_id,
      data.room_id
    );

    const patient: PatientInfo = {
      patientId: data.patient_id,
      fullName: data.patient_name,
      phone: data.patient_phone,
      email: data.patient_email,
      dateOfBirth: new Date(data.patient_dob),
      nationalId: data.patient_national_id
    };

    const provider: ProviderInfo = {
      providerId: data.provider_id,
      fullName: data.provider_name,
      specialization: data.provider_specialization,
      department: data.provider_department,
      licenseNumber: data.provider_license
    };

    const details: AppointmentDetails = {
      reason: data.reason,
      symptoms: data.symptoms,
      notes: data.notes,
      preparationInstructions: data.preparation_instructions,
      estimatedDuration: data.estimated_duration,
      requiresPreparation: data.requires_preparation,
      isFollowUp: data.is_follow_up,
      previousAppointmentId: data.previous_appointment_id
    };

    const props: AppointmentProps = {
      appointmentId,
      patient,
      provider,
      timeSlot,
      details,
      status: data.status,
      priority: data.priority,
      roomId: data.room_id,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      createdBy: data.created_by,
      confirmedAt: data.confirmed_at ? new Date(data.confirmed_at) : undefined,
      completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
      cancelledAt: data.cancelled_at ? new Date(data.cancelled_at) : undefined,
      cancellationReason: data.cancellation_reason,
      remindersSent: data.reminders_sent || 0,
      lastReminderSent: data.last_reminder_sent ? new Date(data.last_reminder_sent) : undefined
    };

    return new Appointment(props, data.id);
  }

  /**
   * Getters
   */
  get appointmentId(): AppointmentId {
    return this.props.appointmentId;
  }

  get patient(): PatientInfo {
    return this.props.patient;
  }

  get provider(): ProviderInfo {
    return this.props.provider;
  }

  get timeSlot(): TimeSlot {
    return this.props.timeSlot;
  }

  get details(): AppointmentDetails {
    return this.props.details;
  }

  get status(): AppointmentStatus {
    return this.props.status;
  }

  get priority(): AppointmentPriority {
    return this.props.priority;
  }

  get roomId(): string | undefined {
    return this.props.roomId;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get createdBy(): string {
    return this.props.createdBy;
  }

  get confirmedAt(): Date | undefined {
    return this.props.confirmedAt;
  }

  get completedAt(): Date | undefined {
    return this.props.completedAt;
  }

  get cancelledAt(): Date | undefined {
    return this.props.cancelledAt;
  }

  get cancellationReason(): string | undefined {
    return this.props.cancellationReason;
  }

  get remindersSent(): number {
    return this.props.remindersSent;
  }

  get lastReminderSent(): Date | undefined {
    return this.props.lastReminderSent;
  }

  /**
   * Business methods
   */

  /**
   * Confirm appointment
   */
  public confirm(confirmedBy: string): void {
    if (this.props.status !== AppointmentStatus.SCHEDULED) {
      throw new Error('Chỉ có thể xác nhận cuộc hẹn đã lên lịch');
    }

    if (this.timeSlot.isPast()) {
      throw new Error('Không thể xác nhận cuộc hẹn đã qua');
    }

    this.props.status = AppointmentStatus.CONFIRMED;
    this.props.confirmedAt = new Date();
    this.props.updatedAt = new Date();

    // Could add domain event for confirmation
  }

  /**
   * Start appointment
   */
  public start(startedBy: string): void {
    if (this.props.status !== AppointmentStatus.CONFIRMED && 
        this.props.status !== AppointmentStatus.SCHEDULED) {
      throw new Error('Chỉ có thể bắt đầu cuộc hẹn đã xác nhận hoặc đã lên lịch');
    }

    // Check if it's time to start (within 15 minutes of start time)
    const now = new Date();
    const startTime = this.timeSlot.startTime;
    const timeDifference = Math.abs(now.getTime() - startTime.getTime()) / (1000 * 60);
    
    if (timeDifference > 15) {
      throw new Error('Chỉ có thể bắt đầu cuộc hẹn trong vòng 15 phút từ giờ hẹn');
    }

    this.props.status = AppointmentStatus.IN_PROGRESS;
    this.props.updatedAt = new Date();
  }

  /**
   * Complete appointment
   */
  public complete(completedBy: string, notes?: string): void {
    if (this.props.status !== AppointmentStatus.IN_PROGRESS) {
      throw new Error('Chỉ có thể hoàn thành cuộc hẹn đang diễn ra');
    }

    this.props.status = AppointmentStatus.COMPLETED;
    this.props.completedAt = new Date();
    this.props.updatedAt = new Date();

    if (notes) {
      this.props.details.notes = notes;
    }

    // Could add domain event for completion
  }

  /**
   * Cancel appointment
   */
  public cancel(cancelledBy: string, reason: string): void {
    if (this.props.status === AppointmentStatus.COMPLETED ||
        this.props.status === AppointmentStatus.CANCELLED) {
      throw new Error('Không thể hủy cuộc hẹn đã hoàn thành hoặc đã hủy');
    }

    // Check cancellation policy (24 hours notice for non-emergency)
    if (!this.appointmentId.isEmergency()) {
      const now = new Date();
      const hoursUntilAppointment = (this.timeSlot.startTime.getTime() - now.getTime()) / (1000 * 60 * 60);
      
      if (hoursUntilAppointment < 24) {
        // Allow but could add penalty or warning
      }
    }

    this.props.status = AppointmentStatus.CANCELLED;
    this.props.cancelledAt = new Date();
    this.props.cancellationReason = reason;
    this.props.updatedAt = new Date();

    // Domain event
    this.addDomainEvent(new AppointmentCancelledEvent(
      this.appointmentId.value,
      this.patient.patientId,
      this.provider.providerId,
      this.timeSlot.startTime,
      reason,
      cancelledBy
    ));
  }

  /**
   * Reschedule appointment
   */
  public reschedule(
    newTimeSlot: TimeSlot,
    newRoomId: string | undefined,
    rescheduledBy: string,
    reason: string
  ): void {
    if (this.props.status === AppointmentStatus.COMPLETED ||
        this.props.status === AppointmentStatus.CANCELLED) {
      throw new Error('Không thể đổi lịch cuộc hẹn đã hoàn thành hoặc đã hủy');
    }

    // Validate new time slot
    if (!newTimeSlot.isAvailable()) {
      throw new Error('Thời gian mới không có sẵn');
    }

    if (newTimeSlot.isPast()) {
      throw new Error('Không thể đổi lịch sang thời gian đã qua');
    }

    const oldTimeSlot = this.props.timeSlot;
    
    this.props.timeSlot = newTimeSlot;
    this.props.roomId = newRoomId;
    this.props.status = AppointmentStatus.RESCHEDULED;
    this.props.updatedAt = new Date();

    // Domain event
    this.addDomainEvent(new AppointmentRescheduledEvent(
      this.appointmentId.value,
      this.patient.patientId,
      this.provider.providerId,
      oldTimeSlot.startTime,
      oldTimeSlot.endTime,
      newTimeSlot.startTime,
      newTimeSlot.endTime,
      reason,
      rescheduledBy
    ));
  }

  /**
   * Mark as no-show
   */
  public markAsNoShow(markedBy: string): void {
    if (this.props.status !== AppointmentStatus.SCHEDULED &&
        this.props.status !== AppointmentStatus.CONFIRMED) {
      throw new Error('Chỉ có thể đánh dấu không đến cho cuộc hẹn đã lên lịch hoặc xác nhận');
    }

    // Check if appointment time has passed
    const now = new Date();
    const gracePeriod = 15; // 15 minutes grace period
    const appointmentEndTime = new Date(this.timeSlot.startTime.getTime() + (gracePeriod * 60 * 1000));
    
    if (now < appointmentEndTime) {
      throw new Error('Chưa thể đánh dấu không đến, vui lòng đợi thêm');
    }

    this.props.status = AppointmentStatus.NO_SHOW;
    this.props.updatedAt = new Date();

    // Could add domain event for no-show
  }

  /**
   * Send reminder
   */
  public sendReminder(): void {
    if (this.props.status !== AppointmentStatus.SCHEDULED &&
        this.props.status !== AppointmentStatus.CONFIRMED) {
      throw new Error('Chỉ có thể gửi nhắc nhở cho cuộc hẹn đã lên lịch hoặc xác nhận');
    }

    this.props.remindersSent += 1;
    this.props.lastReminderSent = new Date();
    this.props.updatedAt = new Date();
  }

  /**
   * Check if appointment needs reminder
   */
  public needsReminder(): boolean {
    if (this.props.status !== AppointmentStatus.SCHEDULED &&
        this.props.status !== AppointmentStatus.CONFIRMED) {
      return false;
    }

    const now = new Date();
    const hoursUntilAppointment = (this.timeSlot.startTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    // Send reminder 24 hours and 2 hours before appointment
    const reminderTimes = [24, 2];
    
    for (const reminderTime of reminderTimes) {
      if (hoursUntilAppointment <= reminderTime && hoursUntilAppointment > (reminderTime - 1)) {
        // Check if reminder already sent for this time
        if (!this.props.lastReminderSent) {
          return true;
        }
        
        const hoursSinceLastReminder = (now.getTime() - this.props.lastReminderSent.getTime()) / (1000 * 60 * 60);
        return hoursSinceLastReminder >= 1; // At least 1 hour between reminders
      }
    }
    
    return false;
  }

  /**
   * Get appointment status in Vietnamese
   */
  public getStatusVietnamese(): string {
    const statusMap = {
      [AppointmentStatus.SCHEDULED]: 'Đã lên lịch',
      [AppointmentStatus.CONFIRMED]: 'Đã xác nhận',
      [AppointmentStatus.IN_PROGRESS]: 'Đang diễn ra',
      [AppointmentStatus.COMPLETED]: 'Đã hoàn thành',
      [AppointmentStatus.CANCELLED]: 'Đã hủy',
      [AppointmentStatus.NO_SHOW]: 'Không đến',
      [AppointmentStatus.RESCHEDULED]: 'Đã đổi lịch'
    };

    return statusMap[this.props.status] || this.props.status;
  }

  /**
   * Check if appointment can be cancelled
   */
  public canBeCancelled(): boolean {
    return this.props.status !== AppointmentStatus.COMPLETED &&
           this.props.status !== AppointmentStatus.CANCELLED &&
           !this.timeSlot.isPast();
  }

  /**
   * Check if appointment can be rescheduled
   */
  public canBeRescheduled(): boolean {
    return this.props.status !== AppointmentStatus.COMPLETED &&
           this.props.status !== AppointmentStatus.CANCELLED;
  }

  /**
   * Get time until appointment
   */
  public getTimeUntilAppointment(): { hours: number; minutes: number } {
    const now = new Date();
    const timeDifference = this.timeSlot.startTime.getTime() - now.getTime();
    
    if (timeDifference <= 0) {
      return { hours: 0, minutes: 0 };
    }
    
    const hours = Math.floor(timeDifference / (1000 * 60 * 60));
    const minutes = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60));
    
    return { hours, minutes };
  }

  /**
   * Convert to persistence format
   */
  public toPersistence(): any {
    return {
      id: this.id,
      appointment_id: this.props.appointmentId.value,
      patient_id: this.props.patient.patientId,
      patient_name: this.props.patient.fullName,
      patient_phone: this.props.patient.phone,
      patient_email: this.props.patient.email,
      patient_dob: this.props.patient.dateOfBirth.toISOString(),
      patient_national_id: this.props.patient.nationalId,
      provider_id: this.props.provider.providerId,
      provider_name: this.props.provider.fullName,
      provider_specialization: this.props.provider.specialization,
      provider_department: this.props.provider.department,
      provider_license: this.props.provider.licenseNumber,
      start_time: this.props.timeSlot.startTime.toISOString(),
      end_time: this.props.timeSlot.endTime.toISOString(),
      time_slot_status: this.props.timeSlot.status,
      reason: this.props.details.reason,
      symptoms: this.props.details.symptoms,
      notes: this.props.details.notes,
      preparation_instructions: this.props.details.preparationInstructions,
      estimated_duration: this.props.details.estimatedDuration,
      requires_preparation: this.props.details.requiresPreparation,
      is_follow_up: this.props.details.isFollowUp,
      previous_appointment_id: this.props.details.previousAppointmentId,
      status: this.props.status,
      priority: this.props.priority,
      room_id: this.props.roomId,
      created_at: this.props.createdAt.toISOString(),
      updated_at: this.props.updatedAt.toISOString(),
      created_by: this.props.createdBy,
      confirmed_at: this.props.confirmedAt?.toISOString(),
      completed_at: this.props.completedAt?.toISOString(),
      cancelled_at: this.props.cancelledAt?.toISOString(),
      cancellation_reason: this.props.cancellationReason,
      reminders_sent: this.props.remindersSent,
      last_reminder_sent: this.props.lastReminderSent?.toISOString()
    };
  }

  /**
   * Private validation methods
   */

  private static validateAppointmentCreation(
    patient: PatientInfo,
    provider: ProviderInfo,
    timeSlot: TimeSlot,
    details: AppointmentDetails
  ): void {
    // Validate patient
    if (!patient.patientId || !patient.fullName || !patient.phone) {
      throw new Error('Thông tin bệnh nhân không đầy đủ');
    }

    // Validate provider
    if (!provider.providerId || !provider.fullName || !provider.department) {
      throw new Error('Thông tin bác sĩ không đầy đủ');
    }

    // Validate time slot
    if (!timeSlot.isAvailable()) {
      throw new Error('Thời gian không có sẵn');
    }

    if (timeSlot.isPast()) {
      throw new Error('Không thể đặt lịch cho thời gian đã qua');
    }

    if (!timeSlot.isWithinBusinessHours()) {
      throw new Error('Thời gian không trong giờ làm việc');
    }

    // Validate details
    if (!details.reason || details.reason.trim().length === 0) {
      throw new Error('Lý do khám không được để trống');
    }

    if (details.estimatedDuration <= 0) {
      throw new Error('Thời gian dự kiến phải lớn hơn 0');
    }
  }
}
