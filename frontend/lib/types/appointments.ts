// Generated from Appointments Service Swagger API
// Base URL: http://localhost:3024

// ============================================================================
// ENUMS
// ============================================================================

export type AppointmentType = 'CONSULTATION' | 'FOLLOW_UP' | 'EMERGENCY' | 'SURGERY' | 'PROCEDURE';

export type AppointmentPriority = 'LOW' | 'NORMAL' | 'URGENT' | 'EMERGENCY';

export type AppointmentStatus =
  | 'SCHEDULED'
  | 'CONFIRMED'
  | 'ARRIVED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

export type PaymentStatus = 'PENDING' | 'PAID' | 'REFUNDED' | 'FAILED';

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
  appointmentId: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  patientEmail: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialization: string;
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
