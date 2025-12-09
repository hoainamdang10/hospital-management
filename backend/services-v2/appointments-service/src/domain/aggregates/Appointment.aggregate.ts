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
import { AppointmentNoShowEvent } from '../events/AppointmentNoShowEvent';
import { AppointmentStartedEvent } from '../events/AppointmentStartedEvent';
import { AppointmentConfirmedEvent } from '../events/AppointmentConfirmedEvent';
import { AppointmentCompletedEvent } from '../events/AppointmentCompletedEvent';
import { AppointmentId } from '../value-objects/AppointmentId.vo';
import { TimeSlot } from '../value-objects/TimeSlot.vo';
import { AppointmentDetails } from '../value-objects/AppointmentDetails.vo';
import { TenantId } from '../value-objects/TenantId.vo';

export enum AppointmentType {
  CONSULTATION = 'consultation',
  FOLLOW_UP = 'follow_up',
  EMERGENCY = 'emergency',
  TELEMEDICINE = 'telemedicine',
  SURGERY = 'surgery',
  PROCEDURE = 'procedure',
  URGENT_CONSULTATION = 'urgent_consultation',
  MEDICAL_TEST = 'medical_test'
}

export enum AppointmentPriority {
  LOW = 'low',
  NORMAL = 'normal',
  URGENT = 'urgent',
  EMERGENCY = 'emergency'
}

export enum AppointmentStatus {
  SCHEDULED = 'scheduled',           // Offline booking, post-reschedule
  PENDING_PAYMENT = 'pending_payment', // Online prepaid flow
  CONFIRMED = 'confirmed',            // Ready for consultation
  IN_PROGRESS = 'in_progress',        // Actively consulting
  COMPLETED = 'completed',            // Consultation finished
  CANCELLED = 'cancelled',            // Cancelled by patient/doctor/admin
  NO_SHOW = 'no_show',               // Patient didn't show up
  RESCHEDULED = 'reschedule_required' // Needs rescheduling
}

/**
 * Payment management is NOT the responsibility of appointments-service
 * Payment state, invoices, and billing are handled by billing-service
 * 
 * Appointments service only:
 * - Stores consultationFee as immutable reference
 * - Emits AppointmentCompletedEvent with fee info
 * - Billing-service consumes event and handles payment lifecycle
 */

export interface AppointmentProps {
  appointmentId: AppointmentId;
  tenantId: TenantId;
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

  // Billing Reference (immutable, for billing-service)
  // Appointments service does NOT manage payment state
  // Only stores fee as reference for billing-service to consume via events
  consultationFee: number;

  // Payment Tracking (for prepaid model - Flow 3)
  // Track payment status and deadline for online booking with prepayment
  paymentStatus?: 'pending' | 'paid' | 'refunded';
  paymentDeadline?: Date; // Timeout for pending payment (default: 10 minutes)

  startedAt?: Date;

  completedAt?: Date;
  cancelledAt?: Date;
  noShowAt?: Date;
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
  version: number;
  createdBy: string;
  lastModifiedBy?: string;
  createdAt: Date;
  updatedAt: Date;
  notes?: string;
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

  public getTenantId(): TenantId {
    return this.props.tenantId;
  }

  public getDoctorId(): string {
    return this.props.doctorId;
  }

  public getVersion(): number {
    return this.props.version;
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

  /**
   * Get consultation fee (immutable reference for billing-service)
   * NOTE: Appointments service does NOT manage payment state
   */
  public getConsultationFee(): number {
    return this.props.consultationFee;
  }

  /**
   * Get payment status (Flow 3 - Prepaid Model)
   */
  public get paymentStatus(): 'pending' | 'paid' | 'refunded' | undefined {
    return this.props.paymentStatus;
  }

  /**
   * Get payment deadline (Flow 3 - Prepaid Model)
   */
  public get paymentDeadline(): Date | undefined {
    return this.props.paymentDeadline;
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

  public getNoShowAt(): Date | undefined {
    return this.props.noShowAt;
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
   * Reconstitute appointment from database (with UUID)
   * Used by repository when loading from persistence
   */
  public static reconstitute(props: AppointmentProps, id: string): Appointment {
    return new Appointment(props, id);
  }

  /**
   * Create new appointment
   */
  public static create(
    appointmentId: AppointmentId,
    tenantId: TenantId,
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
      tenantId,
      patientId,
      doctorId,
      timeSlot,
      durationMinutes,
      type,
      priority,
      // ✅ FIX: Use PENDING_PAYMENT for prepaid flow (Flow 3)
      status: AppointmentStatus.PENDING_PAYMENT,
      details,
      roomId,
      departmentId,
      requiredEquipment,
      consultationFee, // Immutable reference for billing-service
      // Payment tracking for prepaid model (Flow 3)
      paymentStatus: 'pending',
      paymentDeadline: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
      reminderSent: false,
      confirmationRequired: true,
      version: 1,
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
        // ✅ FIX: Event status should match aggregate status
        'pending_payment',
        consultationFee,
        createdBy,
        details.reason,
        details.notes
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
   * Confirm appointment (after payment completed)
   * 
   * ✅ PURE DOMAIN LOGIC - No infrastructure dependencies
   * ✅ Logging moved to application/infrastructure layer
   * 
   * BUSINESS RULES:
   * - Can only confirm appointments in PENDING_PAYMENT or SCHEDULED status
   * - Must have valid confirmedBy actor
   * - Payment deadline must not be expired (if set)
   * - Emits AppointmentConfirmedEvent for downstream services
   * 
   * @param confirmedBy - Actor confirming the appointment (user ID or 'system')
   * @param notes - Optional confirmation notes
   * @throws Error if appointment cannot be confirmed
   */
  public confirm(confirmedBy: string, notes?: string): void {
    // ===== GUARD 1: Validate current status =====
    // Allow confirm from both PENDING_PAYMENT (prepaid flow) and SCHEDULED (traditional flow)
    const validStatuses = [AppointmentStatus.PENDING_PAYMENT, AppointmentStatus.SCHEDULED];

    if (!validStatuses.includes(this.props.status)) {
      throw new Error(
        `Cannot confirm appointment in ${this.props.status} status. ` +
        `Expected: ${validStatuses.join(' or ')}`
      );
    }

    // ===== GUARD 2: Validate confirmedBy =====
    if (!confirmedBy || confirmedBy.trim() === '') {
      throw new Error('confirmedBy is required for appointment confirmation');
    }

    // ===== GUARD 3: Check payment deadline not expired (prepaid flow) =====
    if (this.props.paymentDeadline && new Date() > this.props.paymentDeadline) {
      throw new Error(
        `Cannot confirm appointment - payment deadline has passed. ` +
        `Deadline: ${this.props.paymentDeadline.toISOString()}, ` +
        `Current: ${new Date().toISOString()}`
      );
    }

    // ===== STATE MUTATION =====
    const previousStatus = this.props.status;

    this.props.status = AppointmentStatus.CONFIRMED;
    this.props.confirmedAt = new Date();
    this.props.confirmedBy = confirmedBy;
    this.props.updatedAt = new Date();
    this.props.lastModifiedBy = confirmedBy;

    // Update payment status if in prepaid flow
    if (this.props.paymentStatus === 'pending') {
      this.props.paymentStatus = 'paid';
    }

    // Store notes if provided
    if (notes) {
      this.props.notes = notes;
    }

    // ===== DOMAIN EVENT =====
    // ⚠️ Names will be enriched from read model in Repository layer
    this.addDomainEvent(
      new AppointmentConfirmedEvent(
        this.props.appointmentId.value,
        this.props.patientId,
        this.props.doctorId,
        this.props.timeSlot.appointmentDate,
        this.props.timeSlot.appointmentTime.toString(),
        confirmedBy,
        'payment_completed', // confirmation method for prepaid flow
        undefined, // patientName - enriched in repository
        undefined, // doctorName - enriched in repository
        this.props.departmentId,
        undefined, // departmentName - enriched in repository
        this.props.durationMinutes,
        this.props.consultationFee
      )
    );

    this.incrementVersion();

    // ✅ NO LOGGING HERE - Pure domain logic only
    // Logging sẽ được thực hiện ở application/infrastructure layer
  }



  /**
   * Start appointment
   * Simplified flow: Doctor can start directly from CONFIRMED/SCHEDULED
   * No check-in step required for 3-role system (Patient, Doctor, Admin)
   */
  public start(startTime?: Date): void {
    // Allow start from CONFIRMED or SCHEDULED (no check-in required)
    if (this.props.status !== AppointmentStatus.CONFIRMED &&
      this.props.status !== AppointmentStatus.SCHEDULED) {
      throw new Error(
        `Cannot start appointment with status ${this.props.status}. ` +
        `Expected: CONFIRMED or SCHEDULED`
      );
    }

    // Prevent double-start
    if (this.props.startedAt) {
      throw new Error('Appointment has already been started');
    }

    const actualStartTime = startTime || new Date();
    this.props.status = AppointmentStatus.IN_PROGRESS;
    this.props.startedAt = actualStartTime;
    this.props.updatedAt = new Date();

    // Domain event
    this.addDomainEvent(
      new AppointmentStartedEvent(
        this.props.appointmentId.value,
        this.props.patientId,
        this.props.doctorId,
        this.props.timeSlot.appointmentDate,
        this.props.timeSlot.appointmentTime.toString(),
        'system'
      )
    );

    this.incrementVersion();
  }

  /**
   * Complete appointment
   * Simplified: Only allow from IN_PROGRESS (must start first)
   */
  public complete(): void {
    if (this.props.status !== AppointmentStatus.IN_PROGRESS) {
      throw new Error(
        `Cannot complete appointment with status ${this.props.status}. ` +
        `Expected: IN_PROGRESS`
      );
    }

    this.props.status = AppointmentStatus.COMPLETED;
    this.props.completedAt = new Date();
    this.props.updatedAt = new Date();

    // Calculate duration
    const duration = this.props.startedAt && this.props.completedAt
      ? Math.round((this.props.completedAt.getTime() - this.props.startedAt.getTime()) / 60000)
      : this.props.durationMinutes;

    // Domain event (includes consultationFee for billing-service to consume)
    // billing-service will create invoice and handle payment lifecycle
    this.addDomainEvent(
      new AppointmentCompletedEvent(
        this.props.appointmentId.value,
        this.props.patientId,
        this.props.doctorId,
        this.props.completedAt,
        duration,
        this.props.details?.notes,
        this.props.consultationFee // Billing reference
      )
    );

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
   * Mark appointment as paid
   * Called by PaymentCompletedHandler after successful payment
   * Idempotent - safe to call multiple times
   */
  public markAsPaid(): void {
    if (this.props.paymentStatus === 'paid') {
      return; // Already paid, idempotent
    }

    this.props.paymentStatus = 'paid';
    this.props.updatedAt = new Date();
    this.incrementVersion();
  }

  /**
   * Check if payment deadline has expired
   * Used by ExpireUnpaidAppointmentsUseCase to find expired appointments
   */
  public isPaymentExpired(): boolean {
    if (!this.props.paymentDeadline) {
      return false; // No deadline set (backward compatibility)
    }

    // Only consider expired if status is still pending
    return new Date() > this.props.paymentDeadline && this.props.paymentStatus === 'pending';
  }

  /**
   * Mark as no-show
   */
  public markAsNoShow(markedBy: string): void {
    // Only allow no-show for appointments that haven't started yet
    if (this.props.status !== AppointmentStatus.CONFIRMED &&
      this.props.status !== AppointmentStatus.SCHEDULED) {
      throw new Error(
        `Cannot mark as no-show with status ${this.props.status}. ` +
        `Expected: CONFIRMED or SCHEDULED`
      );
    }

    this.props.status = AppointmentStatus.NO_SHOW;
    this.props.noShowAt = new Date();
    this.props.updatedAt = new Date();
    this.props.lastModifiedBy = markedBy;

    // Domain event
    this.addDomainEvent(
      new AppointmentNoShowEvent(
        this.props.appointmentId.value,
        this.props.patientId,
        this.props.doctorId,
        this.props.timeSlot.appointmentDate, // Already a string
        this.props.timeSlot.appointmentTime.toString(),
        'system' // markedBy - using system as default
      )
    );

    this.incrementVersion();
  }

  /**
   * Transfer appointment to another doctor
   * Business method for changing doctor assignment
   */
  public transfer(newDoctorId: string, reason: string, transferredBy: string): void {
    // Validate state - cannot transfer completed/cancelled appointments
    if (this.props.status === AppointmentStatus.COMPLETED) {
      throw new Error('Cannot transfer completed appointment');
    }

    if (this.props.status === AppointmentStatus.CANCELLED) {
      throw new Error('Cannot transfer cancelled appointment');
    }

    if (this.props.status === AppointmentStatus.NO_SHOW) {
      throw new Error('Cannot transfer no-show appointment');
    }

    // Store old doctor for event
    const oldDoctorId = this.props.doctorId;

    // Update doctor assignment
    this.props.doctorId = newDoctorId;
    this.props.lastModifiedBy = transferredBy;
    this.props.updatedAt = new Date();

    // Add transfer note to details
    const transferNote = `[${new Date().toISOString()}] Transferred from doctor ${oldDoctorId} to ${newDoctorId}. Reason: ${reason}`;
    const currentNotes = this.props.details.notes || '';
    const updatedNotes = currentNotes ? `${currentNotes}\n${transferNote}` : transferNote;

    this.props.details = AppointmentDetails.create(
      this.props.details.reason,
      this.props.details.chiefComplaint,
      this.props.details.symptoms,
      updatedNotes,
      this.props.details.specialInstructions
    );

    this.props.version++;
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

  /**
   * Mark appointment for reschedule due to conflicts
   */
  markForReschedule(reason: string, conflictDetails?: any): void {
    if (this.props.status === AppointmentStatus.COMPLETED) {
      throw new Error('Cannot reschedule completed appointment');
    }

    if (this.props.status === AppointmentStatus.CANCELLED) {
      throw new Error('Cannot reschedule cancelled appointment');
    }

    this.props.status = AppointmentStatus.RESCHEDULED;
    this.props.updatedAt = new Date();
    this.props.notes = this.props.notes
      ? `${this.props.notes}\nMarked for reschedule: ${reason}`
      : `Marked for reschedule: ${reason}`;

    // Add domain event
    this.addDomainEvent(
      new AppointmentRescheduledEvent(
        this.props.appointmentId.value,
        this.props.patientId,
        this.props.doctorId,
        new Date(`${this.props.timeSlot.appointmentDate}T${this.props.timeSlot.appointmentTime}`),
        new Date(`${this.props.timeSlot.appointmentDate}T${this.props.timeSlot.appointmentTime}`),
        new Date(`${this.props.timeSlot.appointmentDate}T${this.props.timeSlot.appointmentTime}`),
        new Date(`${this.props.timeSlot.appointmentDate}T${this.props.timeSlot.appointmentTime}`),
        reason,
        'system'
      )
    );

    this.incrementVersion();
  }

  /**
   * Assign appointment to staff member
   */
  assignToStaff(staffId: string, assignedBy: string): void {
    if (this.props.status === AppointmentStatus.COMPLETED) {
      throw new Error('Cannot assign staff to completed appointment');
    }

    if (this.props.status === AppointmentStatus.CANCELLED) {
      throw new Error('Cannot assign staff to cancelled appointment');
    }

    this.props.doctorId = staffId;
    this.props.updatedAt = new Date();
    this.props.lastModifiedBy = assignedBy;

    // Add domain event for staff assignment
    this.addDomainEvent(
      new AppointmentScheduledEvent(
        this.props.appointmentId.value,
        this.props.patientId,
        staffId,
        this.props.timeSlot.appointmentDate,
        this.props.timeSlot.appointmentTime,
        this.props.durationMinutes,
        this.props.type,
        this.props.priority,
        this.props.status,
        this.props.consultationFee,
        assignedBy
      )
    );

    this.incrementVersion();
  }

  // Getters (shorthand accessors)
  get appointmentId(): AppointmentId { return this.props.appointmentId; }
  get patientId(): string { return this.props.patientId; }
  get doctorId(): string { return this.props.doctorId; }
  get timeSlot(): TimeSlot { return this.props.timeSlot; }
  get durationMinutes(): number { return this.props.durationMinutes; }
  get type(): AppointmentType { return this.props.type; }
  get priority(): AppointmentPriority { return this.props.priority; }
  get status(): AppointmentStatus { return this.props.status; }
  get details(): AppointmentDetails { return this.props.details; }
  get consultationFee(): number { return this.props.consultationFee; } // Billing reference only

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

