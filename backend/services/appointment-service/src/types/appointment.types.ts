// Appointment types based on Supabase database schema
export interface Appointment {
  appointment_id: string;
  patient_id: string;
  doctor_id: string;
  appointment_date: string; // YYYY-MM-DD
  appointment_time: string; // HH:mm
  duration_minutes: number;
  type:
    | "consultation"
    | "follow_up"
    | "emergency"
    | "telemedicine"
    | "surgery"
    | "procedure";
  status:
    | "scheduled"
    | "confirmed"
    | "in_progress"
    | "completed"
    | "cancelled"
    | "no_show";
  reason?: string;
  notes?: string;
  diagnosis?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

// Appointment with joined doctor and patient information
export interface AppointmentWithDetails extends Appointment {
  doctor?: {
    doctor_id: string;
    full_name: string;
    specialty: string;
    phone_number?: string;
    email?: string;
  };
  patient?: {
    patient_id: string;
    full_name: string;
    phone_number?: string;
    email?: string;
    date_of_birth?: string;
    gender?: string;
  };
}

// Create Appointment DTO
export interface CreateAppointmentDto {
  patient_id: string;
  doctor_id: string;
  appointment_date: string;
  appointment_time: string;
  duration_minutes: number;
  type:
    | "consultation"
    | "follow_up"
    | "emergency"
    | "telemedicine"
    | "surgery"
    | "procedure";
  reason?: string;
  notes?: string;
  created_by?: string;
}

// Update Appointment DTO
export interface UpdateAppointmentDto {
  appointment_date?: string;
  appointment_time?: string;
  duration_minutes?: number;
  type?:
    | "consultation"
    | "follow_up"
    | "emergency"
    | "telemedicine"
    | "surgery"
    | "procedure";
  status?:
    | "scheduled"
    | "confirmed"
    | "in_progress"
    | "completed"
    | "cancelled"
    | "no_show";
  reason?: string;
  notes?: string;
  diagnosis?: string;
}

// Appointment search filters
export interface AppointmentSearchFilters {
  doctor_id?: string;
  patient_id?: string;
  appointment_date?: string;
  date_from?: string;
  date_to?: string;
  status?:
    | "scheduled"
    | "confirmed"
    | "in_progress"
    | "completed"
    | "cancelled"
    | "no_show";
  type?:
    | "consultation"
    | "follow_up"
    | "emergency"
    | "telemedicine"
    | "surgery"
    | "procedure";
  search?: string; // Search in patient name, doctor name, reason
}

// Available time slot
export interface TimeSlot {
  date: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
  doctor_id: string;
  slot_duration: number;
}

// Doctor availability request
export interface AvailabilityRequest {
  doctor_id: string;
  date: string;
  duration?: number; // in minutes, default 30
}

// API Response types
export interface AppointmentResponse {
  success: boolean;
  data?:
    | Appointment
    | Appointment[]
    | AppointmentWithDetails
    | AppointmentWithDetails[];
  message?: string;
  error?: string;
  timestamp: string;
}

export interface PaginatedAppointmentResponse {
  success: boolean;
  data: AppointmentWithDetails[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  timestamp: string;
}

export interface TimeSlotsResponse {
  success: boolean;
  data: TimeSlot[];
  doctor_id: string;
  date: string;
  timestamp: string;
}

// Appointment statistics
export interface AppointmentStats {
  total: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
  byStatus: {
    scheduled: number;
    confirmed: number;
    in_progress: number;
    completed: number;
    cancelled: number;
    no_show: number;
  };
  byType: {
    consultation: number;
    follow_up: number;
    emergency: number;
    telemedicine: number;
    surgery: number;
    procedure: number;
  };
}

// Doctor service integration types
export interface DoctorInfo {
  doctor_id: string;
  full_name: string;
  specialty: string;
  phone_number?: string;
  email?: string;
  is_available?: boolean;
}

// Patient service integration types
export interface PatientInfo {
  patient_id: string;
  full_name: string;
  phone_number?: string;
  email?: string;
  date_of_birth?: string;
  gender?: string;
}

// Appointment conflict check
export interface ConflictCheck {
  has_conflict: boolean;
  conflicting_appointments?: Appointment[];
  message?: string;
}

// Doctor service API response types
export interface DoctorServiceResponse {
  success: boolean;
  data?: any;
  message?: string;
  error?: string;
}

export interface DoctorAvailabilityData {
  is_available: boolean;
  start_time: string;
  end_time: string;
  break_start?: string;
  break_end?: string;
}

export interface DoctorAvailabilityResponse {
  success: boolean;
  data?: DoctorAvailabilityData;
  message?: string;
  error?: string;
}

export interface DoctorTimeSlotsResponse {
  success: boolean;
  data?: { start_time: string; end_time: string }[];
  message?: string;
  error?: string;
}

// Patient service API response types
export interface PatientServiceResponse {
  success: boolean;
  data?: any;
  message?: string;
  error?: string;
}
