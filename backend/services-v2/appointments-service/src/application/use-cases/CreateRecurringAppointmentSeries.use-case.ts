/**
 * Create Recurring Appointment Series Use Case
 * Creates a series of recurring appointments based on a pattern
 *
 * @author Hospital Management Team
 * @version 3.0.0
 */

import { BaseHealthcareUseCase } from '@shared/application/use-cases/base/use-case.interface';

export enum RecurrenceType {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
}

export interface CreateRecurringSeriesRequest {
  patientId: string;
  doctorId: string;
  recurrenceType: RecurrenceType;
  recurrenceInterval: number; // Every N days/weeks/months
  recurrenceDaysOfWeek?: number[]; // 0 = Sunday, 1 = Monday, etc.
  recurrenceDayOfMonth?: number; // 1-31
  startDate: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  maxOccurrences?: number;
  appointmentTime: string; // HH:MM:SS
  durationMinutes: number;
  type: string;
  priority: string;
  reason: string;
  consultationFee: number;
  createdBy: string;
}

export interface CreateRecurringSeriesResponse {
  success: boolean;
  message: string;
  series?: {
    seriesId: string;
    totalAppointments: number;
    generatedAppointments: string[]; // Array of appointment IDs
  };
  errors?: string[];
}

/**
 * Create Recurring Appointment Series Use Case
 * Generates multiple appointments based on recurrence pattern
 */
export class CreateRecurringAppointmentSeriesUseCase extends BaseHealthcareUseCase<
  CreateRecurringSeriesRequest,
  CreateRecurringSeriesResponse
> {
  protected async executeInternal(
    request: CreateRecurringSeriesRequest
  ): Promise<CreateRecurringSeriesResponse> {
    try {
      // 1. Validate request
      this.validateRequest(request);

      // 2. Generate series ID
      const seriesId = `SERIES-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // 3. Calculate appointment dates based on recurrence pattern
      const appointmentDates = this.calculateRecurrenceDates(request);

      if (appointmentDates.length === 0) {
        throw new Error('No valid appointment dates generated');
      }

      // 4. Create appointments for each date
      const generatedAppointments: string[] = [];

      for (const date of appointmentDates) {
        // TODO: Create individual appointment via ScheduleAppointmentUseCase
        const appointmentId = `APT-${date}-${Math.random().toString(36).substr(2, 9)}`;
        generatedAppointments.push(appointmentId);
      }

      return {
        success: true,
        message: `Đã tạo ${generatedAppointments.length} lịch hẹn định kỳ`,
        series: {
          seriesId,
          totalAppointments: generatedAppointments.length,
          generatedAppointments,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Không thể tạo lịch hẹn định kỳ',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  private validateRequest(request: CreateRecurringSeriesRequest): void {
    const errors: string[] = [];

    if (!request.patientId) errors.push('Patient ID is required');
    if (!request.doctorId) errors.push('Doctor ID is required');
    if (!request.recurrenceType) errors.push('Recurrence type is required');
    if (!request.startDate) errors.push('Start date is required');
    if (request.recurrenceInterval <= 0) errors.push('Recurrence interval must be positive');

    if (request.recurrenceType === RecurrenceType.WEEKLY && !request.recurrenceDaysOfWeek) {
      errors.push('Days of week required for weekly recurrence');
    }

    if (request.recurrenceType === RecurrenceType.MONTHLY && !request.recurrenceDayOfMonth) {
      errors.push('Day of month required for monthly recurrence');
    }

    if (!request.endDate && !request.maxOccurrences) {
      errors.push('Either end date or max occurrences must be specified');
    }

    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }
  }

  private calculateRecurrenceDates(request: CreateRecurringSeriesRequest): string[] {
    const dates: string[] = [];
    const startDate = new Date(request.startDate);
    const endDate = request.endDate ? new Date(request.endDate) : null;
    const maxOccurrences = request.maxOccurrences || 52; // Default: 1 year weekly
    let currentDate = new Date(startDate);
    let count = 0;

    while (count < maxOccurrences) {
      // Check if we've passed the end date
      if (endDate && currentDate > endDate) {
        break;
      }

      // Check if date matches recurrence pattern
      if (this.dateMatchesPattern(currentDate, request)) {
        dates.push(this.formatDate(currentDate));
        count++;
      }

      // Increment date based on recurrence type
      currentDate = this.incrementDate(currentDate, request);
    }

    return dates;
  }

  private dateMatchesPattern(
    date: Date,
    request: CreateRecurringSeriesRequest
  ): boolean {
    switch (request.recurrenceType) {
      case RecurrenceType.WEEKLY:
        return request.recurrenceDaysOfWeek!.includes(date.getDay());

      case RecurrenceType.MONTHLY:
        return date.getDate() === request.recurrenceDayOfMonth!;

      case RecurrenceType.DAILY:
        return true;

      case RecurrenceType.YEARLY:
        const startDate = new Date(request.startDate);
        return (
          date.getMonth() === startDate.getMonth() &&
          date.getDate() === startDate.getDate()
        );

      default:
        return false;
    }
  }

  private incrementDate(
    date: Date,
    request: CreateRecurringSeriesRequest
  ): Date {
    const newDate = new Date(date);

    switch (request.recurrenceType) {
      case RecurrenceType.DAILY:
        newDate.setDate(newDate.getDate() + request.recurrenceInterval);
        break;

      case RecurrenceType.WEEKLY:
        newDate.setDate(newDate.getDate() + 1); // Check next day
        break;

      case RecurrenceType.MONTHLY:
        newDate.setMonth(newDate.getMonth() + request.recurrenceInterval);
        break;

      case RecurrenceType.YEARLY:
        newDate.setFullYear(newDate.getFullYear() + request.recurrenceInterval);
        break;
    }

    return newDate;
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  }

  async authorize(
    request: CreateRecurringSeriesRequest,
    userId: string
  ): Promise<boolean> {
    return !!userId;
  }

  involvesPHI(request: CreateRecurringSeriesRequest): boolean {
    return true;
  }

  getPatientId(request: CreateRecurringSeriesRequest): string | null {
    return request.patientId;
  }
}

