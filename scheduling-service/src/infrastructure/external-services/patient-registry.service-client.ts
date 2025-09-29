/**
 * Patient Registry Service Client - Infrastructure Layer
 * HTTP client for Patient Registry Service integration
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Inter-Service Communication, Healthcare Integration, Circuit Breaker
 */

import { BaseHttpClient, HttpClientConfig } from '../http/base-http.client';
import { IPatientRegistryService } from '../../application/use-cases/schedule-appointment.use-case';
import { PatientInfo } from '../../domain/aggregates/appointment.aggregate';
import { ILogger } from '../../../shared/infrastructure/logging/logger.interface';

export interface PatientRegistryApiResponse<T> {
  success: boolean;
  data?: T;
  message: string;
  errors?: string[];
  timestamp: string;
  requestId: string;
}

export interface PatientProfileApiDto {
  id: string;
  patientId: string;
  fullName: string;
  phone: string;
  email?: string;
  dateOfBirth?: string;
  nationalId?: string;
  gender?: string;
  address?: {
    street: string;
    ward: string;
    district: string;
    city: string;
    postalCode?: string;
  };
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  medicalInfo?: {
    bloodType?: string;
    allergies?: string[];
    chronicConditions?: string[];
    currentMedications?: string[];
  };
  insurance?: {
    provider: string;
    policyNumber: string;
    validUntil: string;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AppointmentHistoryUpdateRequest {
  patientId: string;
  appointmentId: string;
  appointmentType: string;
  providerId: string;
  department: string;
  scheduledAt: string;
  status: string;
  notes?: string;
}

/**
 * Patient Registry Service Client
 * Handles communication with Patient Registry Service
 */
export class PatientRegistryServiceClient extends BaseHttpClient implements IPatientRegistryService {
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
    super('patient-registry-service', config, logger);
    
    this.serviceBaseUrl = serviceBaseUrl;
    this.logger = logger;
  }

  /**
   * Get patient information by patient ID
   */
  async getPatient(patientId: string): Promise<PatientInfo | null> {
    try {
      this.logger.info('Getting patient information', {
        patientId,
        service: 'patient-registry-service'
      });

      const response = await this.get<PatientRegistryApiResponse<PatientProfileApiDto>>(
        `/api/v1/patients/${patientId}`
      );

      if (!response.data.success || !response.data.data) {
        this.logger.warn('Patient not found in registry service', {
          patientId,
          message: response.data.message
        });
        return null;
      }

      const patientDto = response.data.data;
      const patientInfo = this.mapToPatientInfo(patientDto);

      this.logger.info('Patient information retrieved successfully', {
        patientId,
        fullName: patientInfo.fullName,
        hasEmergencyContact: !!patientInfo.emergencyContact
      });

      return patientInfo;

    } catch (error) {
      this.logger.error('Error getting patient information', {
        patientId,
        error: error.message,
        stack: error.stack
      });

      // Return null instead of throwing to allow graceful handling
      return null;
    }
  }

  /**
   * Validate if patient exists in the system
   */
  async validatePatientExists(patientId: string): Promise<boolean> {
    try {
      this.logger.debug('Validating patient existence', {
        patientId,
        service: 'patient-registry-service'
      });

      const response = await this.get<PatientRegistryApiResponse<{ exists: boolean }>>(
        `/api/v1/patients/${patientId}/exists`
      );

      const exists = response.data.success && response.data.data?.exists === true;

      this.logger.debug('Patient existence validation completed', {
        patientId,
        exists
      });

      return exists;

    } catch (error) {
      this.logger.error('Error validating patient existence', {
        patientId,
        error: error.message
      });

      // Return false on error to be safe
      return false;
    }
  }

  /**
   * Update patient appointment history
   */
  async updatePatientAppointmentHistory(patientId: string, appointmentId: string): Promise<void> {
    try {
      this.logger.info('Updating patient appointment history', {
        patientId,
        appointmentId,
        service: 'patient-registry-service'
      });

      const updateRequest: AppointmentHistoryUpdateRequest = {
        patientId,
        appointmentId,
        appointmentType: 'consultation', // Would be passed from appointment
        providerId: 'unknown', // Would be passed from appointment
        department: 'unknown', // Would be passed from appointment
        scheduledAt: new Date().toISOString(),
        status: 'scheduled',
        notes: 'Appointment scheduled via Scheduling Service'
      };

      const response = await this.post<PatientRegistryApiResponse<any>>(
        `/api/v1/patients/${patientId}/appointment-history`,
        updateRequest
      );

      if (!response.data.success) {
        throw new Error(`Failed to update appointment history: ${response.data.message}`);
      }

      this.logger.info('Patient appointment history updated successfully', {
        patientId,
        appointmentId
      });

    } catch (error) {
      this.logger.error('Error updating patient appointment history', {
        patientId,
        appointmentId,
        error: error.message,
        stack: error.stack
      });

      // Don't throw error to prevent appointment creation failure
      // Log error and continue
    }
  }

  /**
   * Get patient appointment history
   */
  async getPatientAppointmentHistory(
    patientId: string,
    limit: number = 10,
    offset: number = 0
  ): Promise<any[]> {
    try {
      this.logger.debug('Getting patient appointment history', {
        patientId,
        limit,
        offset,
        service: 'patient-registry-service'
      });

      const response = await this.get<PatientRegistryApiResponse<any[]>>(
        `/api/v1/patients/${patientId}/appointment-history?limit=${limit}&offset=${offset}`
      );

      if (!response.data.success || !response.data.data) {
        this.logger.warn('No appointment history found for patient', {
          patientId
        });
        return [];
      }

      this.logger.debug('Patient appointment history retrieved', {
        patientId,
        historyCount: response.data.data.length
      });

      return response.data.data;

    } catch (error) {
      this.logger.error('Error getting patient appointment history', {
        patientId,
        error: error.message
      });

      return [];
    }
  }

  /**
   * Search patients by criteria
   */
  async searchPatients(
    searchTerm: string,
    criteria?: {
      phone?: string;
      email?: string;
      nationalId?: string;
      dateOfBirth?: string;
    },
    limit: number = 20
  ): Promise<PatientInfo[]> {
    try {
      this.logger.debug('Searching patients', {
        searchTerm,
        criteria,
        limit,
        service: 'patient-registry-service'
      });

      const queryParams = new URLSearchParams({
        q: searchTerm,
        limit: limit.toString()
      });

      if (criteria) {
        Object.entries(criteria).forEach(([key, value]) => {
          if (value) {
            queryParams.append(key, value);
          }
        });
      }

      const response = await this.get<PatientRegistryApiResponse<PatientProfileApiDto[]>>(
        `/api/v1/patients/search?${queryParams.toString()}`
      );

      if (!response.data.success || !response.data.data) {
        this.logger.debug('No patients found for search criteria', {
          searchTerm,
          criteria
        });
        return [];
      }

      const patients = response.data.data.map(dto => this.mapToPatientInfo(dto));

      this.logger.debug('Patient search completed', {
        searchTerm,
        resultCount: patients.length
      });

      return patients;

    } catch (error) {
      this.logger.error('Error searching patients', {
        searchTerm,
        criteria,
        error: error.message
      });

      return [];
    }
  }

  /**
   * Get patient medical information
   */
  async getPatientMedicalInfo(patientId: string): Promise<any | null> {
    try {
      this.logger.debug('Getting patient medical information', {
        patientId,
        service: 'patient-registry-service'
      });

      const response = await this.get<PatientRegistryApiResponse<any>>(
        `/api/v1/patients/${patientId}/medical-info`
      );

      if (!response.data.success || !response.data.data) {
        this.logger.debug('No medical information found for patient', {
          patientId
        });
        return null;
      }

      this.logger.debug('Patient medical information retrieved', {
        patientId,
        hasAllergies: !!response.data.data.allergies?.length,
        hasChronicConditions: !!response.data.data.chronicConditions?.length
      });

      return response.data.data;

    } catch (error) {
      this.logger.error('Error getting patient medical information', {
        patientId,
        error: error.message
      });

      return null;
    }
  }

  /**
   * Private helper methods
   */

  private mapToPatientInfo(dto: PatientProfileApiDto): PatientInfo {
    return {
      patientId: dto.patientId,
      fullName: dto.fullName,
      phone: dto.phone,
      email: dto.email,
      dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
      nationalId: dto.nationalId,
      gender: dto.gender,
      address: dto.address ? {
        street: dto.address.street,
        ward: dto.address.ward,
        district: dto.address.district,
        city: dto.address.city,
        postalCode: dto.address.postalCode
      } : undefined,
      emergencyContact: dto.emergencyContact ? {
        name: dto.emergencyContact.name,
        phone: dto.emergencyContact.phone,
        relationship: dto.emergencyContact.relationship
      } : undefined,
      medicalInfo: dto.medicalInfo ? {
        bloodType: dto.medicalInfo.bloodType,
        allergies: dto.medicalInfo.allergies || [],
        chronicConditions: dto.medicalInfo.chronicConditions || [],
        currentMedications: dto.medicalInfo.currentMedications || []
      } : undefined,
      insurance: dto.insurance ? {
        provider: dto.insurance.provider,
        policyNumber: dto.insurance.policyNumber,
        validUntil: new Date(dto.insurance.validUntil)
      } : undefined,
      isActive: dto.isActive,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt)
    };
  }

  /**
   * Health check for Patient Registry Service
   */
  async checkServiceHealth(): Promise<boolean> {
    try {
      const healthStatus = await this.healthCheck();
      return healthStatus.isHealthy;
    } catch (error) {
      this.logger.error('Patient Registry Service health check failed', {
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
      const response = await this.get<PatientRegistryApiResponse<any>>('/api/v1/statistics');
      return response.data.data || {};
    } catch (error) {
      this.logger.error('Error getting Patient Registry Service statistics', {
        error: error.message
      });
      return {};
    }
  }
}
