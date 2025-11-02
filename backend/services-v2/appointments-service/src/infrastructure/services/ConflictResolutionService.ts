/**
 * Conflict Resolution Service Implementation
 * Handles appointment conflicts and suggests alternatives
 *
 * @author Hospital Management Team
 * @version 3.0.0
 */

import {
  IConflictResolutionService,
  ConflictCheckRequest,
  ConflictCheckResponse,
  ConflictInfo,
  FindAlternativeSlotsRequest,
  FindAlternativeSlotsResponse,
  TimeSlotSuggestion,
} from '../../application/services/IConflictResolutionService';
import { IAppointmentRepository } from '../../domain/repositories/IAppointmentRepository';

/**
 * Business Hours Configuration
 */
const BUSINESS_HOURS = {
  start: 8, // 8:00 AM
  end: 17, // 5:00 PM
  lunchStart: 12, // 12:00 PM
  lunchEnd: 13, // 1:00 PM
};

/**
 * Conflict Resolution Service Implementation
 */
export class ConflictResolutionService implements IConflictResolutionService {
  constructor(
    private readonly appointmentRepository: IAppointmentRepository
  ) {}

  /**
   * Check for scheduling conflicts
   */
  async checkConflicts(
    request: ConflictCheckRequest
  ): Promise<ConflictCheckResponse> {
    const conflictCheck = await this.appointmentRepository.checkConflicts(
      request.doctorId,
      request.startTime,
      request.endTime,
      request.excludeAppointmentId
    );

    const conflicts: ConflictInfo[] = conflictCheck.conflicts.map(conflict => ({
      appointmentId: conflict.appointmentId,
      startTime: conflict.startTime,
      endTime: conflict.endTime,
      patientName: 'Bệnh nhân khác',
      reason: conflict.reason,
    }));

    const hasConflicts = conflicts.length > 0;

    // If conflicts found, suggest alternatives
    let suggestions: TimeSlotSuggestion[] | undefined;
    if (hasConflicts) {
      suggestions = await this.generateAlternativeSlots(
        request.doctorId,
        request.startTime,
        request.endTime
      );
    }

    return {
      hasConflicts,
      conflicts,
      suggestions,
    };
  }

  /**
   * Find alternative time slots
   */
  async findAlternativeSlots(
    request: FindAlternativeSlotsRequest
  ): Promise<FindAlternativeSlotsResponse> {
    const suggestions: TimeSlotSuggestion[] = [];
    const maxSuggestions = request.maxSuggestions || 5;

    // 1. Try same doctor, same day, different times
    const sameDaySuggestions = await this.findSameDayAlternatives(
      request.doctorId,
      request.preferredDate,
      request.durationMinutes
    );
    suggestions.push(...sameDaySuggestions.slice(0, maxSuggestions));

    // 2. If not enough, try next day
    if (suggestions.length < maxSuggestions) {
      const nextDaySuggestions = await this.findNextDayAlternatives(
        request.doctorId,
        request.preferredDate,
        request.durationMinutes,
        maxSuggestions - suggestions.length
      );
      suggestions.push(...nextDaySuggestions);
    }

    // 3. If still not enough and department specified, try other doctors
    if (suggestions.length < maxSuggestions && request.departmentId) {
      const otherDoctorsSuggestions = await this.suggestAlternativeDoctors(
        request.departmentId,
        request.preferredDate,
        request.durationMinutes,
        maxSuggestions - suggestions.length
      );
      suggestions.push(...otherDoctorsSuggestions);
    }

    return {
      suggestions,
      totalFound: suggestions.length,
    };
  }

  /**
   * Suggest nearest available slot
   */
  async suggestNearestAvailableSlot(
    doctorId: string,
    preferredTime: Date,
    durationMinutes: number
  ): Promise<TimeSlotSuggestion | null> {
    // Check forward in time (next 7 days)
    const searchEndDate = new Date(preferredTime);
    searchEndDate.setDate(searchEndDate.getDate() + 7);

    let currentDate = new Date(preferredTime);

    while (currentDate <= searchEndDate) {
      // Skip Sundays
      if (currentDate.getDay() === 0) {
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }

      // Check each time slot during business hours
      for (let hour = BUSINESS_HOURS.start; hour < BUSINESS_HOURS.end; hour++) {
        // Skip lunch hour
        if (hour >= BUSINESS_HOURS.lunchStart && hour < BUSINESS_HOURS.lunchEnd) {
          continue;
        }

        const slotStart = new Date(currentDate);
        slotStart.setHours(hour, 0, 0, 0);

        const slotEnd = new Date(slotStart);
        slotEnd.setMinutes(slotEnd.getMinutes() + durationMinutes);

        // Check if slot is available
        const isAvailable = await this.isSlotAvailable(
          doctorId,
          slotStart,
          slotEnd
        );

        if (isAvailable) {
          return {
            startTime: slotStart,
            endTime: slotEnd,
            doctorId,
            confidence: this.calculateConfidence(preferredTime, slotStart),
            reason: this.generateReasonText(preferredTime, slotStart),
          };
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return null;
  }

  /**
   * Suggest alternative doctors in same department
   */
  async suggestAlternativeDoctors(
    departmentId: string,
    preferredTime: Date,
    durationMinutes: number,
    maxSuggestions: number = 3
  ): Promise<TimeSlotSuggestion[]> {
    const suggestions: TimeSlotSuggestion[] = [];

    try {
      // In production, this would query the provider-staff-service or read model
      // to get doctors in the same department. For now, we implement basic logic:
      
      // Search for available slots with other doctors
      // This would integrate with Provider Service or read from local read model
      console.log(
        `[ConflictResolution] Searching alternative doctors in department ${departmentId} ` +
        `for ${preferredTime.toISOString()}`
      );

      // Implementation note: This should call Provider Service API or query local read model
      // For now, returning empty array but with proper structure
      // In production: await providerService.getDoctorsByDepartment(departmentId)
      // Then check availability for each doctor
      
    } catch (error) {
      console.error('[ConflictResolution] Error finding alternative doctors:', error);
    }

    return suggestions;
  }

  // ==================== Private Helper Methods ====================

  /**
   * Generate alternative slots for same day
   */
  private async findSameDayAlternatives(
    doctorId: string,
    preferredDate: Date,
    durationMinutes: number
  ): Promise<TimeSlotSuggestion[]> {
    const suggestions: TimeSlotSuggestion[] = [];
    const date = new Date(preferredDate);

    // Check all business hours
    for (let hour = BUSINESS_HOURS.start; hour < BUSINESS_HOURS.end; hour++) {
      // Skip lunch
      if (hour >= BUSINESS_HOURS.lunchStart && hour < BUSINESS_HOURS.lunchEnd) {
        continue;
      }

      const slotStart = new Date(date);
      slotStart.setHours(hour, 0, 0, 0);

      const slotEnd = new Date(slotStart);
      slotEnd.setMinutes(slotEnd.getMinutes() + durationMinutes);

      // Check availability
      const isAvailable = await this.isSlotAvailable(
        doctorId,
        slotStart,
        slotEnd
      );

      if (isAvailable) {
        suggestions.push({
          startTime: slotStart,
          endTime: slotEnd,
          doctorId,
          confidence: this.calculateConfidence(preferredDate, slotStart),
          reason: `Cùng ngày, ${hour}:00`,
        });
      }
    }

    return suggestions;
  }

  /**
   * Generate alternative slots for next day
   */
  private async findNextDayAlternatives(
    doctorId: string,
    preferredDate: Date,
    durationMinutes: number,
    maxSuggestions: number
  ): Promise<TimeSlotSuggestion[]> {
    const suggestions: TimeSlotSuggestion[] = [];
    let daysChecked = 0;
    const maxDaysToCheck = 7;

    while (suggestions.length < maxSuggestions && daysChecked < maxDaysToCheck) {
      const nextDate = new Date(preferredDate);
      nextDate.setDate(nextDate.getDate() + daysChecked + 1);

      // Skip Sundays
      if (nextDate.getDay() === 0) {
        daysChecked++;
        continue;
      }

      const sameDaySuggestions = await this.findSameDayAlternatives(
        doctorId,
        nextDate,
        durationMinutes
      );

      suggestions.push(...sameDaySuggestions.slice(0, maxSuggestions - suggestions.length));
      daysChecked++;
    }

    return suggestions;
  }

  /**
   * Check if time slot is available
   */
  private async isSlotAvailable(
    doctorId: string,
    startTime: Date,
    endTime: Date
  ): Promise<boolean> {
    try {
      // Check repository for conflicting appointments
      const conflictCheck = await this.appointmentRepository.checkConflicts(
        doctorId,
        startTime,
        endTime
      );

      // Slot is available if no conflicts found
      return conflictCheck.conflicts.length === 0;
    } catch (error) {
      console.error('[ConflictResolution] Error checking slot availability:', error);
      // In case of error, assume slot is NOT available (conservative approach)
      return false;
    }
  }

  /**
   * Calculate confidence score (0-100)
   */
  private calculateConfidence(preferredTime: Date, suggestedTime: Date): number {
    const timeDiff = Math.abs(suggestedTime.getTime() - preferredTime.getTime());
    const hoursDiff = timeDiff / (1000 * 60 * 60);

    // Perfect match: 100
    // Same hour: 90-100
    // Same day: 70-90
    // Next day: 50-70
    // Within week: 30-50
    if (hoursDiff === 0) return 100;
    if (hoursDiff < 1) return 90;
    if (hoursDiff < 8) return 80; // Same day
    if (hoursDiff < 24) return 60; // Next day
    if (hoursDiff < 168) return 40; // Within week

    return 20;
  }

  /**
   * Generate human-readable reason text
   */
  private generateReasonText(preferredTime: Date, suggestedTime: Date): string {
    const timeDiff = suggestedTime.getTime() - preferredTime.getTime();
    const hoursDiff = Math.floor(timeDiff / (1000 * 60 * 60));
    const daysDiff = Math.floor(hoursDiff / 24);

    if (hoursDiff === 0) {
      return 'Đúng giờ mong muốn';
    } else if (Math.abs(hoursDiff) < 8) {
      return `Cùng ngày, ${hoursDiff > 0 ? 'sau' : 'trước'} ${Math.abs(hoursDiff)} giờ`;
    } else if (Math.abs(daysDiff) === 1) {
      return daysDiff > 0 ? 'Ngày hôm sau' : 'Ngày hôm trước';
    } else if (Math.abs(daysDiff) < 7) {
      return `${daysDiff > 0 ? 'Sau' : 'Trước'} ${Math.abs(daysDiff)} ngày`;
    }

    return `${daysDiff} ngày ${daysDiff > 0 ? 'sau' : 'trước'}`;
  }

  /**
   * Generate alternative slots
   */
  private async generateAlternativeSlots(
    doctorId: string,
    startTime: Date,
    endTime: Date
  ): Promise<TimeSlotSuggestion[]> {
    const durationMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);

    const request: FindAlternativeSlotsRequest = {
      doctorId,
      preferredDate: startTime,
      durationMinutes,
      maxSuggestions: 5,
    };

    const response = await this.findAlternativeSlots(request);
    return response.suggestions;
  }
}

