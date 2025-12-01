/**
 * FindAvailableTimeSlots Use Case - Application Layer
 * V2 Clean Architecture + DDD Implementation
 * 
 * Business Logic: Calculate available time slots for provider
 * Formula: Available Slots = Work Schedule Template - Booked Appointments
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards
 * 
 * Security Note (2025-10-23):
 * - Current RLS: Service role bypass + authenticated read access
 * - Data Classification: Operational data (non-PHI)
 * 
 * Multi-Tenancy Support (Future Enhancement):
 * When implementing multi-tenancy, add:
 * 1. tenantId to FindAvailableTimeSlotsCommand
 * 2. Provider active status filter via IProviderService
 * 3. Tenant-level RLS policies in provider_schema and appointments_schema
 * 4. Filter bookedAppointments by tenant_id in repository
 */

import { IProviderScheduleRepository } from '../../domain/repositories/IProviderScheduleRepository';
import { IAppointmentRepository } from '../../domain/repositories/IAppointmentRepository';
import { TimeSlot } from '../../domain/value-objects/TimeSlot.vo';
import { HttpProviderService } from '../../infrastructure/services/HttpProviderService';

export interface FindAvailableTimeSlotsCommand {
  providerId: string;
  date: Date;
  durationMinutes: number;
  // Future: tenantId?: string; // For multi-tenancy support
}

export interface AvailableTimeSlotDTO {
  startTime: Date;
  endTime: Date;
  appointmentDate: string; // YYYY-MM-DD
  appointmentTime: string; // HH:MM:SS
  formattedTime: string;   // HH:MM (display)
  dayOfWeek: string;       // Vietnamese day name
  isAvailable: boolean;
}

/**
 * FindAvailableTimeSlots Use Case
 * 
 * Bounded Context: Scheduling Context (Appointments Service)
 * Responsibility: Calculate runtime availability based on work schedule template
 * 
 * Flow:
 * 1. Get cached work schedule template from ProviderScheduleRepository
 * 2. Get booked appointments for the date from AppointmentRepository
 * 3. Calculate available slots = template - booked
 * 4. Return available time slots
 */
export class FindAvailableTimeSlotsUseCase {
  constructor(
    private readonly providerScheduleRepository: IProviderScheduleRepository,
    private readonly appointmentRepository: IAppointmentRepository,
    private readonly httpProviderService: HttpProviderService
  ) { }

  /**
   * Execute use case
   * 
   * @param command - Command with providerId, date, durationMinutes
   * @returns Array of available time slots
   * @throws Error if provider schedule not found
   */
  async execute(command: FindAvailableTimeSlotsCommand): Promise<AvailableTimeSlotDTO[]> {
    const { providerId, date, durationMinutes } = command;

    // Validate inputs
    this.validateCommand(command);

    // 1. Get work schedule from Provider/Staff Service (HTTP call)
    // Simple approach for MVP: direct API call instead of event-driven read model
    const providerSchedule = await this.httpProviderService.getWorkSchedule(providerId);

    if (!providerSchedule) {
      throw new Error(`Provider schedule not found for provider: ${providerId}`);
    }

    // 2. Check if provider works on this day
    const dayOfWeek = this.getDayOfWeek(date);
    if (!providerSchedule.isWorkingDay(dayOfWeek)) {
      // Provider doesn't work on this day
      return [];
    }

    // 3. Get booked appointments for the date
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const bookedAppointments = await this.appointmentRepository.findByTimeSlot(
      providerId,
      startOfDay,
      endOfDay
    );

    // 4. Generate all possible time slots from work schedule
    const allPossibleSlots: { startTime: Date; endTime: Date }[] = [];

    // Check if provider has dailySchedules (different hours for each day)
    const dailySchedules = (providerSchedule as any).dailySchedules as Array<{ day: string; start: string; end: string }> | undefined;

    if (dailySchedules && dailySchedules.length > 0) {
      // Find the schedule for this specific day
      const daySchedule = dailySchedules.find(ds => ds.day.toLowerCase() === dayOfWeek);

      if (daySchedule) {
        console.log('[FindAvailableTimeSlotsUseCase] Using dailySchedule for day', {
          dayOfWeek,
          schedule: daySchedule,
        });

        const slotsForDay = this.generateTimeSlotsFromSchedule(
          date,
          daySchedule.start,
          daySchedule.end,
          durationMinutes
        );
        allPossibleSlots.push(...slotsForDay);
      } else {
        // No schedule found for this day - return empty
        console.warn('[FindAvailableTimeSlotsUseCase] No dailySchedule found for day', {
          dayOfWeek,
          availableDays: dailySchedules.map(ds => ds.day),
        });
      }
    } else {
      // Fallback to generic working hour ranges (support multiple time ranges)
      const workingHourRanges = providerSchedule.getWorkingHourRanges();

      // Generate slots for each time range (e.g., morning shift + afternoon shift)
      for (const timeRange of workingHourRanges) {
        const slotsForRange = this.generateTimeSlotsFromSchedule(
          date,
          timeRange.start,
          timeRange.end,
          durationMinutes
        );
        allPossibleSlots.push(...slotsForRange);
      }
    }

    // 5. Filter out booked slots
    const availableSlots = this.filterAvailableSlots(
      allPossibleSlots,
      bookedAppointments.map(apt => ({
        startTime: apt.timeSlot.toDate(),
        endTime: new Date(apt.timeSlot.toDate().getTime() + apt.durationMinutes * 60000)
      })),
      durationMinutes
    );

    // 6. Convert to DTOs
    return availableSlots.map(slot => this.toDTO(slot, dayOfWeek));
  }

  /**
   * Validate command inputs
   */
  private validateCommand(command: FindAvailableTimeSlotsCommand): void {
    if (!command.providerId || command.providerId.trim() === '') {
      throw new Error('Provider ID is required');
    }

    if (!command.date || !(command.date instanceof Date)) {
      throw new Error('Valid date is required');
    }

    if (isNaN(command.date.getTime())) {
      throw new Error('Invalid date');
    }

    if (!command.durationMinutes || command.durationMinutes <= 0) {
      throw new Error('Duration must be greater than 0');
    }

    if (command.durationMinutes > 480) {
      throw new Error('Duration cannot exceed 8 hours (480 minutes)');
    }
  }

  /**
   * Get day of week in lowercase (monday, tuesday, etc.)
   */
  private getDayOfWeek(date: Date): string {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[date.getDay()];
  }

  /**
   * Generate all possible time slots from work schedule
   */
  private generateTimeSlotsFromSchedule(
    date: Date,
    startTime: string, // HH:MM format
    endTime: string,   // HH:MM format
    durationMinutes: number
  ): { startTime: Date; endTime: Date }[] {
    const slots: { startTime: Date; endTime: Date }[] = [];

    // Parse start and end times
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    // Create start datetime
    const currentSlot = new Date(date);
    currentSlot.setHours(startHour, startMinute, 0, 0);

    // Create end datetime
    const workDayEnd = new Date(date);
    workDayEnd.setHours(endHour, endMinute, 0, 0);

    // Generate slots
    while (currentSlot.getTime() + durationMinutes * 60000 <= workDayEnd.getTime()) {
      const slotStart = new Date(currentSlot);
      const slotEnd = new Date(currentSlot.getTime() + durationMinutes * 60000);

      slots.push({
        startTime: slotStart,
        endTime: slotEnd
      });

      // Move to next slot (increment by duration)
      currentSlot.setTime(currentSlot.getTime() + durationMinutes * 60000);
    }

    return slots;
  }

  /**
   * Filter out booked slots from all possible slots
   */
  private filterAvailableSlots(
    allSlots: { startTime: Date; endTime: Date }[],
    bookedSlots: { startTime: Date; endTime: Date }[],
    durationMinutes: number
  ): { startTime: Date; endTime: Date }[] {
    return allSlots.filter(slot => {
      // Check if this slot conflicts with any booked appointment
      const hasConflict = bookedSlots.some(booked => {
        // Conflict if:
        // 1. Slot starts during booked appointment
        // 2. Slot ends during booked appointment
        // 3. Slot completely contains booked appointment
        return (
          (slot.startTime >= booked.startTime && slot.startTime < booked.endTime) ||
          (slot.endTime > booked.startTime && slot.endTime <= booked.endTime) ||
          (slot.startTime <= booked.startTime && slot.endTime >= booked.endTime)
        );
      });

      return !hasConflict;
    });
  }

  /**
   * Convert time slot to DTO
   */
  private toDTO(
    slot: { startTime: Date; endTime: Date },
    dayOfWeek: string
  ): AvailableTimeSlotDTO {
    const timeSlot = TimeSlot.fromDate(slot.startTime);

    return {
      startTime: slot.startTime,
      endTime: slot.endTime,
      appointmentDate: timeSlot.appointmentDate,
      appointmentTime: timeSlot.appointmentTime,
      formattedTime: timeSlot.getFormattedTime(),
      dayOfWeek: this.getVietnameseDayName(dayOfWeek),
      isAvailable: true
    };
  }

  /**
   * Get Vietnamese day name
   */
  private getVietnameseDayName(dayOfWeek: string): string {
    const vietnameseDays: Record<string, string> = {
      'monday': 'Thứ Hai',
      'tuesday': 'Thứ Ba',
      'wednesday': 'Thứ Tư',
      'thursday': 'Thứ Năm',
      'friday': 'Thứ Sáu',
      'saturday': 'Thứ Bảy',
      'sunday': 'Chủ Nhật'
    };

    return vietnameseDays[dayOfWeek] || dayOfWeek;
  }
}
