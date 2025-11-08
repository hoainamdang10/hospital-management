/**
 * AppointmentWaitlist Entity - Domain Layer
 * Represents a patient waiting for an appointment slot
 *
 * CONTEXT:
 * Waitlist is different from Queue:
 * - Queue: Same-day waiting (patients checked in, waiting to see doctor)
 * - Waitlist: Future appointment waiting (patients waiting for available slots)
 *
 * USE CASES:
 * - No available slots for preferred date/time
 * - Patient flexible with date/time/doctor
 * - Automatic matching when slots become available
 * - Priority-based slot allocation
 *
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards
 */
import { Entity } from "../../../../shared/domain/base/entity";
export declare enum WaitlistPriority {
    EMERGENCY = "EMERGENCY",
    URGENT = "URGENT",
    NORMAL = "NORMAL",
    LOW = "LOW"
}
export declare enum WaitlistStatus {
    WAITING = "WAITING",// In waitlist, waiting for slot
    MATCHED = "MATCHED",// Slot found, pending conversion
    CONVERTED = "CONVERTED",// Converted to appointment
    CANCELLED = "CANCELLED",// Cancelled by user
    EXPIRED = "EXPIRED"
}
export declare enum PreferredContactMethod {
    SMS = "SMS",
    EMAIL = "EMAIL",
    PUSH = "PUSH",
    CALL = "CALL"
}
export interface AppointmentWaitlistProps {
    waitlistId: string;
    patientId: string;
    preferredDoctorId?: string;
    preferredDepartmentId?: string;
    preferredDate?: Date;
    preferredTimeSlot?: string;
    appointmentType: string;
    priority: WaitlistPriority;
    status: WaitlistStatus;
    notes?: string;
    reason?: string;
    isFlexibleDate: boolean;
    isFlexibleTime: boolean;
    isFlexibleDoctor: boolean;
    matchedAppointmentId?: string;
    matchedAt?: Date;
    matchedBy?: string;
    cancelledAt?: Date;
    cancelledBy?: string;
    cancellationReason?: string;
    expiresAt?: Date;
    contactPhone?: string;
    contactEmail?: string;
    preferredContactMethod: PreferredContactMethod;
    createdAt: Date;
    updatedAt: Date;
    createdBy?: string;
}
/**
 * AppointmentWaitlist Entity
 */
export declare class AppointmentWaitlist extends Entity<AppointmentWaitlistProps> {
    private constructor();
    /**
     * Create new waitlist entry
     */
    static create(props: Omit<AppointmentWaitlistProps, "waitlistId" | "status" | "createdAt" | "updatedAt">): AppointmentWaitlist;
    /**
     * Reconstitute from database
     */
    static reconstitute(props: AppointmentWaitlistProps): AppointmentWaitlist;
    get waitlistId(): string;
    get patientId(): string;
    get preferredDoctorId(): string | undefined;
    get preferredDepartmentId(): string | undefined;
    get preferredDate(): Date | undefined;
    get preferredTimeSlot(): string | undefined;
    get appointmentType(): string;
    get priority(): WaitlistPriority;
    get status(): WaitlistStatus;
    get notes(): string | undefined;
    get reason(): string | undefined;
    get isFlexibleDate(): boolean;
    get isFlexibleTime(): boolean;
    get isFlexibleDoctor(): boolean;
    get matchedAppointmentId(): string | undefined;
    get matchedAt(): Date | undefined;
    get matchedBy(): string | undefined;
    get expiresAt(): Date | undefined;
    get contactPhone(): string | undefined;
    get contactEmail(): string | undefined;
    get preferredContactMethod(): PreferredContactMethod;
    /**
     * Mark as matched with appointment slot
     */
    markAsMatched(appointmentId: string, matchedBy: string): void;
    /**
     * Convert to appointment (final step)
     */
    convertToAppointment(): void;
    /**
     * Cancel waitlist entry
     */
    cancel(cancelledBy: string, reason?: string): void;
    /**
     * Mark as expired
     */
    markAsExpired(): void;
    /**
     * Update preferences
     */
    updatePreferences(updates: {
        preferredDate?: Date;
        preferredTimeSlot?: string;
        preferredDoctorId?: string;
        priority?: WaitlistPriority;
        notes?: string;
        isFlexibleDate?: boolean;
        isFlexibleTime?: boolean;
        isFlexibleDoctor?: boolean;
    }): void;
    /**
     * Check if expired
     */
    isExpired(): boolean;
    /**
     * Check if can be matched
     */
    canBeMatched(): boolean;
    validate(): void;
    toPersistence(): AppointmentWaitlistProps;
}
//# sourceMappingURL=AppointmentWaitlist.entity.d.ts.map