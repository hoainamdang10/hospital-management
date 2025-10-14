/**
 * Appointment Read Model - Domain Layer
 * CQRS Read Model for denormalized appointment data
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS, DDD
 */

export interface AppointmentReadModel {
  // Primary Keys
  id: string;
  appointmentId: string;
  
  // Appointment Core Data
  patientId: string;
  doctorId: string;
  appointmentDate: Date;
  appointmentTime: string;
  durationMinutes: number;
  type: string;
  priority: string;
  status: string;
  roomId?: string;
  departmentId?: string;
  consultationFee: number;
  additionalFees?: number;
  paymentStatus: string;
  
  // Denormalized Patient Data
  patientFullName?: string;
  patientPhone?: string;
  patientEmail?: string;
  patientDateOfBirth?: Date;
  patientGender?: string;
  patientNationalId?: string;
  patientInsuranceNumber?: string;
  patientInsuranceType?: string;
  patientAddress?: string;
  
  // Denormalized Doctor Data
  doctorFullName?: string;
  doctorSpecialization?: string;
  doctorDepartment?: string;
  doctorLicenseNumber?: string;
  doctorPhone?: string;
  doctorEmail?: string;
  
  // Appointment Details
  reason?: string;
  chiefComplaint?: string;
  symptoms?: string[];
  notes?: string;
  specialInstructions?: string;
  requiredEquipment?: string[];
  
  // Timestamps
  checkedInAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  syncedAt: Date;
}

export interface PatientData {
  patientFullName: string;
  patientPhone?: string;
  patientEmail?: string;
  patientDateOfBirth?: Date;
  patientGender?: string;
  patientNationalId?: string;
  patientInsuranceNumber?: string;
  patientInsuranceType?: string;
  patientAddress?: string;
}

export interface DoctorData {
  doctorFullName: string;
  doctorSpecialization?: string;
  doctorDepartment?: string;
  doctorLicenseNumber?: string;
  doctorPhone?: string;
  doctorEmail?: string;
}

export interface CreateAppointmentReadModelData {
  appointmentId: string;
  patientId: string;
  doctorId: string;
  appointmentDate: Date;
  appointmentTime: string;
  durationMinutes: number;
  type: string;
  priority: string;
  status: string;
  roomId?: string;
  departmentId?: string;
  consultationFee: number;
  additionalFees?: number;
  paymentStatus: string;
  
  // Patient data (fetched from Patient Service)
  patientData?: PatientData;
  
  // Doctor data (fetched from Provider Service)
  doctorData?: DoctorData;
  
  // Appointment details
  reason?: string;
  chiefComplaint?: string;
  symptoms?: string[];
  notes?: string;
  specialInstructions?: string;
  requiredEquipment?: string[];
}

export interface AppointmentReadModelFilters {
  patientId?: string;
  doctorId?: string;
  startDate?: Date;
  endDate?: Date;
  status?: string;
  type?: string;
  priority?: string;
  departmentId?: string;
  limit?: number;
  offset?: number;
}

