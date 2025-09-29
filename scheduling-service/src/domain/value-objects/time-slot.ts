/**
 * Time Slot Value Object - Domain Layer
 * Healthcare appointment time slot with Vietnamese healthcare standards
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Vietnamese Healthcare Standards, Time Management
 */

import { HealthcareValueObject } from '../../../shared/domain/base/entity';

export enum TimeSlotStatus {
  AVAILABLE = 'available',
  BOOKED = 'booked',
  BLOCKED = 'blocked',
  MAINTENANCE = 'maintenance',
  EMERGENCY_RESERVED = 'emergency_reserved'
}

export enum DayOfWeek {
  SUNDAY = 0,
  MONDAY = 1,
  TUESDAY = 2,
  WEDNESDAY = 3,
  THURSDAY = 4,
  FRIDAY = 5,
  SATURDAY = 6
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
  frequency: 'daily' | 'weekly' | 'monthly';
  interval: number; // Every N days/weeks/months
  daysOfWeek?: DayOfWeek[]; // For weekly patterns
  endDate?: Date;
  maxOccurrences?: number;
}

/**
 * Time Slot Value Object
 * Represents a specific time period for appointments
 */
export class TimeSlot extends HealthcareValueObject<TimeSlotProps> {
  
  private constructor(props: TimeSlotProps) {
    super(props);
  }

  /**
   * Create time slot
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
      notes
    });
  }

  /**
   * Create from time strings
   */
  public static createFromTimeStrings(
    date: Date,
    startTimeString: string, // "09:00"
    endTimeString: string,   // "09:30"
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
      isRecurring: false
    });
  }

  /**
   * Getters
   */
  get startTime(): Date {
    return this.props.startTime;
  }

  get endTime(): Date {
    return this.props.endTime;
  }

  get status(): TimeSlotStatus {
    return this.props.status;
  }

  get providerId(): string | undefined {
    return this.props.providerId;
  }

  get roomId(): string | undefined {
    return this.props.roomId;
  }

  get appointmentId(): string | undefined {
    return this.props.appointmentId;
  }

  get notes(): string | undefined {
    return this.props.notes;
  }

  get isRecurring(): boolean {
    return this.props.isRecurring;
  }

  get recurringPattern(): RecurringPattern | undefined {
    return this.props.recurringPattern;
  }

  /**
   * Business methods
   */

  /**
   * Get duration in minutes
   */
  getDurationMinutes(): number {
    return Math.floor((this.props.endTime.getTime() - this.props.startTime.getTime()) / (1000 * 60));
  }

  /**
   * Get duration in hours
   */
  getDurationHours(): number {
    return this.getDurationMinutes() / 60;
  }

  /**
   * Check if slot is available
   */
  isAvailable(): boolean {
    return this.props.status === TimeSlotStatus.AVAILABLE;
  }

  /**
   * Check if slot is booked
   */
  isBooked(): boolean {
    return this.props.status === TimeSlotStatus.BOOKED;
  }

  /**
   * Check if slot is blocked
   */
  isBlocked(): boolean {
    return this.props.status === TimeSlotStatus.BLOCKED ||
           this.props.status === TimeSlotStatus.MAINTENANCE;
  }

  /**
   * Check if slot is in the past
   */
  isPast(): boolean {
    return this.props.startTime < new Date();
  }

  /**
   * Check if slot is today
   */
  isToday(): boolean {
    const today = new Date();
    const slotDate = this.props.startTime;
    
    return today.getDate() === slotDate.getDate() &&
           today.getMonth() === slotDate.getMonth() &&
           today.getFullYear() === slotDate.getFullYear();
  }

  /**
   * Check if slot is within business hours
   */
  isWithinBusinessHours(): boolean {
    const hour = this.props.startTime.getHours();
    const dayOfWeek = this.props.startTime.getDay();
    
    // Vietnamese healthcare business hours: 7:00 - 17:00 weekdays, 7:00 - 12:00 Saturday
    if (dayOfWeek === DayOfWeek.SUNDAY) {
      return false; // No regular appointments on Sunday
    }
    
    if (dayOfWeek === DayOfWeek.SATURDAY) {
      return hour >= 7 && hour < 12;
    }
    
    // Monday to Friday
    return hour >= 7 && hour < 17;
  }

  /**
   * Check if slot overlaps with another slot
   */
  overlapsWith(other: TimeSlot): boolean {
    return this.props.startTime < other.props.endTime &&
           this.props.endTime > other.props.startTime;
  }

  /**
   * Check if slot is adjacent to another slot
   */
  isAdjacentTo(other: TimeSlot): boolean {
    return this.props.endTime.getTime() === other.props.startTime.getTime() ||
           this.props.startTime.getTime() === other.props.endTime.getTime();
  }

  /**
   * Check if slot can be merged with another slot
   */
  canMergeWith(other: TimeSlot): boolean {
    return this.isAdjacentTo(other) &&
           this.props.status === other.props.status &&
           this.props.providerId === other.props.providerId &&
           this.props.roomId === other.props.roomId;
  }

  /**
   * Book the slot
   */
  book(appointmentId: string, notes?: string): TimeSlot {
    if (!this.isAvailable()) {
      throw new Error('Không thể đặt lịch cho slot không có sẵn');
    }

    if (this.isPast()) {
      throw new Error('Không thể đặt lịch cho thời gian đã qua');
    }

    return new TimeSlot({
      ...this.props,
      status: TimeSlotStatus.BOOKED,
      appointmentId,
      notes
    });
  }

  /**
   * Cancel booking
   */
  cancelBooking(): TimeSlot {
    if (!this.isBooked()) {
      throw new Error('Slot chưa được đặt lịch');
    }

    return new TimeSlot({
      ...this.props,
      status: TimeSlotStatus.AVAILABLE,
      appointmentId: undefined,
      notes: undefined
    });
  }

  /**
   * Block the slot
   */
  block(reason?: string): TimeSlot {
    return new TimeSlot({
      ...this.props,
      status: TimeSlotStatus.BLOCKED,
      notes: reason
    });
  }

  /**
   * Unblock the slot
   */
  unblock(): TimeSlot {
    if (this.props.status !== TimeSlotStatus.BLOCKED) {
      throw new Error('Slot không bị chặn');
    }

    return new TimeSlot({
      ...this.props,
      status: TimeSlotStatus.AVAILABLE,
      notes: undefined
    });
  }

  /**
   * Reserve for emergency
   */
  reserveForEmergency(): TimeSlot {
    return new TimeSlot({
      ...this.props,
      status: TimeSlotStatus.EMERGENCY_RESERVED
    });
  }

  /**
   * Get time slot display string
   */
  getDisplayString(): string {
    const startTime = this.formatTime(this.props.startTime);
    const endTime = this.formatTime(this.props.endTime);
    const date = this.formatDate(this.props.startTime);
    
    return `${date} ${startTime} - ${endTime}`;
  }

  /**
   * Get status in Vietnamese
   */
  getStatusVietnamese(): string {
    const statusMap = {
      [TimeSlotStatus.AVAILABLE]: 'Có sẵn',
      [TimeSlotStatus.BOOKED]: 'Đã đặt',
      [TimeSlotStatus.BLOCKED]: 'Bị chặn',
      [TimeSlotStatus.MAINTENANCE]: 'Bảo trì',
      [TimeSlotStatus.EMERGENCY_RESERVED]: 'Dành cho cấp cứu'
    };

    return statusMap[this.props.status] || this.props.status;
  }

  /**
   * Get day of week in Vietnamese
   */
  getDayOfWeekVietnamese(): string {
    const dayNames = {
      [DayOfWeek.SUNDAY]: 'Chủ nhật',
      [DayOfWeek.MONDAY]: 'Thứ hai',
      [DayOfWeek.TUESDAY]: 'Thứ ba',
      [DayOfWeek.WEDNESDAY]: 'Thứ tư',
      [DayOfWeek.THURSDAY]: 'Thứ năm',
      [DayOfWeek.FRIDAY]: 'Thứ sáu',
      [DayOfWeek.SATURDAY]: 'Thứ bảy'
    };

    return dayNames[this.props.startTime.getDay()] || 'Không xác định';
  }

  /**
   * Generate recurring slots
   */
  generateRecurringSlots(endDate: Date): TimeSlot[] {
    if (!this.props.isRecurring || !this.props.recurringPattern) {
      return [this];
    }

    const slots: TimeSlot[] = [];
    const pattern = this.props.recurringPattern;
    let currentDate = new Date(this.props.startTime);
    let occurrenceCount = 0;

    while (currentDate <= endDate) {
      if (pattern.maxOccurrences && occurrenceCount >= pattern.maxOccurrences) {
        break;
      }

      if (pattern.endDate && currentDate > pattern.endDate) {
        break;
      }

      // Check if current date matches pattern
      if (this.matchesRecurringPattern(currentDate, pattern)) {
        const slotStartTime = new Date(currentDate);
        slotStartTime.setHours(this.props.startTime.getHours());
        slotStartTime.setMinutes(this.props.startTime.getMinutes());

        const slotEndTime = new Date(currentDate);
        slotEndTime.setHours(this.props.endTime.getHours());
        slotEndTime.setMinutes(this.props.endTime.getMinutes());

        const slot = new TimeSlot({
          ...this.props,
          startTime: slotStartTime,
          endTime: slotEndTime,
          isRecurring: false // Individual slots are not recurring
        });

        slots.push(slot);
        occurrenceCount++;
      }

      // Move to next date based on frequency
      currentDate = this.getNextDate(currentDate, pattern);
    }

    return slots;
  }

  /**
   * Private helper methods
   */

  private static parseTimeString(date: Date, timeString: string): Date {
    const [hours, minutes] = timeString.split(':').map(Number);
    const result = new Date(date);
    result.setHours(hours, minutes, 0, 0);
    return result;
  }

  private formatTime(date: Date): string {
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  }

  private formatDate(date: Date): string {
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  }

  private matchesRecurringPattern(date: Date, pattern: RecurringPattern): boolean {
    if (pattern.frequency === 'weekly' && pattern.daysOfWeek) {
      return pattern.daysOfWeek.includes(date.getDay() as DayOfWeek);
    }

    // For daily and monthly patterns, would need more complex logic
    return true;
  }

  private getNextDate(currentDate: Date, pattern: RecurringPattern): Date {
    const nextDate = new Date(currentDate);

    switch (pattern.frequency) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + pattern.interval);
        break;
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + (7 * pattern.interval));
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + pattern.interval);
        break;
    }

    return nextDate;
  }

  /**
   * Validate format
   */
  protected validateFormat(): void {
    if (!this.props.startTime || !this.props.endTime) {
      throw new Error('Thời gian bắt đầu và kết thúc không được để trống');
    }

    if (this.props.startTime >= this.props.endTime) {
      throw new Error('Thời gian bắt đầu phải trước thời gian kết thúc');
    }

    // Validate minimum duration (5 minutes)
    if (this.getDurationMinutes() < 5) {
      throw new Error('Thời gian slot tối thiểu là 5 phút');
    }

    // Validate maximum duration (8 hours)
    if (this.getDurationMinutes() > 480) {
      throw new Error('Thời gian slot tối đa là 8 giờ');
    }

    if (this.props.isRecurring && !this.props.recurringPattern) {
      throw new Error('Slot lặp lại phải có pattern');
    }
  }

  /**
   * Contains PHI - Time slot may contain PHI in notes
   */
  containsPHI(): boolean {
    return !!this.props.notes; // Notes might contain PHI
  }

  /**
   * String representation
   */
  toString(): string {
    return this.getDisplayString();
  }
}
