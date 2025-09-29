// Base types
export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

// User types - Updated to match auth service
export interface User extends BaseEntity {
  email: string;
  role: 'admin' | 'doctor' | 'patient' | 'nurse' | 'receptionist';
  full_name: string;
  phone_number?: string;
  is_active: boolean;
  last_login?: string;
  profile_id?: string;
  email_verified: boolean;
  phone_verified: boolean;
  profile?: any; // Doctor or Patient profile data
}

// Auth types
export interface LoginForm {
  email: string;
  password: string;
}

// Auth register form for API
export interface AuthRegisterForm {
  email: string;
  password: string;
  role: 'admin' | 'doctor' | 'patient' | 'nurse' | 'receptionist';
  full_name: string;
  phone_number?: string;
  profile_data?: DoctorProfileData | PatientProfileData;
}

export interface LoginResponse {
  user: User;
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface DoctorProfileData {
  specialization: string;
  license_number: string;
  department_id?: string;
  qualification?: string;
  experience_years?: number;
  consultation_fee?: number;
  bio?: string;
}

export interface PatientProfileData {
  date_of_birth: string;
  gender: 'male' | 'female' | 'other';
  blood_type?: string;
  allergies?: string[];
  emergency_contact?: {
    name: string;
    relationship: string;
    phone_number: string;
    email?: string;
  };
  insurance_info?: {
    provider: string;
    policy_number: string;
    group_number?: string;
    expiry_date?: string;
  };
}

export interface UserProfile {
  first_name: string;
  last_name: string;
  phone?: string;
  avatar_url?: string;
}

// Doctor types
export interface Doctor extends BaseEntity {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  specialization: string;
  license_number: string;
  department_id: string;
  status: 'active' | 'inactive' | 'on_leave';
  avatar_url?: string;
  bio?: string;
  experience_years?: number;
  consultation_fee?: number;
  department?: Department;
}

// Patient types
export interface Patient extends BaseEntity {
  user_id?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  date_of_birth: string;
  gender: 'male' | 'female' | 'other';
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  blood_type?: string;
  allergies?: string;
  medical_history?: string;
  insurance_number?: string;
  status: 'active' | 'inactive';
}

// Appointment types
export interface Appointment extends BaseEntity {
  patient_id: string;
  doctor_id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  appointment_type: 'consultation' | 'follow_up' | 'emergency' | 'routine_checkup';
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  reason?: string;
  notes?: string;
  diagnosis?: string;
  patient?: Patient;
  doctor?: Doctor;
}

// Department types
export interface Department extends BaseEntity {
  name: string;
  description?: string;
  head_doctor_id?: string;
  location?: string;
  phone?: string;
  email?: string;
  status: 'active' | 'inactive';
  head_doctor?: Doctor;
}

// Room types - Updated to match database schema
export interface Room extends BaseEntity {
  room_number: string;
  room_type_id: string; // References room_types table
  department_id: string;
  capacity: number;
  status: 'available' | 'occupied' | 'maintenance' | 'reserved';
  equipment?: string;
  notes?: string;
  department?: Department;
  room_type?: RoomType; // Join with room_types table
}

// Room type from database
export interface RoomType {
  room_type_id: string;
  type_name: string; // 'Standard Room', 'VIP Room', 'ICU', 'Operating Room', 'Emergency Room'
  type_code: string; // 'STD', 'VIP', 'ICU', 'OR', 'ER'
  description: string;
  base_price: string;
  is_active: boolean;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  email: string;
  password: string;
  confirmPassword: string;
  role: 'admin' | 'doctor' | 'patient';
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface DoctorForm {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  specialization: string;
  license_number: string;
  department_id: string;
  bio?: string;
  experience_years?: number;
  consultation_fee?: number;
}

export interface PatientForm {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  date_of_birth: string;
  gender: 'male' | 'female' | 'other';
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  blood_type?: string;
  allergies?: string;
  medical_history?: string;
  insurance_number?: string;
}

export interface AppointmentForm {
  patient_id: string;
  doctor_id: string;
  appointment_date: string;
  appointment_time: string;
  duration_minutes: number;
  type: 'consultation' | 'follow_up' | 'emergency' | 'routine_checkup';
  notes?: string;
  symptoms?: string;
}

export interface DepartmentForm {
  name: string;
  description?: string;
  head_doctor_id?: string;
  location?: string;
  phone?: string;
  email?: string;
}

export interface RoomForm {
  room_number: string;
  room_type: 'consultation' | 'surgery' | 'emergency' | 'ward' | 'icu' | 'laboratory';
  department_id: string;
  capacity: number;
  equipment?: string;
  notes?: string;
}

// Filter and search types
export interface FilterOptions {
  search?: string;
  status?: string;
  department_id?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

// Dashboard types
export interface DashboardStats {
  total_patients: number;
  total_doctors: number;
  total_appointments: number;
  total_departments: number;
  appointments_today: number;
  appointments_this_week: number;
  appointments_this_month: number;
  revenue_this_month: number;
}

// Navigation types
export interface NavItem {
  title: string;
  href: string;
  icon?: string;
  badge?: string | number;
  children?: NavItem[];
}

// Theme types
export type Theme = 'light' | 'dark' | 'system';

// Status types
export type Status = 'loading' | 'success' | 'error' | 'idle';

// Toast types
export interface Toast {
  id: string;
  title: string;
  description?: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

// Doctor Profile Page Types
export interface DoctorProfileData {
  doctor_id: string;
  profile_id: string;
  full_name: string;
  specialty: string;
  qualification: string;
  bio: string;
  phone_number: string;
  email: string;
  address: string;
  avatar_url?: string;
  rating: number;
  total_reviews: number;
  experience_years: number;
  consultation_fee: number;
  total_patients: number;
  total_appointments: number;
  availability_status: string;
  department_id: string;
  license_number: string;
  gender: string;
  languages_spoken?: string[];
  created_at: string;
  updated_at: string;
}

export interface AppointmentStats {
  total: number;
  new_patients: number;
  follow_ups: number;
  weekly_data: number[];
  today_count: number;
  this_week_count: number;
  this_month_count: number;
}

export interface ScheduleItem {
  id: string;
  patient_name: string;
  patient_id: string;
  appointment_type: string;
  time: string;
  date: string;
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled';
  notes?: string;
}

export interface Review {
  id: string;
  patient_name: string;
  patient_id: string;
  rating: number;
  comment: string;
  date: string;
  avatar?: string;
  appointment_id?: string;
}

export interface WorkExperience {
  id: string;
  position: string;
  organization: string;
  start_date: string;
  end_date?: string;
  description?: string;
  is_current: boolean;
  type: 'work' | 'education' | 'certification';
}
