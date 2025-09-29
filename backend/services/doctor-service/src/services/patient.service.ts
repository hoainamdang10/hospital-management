import logger from '@hospital/shared/dist/utils/logger';
import { ApiGatewayClient, createApiGatewayClient, defaultApiGatewayConfig } from '@hospital/shared/dist/clients/api-gateway.client';

interface PatientData {
  patient_id: string;
  full_name: string;
  phone_number?: string;
  email?: string;
  date_of_birth?: string;
  gender?: string;
}

interface PatientServiceResponse {
  success: boolean;
  data: PatientData | PatientData[];
}

interface PatientStats {
  total_patients: number;
  unique_patients_this_month: number;
  // New fields from Patient Service stats endpoint
  total_unique_patients?: number;
  new_patients_last_30_days?: number;
  returning_patients_last_30_days?: number;
  new_vs_returning_ratio?: {
    new_percentage: number;
    returning_percentage: number;
  };
  demographics?: {
    gender: {
      male: number;
      female: number;
      other: number;
    };
    age_groups: {
      '0-18': number;
      '19-35': number;
      '36-50': number;
      '51-65': number;
      '65+': number;
    };
  };
  appointment_statistics?: {
    total_appointments: number;
    completed_appointments: number;
    average_appointments_per_patient: number;
    completion_rate: number;
  };
}

export class PatientService {
  private apiGatewayClient: ApiGatewayClient;

  constructor() {
    this.apiGatewayClient = createApiGatewayClient({
      ...defaultApiGatewayConfig,
      serviceName: 'doctor-service',
    });
  }

  // Get patient information by ID
  async getPatientById(patient_id: string): Promise<PatientData | null> {
    try {
      logger.info('🔄 Fetching patient via API Gateway', { patient_id });

      const response = await this.apiGatewayClient.getPatient(patient_id);

      if (response.success && response.data) {
        logger.info('✅ Patient fetched successfully via API Gateway', { patient_id });
        return response.data as PatientData;
      }

      logger.warn('⚠️ Patient not found via API Gateway', { patient_id });
      return null;
    } catch (error) {
      logger.error('❌ Error fetching patient via API Gateway:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        patient_id
      });

      return null;
    }
  }

  // Get multiple patients by IDs
  async getPatientsByIds(patientIds: string[]): Promise<PatientData[]> {
    try {
      const patients: PatientData[] = [];
      
      // Fetch patients in batches to avoid overwhelming the service
      const batchSize = 10;
      for (let i = 0; i < patientIds.length; i += batchSize) {
        const batch = patientIds.slice(i, i + batchSize);
        const batchPromises = batch.map(id => this.getPatientById(id));
        const batchResults = await Promise.allSettled(batchPromises);
        
        batchResults.forEach(result => {
          if (result.status === 'fulfilled' && result.value) {
            patients.push(result.value);
          }
        });
      }

      return patients;
    } catch (error) {
      logger.error('Error fetching multiple patients:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        patientCount: patientIds.length
      });
      
      return [];
    }
  }

  // Get patient statistics for a doctor (patients who have appointments with this doctor)
  async getDoctorPatientStats(doctor_id: string): Promise<PatientStats> {
    try {
      logger.info('🔄 Fetching patient stats via API Gateway', { doctor_id });

      const response = await this.apiGatewayClient.getPatientStats(doctor_id);

      if (response.success && response.data) {
        logger.info('✅ Patient stats fetched successfully via API Gateway', { doctor_id });
        return response.data as PatientStats;
      }

      logger.warn('⚠️ No patient stats found via API Gateway', { doctor_id });
      return {
        total_patients: 0,
        unique_patients_this_month: 0
      };
    } catch (error) {
      logger.error('❌ Error fetching patient stats via API Gateway:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        doctor_id
      });

      return {
        total_patients: 0,
        unique_patients_this_month: 0
      };
    }
  }

  // Check if Patient Service is available
  async isServiceAvailable(): Promise<boolean> {
    try {
      logger.info('🔄 Checking patient service health via API Gateway');

      const isHealthy = await this.apiGatewayClient.checkServiceHealth('patients');

      if (isHealthy) {
        logger.info('✅ Patient service is healthy via API Gateway');
      } else {
        logger.warn('⚠️ Patient service is not healthy via API Gateway');
      }

      return isHealthy;
    } catch (error) {
      logger.error('❌ Error checking patient service health via API Gateway:', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return false;
    }
  }

  // Search patients by name or phone (for appointment display)
  async searchPatients(query: string, limit: number = 10): Promise<PatientData[]> {
    try {
      logger.info('🔄 Searching patients via API Gateway', { query, limit });

      const response = await this.apiGatewayClient.searchPatients(query, limit);

      if (response.success && Array.isArray(response.data)) {
        logger.info('✅ Patients search completed via API Gateway', {
          query,
          resultCount: response.data.length
        });
        return response.data;
      }

      logger.warn('⚠️ No patients found via API Gateway', { query });
      return [];
    } catch (error) {
      logger.error('❌ Error searching patients via API Gateway:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        query,
        limit
      });

      return [];
    }
  }

  // Get patient count for a specific doctor (from appointments)
  async getPatientCountForDoctor(doctor_id: string): Promise<number> {
    try {
      logger.info('🔄 Fetching patient count via API Gateway', { doctor_id });

      // Use the patient stats endpoint which includes patient count
      const stats = await this.getDoctorPatientStats(doctor_id);

      logger.info('✅ Patient count fetched via API Gateway', {
        doctor_id,
        count: stats.total_patients
      });

      return stats.total_patients;
    } catch (error) {
      logger.error('❌ Error fetching patient count via API Gateway:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        doctor_id
      });

      return 0;
    }
  }
}
