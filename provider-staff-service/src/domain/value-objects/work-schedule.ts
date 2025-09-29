/**
 * Work Schedule Value Object - Domain Layer
 * Healthcare provider work schedule with shift patterns
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Healthcare Work Regulations, Vietnamese Labor Law
 */

import { HealthcareValueObject } from '../../../shared/domain/base/entity';

export interface WorkScheduleProps {
  shifts: Shift[];
  weeklyHours: number;
  overtimeHours: number;
  onCallSchedule: OnCallSchedule[];
  vacationDays: VacationPeriod[];
  emergencyAvailability: boolean;
  nightShiftCapable: boolean;
  weekendAvailability: boolean;
}

export interface Shift {
  id: string;
  dayOfWeek: DayOfWeek;
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  shiftType: ShiftType;
  department: string;
  isRecurring: boolean;
  effectiveDate: Date;
  endDate?: Date;
}

export interface OnCallSchedule {
  startDateTime: Date;
  endDateTime: Date;
  priority: OnCallPriority;
  contactMethod: string;
  backupProvider?: string;
}

export interface VacationPeriod {
  startDate: Date;
  endDate: Date;
  type: VacationType;
  status: VacationStatus;
  approvedBy?: string;
  reason?: string;
}

export enum DayOfWeek {
  MONDAY = 1,
  TUESDAY = 2,
  WEDNESDAY = 3,
  THURSDAY = 4,
  FRIDAY = 5,
  SATURDAY = 6,
  SUNDAY = 0
}

export enum ShiftType {
  MORNING = 'morning',      // 7:00 - 15:00
  AFTERNOON = 'afternoon',  // 15:00 - 23:00
  NIGHT = 'night',         // 23:00 - 7:00
  FULL_DAY = 'full_day',   // 7:00 - 19:00
  ON_CALL = 'on_call',     // 24/7 availability
  EMERGENCY = 'emergency'   // Emergency coverage
}

export enum OnCallPriority {
  PRIMARY = 'primary',
  SECONDARY = 'secondary',
  BACKUP = 'backup'
}

export enum VacationType {
  ANNUAL_LEAVE = 'annual_leave',
  SICK_LEAVE = 'sick_leave',
  MATERNITY_LEAVE = 'maternity_leave',
  PATERNITY_LEAVE = 'paternity_leave',
  STUDY_LEAVE = 'study_leave',
  EMERGENCY_LEAVE = 'emergency_leave'
}

export enum VacationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled'
}

/**
 * Work Schedule Value Object
 * Manages healthcare provider work schedules and availability
 */
export class WorkSchedule extends HealthcareValueObject<WorkScheduleProps> {
  private constructor(props: WorkScheduleProps) {
    super(props);
  }

  /**
   * Create Work Schedule
   */
  public static create(
    shifts: Shift[],
    emergencyAvailability: boolean = false,
    nightShiftCapable: boolean = false,
    weekendAvailability: boolean = false,
    onCallSchedule: OnCallSchedule[] = [],
    vacationDays: VacationPeriod[] = []
  ): WorkSchedule {
    const weeklyHours = WorkSchedule.calculateWeeklyHours(shifts);
    const overtimeHours = Math.max(0, weeklyHours - 40); // Standard 40-hour work week

    return new WorkSchedule({
      shifts,
      weeklyHours,
      overtimeHours,
      onCallSchedule,
      vacationDays,
      emergencyAvailability,
      nightShiftCapable,
      weekendAvailability
    });
  }

  /**
   * Getters
   */
  get shifts(): Shift[] {
    return this.props.shifts;
  }

  get weeklyHours(): number {
    return this.props.weeklyHours;
  }

  get overtimeHours(): number {
    return this.props.overtimeHours;
  }

  get onCallSchedule(): OnCallSchedule[] {
    return this.props.onCallSchedule;
  }

  get vacationDays(): VacationPeriod[] {
    return this.props.vacationDays;
  }

  get emergencyAvailability(): boolean {
    return this.props.emergencyAvailability;
  }

  get nightShiftCapable(): boolean {
    return this.props.nightShiftCapable;
  }

  get weekendAvailability(): boolean {
    return this.props.weekendAvailability;
  }

  /**
   * Business methods
   */

  /**
   * Check if provider is available at specific date/time
   */
  isAvailableAt(dateTime: Date): boolean {
    // Check if on vacation
    if (this.isOnVacation(dateTime)) {
      return false;
    }

    const dayOfWeek = dateTime.getDay();
    const timeString = this.formatTime(dateTime);

    // Check regular shifts
    const hasRegularShift = this.props.shifts.some(shift => 
      shift.dayOfWeek === dayOfWeek &&
      this.isTimeInShift(timeString, shift) &&
      this.isShiftActive(shift, dateTime)
    );

    if (hasRegularShift) {
      return true;
    }

    // Check on-call schedule
    const hasOnCallDuty = this.props.onCallSchedule.some(onCall =>
      dateTime >= onCall.startDateTime && dateTime <= onCall.endDateTime
    );

    return hasOnCallDuty;
  }

  /**
   * Check if provider is on vacation
   */
  isOnVacation(date: Date): boolean {
    return this.props.vacationDays.some(vacation =>
      vacation.status === VacationStatus.APPROVED &&
      date >= vacation.startDate &&
      date <= vacation.endDate
    );
  }

  /**
   * Get shifts for specific day
   */
  getShiftsForDay(dayOfWeek: DayOfWeek): Shift[] {
    return this.props.shifts.filter(shift => shift.dayOfWeek === dayOfWeek);
  }

  /**
   * Get current shift (if any)
   */
  getCurrentShift(): Shift | null {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const timeString = this.formatTime(now);

    return this.props.shifts.find(shift =>
      shift.dayOfWeek === dayOfWeek &&
      this.isTimeInShift(timeString, shift) &&
      this.isShiftActive(shift, now)
    ) || null;
  }

  /**
   * Get next shift
   */
  getNextShift(): Shift | null {
    const now = new Date();
    const currentTime = now.getTime();

    // Find the next shift starting from current time
    const upcomingShifts = this.props.shifts
      .map(shift => {
        const shiftDateTime = this.getNextShiftDateTime(shift, now);
        return { shift, dateTime: shiftDateTime };
      })
      .filter(item => item.dateTime > currentTime)
      .sort((a, b) => a.dateTime - b.dateTime);

    return upcomingShifts.length > 0 ? upcomingShifts[0].shift : null;
  }

  /**
   * Check if provider works weekends
   */
  worksWeekends(): boolean {
    return this.props.weekendAvailability ||
           this.props.shifts.some(shift => 
             shift.dayOfWeek === DayOfWeek.SATURDAY || 
             shift.dayOfWeek === DayOfWeek.SUNDAY
           );
  }

  /**
   * Check if provider works night shifts
   */
  worksNightShifts(): boolean {
    return this.props.nightShiftCapable ||
           this.props.shifts.some(shift => shift.shiftType === ShiftType.NIGHT);
  }

  /**
   * Get total vacation days taken this year
   */
  getVacationDaysTakenThisYear(): number {
    const currentYear = new Date().getFullYear();
    
    return this.props.vacationDays
      .filter(vacation => 
        vacation.status === VacationStatus.APPROVED &&
        vacation.startDate.getFullYear() === currentYear
      )
      .reduce((total, vacation) => {
        const days = Math.ceil(
          (vacation.endDate.getTime() - vacation.startDate.getTime()) / 
          (1000 * 60 * 60 * 24)
        ) + 1;
        return total + days;
      }, 0);
  }

  /**
   * Get remaining vacation days (assuming 21 days annual leave)
   */
  getRemainingVacationDays(): number {
    const annualLeaveEntitlement = 21; // Standard Vietnamese annual leave
    return Math.max(0, annualLeaveEntitlement - this.getVacationDaysTakenThisYear());
  }

  /**
   * Check if schedule complies with labor law (max 48 hours/week)
   */
  isCompliantWithLaborLaw(): boolean {
    const maxWeeklyHours = 48; // Vietnamese labor law
    return this.props.weeklyHours <= maxWeeklyHours;
  }

  /**
   * Get schedule violations
   */
  getScheduleViolations(): string[] {
    const violations: string[] = [];

    // Check weekly hours limit
    if (this.props.weeklyHours > 48) {
      violations.push(`Vượt quá giới hạn 48 giờ/tuần: ${this.props.weeklyHours} giờ`);
    }

    // Check daily hours limit (max 12 hours/day)
    for (let day = 0; day <= 6; day++) {
      const dailyHours = this.getDailyHours(day as DayOfWeek);
      if (dailyHours > 12) {
        violations.push(`Vượt quá giới hạn 12 giờ/ngày cho ${this.getDayName(day as DayOfWeek)}: ${dailyHours} giờ`);
      }
    }

    // Check rest periods (minimum 11 hours between shifts)
    const restViolations = this.checkRestPeriods();
    violations.push(...restViolations);

    return violations;
  }

  /**
   * Add shift to schedule
   */
  addShift(shift: Shift): WorkSchedule {
    const newShifts = [...this.props.shifts, shift];
    const newWeeklyHours = WorkSchedule.calculateWeeklyHours(newShifts);
    
    return new WorkSchedule({
      ...this.props,
      shifts: newShifts,
      weeklyHours: newWeeklyHours,
      overtimeHours: Math.max(0, newWeeklyHours - 40)
    });
  }

  /**
   * Remove shift from schedule
   */
  removeShift(shiftId: string): WorkSchedule {
    const newShifts = this.props.shifts.filter(shift => shift.id !== shiftId);
    const newWeeklyHours = WorkSchedule.calculateWeeklyHours(newShifts);
    
    return new WorkSchedule({
      ...this.props,
      shifts: newShifts,
      weeklyHours: newWeeklyHours,
      overtimeHours: Math.max(0, newWeeklyHours - 40)
    });
  }

  /**
   * Add vacation period
   */
  addVacation(vacation: VacationPeriod): WorkSchedule {
    return new WorkSchedule({
      ...this.props,
      vacationDays: [...this.props.vacationDays, vacation]
    });
  }

  /**
   * Validate format
   */
  protected validateFormat(): void {
    // Validate shifts
    this.validateShifts();

    // Validate on-call schedule
    this.validateOnCallSchedule();

    // Validate vacation periods
    this.validateVacationPeriods();

    // Validate weekly hours
    if (this.props.weeklyHours < 0 || this.props.weeklyHours > 80) {
      throw new Error('Số giờ làm việc hàng tuần không hợp lệ');
    }
  }

  /**
   * Private helper methods
   */

  private static calculateWeeklyHours(shifts: Shift[]): number {
    return shifts.reduce((total, shift) => {
      const hours = this.calculateShiftHours(shift);
      return total + hours;
    }, 0);
  }

  private static calculateShiftHours(shift: Shift): number {
    const startMinutes = this.timeToMinutes(shift.startTime);
    const endMinutes = this.timeToMinutes(shift.endTime);
    
    let durationMinutes = endMinutes - startMinutes;
    if (durationMinutes < 0) {
      // Shift crosses midnight
      durationMinutes += 24 * 60;
    }
    
    return durationMinutes / 60;
  }

  private static timeToMinutes(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private formatTime(date: Date): string {
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  }

  private isTimeInShift(timeString: string, shift: Shift): boolean {
    const timeMinutes = WorkSchedule.timeToMinutes(timeString);
    const startMinutes = WorkSchedule.timeToMinutes(shift.startTime);
    const endMinutes = WorkSchedule.timeToMinutes(shift.endTime);

    if (startMinutes <= endMinutes) {
      // Normal shift (doesn't cross midnight)
      return timeMinutes >= startMinutes && timeMinutes < endMinutes;
    } else {
      // Shift crosses midnight
      return timeMinutes >= startMinutes || timeMinutes < endMinutes;
    }
  }

  private isShiftActive(shift: Shift, date: Date): boolean {
    if (!shift.isRecurring) {
      // One-time shift
      return date.toDateString() === shift.effectiveDate.toDateString();
    }

    // Recurring shift
    if (date < shift.effectiveDate) {
      return false;
    }

    if (shift.endDate && date > shift.endDate) {
      return false;
    }

    return true;
  }

  private getNextShiftDateTime(shift: Shift, fromDate: Date): number {
    const currentDay = fromDate.getDay();
    const targetDay = shift.dayOfWeek;
    
    let daysUntilShift = targetDay - currentDay;
    if (daysUntilShift <= 0) {
      daysUntilShift += 7; // Next week
    }

    const shiftDate = new Date(fromDate);
    shiftDate.setDate(shiftDate.getDate() + daysUntilShift);
    
    const [hours, minutes] = shift.startTime.split(':').map(Number);
    shiftDate.setHours(hours, minutes, 0, 0);

    return shiftDate.getTime();
  }

  private getDailyHours(dayOfWeek: DayOfWeek): number {
    return this.props.shifts
      .filter(shift => shift.dayOfWeek === dayOfWeek)
      .reduce((total, shift) => total + WorkSchedule.calculateShiftHours(shift), 0);
  }

  private getDayName(dayOfWeek: DayOfWeek): string {
    const dayNames = {
      [DayOfWeek.MONDAY]: 'Thứ Hai',
      [DayOfWeek.TUESDAY]: 'Thứ Ba',
      [DayOfWeek.WEDNESDAY]: 'Thứ Tư',
      [DayOfWeek.THURSDAY]: 'Thứ Năm',
      [DayOfWeek.FRIDAY]: 'Thứ Sáu',
      [DayOfWeek.SATURDAY]: 'Thứ Bảy',
      [DayOfWeek.SUNDAY]: 'Chủ Nhật'
    };
    return dayNames[dayOfWeek];
  }

  private checkRestPeriods(): string[] {
    const violations: string[] = [];
    const sortedShifts = [...this.props.shifts].sort((a, b) => {
      if (a.dayOfWeek !== b.dayOfWeek) {
        return a.dayOfWeek - b.dayOfWeek;
      }
      return WorkSchedule.timeToMinutes(a.startTime) - WorkSchedule.timeToMinutes(b.startTime);
    });

    for (let i = 0; i < sortedShifts.length - 1; i++) {
      const currentShift = sortedShifts[i];
      const nextShift = sortedShifts[i + 1];
      
      const restHours = this.calculateRestHours(currentShift, nextShift);
      if (restHours < 11) {
        violations.push(`Không đủ thời gian nghỉ giữa ca (${restHours} giờ < 11 giờ yêu cầu)`);
      }
    }

    return violations;
  }

  private calculateRestHours(shift1: Shift, shift2: Shift): number {
    // Simplified calculation - would need more complex logic for cross-day shifts
    const shift1End = WorkSchedule.timeToMinutes(shift1.endTime);
    const shift2Start = WorkSchedule.timeToMinutes(shift2.startTime);
    
    let restMinutes = shift2Start - shift1End;
    if (shift2.dayOfWeek > shift1.dayOfWeek) {
      restMinutes += (shift2.dayOfWeek - shift1.dayOfWeek - 1) * 24 * 60;
    }
    
    return restMinutes / 60;
  }

  private validateShifts(): void {
    for (const shift of this.props.shifts) {
      if (!shift.id || shift.id.trim().length === 0) {
        throw new Error('ID ca làm việc không được để trống');
      }

      if (!shift.startTime.match(/^\d{2}:\d{2}$/)) {
        throw new Error('Thời gian bắt đầu ca không đúng định dạng HH:mm');
      }

      if (!shift.endTime.match(/^\d{2}:\d{2}$/)) {
        throw new Error('Thời gian kết thúc ca không đúng định dạng HH:mm');
      }

      if (shift.dayOfWeek < 0 || shift.dayOfWeek > 6) {
        throw new Error('Ngày trong tuần không hợp lệ');
      }
    }
  }

  private validateOnCallSchedule(): void {
    for (const onCall of this.props.onCallSchedule) {
      if (onCall.endDateTime <= onCall.startDateTime) {
        throw new Error('Thời gian kết thúc trực phải sau thời gian bắt đầu');
      }

      if (!onCall.contactMethod || onCall.contactMethod.trim().length === 0) {
        throw new Error('Phương thức liên lạc khi trực không được để trống');
      }
    }
  }

  private validateVacationPeriods(): void {
    for (const vacation of this.props.vacationDays) {
      if (vacation.endDate <= vacation.startDate) {
        throw new Error('Ngày kết thúc nghỉ phép phải sau ngày bắt đầu');
      }
    }
  }

  /**
   * Contains PHI - Work schedule may contain PHI
   */
  containsPHI(): boolean {
    return false; // Work schedule itself doesn't contain PHI
  }

  /**
   * String representation
   */
  toString(): string {
    return `Lịch làm việc: ${this.props.weeklyHours} giờ/tuần, ${this.props.shifts.length} ca`;
  }
}
