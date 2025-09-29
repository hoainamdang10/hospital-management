import logger from '@hospital/shared/dist/utils/logger';
import { ApiGatewayClient, createApiGatewayClient, defaultApiGatewayConfig } from '@hospital/shared/dist/clients/api-gateway.client';
import {
  DoctorInfo,
  DoctorServiceResponse,
  DoctorAvailabilityResponse,
  DoctorTimeSlotsResponse
} from '../types/appointment.types';

export class DoctorService {
  private apiGatewayClient: ApiGatewayClient;

  constructor() {
    this.apiGatewayClient = createApiGatewayClient({
      ...defaultApiGatewayConfig,
      serviceName: 'appointment-service',
    });
  }

  // Get doctor information by ID
  async getDoctorById(doctor_id: string): Promise<DoctorInfo | null> {
    try {
      logger.info('🔄 Fetching doctor info via API Gateway', { doctor_id });

      const response = await this.apiGatewayClient.getDoctor(doctor_id);

      if (response.success && response.data) {
        const doctor = response.data;

        logger.info('✅ Doctor info fetched successfully via API Gateway', { doctor_id });

        return {
          doctor_id: doctor.doctor_id,
          full_name: doctor.full_name,
          specialty: doctor.specialty,
          phone_number: doctor.phone_number,
          email: doctor.email,
          is_available: true // Will be determined by schedule check
        };
      }

      logger.warn('⚠️ Doctor not found via API Gateway', { doctor_id });
      return null;
    } catch (error) {
      logger.error('❌ Error fetching doctor info via API Gateway:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        doctor_id
      });
      return null;
    }
  }

  // Check doctor availability for a specific date and time
  async checkDoctorAvailability(
    doctor_id: string,
    date: string,
    startTime: string,
    endTime: string
  ): Promise<boolean> {
    try {
      logger.info('🔄 Checking doctor availability via API Gateway', {
        doctor_id,
        date,
        startTime,
        endTime
      });

      const response = await this.apiGatewayClient.getDoctorAvailability(doctor_id, date);

      if (response.success && response.data) {
        const availability = response.data;

        // Check if doctor is available on this day
        if (!availability.is_available) {
          logger.info('⚠️ Doctor not available on this date via API Gateway', { doctor_id, date });
          return false;
        }

        // Check if requested time is within working hours
        const requestStart = this.timeToMinutes(startTime);
        const requestEnd = this.timeToMinutes(endTime);
        const workStart = this.timeToMinutes(availability.start_time);
        const workEnd = this.timeToMinutes(availability.end_time);

        if (requestStart < workStart || requestEnd > workEnd) {
          logger.info('⚠️ Requested time outside working hours via API Gateway', {
            doctor_id,
            requestStart,
            requestEnd,
            workStart,
            workEnd
          });
          return false;
        }

        // Check if requested time conflicts with break time
        if (availability.break_start && availability.break_end) {
          const breakStart = this.timeToMinutes(availability.break_start);
          const breakEnd = this.timeToMinutes(availability.break_end);

          if (
            (requestStart >= breakStart && requestStart < breakEnd) ||
            (requestEnd > breakStart && requestEnd <= breakEnd) ||
            (requestStart <= breakStart && requestEnd >= breakEnd)
          ) {
            logger.info('⚠️ Requested time conflicts with break time via API Gateway', {
              doctor_id,
              breakStart,
              breakEnd
            });
            return false;
          }
        }

        logger.info('✅ Doctor is available via API Gateway', { doctor_id, date, startTime, endTime });
        return true;
      }

      logger.warn('⚠️ No availability data found via API Gateway', { doctor_id, date });
      return false;
    } catch (error) {
      logger.error('❌ Error checking doctor availability via API Gateway:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        doctor_id,
        date,
        startTime,
        endTime
      });
      return false;
    }
  }

  // Get available time slots for a doctor on a specific date
  async getAvailableTimeSlots(
    doctor_id: string,
    date: string,
    duration: number = 30
  ): Promise<{ start_time: string; end_time: string }[]> {
    try {
      logger.info('🔄 Fetching available time slots via API Gateway', {
        doctor_id,
        date,
        duration
      });

      const response = await this.apiGatewayClient.getDoctorTimeSlots(doctor_id, date, duration);

      if (response.success && response.data) {
        logger.info('✅ Time slots fetched successfully via API Gateway', {
          doctor_id,
          date,
          slotsCount: response.data.length
        });
        return response.data;
      }

      logger.warn('⚠️ No time slots found via API Gateway', { doctor_id, date });
      return [];
    } catch (error) {
      logger.error('❌ Error fetching time slots via API Gateway:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        doctor_id,
        date,
        duration
      });
      return [];
    }
  }

  // Verify doctor exists
  async verifyDoctorExists(doctor_id: string): Promise<boolean> {
    try {
      logger.info('🔄 Verifying doctor existence via API Gateway', { doctor_id });

      const doctor = await this.getDoctorById(doctor_id);
      const exists = doctor !== null;

      if (exists) {
        logger.info('✅ Doctor exists via API Gateway', { doctor_id });
      } else {
        logger.warn('⚠️ Doctor does not exist via API Gateway', { doctor_id });
      }

      return exists;
    } catch (error) {
      logger.error('❌ Error verifying doctor existence via API Gateway:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        doctor_id
      });
      return false;
    }
  }

  // Helper method to convert time string to minutes
  private timeToMinutes(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  // Helper method to convert minutes to time string
  private minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }
}
