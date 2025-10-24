/**
 * ProviderSchedule Value Object
 * Cached work schedule template from Provider Staff Service
 * 
 * Bounded Context: Appointments Service
 * - Owns runtime availability calculation
 * - Caches work schedule templates via StaffScheduleUpdatedEvent
 * - Provider Staff Service owns the source of truth for work schedules
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Bounded Context Separation
 */

export interface WorkingHours {
  start: string; // '08:00'
  end: string; // '17:00'
}

export interface ProviderScheduleProps {
  providerId: string;
  workingDays: string[]; // ['monday', 'tuesday', ...]
  workingHours: WorkingHours;
  timeZone: string;
  isFlexible: boolean;
  effectiveDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * ProviderSchedule Value Object
 * Represents a cached work schedule template for a provider
 */
export class ProviderSchedule {
  private constructor(private readonly props: ProviderScheduleProps) {
    this.validate();
  }

  /**
   * Create new ProviderSchedule
   */
  public static create(props: Omit<ProviderScheduleProps, 'createdAt' | 'updatedAt'>): ProviderSchedule {
    const now = new Date();
    return new ProviderSchedule({
      ...props,
      createdAt: now,
      updatedAt: now
    });
  }

  /**
   * Reconstitute from persistence
   */
  public static fromPersistence(data: any): ProviderSchedule {
    return new ProviderSchedule({
      providerId: data.provider_id,
      workingDays: data.working_days,
      workingHours: data.working_hours,
      timeZone: data.time_zone,
      isFlexible: data.is_flexible,
      effectiveDate: data.effective_date ? new Date(data.effective_date) : undefined,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    });
  }

  /**
   * Validate schedule
   */
  private validate(): void {
    if (!this.props.providerId || this.props.providerId.trim().length === 0) {
      throw new Error('Provider ID không được để trống');
    }

    if (!this.props.workingDays || this.props.workingDays.length === 0) {
      throw new Error('Ngày làm việc không được để trống');
    }

    if (!this.props.workingHours) {
      throw new Error('Giờ làm việc không được để trống');
    }

    if (!this.props.timeZone || this.props.timeZone.trim().length === 0) {
      throw new Error('Múi giờ không được để trống');
    }
  }

  // Getters
  public get providerId(): string {
    return this.props.providerId;
  }

  public get workingDays(): string[] {
    return [...this.props.workingDays];
  }

  public get workingHours(): WorkingHours {
    return { ...this.props.workingHours };
  }

  public get timeZone(): string {
    return this.props.timeZone;
  }

  public get isFlexible(): boolean {
    return this.props.isFlexible;
  }

  public get effectiveDate(): Date | undefined {
    return this.props.effectiveDate;
  }

  public get createdAt(): Date {
    return this.props.createdAt;
  }

  public get updatedAt(): Date {
    return this.props.updatedAt;
  }

  /**
   * Check if provider works on a specific day
   */
  public isWorkingDay(day: string): boolean {
    return this.props.workingDays.includes(day.toLowerCase());
  }

  /**
   * Check if a time is within working hours
   */
  public isWorkingTime(time: string): boolean {
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(time)) {
      return false;
    }

    return this.isValidTimeRange(this.props.workingHours.start, time) &&
           this.isValidTimeRange(time, this.props.workingHours.end);
  }

  /**
   * Get working hours per day
   */
  public getWorkingHoursPerDay(): number {
    const start = this.parseTime(this.props.workingHours.start);
    const end = this.parseTime(this.props.workingHours.end);
    
    return (end.hours - start.hours) + (end.minutes - start.minutes) / 60;
  }

  /**
   * Get working hours per week
   */
  public getWorkingHoursPerWeek(): number {
    return this.getWorkingHoursPerDay() * this.props.workingDays.length;
  }

  /**
   * Check if schedule is full-time (40+ hours/week)
   */
  public isFullTime(): boolean {
    return this.getWorkingHoursPerWeek() >= 40;
  }

  /**
   * Check if schedule includes weekend work
   */
  public hasWeekendWork(): boolean {
    return this.isWorkingDay('saturday') || this.isWorkingDay('sunday');
  }

  /**
   * Update schedule (returns new instance - immutable)
   */
  public update(updates: Partial<Omit<ProviderScheduleProps, 'providerId' | 'createdAt' | 'updatedAt'>>): ProviderSchedule {
    return new ProviderSchedule({
      ...this.props,
      ...updates,
      updatedAt: new Date()
    });
  }

  /**
   * Convert to persistence format
   */
  public toPersistence(): any {
    return {
      provider_id: this.props.providerId,
      working_days: this.props.workingDays,
      working_hours: this.props.workingHours,
      time_zone: this.props.timeZone,
      is_flexible: this.props.isFlexible,
      effective_date: this.props.effectiveDate?.toISOString(),
      created_at: this.props.createdAt.toISOString(),
      updated_at: this.props.updatedAt.toISOString()
    };
  }

  // Helper methods
  private isValidTimeRange(startTime: string, endTime: string): boolean {
    const start = this.parseTime(startTime);
    const end = this.parseTime(endTime);
    
    if (start.hours > end.hours) {
      return false;
    }
    
    if (start.hours === end.hours && start.minutes >= end.minutes) {
      return false;
    }
    
    return true;
  }

  private parseTime(time: string): { hours: number; minutes: number } {
    const [hours, minutes] = time.split(':').map(Number);
    return { hours, minutes };
  }

  /**
   * Equality check
   */
  public equals(other: ProviderSchedule): boolean {
    if (!other) return false;
    
    return this.props.providerId === other.props.providerId &&
           JSON.stringify(this.props.workingDays) === JSON.stringify(other.props.workingDays) &&
           this.props.workingHours.start === other.props.workingHours.start &&
           this.props.workingHours.end === other.props.workingHours.end &&
           this.props.timeZone === other.props.timeZone &&
           this.props.isFlexible === other.props.isFlexible;
  }

  /**
   * String representation
   */
  public toString(): string {
    const days = this.props.workingDays.join(', ');
    const hours = `${this.props.workingHours.start} - ${this.props.workingHours.end}`;
    return `Provider ${this.props.providerId}: ${days} | ${hours} (${this.getWorkingHoursPerWeek()}h/week)`;
  }
}
