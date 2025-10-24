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
export declare enum AppointmentType {
    CONSULTATION = "consultation",
    FOLLOW_UP = "follow_up",
    EMERGENCY = "emergency",
    TELEMEDICINE = "telemedicine",
    SURGERY = "surgery",
    PROCEDURE = "procedure"
}
export declare enum AppointmentPriority {
    ROUTINE = "routine",
    URGENT = "urgent",
    EMERGENCY = "emergency",
    STAT = "stat"
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
export declare enum PaymentStatus {
    PENDING = "pending",
    PAID = "paid",
    PARTIALLY_PAID = "partially_paid",
    REFUNDED = "refunded",
    CANCELLED = "cancelled"
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
export declare class Appointment extends HealthcareAggregateRoot<AppointmentProps> {
    private constructor();
    get id(): string;
    getAppointmentId(): AppointmentId;
    getDoctorId(): string;
    getTimeSlot(): TimeSlot;
    getDurationMinutes(): number;
    getType(): AppointmentType;
    getPriority(): AppointmentPriority;
    getStatus(): AppointmentStatus;
    getDetails(): AppointmentDetails;
    getRoomId(): string | undefined;
    getDepartmentId(): string | undefined;
    getRequiredEquipment(): string[] | undefined;
    getConsultationFee(): number;
    getAdditionalFees(): number | undefined;
    getPaymentStatus(): PaymentStatus;
    getPaymentMethod(): string | undefined;
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
     * Create new appointment
     */
    static create(appointmentId: AppointmentId, patientId: string, doctorId: string, timeSlot: TimeSlot, durationMinutes: number, type: AppointmentType, priority: AppointmentPriority, details: AppointmentDetails, consultationFee: number, createdBy: string, roomId?: string, departmentId?: string, requiredEquipment?: string[]): Appointment;
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
    checkIn(): void;
    /**
     * Start appointment
     */
    start(): void;
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
    markAsNoShow(): void;
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
    get paymentStatus(): PaymentStatus;
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