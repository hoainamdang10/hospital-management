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

export interface PatientListResponse {
  success: boolean;
  data?: any[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
  };
  message?: string;
  error?: string;
}

interface GetPatientsParams {
  search?: string;
  page?: number;
  limit?: number;
  status?: string;
  sort?: string;
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

  /**
   * Search/list patients with filters
   */
  async getPatients(params?: GetPatientsParams): Promise<PatientListResponse> {
    const response = await apiClient.get<PatientListResponse>(this.baseUrl, {
      params: {
        page: 1,
        limit: 10,
        ...params,
      },
    });
    return response.data;
  }
}

export const patientsService = new PatientsService();
