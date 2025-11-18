/**
 * Patients Service
 * API client for Patient Registry Service
 */

import apiClient from './axios';

export interface PatientResponse {
  success: boolean;
  data?: {
    patientId: string;
    userId: string;
    fullName: string;
    dateOfBirth?: string;
    gender?: string;
    email?: string;
    phoneNumber?: string;
    address?: string;
    nationalId?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  };
  message?: string;
  error?: string;
}

class PatientsService {
  private baseUrl = '/v1/patients'; // axios baseURL already includes '/api'

  /**
   * Get patient by userId (from auth.users.id)
   * This is used after login to get patientId for appointment booking
   */
  async getByUserId(userId: string): Promise<PatientResponse> {
    const response = await apiClient.get<PatientResponse>(`${this.baseUrl}/user/${userId}`);
    return response.data;
  }

  /**
   * Get patient by patientId (PAT-format)
   */
  async getById(patientId: string): Promise<PatientResponse> {
    const response = await apiClient.get<PatientResponse>(`${this.baseUrl}/${patientId}`);
    return response.data;
  }
}

export const patientsService = new PatientsService();
