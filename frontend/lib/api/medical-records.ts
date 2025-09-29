import { ApiResponse } from "../types";
import { apiClient } from "./client";

// Simplified Medical Record types
export interface MedicalRecord {
  record_id: string; // Keep original field name for compatibility
  patient_id: string;
  doctor_id: string;
  appointment_id?: string;
  visit_date: string;
  // Simplified fields
  symptoms?: string; // Replaces: chief_complaint + present_illness
  examination_notes?: string; // Replaces: physical_examination
  diagnosis?: string;
  treatment?: string; // Replaces: treatment_plan + follow_up_instructions
  medications?: string; // Simple text
  notes?: string;
  basic_vitals?: BasicVitalSigns; // Simplified vital signs
  status: "active" | "archived" | "deleted";
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  // Joined data from other services
  patient_name?: string;
  doctor_name?: string;
  patient_phone?: string;
  patient_age?: number;
}

// REMOVED: LabResult interface - lab results now stored as simple text in medical records

// Simplified Basic Vital Signs - only 5 essential fields
export interface BasicVitalSigns {
  temperature?: number; // Celsius
  blood_pressure?: string; // "120/80" format
  heart_rate?: number; // BPM
  weight?: number; // KG
  height?: number; // CM
}

// Simplified Create Medical Record Request
export interface CreateMedicalRecordRequest {
  patient_id: string;
  doctor_id: string;
  appointment_id?: string;
  visit_date: string;
  // Simplified fields
  symptoms?: string; // Replaces: chief_complaint + present_illness
  examination_notes?: string; // Replaces: physical_examination
  diagnosis?: string;
  treatment?: string; // Replaces: treatment_plan + follow_up_instructions
  medications?: string;
  notes?: string;
  basic_vitals?: BasicVitalSigns;
}

// Simplified Update Medical Record Request
export interface UpdateMedicalRecordRequest {
  symptoms?: string;
  examination_notes?: string;
  diagnosis?: string;
  treatment?: string;
  medications?: string;
  notes?: string;
  basic_vitals?: BasicVitalSigns;
  status?: "active" | "archived" | "deleted";
}

// REMOVED: CreateLabResultRequest - lab results now stored as simple text in medical records
// REMOVED: CreateVitalSignsRequest - vital signs now embedded as BasicVitalSigns in medical records

// ============================================
// PRESCRIPTION TYPES (Merged from Prescription Service)
// ============================================

// Simplified Prescription embedded in Medical Records
export interface EmbeddedPrescription {
  prescription_id: string;
  prescription_date: string;
  status: "active" | "completed" | "cancelled";
  medications: SimplifiedMedication[];
  notes?: string;
  total_cost?: number;
  created_at: string;
  updated_at: string;
}

// Simplified Medication for embedded prescriptions
export interface SimplifiedMedication {
  medication_name: string; // Just the name, no complex lookup
  dosage: string; // Free text (e.g., "500mg")
  instructions: string; // Simple instructions (e.g., "Take twice daily after meals")
  quantity: number;
  cost_per_unit?: number;
  total_cost?: number;
}

// Create Prescription Request (embedded in medical record)
export interface CreateEmbeddedPrescriptionRequest {
  prescription_date: string;
  medications: CreateSimplifiedMedicationRequest[];
  notes?: string;
}

export interface CreateSimplifiedMedicationRequest {
  medication_name: string;
  dosage: string;
  instructions: string;
  quantity: number;
  cost_per_unit?: number;
}

// Update Prescription Request
export interface UpdateEmbeddedPrescriptionRequest {
  status?: "active" | "completed" | "cancelled";
  medications?: CreateSimplifiedMedicationRequest[];
  notes?: string;
}

// Medical Records API
export const medicalRecordsApi = {
  // Medical Records CRUD
  getAllMedicalRecords: async (params?: {
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<MedicalRecord[]>> => {
    return apiClient.get<MedicalRecord[]>("/medical-records", params);
  },

  getMedicalRecordById: async (
    recordId: string
  ): Promise<ApiResponse<MedicalRecord>> => {
    return apiClient.get<MedicalRecord>(`/medical-records/${recordId}`);
  },

  getMedicalRecordsByPatientId: async (
    patientId: string
  ): Promise<ApiResponse<MedicalRecord[]>> => {
    return apiClient.get<MedicalRecord[]>(
      `/medical-records/patient/${patientId}`
    );
  },

  getMedicalRecordsByDoctorId: async (
    doctorId: string
  ): Promise<ApiResponse<MedicalRecord[]>> => {
    return apiClient.get<MedicalRecord[]>(
      `/medical-records/doctor/${doctorId}`
    );
  },

  createMedicalRecord: async (
    data: CreateMedicalRecordRequest
  ): Promise<ApiResponse<MedicalRecord>> => {
    return apiClient.post<MedicalRecord>("/medical-records", data);
  },

  // Alias for compatibility
  create: async (
    data: CreateMedicalRecordRequest
  ): Promise<ApiResponse<MedicalRecord>> => {
    return apiClient.post<MedicalRecord>("/medical-records", data);
  },

  updateMedicalRecord: async (
    recordId: string,
    data: UpdateMedicalRecordRequest
  ): Promise<ApiResponse<MedicalRecord>> => {
    return apiClient.put<MedicalRecord>(`/medical-records/${recordId}`, data);
  },

  deleteMedicalRecord: async (recordId: string): Promise<ApiResponse<void>> => {
    return apiClient.delete<void>(`/medical-records/${recordId}`);
  },

  // REMOVED: Lab Results API methods - lab results now stored as simple text in medical records
  // REMOVED: Vital Signs API methods - vital signs now embedded as BasicVitalSigns in medical records

  // ============================================
  // PRESCRIPTION API METHODS (Merged from Prescription Service)
  // ============================================

  // Create prescription for a medical record
  createPrescriptionForRecord: async (
    recordId: string,
    data: CreateEmbeddedPrescriptionRequest
  ): Promise<ApiResponse<EmbeddedPrescription>> => {
    return apiClient.post<EmbeddedPrescription>(
      `/medical-records/${recordId}/prescriptions`,
      data
    );
  },

  // Update prescription in a medical record
  updatePrescriptionInRecord: async (
    recordId: string,
    prescriptionId: string,
    data: UpdateEmbeddedPrescriptionRequest
  ): Promise<ApiResponse<EmbeddedPrescription>> => {
    return apiClient.put<EmbeddedPrescription>(
      `/medical-records/${recordId}/prescriptions/${prescriptionId}`,
      data
    );
  },

  // Get prescriptions by patient ID
  getPrescriptionsByPatientId: async (
    patientId: string
  ): Promise<ApiResponse<EmbeddedPrescription[]>> => {
    return apiClient.get<EmbeddedPrescription[]>(
      `/medical-records/prescriptions/patient/${patientId}`
    );
  },

  // Get prescriptions by doctor ID
  getPrescriptionsByDoctorId: async (
    doctorId: string
  ): Promise<ApiResponse<EmbeddedPrescription[]>> => {
    return apiClient.get<EmbeddedPrescription[]>(
      `/medical-records/prescriptions/doctor/${doctorId}`
    );
  },
};
