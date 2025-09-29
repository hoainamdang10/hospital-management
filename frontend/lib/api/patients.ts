import { apiClient } from './client';
import { ApiResponse, FilterOptions } from '../types';

// Patient types matching backend service
export interface PatientAddress {
  street?: string;
  district?: string;
  city?: string;
  postal_code?: string;
}

export interface PatientEmergencyContact {
  name?: string;
  phone?: string;
  relationship?: string;
  email?: string;
}

export interface PatientInsuranceInfo {
  provider?: string;
  policy_number?: string;
  group_number?: string;
  expiry_date?: string;
}

export interface PatientMedicationInfo {
  current_medications?: string[];
  medication_allergies?: string[];
}

// Main Patient interface matching backend
export interface Patient {
  patient_id: string;
  profile_id: string;
  gender: 'male' | 'female' | 'other';
  blood_type?: string;
  address?: PatientAddress;
  emergency_contact?: PatientEmergencyContact;
  insurance_info?: PatientInsuranceInfo;
  medical_history?: string;
  allergies?: string[];
  chronic_conditions?: string[];
  current_medications?: PatientMedicationInfo;
  status: 'active' | 'inactive' | 'suspended';
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

// Patient with profile information
export interface PatientWithProfile extends Patient {
  profile?: {
    id: string;
    email: string;
    full_name: string;
    date_of_birth?: string;
    phone_number?: string;
    role: string;
    is_active: boolean;
    email_verified: boolean;
    phone_verified: boolean;
  };
}

// Create Patient DTO
export interface CreatePatientDto {
  profile_id: string;
  full_name: string;
  date_of_birth: string;
  gender: 'male' | 'female' | 'other';
  blood_type?: string;
  address?: PatientAddress;
  emergency_contact?: PatientEmergencyContact;
  insurance_info?: PatientInsuranceInfo;
  medical_history?: string;
  allergies?: string[];
  current_medications?: PatientMedicationInfo;
  notes?: string;
  created_by?: string;
}

// Update Patient DTO
export interface UpdatePatientDto {
  full_name?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other';
  blood_type?: string;
  address?: PatientAddress;
  emergency_contact?: PatientEmergencyContact;
  insurance_info?: PatientInsuranceInfo;
  medical_history?: string;
  allergies?: string[];
  current_medications?: PatientMedicationInfo;
  status?: 'active' | 'inactive' | 'suspended';
  notes?: string;
}

// Patient search filters
export interface PatientSearchFilters {
  search?: string;
  gender?: 'male' | 'female' | 'other';
  status?: 'active' | 'inactive' | 'suspended';
  blood_type?: string;
  age_min?: number;
  age_max?: number;
  created_after?: string;
  created_before?: string;
  page?: number;
  limit?: number;
}

// Paginated response
export interface PaginatedPatientResponse {
  success: boolean;
  data: PatientWithProfile[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  timestamp: string;
}

// Patients API endpoints
export const patientsApi = {
  // Get all patients with pagination
  getAll: async (filters?: PatientSearchFilters): Promise<ApiResponse<PaginatedPatientResponse>> => {
    return apiClient.get<PaginatedPatientResponse>('/patients', filters);
  },

  // Get patient by ID
  getById: async (id: string): Promise<ApiResponse<PatientWithProfile>> => {
    return apiClient.get<PatientWithProfile>(`/patients/${id}`);
  },

  // Create new patient
  create: async (patientData: CreatePatientDto): Promise<ApiResponse<Patient>> => {
    return apiClient.post<Patient>('/patients', patientData);
  },

  // Update patient
  update: async (id: string, patientData: UpdatePatientDto): Promise<ApiResponse<Patient>> => {
    return apiClient.put<Patient>(`/patients/${id}`, patientData);
  },

  // Delete patient (soft delete)
  delete: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.delete<{ message: string }>(`/patients/${id}`);
  },

  // Update patient status
  updateStatus: async (id: string, status: 'active' | 'inactive' | 'suspended'): Promise<ApiResponse<Patient>> => {
    return apiClient.patch<Patient>(`/patients/${id}/status`, { status });
  },

  // Get patient's appointments
  getAppointments: async (id: string, filters?: FilterOptions): Promise<ApiResponse<any[]>> => {
    return apiClient.get<any[]>(`/patients/${id}/appointments`, filters);
  },

  // Get patient's medical history
  getMedicalHistory: async (id: string): Promise<ApiResponse<any[]>> => {
    return apiClient.get<any[]>(`/patients/${id}/medical-history`);
  },

  // Search patients (use getAll with search filter instead)
  // search: async (query: string): Promise<ApiResponse<PatientWithProfile[]>> => {
  //   return apiClient.get<PatientWithProfile[]>('/patients/search', { q: query });
  // },

  // Get patient by profile ID
  getByProfileId: async (profileId: string): Promise<ApiResponse<PatientWithProfile>> => {
    return apiClient.get<PatientWithProfile>(`/patients/profile/${profileId}`);
  },

  // Get patient statistics
  getStats: async (): Promise<ApiResponse<any>> => {
    return apiClient.get<any>('/patients/stats');
  },

  // Upload patient avatar
  uploadAvatar: async (id: string, file: File): Promise<ApiResponse<{ avatar_url: string }>> => {
    return apiClient.uploadFile<{ avatar_url: string }>(`/patients/${id}/avatar`, file);
  },
};
