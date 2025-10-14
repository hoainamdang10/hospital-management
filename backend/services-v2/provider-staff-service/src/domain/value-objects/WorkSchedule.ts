/**
 * WorkSchedule Value Object
 * Vietnamese Healthcare Work Schedule
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards
 */

import { ValueObject } from '../../../shared/domain/base/value-object';

export interface WorkingHours {
  start: string; // '08:00'
  end: string; // '17:00'
}

interface WorkScheduleProps {
  workingDays: string[]; // ['monday', 'tuesday', ...]
  workingHours: WorkingHours;
  timeZone: string;
  isFlexible: boolean;
}

export class WorkSchedule extends ValueObject<WorkScheduleProps> {
  private static readonly VALID_DAYS = [
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
  ];

  private static readonly TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

  private constructor(props: WorkScheduleProps) {
    super(props);
  }

  protected validateFormat(): void {
    // Working days validation
    if (!this.props.workingDays || this.props.workingDays.length === 0) {
      throw new Error('Ngày làm việc không được để trống');
    }

    for (const day of this.props.workingDays) {
      if (!WorkSchedule.VALID_DAYS.includes(day.toLowerCase())) {
        throw new Error(`Ngày làm việc không hợp lệ: ${day}`);
      }
    }

    // Working hours validation
    if (!this.props.workingHours) {
      throw new Error('Giờ làm việc không được để trống');
    }

    if (!WorkSchedule.TIME_REGEX.test(this.props.workingHours.start)) {
      throw new Error('Giờ bắt đầu không đúng định dạng (HH:MM)');
    }

    if (!WorkSchedule.TIME_REGEX.test(this.props.workingHours.end)) {
      throw new Error('Giờ kết thúc không đúng định dạng (HH:MM)');
    }

    // Validate start time is before end time
    if (!this.isValidTimeRange(this.props.workingHours.start, this.props.workingHours.end)) {
      throw new Error('Giờ bắt đầu phải trước giờ kết thúc');
    }

    // Time zone validation
    if (!this.props.timeZone || this.props.timeZone.trim().length === 0) {
      throw new Error('Múi giờ không được để trống');
    }
  }

  public static create(props: WorkScheduleProps): WorkSchedule {
    return new WorkSchedule({
      ...props,
      workingDays: props.workingDays.map(d => d.toLowerCase()),
      timeZone: props.timeZone.trim()
    });
  }

  public static fromPersistence(data: any): WorkSchedule {
    return WorkSchedule.create({
      workingDays: data.working_days,
      workingHours: data.working_hours,
      timeZone: data.time_zone,
      isFlexible: data.is_flexible
    });
  }

  // Getters
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

  // Business methods
  public isWorkingDay(day: string): boolean {
    return this.props.workingDays.includes(day.toLowerCase());
  }

  public isWorkingTime(time: string): boolean {
    if (!WorkSchedule.TIME_REGEX.test(time)) {
      return false;
    }

    return this.isValidTimeRange(this.props.workingHours.start, time) &&
           this.isValidTimeRange(time, this.props.workingHours.end);
  }

  public getWorkingDaysCount(): number {
    return this.props.workingDays.length;
  }

  public getWorkingHoursPerDay(): number {
    const start = this.parseTime(this.props.workingHours.start);
    const end = this.parseTime(this.props.workingHours.end);
    
    return (end.hours - start.hours) + (end.minutes - start.minutes) / 60;
  }

  public getWorkingHoursPerWeek(): number {
    return this.getWorkingHoursPerDay() * this.getWorkingDaysCount();
  }

  public isFullTime(): boolean {
    // Full-time is typically 40+ hours per week
    return this.getWorkingHoursPerWeek() >= 40;
  }

  public isPartTime(): boolean {
    return !this.isFullTime();
  }

  public hasWeekendWork(): boolean {
    return this.isWorkingDay('saturday') || this.isWorkingDay('sunday');
  }

  public getWorkingDaysInVietnamese(): string[] {
    const vietnameseDays: Record<string, string> = {
      'monday': 'Thứ Hai',
      'tuesday': 'Thứ Ba',
      'wednesday': 'Thứ Tư',
      'thursday': 'Thứ Năm',
      'friday': 'Thứ Sáu',
      'saturday': 'Thứ Bảy',
      'sunday': 'Chủ Nhật'
    };

    return this.props.workingDays.map(day => vietnameseDays[day] || day);
  }

  public getScheduleSummary(): string {
    const days = this.getWorkingDaysInVietnamese().join(', ');
    const hours = `${this.props.workingHours.start} - ${this.props.workingHours.end}`;
    const hoursPerWeek = this.getWorkingHoursPerWeek();
    
    return `${days} | ${hours} (${hoursPerWeek}h/tuần)`;
  }

  // Update methods
  public updateWorkingDays(newDays: string[]): WorkSchedule {
    if (!newDays || newDays.length === 0) {
      throw new Error('Ngày làm việc không được để trống');
    }

    return WorkSchedule.create({
      ...this.props,
      workingDays: newDays
    });
  }

  public updateWorkingHours(newHours: WorkingHours): WorkSchedule {
    if (!WorkSchedule.TIME_REGEX.test(newHours.start)) {
      throw new Error('Giờ bắt đầu không đúng định dạng (HH:MM)');
    }

    if (!WorkSchedule.TIME_REGEX.test(newHours.end)) {
      throw new Error('Giờ kết thúc không đúng định dạng (HH:MM)');
    }

    if (!this.isValidTimeRange(newHours.start, newHours.end)) {
      throw new Error('Giờ bắt đầu phải trước giờ kết thúc');
    }

    return WorkSchedule.create({
      ...this.props,
      workingHours: newHours
    });
  }

  public setFlexible(flexible: boolean): WorkSchedule {
    return WorkSchedule.create({
      ...this.props,
      isFlexible: flexible
    });
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

  // Persistence
  public toPersistence(): any {
    return {
      working_days: this.props.workingDays,
      working_hours: this.props.workingHours,
      time_zone: this.props.timeZone,
      is_flexible: this.props.isFlexible
    };
  }

  public equals(other: WorkSchedule): boolean {
    if (!other) return false;
    
    return JSON.stringify(this.props.workingDays) === JSON.stringify(other.props.workingDays) &&
           this.props.workingHours.start === other.props.workingHours.start &&
           this.props.workingHours.end === other.props.workingHours.end &&
           this.props.timeZone === other.props.timeZone &&
           this.props.isFlexible === other.props.isFlexible;
  }

  public toString(): string {
    return this.getScheduleSummary();
  }
}

