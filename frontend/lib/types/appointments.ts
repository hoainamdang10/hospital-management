// Generated from Appointments Service Swagger API
// Base URL: http://localhost:3024

// ============================================================================
// ENUMS
// ============================================================================

export type AppointmentType =
  | 'CONSULTATION' | 'consultation'
  | 'FOLLOW_UP' | 'follow_up'
  | 'EMERGENCY' | 'emergency'
  | 'SURGERY' | 'surgery'
  | 'PROCEDURE' | 'procedure'
  | 'URGENT_CONSULTATION' | 'urgent_consultation'
  | 'MEDICAL_TEST' | 'medical_test';

export type AppointmentPriority = 'LOW' | 'NORMAL' | 'URGENT' | 'EMERGENCY';

export type AppointmentStatus =
  | 'SCHEDULED' | 'scheduled'
  | 'PENDING_PAYMENT' | 'pending_payment'
  | 'CONFIRMED' | 'confirmed'
  | 'ARRIVED' | 'arrived'
  | 'IN_PROGRESS' | 'in_progress'
  | 'COMPLETED' | 'completed'
  | 'CANCELLED' | 'cancelled'
  | 'NO_SHOW' | 'no_show'
  | 'RESCHEDULED' | 'reschedule_required';

export type PaymentStatus = 'PENDING' | 'pending' | 'PAID' | 'paid' | 'REFUNDED' | 'refunded' | 'FAILED' | 'failed';

// ============================================================================
// REQUEST TYPES
// ============================================================================

export interface ScheduleAppointmentRequest {
  patientId: string;
  doctorId: string;
  appointmentDate: string; // YYYY-MM-DD
  appointmentTime: string; // HH:mm:ss
  durationMinutes: number; // 15-480
  type: AppointmentType;
  priority: AppointmentPriority;
  reason?: string;
  consultationFee: number;
  createdBy: string;
}

export interface CancelAppointmentRequest {
  cancellationReason: string; // 3-500 chars
}

export interface ListAppointmentsParams {
  patientId?: string;
  doctorId?: string;
  status?: AppointmentStatus;
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  limit?: number; // default: 50, max: 100
  offset?: number; // default: 0
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export interface Appointment {
  id: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  appointmentDate: string;
  appointmentTime: string;
  durationMinutes: number;
  type: AppointmentType;
  priority: AppointmentPriority;
  status: AppointmentStatus;
  reason?: string;
  consultationFee: number;
  paymentStatus: PaymentStatus;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}

export interface AppointmentReadModel {
  id: string;
  appointment_id: string;
  patient_id: string;
  patient_full_name: string;
  patient_phone: string | null;
  patient_email: string;
  patient_date_of_birth?: string;
  patient_gender?: string;
  patient_national_id?: string;
  patient_insurance_number?: string | null;
  patient_insurance_type?: string | null;
  patient_address?: string;
  doctor_id: string;
  doctor_full_name: string;
  doctor_specialization: string;
  doctor_department?: string | null;
  doctor_license_number?: string | null;
  doctor_phone?: string | null;
  doctor_email?: string | null;
  appointment_date: string;
  appointment_time: string;
  duration_minutes: number;
  type: AppointmentType;
  priority: AppointmentPriority;
  status: AppointmentStatus;
  reason?: string | null;
  chief_complaint?: string | null;
  symptoms?: string[];
  notes?: string | null;
  special_instructions?: string | null;
  required_equipment?: string[];
  room_id?: string | null;
  department_id?: string | null;
  consultation_fee: string;
  additional_fees?: string;
  payment_status: PaymentStatus;
  checked_in_at?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  cancelled_at?: string | null;
  cancellation_reason?: string | null;
  created_at?: string;
  updated_at?: string;
  synced_at?: string;
}

export interface ScheduleAppointmentResponse {
  success: boolean;
  appointmentId: string;
  message: string;
  appointment: Appointment;
  // Payment link (Flow 3 - Priority 1: Frontend UI)
  paymentLink?: string; // PayOS checkout URL (may be undefined if Billing Service hasn't processed event yet)
  invoiceId?: string; // Invoice ID for reference
  paymentDeadline?: string; // ISO string for countdown timer
}

export interface ListAppointmentsResponse {
  success: boolean;
  appointments: AppointmentReadModel[];
  totalCount: number;
  hasMore: boolean;
}

export interface SuccessResponse {
  success: boolean;
  message: string;
}

export interface ErrorResponse {
  success: false;
  message: string;
  errors?: string[];
  timestamp: string;
}

// ============================================================================
// HEALTH CHECK
// ============================================================================

export interface HealthCheckResponse {
  service: string;
  status: string;
  version: string;
  timestamp: string;
}
