// Supabase Database Types - Based on actual database structure

// User types from Supabase
export interface SupabaseUser {
  user_id: string;
  email: string;
  password_hash: string;
  role: string;
  full_name: string;
  phone_number: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login: string;
  profile_id: string;
}

// Doctor types from Supabase
export interface SupabaseDoctor {
  doctor_id: string;
  full_name: string;
  specialty: string;
  qualification: string;
  schedule: string;
  department_id: string;
  license_number: string;
  gender: string;
  photo_url?: string;
  phone_number: string;
  email: string;
  // Joined data
  department_name?: string;
  departments?: {
    department_name: string;
  };
}

// Patient types from Supabase - Updated to match actual database schema
export interface SupabasePatient {
  patient_id: string;
  profile_id: string;
  gender: string;
  blood_type: string;
  address: any; // JSONB field
  emergency_contact: any; // JSONB field
  insurance_info: any; // JSONB field
  medical_history: string;
  allergies: string[]; // Array field
  chronic_conditions: string[]; // Array field (renamed from chronic_diseases)
  current_medications: any; // JSONB field
  status: string;
  notes: string;
  height: number;
  weight: number;
  preferred_language: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  // Personal info comes from profiles table via profile_id
  full_name?: string; // From profiles join
  email?: string; // From profiles join
  phone_number?: string; // From profiles join
  date_of_birth?: string; // From profiles join (correct field name)
}

// Appointment types from Supabase
export interface SupabaseAppointment {
  appointment_id: string;
  patient_id: string;
  doctor_id: string;
  appointment_date: string;
  appointment_time: string;
  treatment_description: string;
  status: string;
  // Joined data
  patient_name?: string;
  doctor_name?: string;
  patients?: {
    full_name: string;
    phone_number: string;
    email: string;
  };
  doctors?: {
    full_name: string;
    specialty: string;
  };
}

// Department types from Supabase
export interface SupabaseDepartment {
  department_id: string;
  department_name: string;
}

// Room types from Supabase
export interface SupabaseRoom {
  room_id: string;
  room_number: string;
  department_id: string;
  room_type: string;
  capacity: number;
  status: string;
  equipment?: any[];
  location?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  department_name?: string;
  departments?: {
    department_id: string;
    name: string;
    description?: string;
    location?: string;
  };
}

// Login session types from Supabase
export interface SupabaseLoginSession {
  session_id: number;
  user_id: string;
  login_time: string;
  logout_time?: string;
  ip_address: string;
  user_agent: string;
  device_info: any;
  session_token: string;
  is_active: boolean;
}

// Form types for Supabase data
export interface SupabaseDoctorForm {
  full_name: string;
  specialty: string;
  qualification: string;
  schedule: string;
  department_id: string;
  license_number: string;
  gender: string;
  photo_url?: string;
  phone_number: string;
  email: string;
}

export interface SupabasePatientForm {
  full_name: string;
  date_of_birth: string; // Fixed: matches database schema
  phone_number: string;
  email: string;
  blood_type: string;
  gender: string;
  address: string;
  allergies: string[];
  chronic_conditions: string[]; // Fixed: matches database schema (renamed from chronic_diseases)
  insurance_info: any; // JSONB field
}

export interface SupabaseAppointmentForm {
  patient_id: string;
  doctor_id: string;
  appointment_date: string;
  appointment_time: string;
  treatment_description: string;
  status: string;
}

export interface SupabaseDepartmentForm {
  department_name: string;
}

export interface SupabaseRoomForm {
  room_number: string;
  department_id: string;
  room_type: string;
  capacity: number;
  status: string;
  equipment?: any[];
  location?: string;
  notes?: string;
}

// Status mappings for Vietnamese data
export const APPOINTMENT_STATUS = {
  'Đã xác nhận': 'confirmed',
  'Chờ xác nhận': 'pending',
  'Đã hủy': 'cancelled',
  'Hoàn thành': 'completed',
} as const;

export const ROOM_STATUS = {
  'Trống': 'available',
  'Đang sử dụng': 'occupied',
  'Bảo trì': 'maintenance',
} as const;

export const GENDER_MAPPING = {
  'Nam': 'Male',
  'Nữ': 'Female',
  'Khác': 'Other',
} as const;

// Utility types for DataTable
export type SupabaseDoctorWithDepartment = SupabaseDoctor & {
  department_name: string;
};

export type SupabasePatientWithAge = SupabasePatient & {
  age: number;
};

export type SupabaseAppointmentWithDetails = SupabaseAppointment & {
  patient_name: string;
  doctor_name: string;
  doctor_specialty?: string;
};

export type SupabaseRoomWithDepartment = SupabaseRoom & {
  department_name: string;
};
