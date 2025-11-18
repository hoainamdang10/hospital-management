/**
 * HTTP Provider Service - Infrastructure Layer
 * Calls Provider/Staff Service API to fetch provider data and schedules
 * 
 * Simple, pragmatic approach for MVP scope:
 * - Direct HTTP call to provider-staff-service
 * - No event-driven complexity
 * - Easy to explain and maintain
 * 
 * Future enhancement: Can replace with event-driven read model without changing use cases
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Microservices
 */

import axios, { AxiosInstance } from 'axios';
import { ProviderSchedule } from '../../domain/value-objects/ProviderSchedule.vo';

export interface WorkScheduleDTO {
  workingDays: string[];
  workingHours: {
    start: string;
    end: string;
  };
  timeZone: string;
  isFlexible: boolean;
}

export interface StaffDTO {
  id: string;
  userId: string;
  staffType: string;
  personalInfo: {
    fullName: string;
    email: string;
    phoneNumber: string;
  };
  workSchedule: WorkScheduleDTO;
  employmentInfo: {
    status: string;
    isActive: boolean;
  };
}

export class HttpProviderService {
  private httpClient: AxiosInstance;

  constructor(
    providerServiceUrl: string
  ) {
    this.httpClient = axios.create({
      baseURL: providerServiceUrl,
      timeout: 5000, // 5 second timeout
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Get provider's work schedule from Provider/Staff Service
   * 
   * @param providerId - Staff ID (e.g., LABO-DOC-202502-007)
   * @returns ProviderSchedule or null if not found
   */
  async getWorkSchedule(providerId: string): Promise<ProviderSchedule | null> {
    try {
      console.log('[HttpProviderService] Fetching work schedule', {
        providerId,
      });

      const response = await this.httpClient.get<{ success: boolean; data: StaffDTO }>(
        `/api/v1/staff/${providerId}`
      );

      if (!response.data.success || !response.data.data) {
        console.warn('[HttpProviderService] Provider not found', {
          providerId,
        });
        return null;
      }

      const staff = response.data.data;

      // Check if staff is active and is a doctor
      if (!staff.employmentInfo?.isActive || staff.employmentInfo?.status !== 'active') {
        console.warn('[HttpProviderService] Provider is not active', {
          providerId,
          status: staff.employmentInfo?.status,
          isActive: staff.employmentInfo?.isActive,
        });
        return null;
      }

      // Map work schedule to ProviderSchedule domain object
      const schedule = staff.workSchedule;
      
      const providerSchedule = ProviderSchedule.create({
        providerId, // Use staffId from parameter (e.g., LABO-DOC-202502-007)
        workingDays: schedule.workingDays,
        workingHours: {
          start: schedule.workingHours.start,
          end: schedule.workingHours.end,
        },
        timeZone: schedule.timeZone || 'Asia/Ho_Chi_Minh',
        isFlexible: schedule.isFlexible,
        effectiveDate: new Date(), // Current date
      });

      console.log('[HttpProviderService] Work schedule fetched successfully', {
        providerId,
        workingDays: schedule.workingDays,
        workingHours: schedule.workingHours,
      });

      return providerSchedule;
    } catch (error) {
      console.error('[HttpProviderService] Failed to fetch work schedule', {
        providerId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });

      // Return null instead of throwing to allow graceful degradation
      return null;
    }
  }

  /**
   * Get provider details by ID
   */
  async getProvider(providerId: string): Promise<StaffDTO | null> {
    try {
      const response = await this.httpClient.get<{ success: boolean; data: StaffDTO }>(
        `/api/v1/staff/${providerId}`
      );

      if (!response.data.success || !response.data.data) {
        return null;
      }

      return response.data.data;
    } catch (error) {
      console.error('[HttpProviderService] Failed to fetch provider', {
        providerId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }
}
