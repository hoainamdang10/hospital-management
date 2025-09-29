export interface MedicalRecord {
  record_id: string;
  patient_id: string;
  doctor_id: string;
  appointment_id?: string;
  visit_date: Date;
  // Simplified medical fields - merge complex terminology into simple text fields
  symptoms?: string; // Replaces: chief_complaint + present_illness
  examination_notes?: string; // Replaces: physical_examination
  diagnosis?: string; // Keep as is
  treatment?: string; // Replaces: treatment_plan + follow_up_instructions
  medications?: string; // Keep as simple text for backward compatibility
  notes?: string;
  // Simplified vital signs embedded
  basic_vitals?: BasicVitalSigns;
  // MERGED: Prescription data embedded (replaces separate Prescription Service)
  prescriptions?: EmbeddedPrescription[]; // Array of prescriptions for this medical record
  status: "active" | "archived" | "deleted";
  created_at: Date;
  updated_at: Date;
  created_by?: string;
  updated_by?: string;
}

// Simplified vital signs - only 5 basic fields
export interface BasicVitalSigns {
  temperature?: number; // Celsius
  blood_pressure?: string; // "120/80" format
  heart_rate?: number; // BPM
  weight?: number; // KG
  height?: number; // CM
}

export interface MedicalRecordAttachment {
  attachment_id: string;
  record_id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  mime_type: string;
  description?: string;
  uploaded_by: string;
  uploaded_at: Date;
}

// REMOVED: LabResult interface - lab results now stored as simple text in medical records
// REMOVED: VitalSignsHistory interface - vital signs now embedded as BasicVitalSigns in medical records

// Keep only essential interfaces for simplified system

// REMOVED: MedicalRecordTemplate - templates are too complex for simplified system

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
  medications?: string; // Keep for backward compatibility
  notes?: string;
  // Basic vital signs
  basic_vitals?: BasicVitalSigns;
  // MERGED: Prescription data (optional)
  prescriptions?: CreateEmbeddedPrescriptionRequest[];
}

export interface UpdateMedicalRecordRequest {
  // Simplified fields
  symptoms?: string;
  examination_notes?: string;
  diagnosis?: string;
  treatment?: string;
  medications?: string; // Keep for backward compatibility
  notes?: string;
  basic_vitals?: BasicVitalSigns;
  // MERGED: Prescription updates
  prescriptions?: CreateEmbeddedPrescriptionRequest[];
  status?: "active" | "archived" | "deleted";
}

// REMOVED: CreateLabResultRequest - lab results now stored as simple text in medical records

// Detailed Vital Signs history row
export interface VitalSignsHistory {
  vital_id: string;
  record_id: string;
  recorded_at: Date;
  recorded_by: string;
  temperature?: number;
  blood_pressure_systolic?: number;
  blood_pressure_diastolic?: number;
  heart_rate?: number;
  respiratory_rate?: number;
  oxygen_saturation?: number;
  weight?: number;
  height?: number;
  bmi?: number;
  notes?: string;
}

// Detailed Lab Result row
export interface LabResult {
  result_id: string;
  record_id: string;
  test_name: string;
  test_type: string;
  test_date: Date;
  result_value?: string;
  reference_range?: string;
  unit?: string;
  status: "pending" | "completed" | "cancelled";
  result_date?: Date;
  lab_technician?: string;
  notes?: string;
  created_at: Date;
}

// REMOVED: CreateVitalSignsRequest - vital signs now embedded as BasicVitalSigns in medical records

// ============================================
// PRESCRIPTION TYPES (Merged from Prescription Service)
// ============================================

// Simplified Prescription embedded in Medical Records
export interface EmbeddedPrescription {
  prescription_id: string;
  prescription_date: Date;
  status: "active" | "completed" | "cancelled";
  medications: SimplifiedMedication[];
  notes?: string;
  total_cost?: number;
  created_at: Date;
  updated_at: Date;
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

// Input types for Vital Signs and Lab Results
export interface CreateVitalSignsRequest {
  recorded_at: string;
  temperature?: number;
  blood_pressure_systolic?: number;
  blood_pressure_diastolic?: number;
  heart_rate?: number;
  respiratory_rate?: number;
  oxygen_saturation?: number;
  weight?: number;
  height?: number;
  notes?: string;
}

export interface CreateLabResultRequest {
  test_name: string;
  test_type: string;
  test_date: string;
  result_value?: string;
  reference_range?: string;
  unit?: string;
  result_date?: string;
  lab_technician?: string;
  notes?: string;
  status?: "pending" | "completed" | "cancelled";
}
