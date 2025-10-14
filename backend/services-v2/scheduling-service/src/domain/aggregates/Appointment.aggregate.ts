/**
 * Appointment Aggregate Root - Domain Layer
 * V2 Clean Architecture + DDD + Event-Driven Implementation
 * Rebuilt to align 100% with scheduling_schema database
 *
 * @author Hospital Management Team
 * @version 3.0.0
 * @compliance Clean Architecture, DDD, HIPAA, Vietnamese Healthcare Standards
 */

import { HealthcareAggregateRoot } from '@shared/domain/base/aggregate-root';
import { DomainEvent } from '@shared/domain/base/domain-event';
import { AppointmentScheduledEvent } from '../events/AppointmentScheduledEvent';
import { AppointmentCancelledEvent } from '../events/AppointmentCancelledEvent';
import { AppointmentRescheduledEvent } from '../events/AppointmentRescheduledEvent';
import { AppointmentId } from '../value-objects/AppointmentId.vo';
import { TimeSlot } from '../value-objects/TimeSlot.vo';
import { AppointmentDetails } from '../value-objects/AppointmentDetails.vo';

export enum AppointmentType {
  CONSULTATION = 'consultation',
  FOLLOW_UP = 'follow_up',
  EMERGENCY = 'emergency',
  TELEMEDICINE = 'telemedicine',
  SURGERY = 'surgery',
  PROCEDURE = 'procedure'
}

export enum AppointmentPriority {
  ROUTINE = 'routine',
  URGENT = 'urgent',
  EMERGENCY = 'emergency',
  STAT = 'stat'
}

export enum AppointmentStatus {
  SCHEDULED = 'scheduled',
  CONFIRMED = 'confirmed',
  ARRIVED = 'arrived',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show'
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  PARTIALLY_PAID = 'partially_paid',
  REFUNDED = 'refunded',
  CANCELLED = 'cancelled'
}

export interface AppointmentProps {
  appointmentId: AppointmentId;
  patientId: string;
  doctorId: string;
  timeSlot: TimeSlot;
  durationMinutes: number;
  type: AppointmentType;
  priority: AppointmentPriority;
  status: AppointmentStatus;
  details: AppointmentDetails;
  roomId?: string;
  departmentId?: string;
  requiredEquipment?: string[];
  consultationFee: number;
  additionalFees?: number;
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  checkedInAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
  cancelledBy?: string;
  followUpAppointmentId?: string;
  parentAppointmentId?: string;
  seriesId?: string;
  reminderSent: boolean;
  reminderSentAt?: Date;
  confirmationRequired: boolean;
  confirmedAt?: Date;
  confirmedBy?: string;
  createdBy: string;
  lastModifiedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Appointment Aggregate Root
 * Manages appointment lifecycle with Vietnamese healthcare business rules
 * Follows DDD aggregate pattern: only stores IDs, not denormalized data
 */
export class Appointment extends HealthcareAggregateRoot<AppointmentProps> {
  private constructor(props: AppointmentProps, id?: string) {
    super(props, id);
  }

  // Getters - Expose properties following DDD best practices
  public override get id(): string {
    return this._id;
  }

  public getAppointmentId(): AppointmentId {
    return this.props.appointmentId;
  }

  public getDoctorId(): string {
    return this.props.doctorId;
  }

  public getTimeSlot(): TimeSlot {
    return this.props.timeSlot;
  }

  public getDurationMinutes(): number {
    return this.props.durationMinutes;
  }

  public getType(): AppointmentType {
    return this.props.type;
  }

  public getPriority(): AppointmentPriority {
    return this.props.priority;
  }

  public getStatus(): AppointmentStatus {
    return this.props.status;
  }

  public getDetails(): AppointmentDetails {
    return this.props.details;
  }

  public getRoomId(): string | undefined {
    return this.props.roomId;
  }

  public getDepartmentId(): string | undefined {
    return this.props.departmentId;
  }

  public getRequiredEquipment(): string[] | undefined {
    return this.props.requiredEquipment ? [...this.props.requiredEquipment] : undefined;
  }

  public getConsultationFee(): number {
    return this.props.consultationFee;
  }

  public getAdditionalFees(): number | undefined {
    return this.props.additionalFees;
  }

  public getPaymentStatus(): PaymentStatus {
    return this.props.paymentStatus;
  }

  public getPaymentMethod(): string | undefined {
    return this.props.paymentMethod;
  }

  public getCheckedInAt(): Date | undefined {
    return this.props.checkedInAt;
  }

  public getStartedAt(): Date | undefined {
    return this.props.startedAt;
  }

  public getCompletedAt(): Date | undefined {
    return this.props.completedAt;
  }

  public getCancelledAt(): Date | undefined {
    return this.props.cancelledAt;
  }

  public getCancellationReason(): string | undefined {
    return this.props.cancellationReason;
  }

  public getCancelledBy(): string | undefined {
    return this.props.cancelledBy;
  }

  public getFollowUpAppointmentId(): string | undefined {
    return this.props.followUpAppointmentId;
  }

  public getParentAppointmentId(): string | undefined {
    return this.props.parentAppointmentId;
  }

  public getSeriesId(): string | undefined {
    return this.props.seriesId;
  }

  public getReminderSent(): boolean {
    return this.props.reminderSent;
  }

  public getReminderSentAt(): Date | undefined {
    return this.props.reminderSentAt;
  }

  public getConfirmationRequired(): boolean {
    return this.props.confirmationRequired;
  }

  public getConfirmedAt(): Date | undefined {
    return this.props.confirmedAt;
  }

  public getConfirmedBy(): string | undefined {
    return this.props.confirmedBy;
  }

  public getCreatedBy(): string {
    return this.props.createdBy;
  }

  public getLastModifiedBy(): string | undefined {
    return this.props.lastModifiedBy;
  }

  public getCreatedAt(): Date {
    return this.props.createdAt;
  }

  public getUpdatedAt(): Date {
    return this.props.updatedAt;
  }

  /**
   * Create new appointment
   */
  public static create(
    appointmentId: AppointmentId,
    patientId: string,
    doctorId: string,
    timeSlot: TimeSlot,
    durationMinutes: number,
    type: AppointmentType,
    priority: AppointmentPriority,
    details: AppointmentDetails,
    consultationFee: number,
    createdBy: string,
    roomId?: string,
    departmentId?: string,
    requiredEquipment?: string[]
  ): Appointment {
    // Business rule validations
    Appointment.validateAppointmentCreation(
      patientId,
      doctorId,
      timeSlot,
      durationMinutes,
      consultationFee
    );

    const props: AppointmentProps = {
      appointmentId,
      patientId,
      doctorId,
      timeSlot,
      durationMinutes,
      type,
      priority,
      status: AppointmentStatus.SCHEDULED,
      details,
      roomId,
      departmentId,
      requiredEquipment,
      consultationFee,
      additionalFees: 0,
      paymentStatus: PaymentStatus.PENDING,
      reminderSent: false,
      confirmationRequired: true,
      createdBy,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const appointment = new Appointment(props);

    // Domain event
    appointment.addDomainEvent(
      new AppointmentScheduledEvent(
        appointmentId.value,
        patientId,
        doctorId,
        timeSlot.appointmentDate,
        timeSlot.appointmentTime,
        durationMinutes,
        type,
        priority,
        'scheduled',
        consultationFee,
        createdBy
      )
    );

    return appointment;
  }

  /**
   * Validate appointment creation
   */
  private static validateAppointmentCreation(
    patientId: string,
    doctorId: string,
    timeSlot: TimeSlot,
    durationMinutes: number,
    consultationFee: number
  ): void {
    if (!patientId || !doctorId) {
      throw new Error('Patient ID and Doctor ID are required');
    }

    if (durationMinutes <= 0 || durationMinutes > 480) {
      throw new Error('Duration must be between 1 and 480 minutes');
    }

    if (consultationFee < 0) {
      throw new Error('Consultation fee cannot be negative');
    }

    if (timeSlot.isPast()) {
      throw new Error('Cannot schedule appointment in the past');
    }
  }

  /**
   * Confirm appointment
   */
  public confirm(confirmedBy: string): void {
    if (this.props.status !== AppointmentStatus.SCHEDULED) {
      throw new Error('Only scheduled appointments can be confirmed');
    }

    this.props.status = AppointmentStatus.CONFIRMED;
    this.props.confirmedAt = new Date();
    this.props.confirmedBy = confirmedBy;
    this.props.updatedAt = new Date();
    this.props.lastModifiedBy = confirmedBy;

    this.incrementVersion();
  }

  /**
   * Check in patient
   */
  public checkIn(): void {
    if (this.props.status !== AppointmentStatus.CONFIRMED) {
      throw new Error('Only confirmed appointments can be checked in');
    }

    this.props.status = AppointmentStatus.ARRIVED;
    this.props.checkedInAt = new Date();
    this.props.updatedAt = new Date();

    this.incrementVersion();
  }

  /**
   * Start appointment
   */
  public start(): void {
    if (this.props.status !== AppointmentStatus.ARRIVED) {
      throw new Error('Patient must be checked in before starting appointment');
    }

    this.props.status = AppointmentStatus.IN_PROGRESS;
    this.props.startedAt = new Date();
    this.props.updatedAt = new Date();

    this.incrementVersion();
  }

  /**
   * Complete appointment
   */
  public complete(): void {
    if (this.props.status !== AppointmentStatus.IN_PROGRESS) {
      throw new Error('Only in-progress appointments can be completed');
    }

    this.props.status = AppointmentStatus.COMPLETED;
    this.props.completedAt = new Date();
    this.props.updatedAt = new Date();

    this.incrementVersion();
  }

  /**
   * Cancel appointment
   */
  public cancel(reason: string, cancelledBy: string): void {
    if (this.props.status === AppointmentStatus.COMPLETED) {
      throw new Error('Cannot cancel completed appointment');
    }

    if (this.props.status === AppointmentStatus.CANCELLED) {
      throw new Error('Appointment is already cancelled');
    }

    this.props.status = AppointmentStatus.CANCELLED;
    this.props.cancelledAt = new Date();
    this.props.cancellationReason = reason;
    this.props.cancelledBy = cancelledBy;
    this.props.updatedAt = new Date();
    this.props.lastModifiedBy = cancelledBy;

    // Create originalStartTime from timeSlot
    const originalStartTime = new Date(`${this.props.timeSlot.appointmentDate}T${this.props.timeSlot.appointmentTime}`);
    const originalEndTime = new Date(originalStartTime.getTime() + this.props.durationMinutes * 60 * 1000);

    // Domain event
    this.addDomainEvent(
      new AppointmentCancelledEvent(
        this.props.appointmentId.value,
        this.props.patientId,
        this.props.doctorId,
        originalStartTime,
        reason,
        cancelledBy,
        originalEndTime
      )
    );

    this.incrementVersion();
  }

  /**
   * Mark as no-show
   */
  public markAsNoShow(): void {
    if (this.props.status !== AppointmentStatus.CONFIRMED && 
        this.props.status !== AppointmentStatus.SCHEDULED) {
      throw new Error('Only scheduled/confirmed appointments can be marked as no-show');
    }

    this.props.status = AppointmentStatus.NO_SHOW;
    this.props.updatedAt = new Date();

    this.incrementVersion();
  }

  /**
   * Reschedule appointment
   */
  public reschedule(
    newTimeSlot: TimeSlot,
    reason: string,
    rescheduledBy: string
  ): void {
    if (this.props.status === AppointmentStatus.COMPLETED) {
      throw new Error('Cannot reschedule completed appointment');
    }

    if (this.props.status === AppointmentStatus.CANCELLED) {
      throw new Error('Cannot reschedule cancelled appointment');
    }

    if (newTimeSlot.isPast()) {
      throw new Error('Cannot reschedule to past time');
    }

    const oldTimeSlot = this.props.timeSlot;
    this.props.timeSlot = newTimeSlot;
    this.props.status = AppointmentStatus.SCHEDULED;
    this.props.confirmedAt = undefined;
    this.props.confirmedBy = undefined;
    this.props.updatedAt = new Date();
    this.props.lastModifiedBy = rescheduledBy;

    // Create Date objects from time slot strings
    const originalStartTime = new Date(`${oldTimeSlot.appointmentDate}T${oldTimeSlot.appointmentTime}`);
    const originalEndTime = new Date(originalStartTime.getTime() + this.props.durationMinutes * 60 * 1000);
    const newStartTime = new Date(`${newTimeSlot.appointmentDate}T${newTimeSlot.appointmentTime}`);
    const newEndTime = new Date(newStartTime.getTime() + this.props.durationMinutes * 60 * 1000);

    // Domain event
    this.addDomainEvent(
      new AppointmentRescheduledEvent(
        this.props.appointmentId.value,
        this.props.patientId,
        this.props.doctorId,
        originalStartTime,
        originalEndTime,
        newStartTime,
        newEndTime,
        reason,
        rescheduledBy
      )
    );

    this.incrementVersion();
  }

  // Getters
  get appointmentId(): AppointmentId { return this.props.appointmentId; }
  get patientId(): string { return this.props.patientId; }
  get doctorId(): string { return this.props.doctorId; }
  get timeSlot(): TimeSlot { return this.props.timeSlot; }
  get durationMinutes(): number { return this.props.durationMinutes; }
  get type(): AppointmentType { return this.props.type; }
  get priority(): AppointmentPriority { return this.props.priority; }
  get status(): AppointmentStatus { return this.props.status; }
  get details(): AppointmentDetails { return this.props.details; }
  get consultationFee(): number { return this.props.consultationFee; }
  get paymentStatus(): PaymentStatus { return this.props.paymentStatus; }

  /**
   * Healthcare-specific: Contains PHI
   */
  override containsPHI(): boolean {
    return true;
  }

  /**
   * Healthcare-specific: Get patient ID
   */
  override getPatientId(): string | null {
    return this.props.patientId;
  }

  /**
   * Validate business invariants
   */
  protected validateBusinessInvariants(): void {
    if (!this.props.patientId || !this.props.doctorId) {
      throw new Error('Patient ID and Doctor ID are required');
    }

    if (this.props.durationMinutes <= 0) {
      throw new Error('Duration must be positive');
    }

    if (this.props.consultationFee < 0) {
      throw new Error('Consultation fee cannot be negative');
    }
  }

  /**
   * Apply domain event (for event sourcing)
   */
  protected applyEvent(event: DomainEvent): void {
    // Event sourcing logic can be implemented here
    // For now, we use state-based persistence, so this is a no-op
    // In future, implement event sourcing logic here
  }

  // ==================== Required Abstract Methods ====================

  /**
   * Validate entity state (required by HealthcareAggregateRoot base class)
   */
  validate(): void {
    this.validateBusinessInvariants();
  }

  /**
   * Convert to persistence format (required by HealthcareAggregateRoot base class)
   * Note: This is a minimal stub. Use AppointmentMapper.toPersistence() for actual persistence.
   */
  toPersistence(): { id: string; appointment_id: string } {
    return {
      id: this.id,
      appointment_id: this.props.appointmentId.value
    };
  }
}

