import axios from 'axios';
import logger from '@hospital/shared/dist/utils/logger';
import { PatientInfo, PatientServiceResponse } from '../types/appointment.types';

export class PatientService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.PATIENT_SERVICE_URL || 'http://patient-service:3003';
  }

  // Get patient information by ID
  async getPatientById(patient_id: string): Promise<PatientInfo | null> {
    try {
      const response = await axios.get<PatientServiceResponse>(`${patient_id}`, {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success && response.data.data) {
        const patient = response.data.data;
        return {
          patient_id: patient.patient_id,
          full_name: patient.full_name,
          phone_number: patient.profile?.phone_number,
          email: patient.profile?.email,
          date_of_birth: patient.date_of_birth,
          gender: patient.gender
        };
      }

      return null;
    } catch (error) {
      logger.error('Error fetching patient information:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        patient_id
      });
      return null;
    }
  }

  // Verify patient exists and is active
  async verifyPatientExists(patient_id: string): Promise<boolean> {
    try {
      const patient = await this.getPatientById(patient_id);
      return patient !== null;
    } catch (error) {
      logger.error('Error verifying patient existence:', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        patient_id 
      });
      return false;
    }
  }

  // Get patient's appointment history count
  async getPatientAppointmentCount(patient_id: string): Promise<number> {
    try {
      // This would typically call the patient service to get appointment count
      // For now, we'll return 0 as a placeholder
      return 0;
    } catch (error) {
      logger.error('Error fetching patient appointment count:', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        patient_id 
      });
      return 0;
    }
  }

  // Check if patient has any active appointments
  async hasActiveAppointments(patient_id: string): Promise<boolean> {
    try {
      // This would check if patient has any scheduled/confirmed appointments
      // For now, we'll return false as a placeholder
      return false;
    } catch (error) {
      logger.error('Error checking patient active appointments:', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        patient_id 
      });
      return false;
    }
  }
}
