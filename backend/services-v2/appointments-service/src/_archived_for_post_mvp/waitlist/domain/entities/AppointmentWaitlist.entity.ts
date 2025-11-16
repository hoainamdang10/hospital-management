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

import { Entity } from "@shared/domain/base/entity";
import crypto from "crypto";

// Enums
export enum WaitlistPriority {
  EMERGENCY = "EMERGENCY",
  URGENT = "URGENT",
  NORMAL = "NORMAL",
  LOW = "LOW",
}

export enum WaitlistStatus {
  WAITING = "WAITING", // In waitlist, waiting for slot
  MATCHED = "MATCHED", // Slot found, pending conversion
  CONVERTED = "CONVERTED", // Converted to appointment
  CANCELLED = "CANCELLED", // Cancelled by user
  EXPIRED = "EXPIRED", // Auto-expired
}

export enum PreferredContactMethod {
  SMS = "SMS",
  EMAIL = "EMAIL",
  PUSH = "PUSH",
  CALL = "CALL",
}

// Props Interface
export interface AppointmentWaitlistProps {
  waitlistId: string;
  patientId: string;

  // Preferences
  preferredDoctorId?: string;
  preferredDepartmentId?: string;
  preferredDate?: Date;
  preferredTimeSlot?: string; // "morning", "afternoon", "evening", or "14:00-15:00"
  appointmentType: string;

  // Priority & Status
  priority: WaitlistPriority;
  status: WaitlistStatus;

  // Additional Information
  notes?: string;
  reason?: string;

  // Flexibility
  isFlexibleDate: boolean;
  isFlexibleTime: boolean;
  isFlexibleDoctor: boolean;

  // Matching Information
  matchedAppointmentId?: string;
  matchedAt?: Date;
  matchedBy?: string;

  // Cancellation/Expiration
  cancelledAt?: Date;
  cancelledBy?: string;
  cancellationReason?: string;
  expiresAt?: Date;

  // Contact Information
  contactPhone?: string;
  contactEmail?: string;
  preferredContactMethod: PreferredContactMethod;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

/**
 * AppointmentWaitlist Entity
 */
export class AppointmentWaitlist extends Entity<AppointmentWaitlistProps> {
  private constructor(props: AppointmentWaitlistProps) {
    super(props);
  }

  /**
   * Create new waitlist entry
   */
  public static create(
    props: Omit<
      AppointmentWaitlistProps,
      "waitlistId" | "status" | "createdAt" | "updatedAt"
    >,
  ): AppointmentWaitlist {
    const now = new Date();

    return new AppointmentWaitlist({
      ...props,
      waitlistId: crypto.randomUUID(),
      status: WaitlistStatus.WAITING,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Reconstitute from database
   */
  public static reconstitute(
    props: AppointmentWaitlistProps,
  ): AppointmentWaitlist {
    return new AppointmentWaitlist(props);
  }

  // Getters
  get waitlistId(): string {
    return this.props.waitlistId;
  }
  get patientId(): string {
    return this.props.patientId;
  }
  get preferredDoctorId(): string | undefined {
    return this.props.preferredDoctorId;
  }
  get preferredDepartmentId(): string | undefined {
    return this.props.preferredDepartmentId;
  }
  get preferredDate(): Date | undefined {
    return this.props.preferredDate;
  }
  get preferredTimeSlot(): string | undefined {
    return this.props.preferredTimeSlot;
  }
  get appointmentType(): string {
    return this.props.appointmentType;
  }
  get priority(): WaitlistPriority {
    return this.props.priority;
  }
  get status(): WaitlistStatus {
    return this.props.status;
  }
  get notes(): string | undefined {
    return this.props.notes;
  }
  get reason(): string | undefined {
    return this.props.reason;
  }
  get isFlexibleDate(): boolean {
    return this.props.isFlexibleDate;
  }
  get isFlexibleTime(): boolean {
    return this.props.isFlexibleTime;
  }
  get isFlexibleDoctor(): boolean {
    return this.props.isFlexibleDoctor;
  }
  get matchedAppointmentId(): string | undefined {
    return this.props.matchedAppointmentId;
  }
  get matchedAt(): Date | undefined {
    return this.props.matchedAt;
  }
  get matchedBy(): string | undefined {
    return this.props.matchedBy;
  }
  get expiresAt(): Date | undefined {
    return this.props.expiresAt;
  }
  get contactPhone(): string | undefined {
    return this.props.contactPhone;
  }
  get contactEmail(): string | undefined {
    return this.props.contactEmail;
  }
  get preferredContactMethod(): PreferredContactMethod {
    return this.props.preferredContactMethod;
  }
  /**
   * Mark as matched with appointment slot
   */
  public markAsMatched(appointmentId: string, matchedBy: string): void {
    if (this.props.status !== WaitlistStatus.WAITING) {
      throw new Error("Can only match waitlist entries with WAITING status");
    }

    this.props.status = WaitlistStatus.MATCHED;
    this.props.matchedAppointmentId = appointmentId;
    this.props.matchedAt = new Date();
    this.props.matchedBy = matchedBy;
    this.props.updatedAt = new Date();
  }

  /**
   * Convert to appointment (final step)
   */
  public convertToAppointment(): void {
    if (this.props.status !== WaitlistStatus.MATCHED) {
      throw new Error("Can only convert MATCHED waitlist entries");
    }

    this.props.status = WaitlistStatus.CONVERTED;
    this.props.updatedAt = new Date();
  }

  /**
   * Cancel waitlist entry
   */
  public cancel(cancelledBy: string, reason?: string): void {
    if (this.props.status === WaitlistStatus.CONVERTED) {
      throw new Error("Cannot cancel already converted waitlist entry");
    }
    if (this.props.status === WaitlistStatus.CANCELLED) {
      throw new Error("Waitlist entry already cancelled");
    }

    this.props.status = WaitlistStatus.CANCELLED;
    this.props.cancelledAt = new Date();
    this.props.cancelledBy = cancelledBy;
    this.props.cancellationReason = reason;
    this.props.updatedAt = new Date();
  }

  /**
   * Mark as expired
   */
  public markAsExpired(): void {
    if (this.props.status !== WaitlistStatus.WAITING) {
      throw new Error("Can only expire WAITING entries");
    }

    this.props.status = WaitlistStatus.EXPIRED;
    this.props.updatedAt = new Date();
  }

  /**
   * Update preferences
   */
  public updatePreferences(updates: {
    preferredDate?: Date;
    preferredTimeSlot?: string;
    preferredDoctorId?: string;
    priority?: WaitlistPriority;
    notes?: string;
    isFlexibleDate?: boolean;
    isFlexibleTime?: boolean;
    isFlexibleDoctor?: boolean;
  }): void {
    if (this.props.status !== WaitlistStatus.WAITING) {
      throw new Error("Can only update WAITING entries");
    }

    if (updates.preferredDate !== undefined) {
      this.props.preferredDate = updates.preferredDate;
    }
    if (updates.preferredTimeSlot !== undefined) {
      this.props.preferredTimeSlot = updates.preferredTimeSlot;
    }
    if (updates.preferredDoctorId !== undefined) {
      this.props.preferredDoctorId = updates.preferredDoctorId;
    }
    if (updates.priority !== undefined) {
      this.props.priority = updates.priority;
    }
    if (updates.notes !== undefined) {
      this.props.notes = updates.notes;
    }
    if (updates.isFlexibleDate !== undefined) {
      this.props.isFlexibleDate = updates.isFlexibleDate;
    }
    if (updates.isFlexibleTime !== undefined) {
      this.props.isFlexibleTime = updates.isFlexibleTime;
    }
    if (updates.isFlexibleDoctor !== undefined) {
      this.props.isFlexibleDoctor = updates.isFlexibleDoctor;
    }

    this.props.updatedAt = new Date();
  }

  /**
   * Check if expired
   */
  public isExpired(): boolean {
    if (!this.props.expiresAt) {
      return false;
    }
    return new Date() > this.props.expiresAt;
  }

  /**
   * Check if can be matched
   */
  public canBeMatched(): boolean {
    return this.props.status === WaitlistStatus.WAITING && !this.isExpired();
  }

  public override validate(): void {
    if (!this.props.patientId) {
      throw new Error("Patient ID is required for waitlist entry");
    }
    if (!this.props.appointmentType) {
      throw new Error("Appointment type is required");
    }
  }

  public override toPersistence(): AppointmentWaitlistProps {
    return { ...this.props };
  }
}
