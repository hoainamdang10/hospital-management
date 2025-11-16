/**
 * AppointmentReminder Aggregate Root
 * Represents an appointment reminder schedule in the domain
 * Refactored to match project architecture patterns
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { HealthcareAggregateRoot } from '@shared/domain/base/aggregate-root';
import { DomainEvent } from '@shared/domain/base/domain-event';
import { ReminderType, ReminderTypeValue } from '../value-objects/ReminderType';
import { ReminderStatus, ReminderStatusValue } from '../value-objects/ReminderStatus';

export interface AppointmentReminderProps {
  // Appointment info
  appointmentId: string;
  tenantId: string;

  // Patient info
  patientId: string;
  patientName?: string;
  patientPhone?: string;
  patientEmail?: string;
  patientLanguage?: string;

  // Doctor info
  doctorId?: string;
  doctorName?: string;
  doctorSpecialization?: string;

  // Appointment details
  appointmentDate: Date;
  appointmentTime: string; // HH:MM format
  appointmentType?: string;
  reason?: string;

  // Reminder configuration
  reminderType: ReminderType;
  scheduledSendTime: Date;
  status: ReminderStatus;

  // Notification channels
  channels?: string[];
  preferredChannel?: string;

  // Delivery tracking
  notificationId?: string;
  sentAt?: Date;
  deliveredAt?: Date;
  failedAt?: Date;
  failureReason?: string;

  // Retry logic
  retryCount?: number;
  maxRetries?: number;
  lastRetryAt?: Date;
  nextRetryAt?: Date;

  // Template
  templateId?: string;
  templateData?: Record<string, any>;
  customMessage?: string;

  // Cancellation
  cancelledAt?: Date;
  cancelledBy?: string;
  cancellationReason?: string;

  // Metadata
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string;
}

export class AppointmentReminder extends HealthcareAggregateRoot<AppointmentReminderProps> {
  private constructor(props: AppointmentReminderProps, id?: string) {
    super(props, id);
  }

  /**
   * Factory method to create a new reminder
   */
  public static create(
    props: AppointmentReminderProps,
    id?: string
  ): AppointmentReminder {
    // Validation
    if (!props.appointmentId || props.appointmentId.trim().length === 0) {
      throw new Error('Appointment ID is required');
    }

    if (!props.patientId || props.patientId.trim().length === 0) {
      throw new Error('Patient ID is required');
    }

    if (!props.appointmentDate) {
      throw new Error('Appointment date is required');
    }

    if (!props.appointmentTime) {
      throw new Error('Appointment time is required');
    }

    if (!props.scheduledSendTime) {
      throw new Error('Scheduled send time is required');
    }

    // Ensure at least one contact method
    if (!props.patientPhone && !props.patientEmail) {
      throw new Error(
        'Patient must have at least one contact method (phone or email)'
      );
    }

    // Set defaults
    const defaultProps: AppointmentReminderProps = {
      ...props,
      tenantId: props.tenantId || 'hospital-1',
      status: props.status || ReminderStatus.PENDING,
      channels: props.channels || ['SMS', 'EMAIL'],
      preferredChannel: props.preferredChannel || 'SMS',
      patientLanguage: props.patientLanguage || 'vi',
      retryCount: props.retryCount || 0,
      maxRetries: props.maxRetries || 3,
      templateId: props.templateId || 'APPOINTMENT_REMINDER',
      templateData: props.templateData || {},
      metadata: props.metadata || {},
      createdAt: props.createdAt || new Date(),
      updatedAt: props.updatedAt || new Date(),
      createdBy: props.createdBy || 'system',
    };

    const reminder = new AppointmentReminder(defaultProps, id);
    reminder.validateInvariants();
    return reminder;
  }

  // ==============================================
  // Getters
  // ==============================================

  get reminderId(): string {
    return this.id;
  }

  get appointmentId(): string {
    return this.props.appointmentId;
  }

  get tenantId(): string {
    return this.props.tenantId;
  }

  get patientId(): string {
    return this.props.patientId;
  }

  get patientName(): string | undefined {
    return this.props.patientName;
  }

  get patientPhone(): string | undefined {
    return this.props.patientPhone;
  }

  get patientEmail(): string | undefined {
    return this.props.patientEmail;
  }

  get doctorName(): string | undefined {
    return this.props.doctorName;
  }

  get appointmentDate(): Date {
    return this.props.appointmentDate;
  }

  get appointmentTime(): string {
    return this.props.appointmentTime;
  }

  get reminderType(): ReminderType {
    return this.props.reminderType;
  }

  get scheduledSendTime(): Date {
    return this.props.scheduledSendTime;
  }

  get status(): ReminderStatus {
    return this.props.status;
  }

  get notificationId(): string | undefined {
    return this.props.notificationId;
  }

  get sentAt(): Date | undefined {
    return this.props.sentAt;
  }

  get retryCount(): number {
    return this.props.retryCount || 0;
  }

  get maxRetries(): number {
    return this.props.maxRetries || 3;
  }

  get templateData(): Record<string, any> {
    return this.props.templateData || {};
  }

  // ==============================================
  // Business Logic Methods
  // ==============================================

  /**
   * Check if reminder is due to be sent
   */
  public isDue(currentTime: Date = new Date()): boolean {
    return (
      this.props.status.isPending() &&
      this.props.scheduledSendTime <= currentTime
    );
  }

  /**
   * Check if reminder can be retried
   */
  public canRetry(): boolean {
    return (
      this.props.status.isFailed() &&
      this.props.retryCount! < this.props.maxRetries!
    );
  }

  /**
   * Mark as processing
   */
  public markAsProcessing(): void {
    if (!this.props.status.isPending()) {
      throw new Error(
        `Cannot process reminder with status: ${this.props.status.toString()}`
      );
    }

    this.props.status = ReminderStatus.PROCESSING;
    this.props.updatedAt = new Date();
  }

  /**
   * Mark as sent
   */
  public markAsSent(notificationId: string): void {
    if (!this.props.status.isProcessing()) {
      throw new Error(
        `Cannot mark as sent reminder with status: ${this.props.status.toString()}`
      );
    }

    this.props.status = ReminderStatus.SENT;
    this.props.notificationId = notificationId;
    this.props.sentAt = new Date();
    this.props.updatedAt = new Date();
  }

  /**
   * Mark as failed
   */
  public markAsFailed(reason: string): void {
    this.props.status = ReminderStatus.FAILED;
    this.props.failedAt = new Date();
    this.props.failureReason = reason;
    this.props.retryCount = (this.props.retryCount || 0) + 1;
    this.props.lastRetryAt = new Date();

    // Calculate next retry time (exponential backoff)
    if (this.canRetry()) {
      const backoffMinutes = Math.pow(2, this.props.retryCount!) * 5; // 5, 10, 20 minutes
      const nextRetry = new Date();
      nextRetry.setMinutes(nextRetry.getMinutes() + backoffMinutes);
      this.props.nextRetryAt = nextRetry;
    }

    this.props.updatedAt = new Date();
  }

  /**
   * Cancel reminder
   */
  public cancel(reason: string, cancelledBy: string): void {
    if (!this.props.status.canCancel()) {
      throw new Error(
        `Cannot cancel reminder with status: ${this.props.status.toString()}`
      );
    }

    this.props.status = ReminderStatus.CANCELLED;
    this.props.cancelledAt = new Date();
    this.props.cancelledBy = cancelledBy;
    this.props.cancellationReason = reason;
    this.props.updatedAt = new Date();
  }

  /**
   * Mark as expired (past appointment date)
   */
  public markAsExpired(): void {
    if (this.props.status.isFinal()) {
      return; // Already final, no need to update
    }

    this.props.status = ReminderStatus.EXPIRED;
    this.props.updatedAt = new Date();
  }

  /**
   * Get template variables for reminder message
   */
  public getTemplateVariables(): Record<string, any> {
    return {
      patientName: this.props.patientName,
      doctorName: this.props.doctorName,
      doctorSpecialization: this.props.doctorSpecialization,
      appointmentDate: this.formatDate(this.props.appointmentDate),
      appointmentTime: this.props.appointmentTime,
      appointmentType: this.props.appointmentType,
      reason: this.props.reason,
      reminderType: this.props.reminderType.getDescriptionVi(),
      ...this.props.templateData,
    };
  }

  /**
   * Format date for Vietnamese locale
   */
  private formatDate(date: Date): string {
    return date.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  /**
   * Get appointment date time
   */
  public getAppointmentDateTime(): Date {
    const [hours, minutes] = this.props.appointmentTime.split(':').map(Number);
    const datetime = new Date(this.props.appointmentDate);
    datetime.setHours(hours, minutes, 0, 0);
    return datetime;
  }

  /**
   * Check if appointment is in the past
   */
  public isAppointmentPast(currentTime: Date = new Date()): boolean {
    return this.getAppointmentDateTime() < currentTime;
  }

  // ==============================================
  // HealthcareAggregateRoot Abstract Methods
  // ==============================================

  getPatientId(): string | null {
    return this.props.patientId;
  }

  protected validateBusinessInvariants(): void {
    if (!this.props.appointmentId || this.props.appointmentId.trim().length === 0) {
      throw new Error('Appointment ID is required');
    }

    if (!this.props.patientId || this.props.patientId.trim().length === 0) {
      throw new Error('Patient ID is required');
    }

    if (!this.props.scheduledSendTime) {
      throw new Error('Scheduled send time is required');
    }

    if (!this.props.patientPhone && !this.props.patientEmail) {
      throw new Error('Patient must have at least one contact method');
    }
  }

  protected applyEvent(event: DomainEvent): void {
    // Handle domain events if needed
    switch (event.eventType) {
      case 'ReminderSent':
        this.props.status = ReminderStatus.SENT;
        this.props.sentAt = new Date();
        break;
      case 'ReminderFailed':
        this.props.status = ReminderStatus.FAILED;
        break;
      case 'ReminderCancelled':
        this.props.status = ReminderStatus.CANCELLED;
        break;
      default:
        break;
    }
  }

  // Required by Entity base class
  validate(): void {
    this.validateInvariants();
  }

  toPersistence(): any {
    return {
      id: this.id,
      appointment_id: this.props.appointmentId,
      tenant_id: this.props.tenantId,
      patient_id: this.props.patientId,
      patient_name: this.props.patientName,
      patient_phone: this.props.patientPhone,
      patient_email: this.props.patientEmail,
      patient_language: this.props.patientLanguage,
      doctor_id: this.props.doctorId,
      doctor_name: this.props.doctorName,
      doctor_specialization: this.props.doctorSpecialization,
      appointment_date: this.props.appointmentDate,
      appointment_time: this.props.appointmentTime,
      appointment_type: this.props.appointmentType,
      reason: this.props.reason,
      reminder_type: this.props.reminderType.getValue(),
      scheduled_send_time: this.props.scheduledSendTime,
      status: this.props.status.getValue(),
      channels: this.props.channels,
      preferred_channel: this.props.preferredChannel,
      notification_id: this.props.notificationId,
      sent_at: this.props.sentAt,
      delivered_at: this.props.deliveredAt,
      failed_at: this.props.failedAt,
      failure_reason: this.props.failureReason,
      retry_count: this.props.retryCount,
      max_retries: this.props.maxRetries,
      last_retry_at: this.props.lastRetryAt,
      next_retry_at: this.props.nextRetryAt,
      template_id: this.props.templateId,
      template_data: this.props.templateData,
      custom_message: this.props.customMessage,
      cancelled_at: this.props.cancelledAt,
      cancelled_by: this.props.cancelledBy,
      cancellation_reason: this.props.cancellationReason,
      metadata: this.props.metadata,
      created_at: this.props.createdAt,
      updated_at: this.props.updatedAt,
      created_by: this.props.createdBy,
    };
  }
}
