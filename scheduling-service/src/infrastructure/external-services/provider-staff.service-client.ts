/**
 * Provider/Staff Service Client - Infrastructure Layer
 * HTTP client for Provider/Staff Service integration
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Inter-Service Communication, Healthcare Integration, Circuit Breaker
 */

import { BaseHttpClient, HttpClientConfig } from '../http/base-http.client';
import { IProviderStaffService } from '../../application/use-cases/schedule-appointment.use-case';
import { ProviderInfo } from '../../domain/aggregates/appointment.aggregate';
import { ILogger } from '../../../shared/infrastructure/logging/logger.interface';

export interface ProviderStaffApiResponse<T> {
  success: boolean;
  data?: T;
  message: string;
  errors?: string[];
  timestamp: string;
  requestId: string;
}

export interface DoctorProfileApiDto {
  id: string;
  doctorId: string;
  fullName: string;
  specialization: string;
  department: string;
  licenseNumber: string;
  phone: string;
  email: string;
  title: string;
  experience: number;
  education: {
    degree: string;
    university: string;
    graduationYear: number;
  }[];
  certifications: {
    name: string;
    issuedBy: string;
    issuedDate: string;
    expiryDate?: string;
  }[];
  workSchedule: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isAvailable: boolean;
  }[];
  consultationFee: number;
  rating: number;
  totalReviews: number;
  availableLanguages: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProviderAvailabilityRequest {
  providerId: string;
  startTime: string;
  endTime: string;
  appointmentType?: string;
  excludeAppointmentId?: string;
}

export interface TimeSlotBookingRequest {
  providerId: string;
  appointmentId: string;
  startTime: string;
  endTime: string;
  appointmentType: string;
  patientId: string;
  reason: string;
  priority: string;
  bookedBy: string;
}

export interface ProviderCapabilityRequest {
  providerId: string;
  appointmentType: string;
  requiredSpecializations?: string[];
  requiredCertifications?: string[];
}

/**
 * Provider/Staff Service Client
 * Handles communication with Provider/Staff Service
 */
export class ProviderStaffServiceClient extends BaseHttpClient implements IProviderStaffService {
  private readonly serviceBaseUrl: string;

  constructor(
    serviceBaseUrl: string,
    logger: ILogger,
    customConfig?: Partial<HttpClientConfig>
  ) {
    const defaultConfig: HttpClientConfig = {
      baseURL: serviceBaseUrl,
      timeout: 10000, // 10 seconds
      retryConfig: {
        maxRetries: 3,
        baseDelay: 1000,
        maxDelay: 5000,
        backoffMultiplier: 2
      },
      circuitBreakerConfig: {
        failureThreshold: 5,
        resetTimeout: 30000, // 30 seconds
        monitoringPeriod: 60000 // 1 minute
      },
      defaultHeaders: {
        'X-Service-Name': 'scheduling-service',
        'X-Service-Version': '2.0.0'
      }
    };

    const config = { ...defaultConfig, ...customConfig };
    super('provider-staff-service', config, logger);
    
    this.serviceBaseUrl = serviceBaseUrl;
    this.logger = logger;
  }

  /**
   * Get provider information by provider ID
   */
  async getProvider(providerId: string): Promise<ProviderInfo | null> {
    try {
      this.logger.info('Getting provider information', {
        providerId,
        service: 'provider-staff-service'
      });

      const response = await this.get<ProviderStaffApiResponse<DoctorProfileApiDto>>(
        `/api/v1/doctors/${providerId}`
      );

      if (!response.data.success || !response.data.data) {
        this.logger.warn('Provider not found in staff service', {
          providerId,
          message: response.data.message
        });
        return null;
      }

      const doctorDto = response.data.data;
      const providerInfo = this.mapToProviderInfo(doctorDto);

      this.logger.info('Provider information retrieved successfully', {
        providerId,
        fullName: providerInfo.fullName,
        department: providerInfo.department,
        specialization: providerInfo.specialization
      });

      return providerInfo;

    } catch (error) {
      this.logger.error('Error getting provider information', {
        providerId,
        error: error.message,
        stack: error.stack
      });

      // Return null instead of throwing to allow graceful handling
      return null;
    }
  }

  /**
   * Validate provider availability for specific time slot
   */
  async validateProviderAvailability(
    providerId: string,
    startTime: Date,
    endTime: Date
  ): Promise<boolean> {
    try {
      this.logger.debug('Validating provider availability', {
        providerId,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        service: 'provider-staff-service'
      });

      const request: ProviderAvailabilityRequest = {
        providerId,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString()
      };

      const response = await this.post<ProviderStaffApiResponse<{ isAvailable: boolean; conflicts?: any[] }>>(
        `/api/v1/doctors/${providerId}/availability/check`,
        request
      );

      const isAvailable = response.data.success && response.data.data?.isAvailable === true;

      this.logger.debug('Provider availability validation completed', {
        providerId,
        isAvailable,
        conflicts: response.data.data?.conflicts?.length || 0
      });

      return isAvailable;

    } catch (error) {
      this.logger.error('Error validating provider availability', {
        providerId,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        error: error.message
      });

      // Return false on error to be safe
      return false;
    }
  }

  /**
   * Book provider time slot for appointment
   */
  async bookProviderTimeSlot(
    providerId: string,
    startTime: Date,
    endTime: Date,
    appointmentId: string
  ): Promise<void> {
    try {
      this.logger.info('Booking provider time slot', {
        providerId,
        appointmentId,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        service: 'provider-staff-service'
      });

      const request: TimeSlotBookingRequest = {
        providerId,
        appointmentId,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        appointmentType: 'consultation', // Would be passed from appointment
        patientId: 'unknown', // Would be passed from appointment
        reason: 'Appointment booking via Scheduling Service',
        priority: 'normal',
        bookedBy: 'scheduling-service'
      };

      const response = await this.post<ProviderStaffApiResponse<any>>(
        `/api/v1/doctors/${providerId}/time-slots/book`,
        request
      );

      if (!response.data.success) {
        throw new Error(`Failed to book time slot: ${response.data.message}`);
      }

      this.logger.info('Provider time slot booked successfully', {
        providerId,
        appointmentId,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString()
      });

    } catch (error) {
      this.logger.error('Error booking provider time slot', {
        providerId,
        appointmentId,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        error: error.message,
        stack: error.stack
      });

      // Don't throw error to prevent appointment creation failure
      // Log error and continue
    }
  }

  /**
   * Validate provider capabilities for appointment type
   */
  async validateProviderCapabilities(
    providerId: string,
    appointmentType: string
  ): Promise<boolean> {
    try {
      this.logger.debug('Validating provider capabilities', {
        providerId,
        appointmentType,
        service: 'provider-staff-service'
      });

      const request: ProviderCapabilityRequest = {
        providerId,
        appointmentType
      };

      const response = await this.post<ProviderStaffApiResponse<{ hasCapabilities: boolean; missingRequirements?: string[] }>>(
        `/api/v1/doctors/${providerId}/capabilities/validate`,
        request
      );

      const hasCapabilities = response.data.success && response.data.data?.hasCapabilities === true;

      this.logger.debug('Provider capabilities validation completed', {
        providerId,
        appointmentType,
        hasCapabilities,
        missingRequirements: response.data.data?.missingRequirements || []
      });

      return hasCapabilities;

    } catch (error) {
      this.logger.error('Error validating provider capabilities', {
        providerId,
        appointmentType,
        error: error.message
      });

      // Return true on error to be permissive (could be service down)
      return true;
    }
  }

  /**
   * Get provider schedule for date range
   */
  async getProviderSchedule(
    providerId: string,
    startDate: Date,
    endDate: Date
  ): Promise<any[]> {
    try {
      this.logger.debug('Getting provider schedule', {
        providerId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        service: 'provider-staff-service'
      });

      const response = await this.get<ProviderStaffApiResponse<any[]>>(
        `/api/v1/doctors/${providerId}/schedule?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      );

      if (!response.data.success || !response.data.data) {
        this.logger.debug('No schedule found for provider', {
          providerId,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        });
        return [];
      }

      this.logger.debug('Provider schedule retrieved', {
        providerId,
        scheduleCount: response.data.data.length
      });

      return response.data.data;

    } catch (error) {
      this.logger.error('Error getting provider schedule', {
        providerId,
        error: error.message
      });

      return [];
    }
  }

  /**
   * Search providers by criteria
   */
  async searchProviders(
    searchTerm: string,
    criteria?: {
      department?: string;
      specialization?: string;
      availableDate?: string;
      availableTime?: string;
      minRating?: number;
    },
    limit: number = 20
  ): Promise<ProviderInfo[]> {
    try {
      this.logger.debug('Searching providers', {
        searchTerm,
        criteria,
        limit,
        service: 'provider-staff-service'
      });

      const queryParams = new URLSearchParams({
        q: searchTerm,
        limit: limit.toString()
      });

      if (criteria) {
        Object.entries(criteria).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, value.toString());
          }
        });
      }

      const response = await this.get<ProviderStaffApiResponse<DoctorProfileApiDto[]>>(
        `/api/v1/doctors/search?${queryParams.toString()}`
      );

      if (!response.data.success || !response.data.data) {
        this.logger.debug('No providers found for search criteria', {
          searchTerm,
          criteria
        });
        return [];
      }

      const providers = response.data.data.map(dto => this.mapToProviderInfo(dto));

      this.logger.debug('Provider search completed', {
        searchTerm,
        resultCount: providers.length
      });

      return providers;

    } catch (error) {
      this.logger.error('Error searching providers', {
        searchTerm,
        criteria,
        error: error.message
      });

      return [];
    }
  }

  /**
   * Get provider statistics
   */
  async getProviderStatistics(providerId: string): Promise<any> {
    try {
      this.logger.debug('Getting provider statistics', {
        providerId,
        service: 'provider-staff-service'
      });

      const response = await this.get<ProviderStaffApiResponse<any>>(
        `/api/v1/doctors/${providerId}/statistics`
      );

      if (!response.data.success || !response.data.data) {
        this.logger.debug('No statistics found for provider', {
          providerId
        });
        return {};
      }

      return response.data.data;

    } catch (error) {
      this.logger.error('Error getting provider statistics', {
        providerId,
        error: error.message
      });

      return {};
    }
  }

  /**
   * Cancel provider time slot booking
   */
  async cancelProviderTimeSlot(
    providerId: string,
    appointmentId: string,
    reason: string
  ): Promise<void> {
    try {
      this.logger.info('Cancelling provider time slot', {
        providerId,
        appointmentId,
        reason,
        service: 'provider-staff-service'
      });

      const response = await this.post<ProviderStaffApiResponse<any>>(
        `/api/v1/doctors/${providerId}/time-slots/${appointmentId}/cancel`,
        { reason, cancelledBy: 'scheduling-service' }
      );

      if (!response.data.success) {
        throw new Error(`Failed to cancel time slot: ${response.data.message}`);
      }

      this.logger.info('Provider time slot cancelled successfully', {
        providerId,
        appointmentId
      });

    } catch (error) {
      this.logger.error('Error cancelling provider time slot', {
        providerId,
        appointmentId,
        error: error.message
      });

      // Don't throw error to prevent appointment cancellation failure
    }
  }

  /**
   * Private helper methods
   */

  private mapToProviderInfo(dto: DoctorProfileApiDto): ProviderInfo {
    return {
      providerId: dto.doctorId,
      fullName: dto.fullName,
      specialization: dto.specialization,
      department: dto.department,
      licenseNumber: dto.licenseNumber,
      phone: dto.phone,
      email: dto.email,
      title: dto.title,
      experience: dto.experience,
      education: dto.education?.map(edu => ({
        degree: edu.degree,
        university: edu.university,
        graduationYear: edu.graduationYear
      })) || [],
      certifications: dto.certifications?.map(cert => ({
        name: cert.name,
        issuedBy: cert.issuedBy,
        issuedDate: new Date(cert.issuedDate),
        expiryDate: cert.expiryDate ? new Date(cert.expiryDate) : undefined
      })) || [],
      workSchedule: dto.workSchedule?.map(schedule => ({
        dayOfWeek: schedule.dayOfWeek,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        isAvailable: schedule.isAvailable
      })) || [],
      consultationFee: dto.consultationFee,
      rating: dto.rating,
      totalReviews: dto.totalReviews,
      availableLanguages: dto.availableLanguages || ['vi'],
      isActive: dto.isActive,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt)
    };
  }

  /**
   * Health check for Provider/Staff Service
   */
  async checkServiceHealth(): Promise<boolean> {
    try {
      const healthStatus = await this.healthCheck();
      return healthStatus.isHealthy;
    } catch (error) {
      this.logger.error('Provider/Staff Service health check failed', {
        error: error.message
      });
      return false;
    }
  }

  /**
   * Get service statistics
   */
  async getServiceStatistics(): Promise<any> {
    try {
      const response = await this.get<ProviderStaffApiResponse<any>>('/api/v1/statistics');
      return response.data.data || {};
    } catch (error) {
      this.logger.error('Error getting Provider/Staff Service statistics', {
        error: error.message
      });
      return {};
    }
  }
}
