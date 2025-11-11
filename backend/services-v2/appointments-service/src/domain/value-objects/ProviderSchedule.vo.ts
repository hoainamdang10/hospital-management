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
  workingHours: WorkingHours | WorkingHours[]; // Support both single and multiple time ranges
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
    // Normalize working_hours: convert array to array, keep object as-is
    let workingHours: WorkingHours | WorkingHours[] = data.working_hours;
    
    // If working_hours is an array of time ranges, keep it as array
    // If it's a single object, keep it as object
    if (Array.isArray(data.working_hours)) {
      workingHours = data.working_hours as WorkingHours[];
    } else {
      workingHours = data.working_hours as WorkingHours;
    }
    
    return new ProviderSchedule({
      providerId: data.provider_id,
      workingDays: data.working_days,
      workingHours: workingHours,
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

  public get workingHours(): WorkingHours | WorkingHours[] {
    if (Array.isArray(this.props.workingHours)) {
      return [...this.props.workingHours];
    }
    return { ...this.props.workingHours as WorkingHours };
  }
  
  /**
   * Get all working hour ranges as an array (normalized)
   */
  public getWorkingHourRanges(): WorkingHours[] {
    if (Array.isArray(this.props.workingHours)) {
      return this.props.workingHours;
    }
    return [this.props.workingHours as WorkingHours];
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
   * Supports both lowercase ('monday') and uppercase ('MONDAY') formats
   */
  public isWorkingDay(day: string): boolean {
    const dayLower = day.toLowerCase();
    const dayUpper = day.toUpperCase();
    return this.props.workingDays.some(d => 
      d.toLowerCase() === dayLower || d.toUpperCase() === dayUpper
    );
  }

  /**
   * Check if a time is within working hours (any time range)
   */
  public isWorkingTime(time: string): boolean {
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(time)) {
      return false;
    }

    // Check if time falls within any of the working hour ranges
    const ranges = this.getWorkingHourRanges();
    return ranges.some(range => 
      this.isValidTimeRange(range.start, time) &&
      this.isValidTimeRange(time, range.end)
    );
  }

  /**
   * Get working hours per day (sum of all time ranges)
   */
  public getWorkingHoursPerDay(): number {
    const ranges = this.getWorkingHourRanges();
    return ranges.reduce((total, range) => {
      const start = this.parseTime(range.start);
      const end = this.parseTime(range.end);
      return total + (end.hours - start.hours) + (end.minutes - start.minutes) / 60;
    }, 0);
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
           JSON.stringify(this.props.workingHours) === JSON.stringify(other.props.workingHours) &&
           this.props.timeZone === other.props.timeZone &&
           this.props.isFlexible === other.props.isFlexible;
  }

  /**
   * String representation
   */
  public toString(): string {
    const days = this.props.workingDays.join(', ');
    const ranges = this.getWorkingHourRanges();
    const hours = ranges.map(r => `${r.start}-${r.end}`).join(', ');
    return `Provider ${this.props.providerId}: ${days} | ${hours} (${this.getWorkingHoursPerWeek()}h/week)`;
  }
}
