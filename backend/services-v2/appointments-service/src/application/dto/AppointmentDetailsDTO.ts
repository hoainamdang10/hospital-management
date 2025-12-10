/**
 * Appointment Details DTO - Application Layer
 * Data Transfer Object for appointment details with patient/doctor info
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS
 */

export interface AppointmentDetailsDTO {
  // Appointment Core
  appointmentId: string;
  appointmentDate: string;
  appointmentTime: string;
  durationMinutes: number;
  type: string;
  priority: string;
  status: string;
  paymentStatus?: string;
  roomId?: string;
  departmentId?: string;

  // Patient Information (denormalized from patient-service for display)
  patient: {
    patientId: string;
    fullName?: string;
    phone?: string;
    email?: string;
    dateOfBirth?: string;
    gender?: string;
    nationalId?: string;
    insuranceNumber?: string; // Reference only - billing-service validates insurance
    insuranceType?: string; // Reference only - billing-service validates insurance
    address?: string;
  };

  // Doctor Information
  doctor: {
    doctorId: string;
    fullName?: string;
    specialization?: string;
    department?: string;
    licenseNumber?: string;
    phone?: string;
    email?: string;
  };

  // Appointment Details
  reason?: string;
  chiefComplaint?: string;
  symptoms?: string[];
  notes?: string;
  specialInstructions?: string;
  requiredEquipment?: string[];

  // Financial
  consultationFee: number; // Billing reference only - billing-service owns payment lifecycle

  // Timestamps
  checkedInAt?: string;
  startedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppointmentListItemDTO {
  appointment_id: string;
  appointment_date: string;
  appointment_time: string;
  duration_minutes: number;
  type: string;
  priority: string;
  status: string;
  department_id?: string | null;

  patient_id: string;
  patient_full_name?: string;
  patient_phone?: string;
  patient_gender?: string;
  patient_date_of_birth?: string;

  doctor_id: string;
  doctor_full_name?: string;
  doctor_specialization?: string;
  doctor_department?: string | null;

  consultation_fee: number; // Billing reference only
  payment_status?: string;

  created_at: string;
}

export interface AppointmentListResponseDTO {
  appointments: AppointmentListItemDTO[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
