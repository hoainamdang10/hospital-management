import { apiClient } from './client';
import { ApiResponse } from '../types';

// Prescription types
export interface Prescription {
  id: string;
  patient_id: string;
  doctor_id: string;
  prescription_date: string;
  appointment_id?: string;
  medical_record_id?: string;
  status: 'pending' | 'dispensed' | 'cancelled' | 'expired';
  total_cost: number;
  notes?: string;
  pharmacy_notes?: string;
  dispensed_by?: string;
  dispensed_at?: string;
  created_at: string;
  updated_at: string;
  items?: PrescriptionItem[];
}

export interface PrescriptionItem {
  id: string;
  prescription_id: string;
  medication_id: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  instructions: string;
  created_at: string;
  medication?: Medication;
}

export interface Medication {
  id: string;
  name: string;
  generic_name?: string;
  brand_name?: string;
  category: string;
  form: string;
  strength: string;
  unit: string;
  manufacturer?: string;
  description?: string;
  contraindications?: string;
  side_effects?: string;
  storage_conditions?: string;
  price_per_unit: number;
  stock_quantity: number;
  expiry_date?: string;
  requires_prescription: boolean;
  is_controlled_substance: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreatePrescriptionRequest {
  patient_id: string;
  doctor_id: string;
  prescription_date: string;
  appointment_id?: string;
  medical_record_id?: string;
  notes?: string;
  items: {
    medication_id: string;
    dosage: string;
    frequency: string;
    duration: string;
    quantity: number;
    instructions: string;
  }[];
}

export interface UpdatePrescriptionRequest {
  status?: 'pending' | 'dispensed' | 'cancelled' | 'expired';
  notes?: string;
  pharmacy_notes?: string;
  dispensed_by?: string;
  dispensed_at?: string;
}

export interface CreateMedicationRequest {
  name: string;
  generic_name?: string;
  brand_name?: string;
  category: string;
  form: string;
  strength: string;
  unit: string;
  manufacturer?: string;
  description?: string;
  contraindications?: string;
  side_effects?: string;
  storage_conditions?: string;
  price_per_unit?: number;
  stock_quantity?: number;
  expiry_date?: string;
  requires_prescription?: boolean;
  is_controlled_substance?: boolean;
}

export interface DrugInteraction {
  medication1_id: string;
  medication2_id: string;
  interaction_type: 'minor' | 'moderate' | 'major';
  description: string;
  severity_level: number;
}

// Prescriptions API
export const prescriptionsApi = {
  // Prescriptions CRUD
  getAllPrescriptions: async (params?: { page?: number; limit?: number }): Promise<ApiResponse<Prescription[]>> => {
    return apiClient.get<Prescription[]>('/prescriptions', params);
  },

  getPrescriptionById: async (prescriptionId: string): Promise<ApiResponse<Prescription>> => {
    return apiClient.get<Prescription>(`/prescriptions/${prescriptionId}`);
  },

  getPrescriptionsByPatientId: async (patientId: string): Promise<ApiResponse<Prescription[]>> => {
    return apiClient.get<Prescription[]>(`/prescriptions/patient/${patientId}`);
  },

  getPrescriptionsByDoctorId: async (doctorId: string): Promise<ApiResponse<Prescription[]>> => {
    return apiClient.get<Prescription[]>(`/prescriptions/doctor/${doctorId}`);
  },

  createPrescription: async (data: CreatePrescriptionRequest): Promise<ApiResponse<Prescription>> => {
    return apiClient.post<Prescription>('/prescriptions', data);
  },

  updatePrescription: async (prescriptionId: string, data: UpdatePrescriptionRequest): Promise<ApiResponse<Prescription>> => {
    return apiClient.put<Prescription>(`/prescriptions/${prescriptionId}`, data);
  },

  deletePrescription: async (prescriptionId: string): Promise<ApiResponse<void>> => {
    return apiClient.delete<void>(`/prescriptions/${prescriptionId}`);
  },

  // Medications
  getAllMedications: async (): Promise<ApiResponse<Medication[]>> => {
    return apiClient.get<Medication[]>('/prescriptions/medications');
  },

  searchMedications: async (query: string): Promise<ApiResponse<Medication[]>> => {
    return apiClient.get<Medication[]>('/prescriptions/medications/search', { q: query });
  },

  createMedication: async (data: CreateMedicationRequest): Promise<ApiResponse<Medication>> => {
    return apiClient.post<Medication>('/prescriptions/medications', data);
  },

  // Drug Interactions
  checkDrugInteractions: async (medicationIds: string[]): Promise<ApiResponse<DrugInteraction[]>> => {
    return apiClient.post<DrugInteraction[]>('/prescriptions/check-interactions', { medicationIds });
  },
};
