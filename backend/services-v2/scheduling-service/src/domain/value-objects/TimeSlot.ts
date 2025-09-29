/**
 * Time Slot Value Object - Domain Layer
 * V2 Clean Architecture + DDD Implementation
 * Vietnamese healthcare time slot management
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards
 */

import { HealthcareValueObject } from "../../../shared/domain/base/value-object";

export enum TimeSlotStatus {
  AVAILABLE = "available",
  BOOKED = "booked",
  BLOCKED = "blocked",
  MAINTENANCE = "maintenance",
}

export enum DayOfWeek {
  SUNDAY = 0,
  MONDAY = 1,
  TUESDAY = 2,
  WEDNESDAY = 3,
  THURSDAY = 4,
  FRIDAY = 5,
  SATURDAY = 6,
}

export interface TimeSlotProps {
  startTime: Date;
  endTime: Date;
  status: TimeSlotStatus;
  providerId?: string;
  roomId?: string;
  appointmentId?: string;
  notes?: string;
  isRecurring: boolean;
  recurringPattern?: RecurringPattern;
}

export interface RecurringPattern {
  frequency: "daily" | "weekly" | "monthly";
  interval: number; // Every N days/weeks/months
  daysOfWeek?: DayOfWeek[]; // For weekly patterns
  endDate?: Date;
  maxOccurrences?: number;
}

/**
 * Time Slot Value Object
 * Represents a specific time period for appointments with Vietnamese healthcare rules
 */
export class TimeSlot extends HealthcareValueObject<TimeSlotProps> {
  private constructor(props: TimeSlotProps) {
    super(props);
  }

  /**
   * Create time slot with Vietnamese healthcare validation
   */
  public static create(
    startTime: Date,
    endTime: Date,
    status: TimeSlotStatus = TimeSlotStatus.AVAILABLE,
    providerId?: string,
    roomId?: string,
    isRecurring: boolean = false,
    recurringPattern?: RecurringPattern,
    notes?: string
  ): TimeSlot {
    return new TimeSlot({
      startTime,
      endTime,
      status,
      providerId,
      roomId,
      isRecurring,
      recurringPattern,
      notes,
    });
  }

  /**
   * Create from time strings with Vietnamese date format
   */
  public static createFromTimeStrings(
    date: Date,
    startTimeString: string, // "09:00"
    endTimeString: string, // "09:30"
    status: TimeSlotStatus = TimeSlotStatus.AVAILABLE,
    providerId?: string,
    roomId?: string
  ): TimeSlot {
    const startTime = TimeSlot.parseTimeString(date, startTimeString);
    const endTime = TimeSlot.parseTimeString(date, endTimeString);

    return new TimeSlot({
      startTime,
      endTime,
      status,
      providerId,
      roomId,
      isRecurring: false,
    });
  }

  // Getters
  public get startTime(): Date {
    return this.props.startTime;
  }

  public get endTime(): Date {
    return this.props.endTime;
  }

  public get status(): TimeSlotStatus {
    return this.props.status;
  }

  public get providerId(): string | undefined {
    return this.props.providerId;
  }

  public get roomId(): string | undefined {
    return this.props.roomId;
  }

  public get appointmentId(): string | undefined {
    return this.props.appointmentId;
  }

  public get notes(): string | undefined {
    return this.props.notes;
  }

  public get isRecurring(): boolean {
    return this.props.isRecurring;
  }

  public get recurringPattern(): RecurringPattern | undefined {
    return this.props.recurringPattern;
  }

  /**
   * Get duration in minutes
   */
  public getDurationMinutes(): number {
    return (
      (this.props.endTime.getTime() - this.props.startTime.getTime()) /
      (1000 * 60)
    );
  }

  /**
   * Get duration in hours
   */
  public getDurationHours(): number {
    return this.getDurationMinutes() / 60;
  }

  /**
   * Check if slot is available
   */
  public isAvailable(): boolean {
    return this.props.status === TimeSlotStatus.AVAILABLE;
  }

  /**
   * Check if slot is booked
   */
  public isBooked(): boolean {
    return this.props.status === TimeSlotStatus.BOOKED;
  }

  /**
   * Check if slot is blocked
   */
  public isBlocked(): boolean {
    return this.props.status === TimeSlotStatus.BLOCKED;
  }

  /**
   * Check if slot is in the past
   */
  public isPast(): boolean {
    return this.props.startTime < new Date();
  }

  /**
   * Check if slot is today
   */
  public isToday(): boolean {
    const today = new Date();
    const slotDate = this.props.startTime;

    return (
      today.getDate() === slotDate.getDate() &&
      today.getMonth() === slotDate.getMonth() &&
      today.getFullYear() === slotDate.getFullYear()
    );
  }

  /**
   * Check if slot is within business hours (8:00 - 17:00)
   */
  public isWithinBusinessHours(): boolean {
    const startHour = this.props.startTime.getHours();
    const endHour = this.props.endTime.getHours();

    return startHour >= 8 && endHour <= 17;
  }

  /**
   * Check if slot overlaps with another time slot
   */
  public overlapsWith(other: TimeSlot): boolean {
    return (
      this.props.startTime < other.endTime &&
      this.props.endTime > other.startTime
    );
  }

  /**
   * Check if slot is adjacent to another time slot
   */
  public isAdjacentTo(other: TimeSlot): boolean {
    return (
      this.props.endTime.getTime() === other.startTime.getTime() ||
      this.props.startTime.getTime() === other.endTime.getTime()
    );
  }

  /**
   * Book the slot
   */
  public book(appointmentId: string, notes?: string): TimeSlot {
    if (!this.isAvailable()) {
      throw new Error("Không thể đặt lịch cho slot không có sẵn");
    }

    if (this.isPast()) {
      throw new Error("Không thể đặt lịch cho thời gian đã qua");
    }

    return new TimeSlot({
      ...this.props,
      status: TimeSlotStatus.BOOKED,
      appointmentId,
      notes,
    });
  }

  /**
   * Cancel booking
   */
  public cancelBooking(): TimeSlot {
    if (!this.isBooked()) {
      throw new Error("Slot chưa được đặt lịch");
    }

    return new TimeSlot({
      ...this.props,
      status: TimeSlotStatus.AVAILABLE,
      appointmentId: undefined,
      notes: undefined,
    });
  }

  /**
   * Block the slot
   */
  public block(reason?: string): TimeSlot {
    return new TimeSlot({
      ...this.props,
      status: TimeSlotStatus.BLOCKED,
      notes: reason,
    });
  }

  /**
   * Unblock the slot
   */
  public unblock(): TimeSlot {
    if (this.props.status !== TimeSlotStatus.BLOCKED) {
      throw new Error("Slot không bị chặn");
    }

    return new TimeSlot({
      ...this.props,
      status: TimeSlotStatus.AVAILABLE,
      notes: undefined,
    });
  }

  /**
   * Get Vietnamese display for status
   */
  public getStatusDisplayName(): string {
    switch (this.props.status) {
      case TimeSlotStatus.AVAILABLE:
        return "Có sẵn";
      case TimeSlotStatus.BOOKED:
        return "Đã đặt";
      case TimeSlotStatus.BLOCKED:
        return "Bị chặn";
      case TimeSlotStatus.MAINTENANCE:
        return "Bảo trì";
      default:
        return "Không xác định";
    }
  }

  /**
   * Format time for Vietnamese display
   */
  public getTimeDisplayString(): string {
    const startTime = this.props.startTime.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const endTime = this.props.endTime.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });

    return `${startTime} - ${endTime}`;
  }

  /**
   * Parse time string to Date
   */
  private static parseTimeString(date: Date, timeString: string): Date {
    const [hours, minutes] = timeString.split(":").map(Number);
    const result = new Date(date);
    result.setHours(hours, minutes, 0, 0);
    return result;
  }

  protected validateFormat(): void {
    if (!this.props.startTime || !this.props.endTime) {
      throw new Error("Thời gian bắt đầu và kết thúc không được để trống");
    }

    if (this.props.startTime >= this.props.endTime) {
      throw new Error("Thời gian bắt đầu phải trước thời gian kết thúc");
    }

    // Validate minimum duration (5 minutes)
    if (this.getDurationMinutes() < 5) {
      throw new Error("Thời gian slot tối thiểu là 5 phút");
    }

    // Validate maximum duration (8 hours)
    if (this.getDurationMinutes() > 480) {
      throw new Error("Thời gian slot tối đa là 8 giờ");
    }

    if (this.props.isRecurring && !this.props.recurringPattern) {
      throw new Error("Slot lặp lại phải có pattern");
    }
  }

  /**
   * Healthcare-specific: Check if contains PHI
   */
  containsPHI(): boolean {
    return false; // Time slot itself doesn't contain PHI
  }

  /**
   * Create anonymized version for logging/audit
   */
  public anonymize(): TimeSlot {
    return new TimeSlot({
      ...this.props,
      appointmentId: this.props.appointmentId
        ? "MASKED-APPOINTMENT-ID"
        : undefined,
      notes: this.props.notes ? "Ghi chú đã ẩn" : undefined,
    });
  }

  public isValid(): boolean {
    try {
      this.validateFormat();
      return true;
    } catch {
      return false;
    }
  }
}
