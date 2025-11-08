/**
 * Availability Service
 * API service for fetching doctor availability and time slots
 */

import apiClient from './client';

export interface TimeSlot {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  appointmentId?: string;
}

export interface AvailableSlotsResponse {
  success: boolean;
  data: {
    providerId: string;
    date: string;
    slots: TimeSlot[];
  };
}

export interface ProviderSchedule {
  providerId: string;
  workingDays: string[]; // ['MONDAY', 'TUESDAY', ...]
  workingHours: {
    start: string; // 'HH:mm'
    end: string;
  };
  breakTime?: {
    start: string;
    end: string;
  };
}

export interface ProviderScheduleResponse {
  success: boolean;
  data: ProviderSchedule;
}

/**
 * Get available time slots for a provider on a specific date
 */
export async function getAvailableSlots(
  providerId: string,
  date: string,
  duration: number = 30
): Promise<AvailableSlotsResponse> {
  const response = await apiClient.get<AvailableSlotsResponse>(
    `/api/v1/appointments/providers/${providerId}/available-slots`,
    {
      params: { date, duration },
    }
  );
  return response.data;
}

/**
 * Get provider's work schedule template
 */
export async function getProviderSchedule(
  providerId: string
): Promise<ProviderScheduleResponse> {
  const response = await apiClient.get<ProviderScheduleResponse>(
    `/api/v1/appointments/providers/${providerId}/schedule`
  );
  return response.data;
}

/**
 * Generate time slots for display (mock data fallback)
 */
export function generateMockTimeSlots(date: string): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const morningSlots = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30'];
  const afternoonSlots = ['14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'];

  [...morningSlots, ...afternoonSlots].forEach((time) => {
    const [hours, minutes] = time.split(':');
    const endHours = parseInt(hours) + (parseInt(minutes) === 30 ? 1 : 0);
    const endMinutes = parseInt(minutes) === 30 ? '00' : '30';

    slots.push({
      startTime: time,
      endTime: `${endHours.toString().padStart(2, '0')}:${endMinutes}`,
      isAvailable: Math.random() > 0.3, // 70% available
    });
  });

  return slots;
}
