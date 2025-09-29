// Patient types based on Supabase database schema
export interface Address {
  street: string;
  ward: string;
  district: string;
  city: string;
  postal_code?: string;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  address?: string;
}

export interface InsuranceInfo {
  provider: string;
  policy_number: string;
  expiry_date?: string;
  coverage?: string;
}

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  start_date: string;
  end_date?: string;
}

export interface MedicationInfo {
  medications: Medication[];
}

// Main Patient interface matching Supabase schema (CLEAN DESIGN)
export interface Patient {
  patient_id: string;
  profile_id: string;
  // ✅ CLEAN DESIGN: NO full_name, date_of_birth - they are in profiles table
  gender: 'male' | 'female' | 'other';
  blood_type?: string;
  address?: Address;
  emergency_contact?: EmergencyContact;
  insurance_info?: InsuranceInfo;
  medical_history?: string;
  allergies?: string[];
  chronic_conditions?: string[];
  current_medications?: MedicationInfo;
  status: 'active' | 'inactive' | 'suspended';
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

// Patient with profile information joined (CLEAN DESIGN)
export interface PatientWithProfile extends Patient {
  profile?: {
    id: string;
    email: string;
    full_name: string;        // ✅ From profiles table
    date_of_birth?: string;   // ✅ From profiles table
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
  address?: Address;
  emergency_contact?: EmergencyContact;
  insurance_info?: InsuranceInfo;
  medical_history?: string;
  allergies?: string[];
  current_medications?: MedicationInfo;
  notes?: string;
  created_by?: string;
}

// Update Patient DTO
export interface UpdatePatientDto {
  full_name?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other';
  blood_type?: string;
  address?: Address;
  emergency_contact?: EmergencyContact;
  insurance_info?: InsuranceInfo;
  medical_history?: string;
  allergies?: string[];
  current_medications?: MedicationInfo;
  status?: 'active' | 'inactive' | 'suspended';
  notes?: string;
}

// Patient search filters
export interface PatientSearchFilters {
  search?: string; // Search in name, patient_id
  gender?: 'male' | 'female' | 'other';
  status?: 'active' | 'inactive' | 'suspended';
  blood_type?: string;
  age_min?: number;
  age_max?: number;
  created_after?: string;
  created_before?: string;
}

// API Response types
export interface PatientResponse {
  success: boolean;
  data?: Patient | Patient[];
  message?: string;
  error?: string;
  timestamp: string;
}

export interface PaginatedPatientResponse {
  success: boolean;
  data: Patient[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  timestamp: string;
}
