/**
 * Appointment Aggregate Root - Domain Layer
 * V2 Clean Architecture + DDD + Event-Driven Implementation
 * Rebuilt to align 100% with scheduling_schema database
 *
 * @author Hospital Management Team
 * @version 3.0.0
 * @compliance Clean Architecture, DDD, HIPAA, Vietnamese Healthcare Standards
 */
import { HealthcareAggregateRoot } from '../../../../shared/domain/base/aggregate-root';
import { DomainEvent } from '../../../../shared/domain/base/domain-event';
import { AppointmentId } from '../value-objects/AppointmentId.vo';
import { TimeSlot } from '../value-objects/TimeSlot.vo';
import { AppointmentDetails } from '../value-objects/AppointmentDetails.vo';
import { TenantId } from '../value-objects/TenantId.vo';
export declare enum AppointmentType {
    CONSULTATION = "consultation",
    FOLLOW_UP = "follow_up",
    EMERGENCY = "emergency",
    TELEMEDICINE = "telemedicine",
    SURGERY = "surgery",
    PROCEDURE = "procedure",
    URGENT_CONSULTATION = "urgent_consultation",
    MEDICAL_TEST = "medical_test"
}
export declare enum AppointmentPriority {
    LOW = "low",
    NORMAL = "normal",
    URGENT = "urgent",
    EMERGENCY = "emergency"
}
export declare enum AppointmentStatus {
    SCHEDULED = "scheduled",// Offline booking, post-reschedule
    PENDING_PAYMENT = "pending_payment",// Online prepaid flow
    CONFIRMED = "confirmed",// Ready for consultation
    IN_PROGRESS = "in_progress",// Actively consulting
    COMPLETED = "completed",// Consultation finished
    CANCELLED = "cancelled",// Cancelled by patient/doctor/admin
    NO_SHOW = "no_show",// Patient didn't show up
    RESCHEDULED = "reschedule_required"
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
    consultationFee: number;
    paymentStatus?: 'pending' | 'paid' | 'refunded';
    paymentDeadline?: Date;
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
export declare class Appointment extends HealthcareAggregateRoot<AppointmentProps> {
    private constructor();
    get id(): string;
    getAppointmentId(): AppointmentId;
    getTenantId(): TenantId;
    getDoctorId(): string;
    getVersion(): number;
    getTimeSlot(): TimeSlot;
    getDurationMinutes(): number;
    getType(): AppointmentType;
    getPriority(): AppointmentPriority;
    getStatus(): AppointmentStatus;
    getDetails(): AppointmentDetails;
    getRoomId(): string | undefined;
    getDepartmentId(): string | undefined;
    getRequiredEquipment(): string[] | undefined;
    /**
     * Get consultation fee (immutable reference for billing-service)
     * NOTE: Appointments service does NOT manage payment state
     */
    getConsultationFee(): number;
    /**
     * Get payment status (Flow 3 - Prepaid Model)
     */
    get paymentStatus(): 'pending' | 'paid' | 'refunded' | undefined;
    /**
     * Get payment deadline (Flow 3 - Prepaid Model)
     */
    get paymentDeadline(): Date | undefined;
    getStartedAt(): Date | undefined;
    getCompletedAt(): Date | undefined;
    getCancelledAt(): Date | undefined;
    getNoShowAt(): Date | undefined;
    getCancellationReason(): string | undefined;
    getCancelledBy(): string | undefined;
    getFollowUpAppointmentId(): string | undefined;
    getParentAppointmentId(): string | undefined;
    getSeriesId(): string | undefined;
    getReminderSent(): boolean;
    getReminderSentAt(): Date | undefined;
    getConfirmationRequired(): boolean;
    getConfirmedAt(): Date | undefined;
    getConfirmedBy(): string | undefined;
    getCreatedBy(): string;
    getLastModifiedBy(): string | undefined;
    getCreatedAt(): Date;
    getUpdatedAt(): Date;
    /**
     * Reconstitute appointment from database (with UUID)
     * Used by repository when loading from persistence
     */
    static reconstitute(props: AppointmentProps, id: string): Appointment;
    /**
     * Create new appointment
     */
    static create(appointmentId: AppointmentId, tenantId: TenantId, patientId: string, doctorId: string, timeSlot: TimeSlot, durationMinutes: number, type: AppointmentType, priority: AppointmentPriority, details: AppointmentDetails, consultationFee: number, createdBy: string, roomId?: string, departmentId?: string, requiredEquipment?: string[]): Appointment;
    /**
     * Validate appointment creation
     */
    private static validateAppointmentCreation;
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
    confirm(confirmedBy: string, notes?: string): void;
    /**
     * Start appointment
     * Simplified flow: Doctor can start directly from CONFIRMED/SCHEDULED
     * No check-in step required for 3-role system (Patient, Doctor, Admin)
     */
    start(startTime?: Date): void;
    /**
     * Complete appointment
     * Simplified: Only allow from IN_PROGRESS (must start first)
     */
    complete(): void;
    /**
     * Cancel appointment
     */
    cancel(reason: string, cancelledBy: string): void;
    /**
     * Mark appointment as paid
     * Called by PaymentCompletedHandler after successful payment
     * Idempotent - safe to call multiple times
     */
    markAsPaid(): void;
    /**
     * Check if payment deadline has expired
     * Used by ExpireUnpaidAppointmentsUseCase to find expired appointments
     */
    isPaymentExpired(): boolean;
    /**
     * Mark as no-show
     */
    markAsNoShow(markedBy: string): void;
    /**
     * Transfer appointment to another doctor
     * Business method for changing doctor assignment
     */
    transfer(newDoctorId: string, reason: string, transferredBy: string): void;
    /**
     * Reschedule appointment
     */
    reschedule(newTimeSlot: TimeSlot, reason: string, rescheduledBy: string): void;
    /**
     * Mark appointment for reschedule due to conflicts
     */
    markForReschedule(reason: string, conflictDetails?: any): void;
    /**
     * Assign appointment to staff member
     */
    assignToStaff(staffId: string, assignedBy: string): void;
    get appointmentId(): AppointmentId;
    get patientId(): string;
    get doctorId(): string;
    get timeSlot(): TimeSlot;
    get durationMinutes(): number;
    get type(): AppointmentType;
    get priority(): AppointmentPriority;
    get status(): AppointmentStatus;
    get details(): AppointmentDetails;
    get consultationFee(): number;
    /**
     * Healthcare-specific: Contains PHI
     */
    containsPHI(): boolean;
    /**
     * Healthcare-specific: Get patient ID
     */
    getPatientId(): string | null;
    /**
     * Validate business invariants
     */
    protected validateBusinessInvariants(): void;
    /**
     * Apply domain event (for event sourcing)
     */
    protected applyEvent(event: DomainEvent): void;
    /**
     * Validate entity state (required by HealthcareAggregateRoot base class)
     */
    validate(): void;
    /**
     * Convert to persistence format (required by HealthcareAggregateRoot base class)
     * Note: This is a minimal stub. Use AppointmentMapper.toPersistence() for actual persistence.
     */
    toPersistence(): {
        id: string;
        appointment_id: string;
    };
}
//# sourceMappingURL=Appointment.aggregate.d.ts.map