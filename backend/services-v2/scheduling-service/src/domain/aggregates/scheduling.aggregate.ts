/**
 * Appointment Aggregate - Domain Layer
 * V2 Clean Architecture + DDD + Event-Driven Implementation
 * Migrated from V1 with enhanced healthcare compliance
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, HIPAA, Vietnamese Healthcare Standards
 */

import { HealthcareAggregateRoot } from "../../../shared/domain/base/aggregate-root";
import { DomainEvent } from "../../../shared/domain/base/domain-event";
import { AppointmentCancelledEvent } from "../events/AppointmentCancelledEvent";
import { AppointmentRescheduledEvent } from "../events/AppointmentRescheduledEvent";
import { AppointmentScheduledEvent } from "../events/AppointmentScheduledEvent";
import { AppointmentDetails } from "../value-objects/AppointmentDetails";
import { AppointmentId } from "../value-objects/AppointmentId";
import { PatientInfo } from "../value-objects/PatientInfo";
import { ProviderInfo } from "../value-objects/ProviderInfo";
import { TimeSlot } from "../value-objects/TimeSlot";

export enum AppointmentStatus {
  SCHEDULED = "scheduled",
  CONFIRMED = "confirmed",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  NO_SHOW = "no_show",
  RESCHEDULED = "rescheduled",
}

export interface AppointmentProps {
  appointmentId: AppointmentId;
  patient: PatientInfo;
  provider: ProviderInfo;
  timeSlot: TimeSlot;
  details: AppointmentDetails;
  status: AppointmentStatus;
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
 * Manages appointment lifecycle and Vietnamese healthcare business rules
 */
export class Appointment extends HealthcareAggregateRoot<AppointmentProps> {
  private constructor(props: AppointmentProps, id?: string) {
    super(props, id);
  }

  /**
   * Create new appointment with Vietnamese healthcare validation
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
    Appointment.validateAppointmentCreation(
      patient,
      provider,
      timeSlot,
      details
    );

    const props: AppointmentProps = {
      appointmentId,
      patient,
      provider,
      timeSlot,
      details,
      status: AppointmentStatus.SCHEDULED,
      roomId,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy,
      remindersSent: 0,
    };

    const appointment = new Appointment(props);

    // Domain event with Vietnamese healthcare metadata
    appointment.addDomainEvent(
      new AppointmentScheduledEvent(
        appointmentId.value,
        patient.patientId,
        provider.providerId,
        timeSlot.startTime,
        timeSlot.endTime,
        details.reason,
        appointmentId.appointmentType,
        appointmentId.priority,
        createdBy
      )
    );

    return appointment;
  }

  /**
   * Factory method for reconstituting from persistence
   */
  public static reconstitute(props: AppointmentProps): Appointment {
    return new Appointment(props);
  }

  // Getters
  public get appointmentId(): AppointmentId {
    return this.props.appointmentId;
  }

  public get patient(): PatientInfo {
    return this.props.patient;
  }

  public get provider(): ProviderInfo {
    return this.props.provider;
  }

  public get timeSlot(): TimeSlot {
    return this.props.timeSlot;
  }

  public get details(): AppointmentDetails {
    return this.props.details;
  }

  public get status(): AppointmentStatus {
    return this.props.status;
  }

  public get roomId(): string | undefined {
    return this.props.roomId;
  }

  public get createdAt(): Date {
    return this.props.createdAt;
  }

  public get updatedAt(): Date {
    return this.props.updatedAt;
  }

  public get createdBy(): string {
    return this.props.createdBy;
  }

  /**
   * Confirm appointment - Vietnamese healthcare workflow
   */
  public confirm(confirmedBy: string): void {
    if (this.props.status !== AppointmentStatus.SCHEDULED) {
      throw new Error("Chỉ có thể xác nhận cuộc hẹn đã lên lịch");
    }

    // Check if appointment is not in the past
    const now = new Date();
    if (this.timeSlot.startTime <= now) {
      throw new Error("Không thể xác nhận cuộc hẹn đã qua");
    }

    this.props.status = AppointmentStatus.CONFIRMED;
    this.props.confirmedAt = new Date();
    this.props.updatedAt = new Date();

    // Could add domain event for confirmation
  }

  /**
   * Start appointment - Vietnamese healthcare business rules
   */
  public start(startedBy: string): void {
    if (
      this.props.status !== AppointmentStatus.CONFIRMED &&
      this.props.status !== AppointmentStatus.SCHEDULED
    ) {
      throw new Error(
        "Chỉ có thể bắt đầu cuộc hẹn đã xác nhận hoặc đã lên lịch"
      );
    }

    // Check if it's time to start (within 15 minutes of start time)
    const now = new Date();
    const startTime = this.timeSlot.startTime;
    const timeDifference =
      Math.abs(now.getTime() - startTime.getTime()) / (1000 * 60);

    if (timeDifference > 15) {
      throw new Error(
        "Chỉ có thể bắt đầu cuộc hẹn trong vòng 15 phút từ giờ hẹn"
      );
    }

    this.props.status = AppointmentStatus.IN_PROGRESS;
    this.props.updatedAt = new Date();
  }

  /**
   * Complete appointment - Vietnamese healthcare workflow
   */
  public complete(completedBy: string, notes?: string): void {
    if (this.props.status !== AppointmentStatus.IN_PROGRESS) {
      throw new Error("Chỉ có thể hoàn thành cuộc hẹn đang diễn ra");
    }

    this.props.status = AppointmentStatus.COMPLETED;
    this.props.completedAt = new Date();
    this.props.updatedAt = new Date();

    if (notes) {
      // Update details with completion notes
      this.props.details = this.props.details.withNotes(notes);
    }

    // Could add domain event for completion
  }

  /**
   * Cancel appointment - Vietnamese healthcare business rules
   */
  public cancel(reason: string, cancelledBy: string): void {
    if (
      this.props.status === AppointmentStatus.COMPLETED ||
      this.props.status === AppointmentStatus.CANCELLED
    ) {
      throw new Error("Không thể hủy cuộc hẹn đã hoàn thành hoặc đã hủy");
    }

    this.props.status = AppointmentStatus.CANCELLED;
    this.props.cancelledAt = new Date();
    this.props.cancellationReason = reason;
    this.props.updatedAt = new Date();

    // Domain event for cancellation
    this.addDomainEvent(
      new AppointmentCancelledEvent(
        this.appointmentId.value,
        this.patient.patientId,
        this.provider.providerId,
        this.timeSlot.startTime,
        reason,
        cancelledBy,
        this.timeSlot.endTime
      )
    );
  }

  /**
   * Reschedule appointment - Vietnamese healthcare workflow
   */
  public reschedule(
    newTimeSlot: TimeSlot,
    reason: string,
    rescheduledBy: string
  ): void {
    if (
      this.props.status === AppointmentStatus.COMPLETED ||
      this.props.status === AppointmentStatus.CANCELLED
    ) {
      throw new Error("Không thể đổi lịch cuộc hẹn đã hoàn thành hoặc đã hủy");
    }

    const originalTimeSlot = this.props.timeSlot;

    this.props.timeSlot = newTimeSlot;
    this.props.status = AppointmentStatus.RESCHEDULED;
    this.props.updatedAt = new Date();

    // Domain event for rescheduling
    this.addDomainEvent(
      new AppointmentRescheduledEvent(
        this.appointmentId.value,
        this.patient.patientId,
        this.provider.providerId,
        originalTimeSlot.startTime,
        originalTimeSlot.endTime,
        newTimeSlot.startTime,
        newTimeSlot.endTime,
        reason,
        rescheduledBy
      )
    );
  }

  /**
   * Mark as no-show - Vietnamese healthcare business rules
   */
  public markAsNoShow(markedBy: string): void {
    if (
      this.props.status !== AppointmentStatus.SCHEDULED &&
      this.props.status !== AppointmentStatus.CONFIRMED
    ) {
      throw new Error(
        "Chỉ có thể đánh dấu không đến cho cuộc hẹn đã lên lịch hoặc xác nhận"
      );
    }

    // Check if appointment time has passed
    const now = new Date();
    const gracePeriod = 15; // 15 minutes grace period
    const appointmentEndTime = new Date(
      this.timeSlot.startTime.getTime() + gracePeriod * 60 * 1000
    );

    if (now < appointmentEndTime) {
      throw new Error("Chưa thể đánh dấu không đến, vui lòng đợi thêm");
    }

    this.props.status = AppointmentStatus.NO_SHOW;
    this.props.updatedAt = new Date();

    // Could add domain event for no-show
  }

  /**
   * Business rule validation for appointment creation
   */
  private static validateAppointmentCreation(
    patient: PatientInfo,
    provider: ProviderInfo,
    timeSlot: TimeSlot,
    details: AppointmentDetails
  ): void {
    // Patient validation
    if (!patient.isValid()) {
      throw new Error("Thông tin bệnh nhân không hợp lệ");
    }

    // Provider validation
    if (!provider.isValid()) {
      throw new Error("Thông tin bác sĩ không hợp lệ");
    }

    // Time slot validation
    if (!timeSlot.isValid()) {
      throw new Error("Khung thời gian không hợp lệ");
    }

    // Check if appointment is in the future
    const now = new Date();
    if (timeSlot.startTime <= now) {
      throw new Error("Không thể đặt lịch hẹn trong quá khứ");
    }

    // Check business hours (8:00 - 17:00)
    const startHour = timeSlot.startTime.getHours();
    if (startHour < 8 || startHour >= 17) {
      throw new Error(
        "Chỉ có thể đặt lịch hẹn trong giờ làm việc (8:00 - 17:00)"
      );
    }

    // Details validation
    if (!details.isValid()) {
      throw new Error("Chi tiết cuộc hẹn không hợp lệ");
    }
  }

  protected validateBusinessInvariants(): void {
    // Validate appointment state consistency
    if (
      this.props.status === AppointmentStatus.CONFIRMED &&
      !this.props.confirmedAt
    ) {
      throw new Error("Cuộc hẹn đã xác nhận phải có thời gian xác nhận");
    }

    if (
      this.props.status === AppointmentStatus.COMPLETED &&
      !this.props.completedAt
    ) {
      throw new Error("Cuộc hẹn đã hoàn thành phải có thời gian hoàn thành");
    }

    if (
      this.props.status === AppointmentStatus.CANCELLED &&
      !this.props.cancelledAt
    ) {
      throw new Error("Cuộc hẹn đã hủy phải có thời gian hủy");
    }

    // Validate time slot consistency
    if (!this.props.timeSlot.isValid()) {
      throw new Error("Khung thời gian không hợp lệ");
    }

    // Validate patient and provider info
    if (!this.props.patient.isValid()) {
      throw new Error("Thông tin bệnh nhân không hợp lệ");
    }

    if (!this.props.provider.isValid()) {
      throw new Error("Thông tin nhà cung cấp không hợp lệ");
    }

    // Validate appointment details
    if (!this.props.details.isValid()) {
      throw new Error("Chi tiết cuộc hẹn không hợp lệ");
    }
  }

  protected applyEvent(event: DomainEvent): void {
    // Event sourcing - apply events to aggregate state
    switch (event.eventType) {
      case "AppointmentScheduled":
        // Already handled in create method
        break;
      case "AppointmentCancelled":
        // State already updated in cancel method
        break;
      case "AppointmentRescheduled":
        // State already updated in reschedule method
        break;
      default:
        // Unknown event type
        break;
    }
  }

  /**
   * Healthcare-specific: Get patient ID
   */
  getPatientId(): string | null {
    return this.props.patient.patientId;
  }

  /**
   * Healthcare-specific: Check if contains PHI
   */
  containsPHI(): boolean {
    return true; // Appointments always contain PHI
  }

  /**
   * Convert to persistence format
   */
  toPersistence(): any {
    return {
      id: this.id,
      appointment_id: this.props.appointmentId.value,
      patient_id: this.props.patient.patientId,
      provider_id: this.props.provider.providerId,
      start_time: this.props.timeSlot.startTime,
      end_time: this.props.timeSlot.endTime,
      status: this.props.status,
      room_id: this.props.roomId,
      reason: this.props.details.reason,
      notes: this.props.details.notes,
      created_at: this.props.createdAt,
      updated_at: this.props.updatedAt,
      created_by: this.props.createdBy,
      confirmed_at: this.props.confirmedAt,
      completed_at: this.props.completedAt,
      cancelled_at: this.props.cancelledAt,
      cancellation_reason: this.props.cancellationReason,
      reminders_sent: this.props.remindersSent,
      last_reminder_sent: this.props.lastReminderSent,
      version: this.version,
      last_modified: this.lastModified,
      modified_by: this.modifiedBy,
    };
  }
}
