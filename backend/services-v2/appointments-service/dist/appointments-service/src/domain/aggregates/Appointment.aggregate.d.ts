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
    PROCEDURE = "procedure"
}
export declare enum AppointmentPriority {
    LOW = "low",
    NORMAL = "normal",
    URGENT = "urgent",
    EMERGENCY = "emergency"
}
export declare enum AppointmentStatus {
    SCHEDULED = "scheduled",
    CONFIRMED = "confirmed",
    ARRIVED = "arrived",
    IN_PROGRESS = "in_progress",
    COMPLETED = "completed",
    CANCELLED = "cancelled",
    NO_SHOW = "no_show"
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
    version: number;
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
    getCheckedInAt(): Date | undefined;
    getStartedAt(): Date | undefined;
    getCompletedAt(): Date | undefined;
    getCancelledAt(): Date | undefined;
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
     * Confirm appointment
     */
    confirm(confirmedBy: string): void;
    /**
     * Check in patient
     */
    checkIn(checkInTime?: Date): void;
    /**
     * Start appointment
     */
    start(startTime?: Date): void;
    /**
     * Complete appointment
     */
    complete(): void;
    /**
     * Cancel appointment
     */
    cancel(reason: string, cancelledBy: string): void;
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