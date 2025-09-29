// GraphQL Generated Types
// This file will be auto-generated in production, but we define basic types for development

export interface Doctor {
  id: string;
  doctorId: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  specialization: string;
  licenseNumber: string;
  yearsOfExperience: number;
  profilePicture?: string;
  averageRating?: number;
  totalPatients?: number;
  upcomingAppointments?: number;
  department?: Department;
  schedule?: WorkSchedule[];
  appointments?: AppointmentConnection;
  reviews?: ReviewConnection;
  experiences?: WorkExperience[];
}

export interface Patient {
  id: string;
  patientId: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  dateOfBirth: string;
  gender: Gender;
  age: number;
  lastVisit?: string;
  totalAppointments?: number;
  appointments?: AppointmentConnection;
  medicalRecords?: MedicalRecordConnection;
}

export interface Appointment {
  id: string;
  appointmentId: string;
  scheduledDate: string;
  scheduledTime: string;
  status: AppointmentStatus;
  notes?: string;
  duration?: number;
  isUpcoming: boolean;
  canCancel: boolean;
  doctor: Doctor;
  patient: Patient;
  medicalRecord?: MedicalRecord;
}

export interface Department {
  id: string;
  name: string;
  description?: string;
}

export interface WorkSchedule {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export interface WorkExperience {
  id: string;
  hospitalName: string;
  position: string;
  startDate: string;
  endDate?: string;
  description?: string;
}

export interface Review {
  id: string;
  rating: number;
  comment?: string;
  createdAt: string;
  patient: Patient;
}

export interface MedicalRecord {
  id: string;
  diagnosis?: string;
  treatment?: string;
  notes?: string;
}

export interface DoctorDashboard {
  doctor: Doctor;
  todayAppointments: Appointment[];
  upcomingAppointments: Appointment[];
  recentPatients: Patient[];
  appointmentStats: AppointmentStats;
  schedule: WorkSchedule[];
  recentReviews: Review[];
}

export interface AppointmentStats {
  total: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
  completed: number;
  cancelled: number;
  averageRating?: number;
}

// Connection types for pagination
export interface Connection<T> {
  edges: Edge<T>[];
  pageInfo: PageInfo;
  totalCount: number;
}

export interface Edge<T> {
  node: T;
  cursor: string;
}

export interface PageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor?: string;
  endCursor?: string;
}

export type DoctorConnection = Connection<Doctor>;
export type PatientConnection = Connection<Patient>;
export type AppointmentConnection = Connection<Appointment>;
export type ReviewConnection = Connection<Review>;
export type MedicalRecordConnection = Connection<MedicalRecord>;

// Enums
export enum AppointmentStatus {
  SCHEDULED = "SCHEDULED",
  CONFIRMED = "CONFIRMED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  NO_SHOW = "NO_SHOW",
}

export enum Gender {
  MALE = "MALE",
  FEMALE = "FEMALE",
  OTHER = "OTHER",
}

// Input types for mutations
export interface CreateAppointmentInput {
  doctorId: string;
  patientId: string;
  scheduledDate: string;
  scheduledTime: string;
  notes?: string;
}

export interface UpdateAppointmentInput {
  scheduledDate?: string;
  scheduledTime?: string;
  status?: AppointmentStatus;
  notes?: string;
}

export interface UpdateDoctorInput {
  fullName?: string;
  phoneNumber?: string;
  specialization?: string;
  yearsOfExperience?: number;
  profilePicture?: string;
}

export interface AddExperienceInput {
  hospitalName: string;
  position: string;
  startDate: string;
  endDate?: string;
  description?: string;
}

export interface UpdateScheduleInput {
  schedule: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isActive: boolean;
  }[];
}

export interface UpdatePatientInput {
  fullName?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  gender?: Gender;
}
