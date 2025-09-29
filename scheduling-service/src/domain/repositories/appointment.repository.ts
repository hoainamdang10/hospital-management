/**
 * Appointment Repository Interface - Domain Layer
 * Repository interface for appointment persistence with healthcare compliance
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Repository Pattern, Healthcare Standards, Domain Layer
 */

import { Appointment } from '../aggregates/appointment.aggregate';
import { AppointmentId, AppointmentType, AppointmentPriority } from '../value-objects/appointment-id';

export interface AppointmentSearchCriteria {
  patientId?: string;
  providerId?: string;
  department?: string;
  appointmentTypes?: AppointmentType[];
  statuses?: string[];
  priorities?: AppointmentPriority[];
  startDate?: Date;
  endDate?: Date;
  roomId?: string;
}

export interface AppointmentSearchResult {
  appointments: Appointment[];
  totalCount: number;
  availableFilters?: {
    departments: string[];
    appointmentTypes: string[];
    statuses: string[];
    priorities: string[];
  };
}

/**
 * Appointment Repository Interface
 * Defines contract for appointment persistence operations
 */
export interface IAppointmentRepository {
  /**
   * Save appointment
   */
  save(appointment: Appointment): Promise<void>;

  /**
   * Find appointment by ID
   */
  findById(id: string): Promise<Appointment | null>;

  /**
   * Find appointment by appointment ID
   */
  findByAppointmentId(appointmentId: string): Promise<Appointment | null>;

  /**
   * Find appointments by patient ID
   */
  findByPatientId(patientId: string): Promise<Appointment[]>;

  /**
   * Find appointments by provider ID
   */
  findByProviderId(providerId: string): Promise<Appointment[]>;

  /**
   * Find patient appointments in time range
   */
  findPatientAppointmentsInTimeRange(
    patientId: string,
    startTime: Date,
    endTime: Date
  ): Promise<Appointment[]>;

  /**
   * Find provider appointments in time range
   */
  findProviderAppointmentsInTimeRange(
    providerId: string,
    startTime: Date,
    endTime: Date
  ): Promise<Appointment[]>;

  /**
   * Find room appointments in time range
   */
  findRoomAppointmentsInTimeRange(
    roomId: string,
    startTime: Date,
    endTime: Date
  ): Promise<Appointment[]>;

  /**
   * Search appointments with criteria
   */
  searchAppointments(
    searchTerm?: string,
    criteria?: AppointmentSearchCriteria,
    page?: number,
    pageSize?: number,
    sortBy?: string,
    sortOrder?: 'asc' | 'desc'
  ): Promise<AppointmentSearchResult>;

  /**
   * Find appointments by date range
   */
  findByDateRange(
    startDate: Date,
    endDate: Date,
    statuses?: string[]
  ): Promise<Appointment[]>;

  /**
   * Find emergency appointments
   */
  findEmergencyAppointments(
    startDate?: Date,
    endDate?: Date
  ): Promise<Appointment[]>;

  /**
   * Find appointments needing reminders
   */
  findAppointmentsNeedingReminders(): Promise<Appointment[]>;

  /**
   * Update appointment status
   */
  updateStatus(appointmentId: AppointmentId, status: string, updatedBy: string): Promise<void>;

  /**
   * Delete appointment
   */
  delete(appointmentId: AppointmentId): Promise<void>;

  /**
   * Check if appointment exists
   */
  exists(appointmentId: AppointmentId): Promise<boolean>;

  /**
   * Get appointment statistics
   */
  getStatistics(
    startDate?: Date,
    endDate?: Date,
    department?: string
  ): Promise<{
    totalAppointments: number;
    scheduledAppointments: number;
    completedAppointments: number;
    cancelledAppointments: number;
    emergencyAppointments: number;
    averageWaitTime: number;
    departmentDistribution: { [department: string]: number };
    statusDistribution: { [status: string]: number };
  }>;
}
