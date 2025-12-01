// Generated from Appointments Service Swagger API
// Base URL: http://localhost:3024

// ============================================================================
// ENUMS
// ============================================================================

export type AppointmentType =
  | 'CONSULTATION'
  | 'consultation'
  | 'FOLLOW_UP'
  | 'follow_up'
  | 'EMERGENCY'
  | 'emergency'
  | 'SURGERY'
  | 'surgery'
  | 'PROCEDURE'
  | 'procedure'
  | 'URGENT_CONSULTATION'
  | 'urgent_consultation'
  | 'MEDICAL_TEST'
  | 'medical_test';

export type AppointmentPriority = 'LOW' | 'NORMAL' | 'URGENT' | 'EMERGENCY';

export type AppointmentStatus =
  | 'SCHEDULED'
  | 'scheduled'
  | 'PENDING_PAYMENT'
  | 'pending_payment'
  | 'CONFIRMED'
  | 'confirmed'
  | 'ARRIVED'
  | 'arrived'
  | 'IN_PROGRESS'
  | 'in_progress'
  | 'COMPLETED'
  | 'completed'
  | 'CANCELLED'
  | 'cancelled'
  | 'NO_SHOW'
  | 'no_show'
  | 'RESCHEDULED'
  | 'reschedule_required';

export type PaymentStatus =
  | 'PENDING'
  | 'pending'
  | 'PAID'
  | 'paid'
  | 'REFUNDED'
  | 'refunded'
  | 'FAILED'
  | 'failed';

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

export interface CancellationPolicy {
  penaltyApplied: boolean;
  refundEligible: boolean;
  rescheduleAllowed: boolean;
  penaltyAmount?: number;
  refundPercentage?: number;
  hoursNotice?: number;
  estimatedRefundAmount?: number;
  consultationFee?: number;
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
  doctorId: string;
  appointmentDate: string;
  appointmentTime: string;
  durationMinutes: number;
  type: AppointmentType;
  priority: AppointmentPriority;
  status: AppointmentStatus;
  roomId?: string | null;
  departmentId?: string | null;

  // Patient Information (nested from backend but flattened here)
  patient?: {
    patientId: string;
    fullName: string;
    phone?: string;
    email?: string;
    dateOfBirth?: string;
    gender?: string;
    nationalId?: string;
    insuranceNumber?: string;
    insuranceType?: string;
    address?: any;
  };

  //Doctor Information (nested from backend but flattened here)
  doctor?: {
    doctorId: string;
    fullName: string;
    specialization?: string;
    department?: string;
    licenseNumber?: string;
    phone?: string;
    email?: string;
  };

  // Flat aliases for backward compatibility
  patientFullName?: string;
  patientName?: string;
  patientPhone?: string | null;
  patientEmail?: string;
  patientDateOfBirth?: string;
  patientGender?: string;
  patientNationalId?: string;
  patientInsuranceNumber?: string | null;
  patientInsuranceType?: string | null;
  patientAddress?: string;

  doctorName?: string;
  doctorFullName?: string;
  doctorSpecialization?: string;
  doctorDepartment?: string | null;
  doctorLicenseNumber?: string | null;
  doctorPhone?: string | null;
  doctorEmail?: string | null;

  // Appointment Details
  reason?: string | null;
  chiefComplaint?: string | null;
  symptoms?: string[];
  notes?: string | null;
  specialInstructions?: string | null;
  requiredEquipment?: string[];

  // Financial
  consultationFee?: string | number;
  additionalFees?: string;
  paymentStatus?: PaymentStatus;

  // Timestamps
  checkedInAt?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  cancelledAt?: string | null;
  cancellationReason?: string | null;
  createdAt?: string;
  updatedAt?: string;
  syncedAt?: string;
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

export interface CancelAppointmentResponse extends SuccessResponse {
  cancellationPolicy?: CancellationPolicy;
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
