/**
 * Scheduling Repository Interface - Application Layer
 * V2 Clean Architecture + DDD Implementation
 * Repository pattern for appointment persistence
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Repository Pattern
 */

import { Appointment } from '../../domain/aggregates/scheduling.aggregate';

/**
 * Scheduling Repository Interface
 * Defines contract for appointment persistence operations
 */
export interface ISchedulingRepository {
  /**
   * Save appointment aggregate
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
   * Find appointments by provider and date
   */
  findByProviderAndDate(providerId: string, date: Date): Promise<Appointment[]>;

  /**
   * Find appointments by date range
   */
  findByDateRange(startDate: Date, endDate: Date): Promise<Appointment[]>;

  /**
   * Find appointments by status
   */
  findByStatus(status: string): Promise<Appointment[]>;

  /**
   * Find appointments by patient and date range
   */
  findByPatientAndDateRange(patientId: string, startDate: Date, endDate: Date): Promise<Appointment[]>;

  /**
   * Find appointments by provider and date range
   */
  findByProviderAndDateRange(providerId: string, startDate: Date, endDate: Date): Promise<Appointment[]>;

  /**
   * Find appointments by department and date
   */
  findByDepartmentAndDate(departmentCode: string, date: Date): Promise<Appointment[]>;

  /**
   * Find appointments by room and date
   */
  findByRoomAndDate(roomId: string, date: Date): Promise<Appointment[]>;

  /**
   * Find conflicting appointments
   */
  findConflicts(
    providerId: string, 
    startTime: Date, 
    endTime: Date, 
    excludeAppointmentId?: string
  ): Promise<Appointment[]>;

  /**
   * Find appointments requiring reminders
   */
  findAppointmentsForReminders(reminderTime: Date): Promise<Appointment[]>;

  /**
   * Find overdue appointments
   */
  findOverdueAppointments(): Promise<Appointment[]>;

  /**
   * Find appointments by urgency level
   */
  findByUrgencyLevel(urgencyLevel: 'routine' | 'urgent' | 'emergency'): Promise<Appointment[]>;

  /**
   * Find follow-up appointments
   */
  findFollowUpAppointments(originalAppointmentId: string): Promise<Appointment[]>;

  /**
   * Search appointments with filters
   */
  search(filters: AppointmentSearchFilters): Promise<AppointmentSearchResult>;

  /**
   * Get appointment statistics
   */
  getStatistics(filters: AppointmentStatisticsFilters): Promise<AppointmentStatistics>;

  /**
   * Delete appointment (soft delete)
   */
  delete(id: string): Promise<void>;

  /**
   * Check if appointment exists
   */
  exists(id: string): Promise<boolean>;

  /**
   * Get appointment count by filters
   */
  count(filters: AppointmentCountFilters): Promise<number>;
}

/**
 * Appointment Search Filters
 */
export interface AppointmentSearchFilters {
  patientId?: string;
  providerId?: string;
  departmentCode?: string;
  roomId?: string;
  status?: string[];
  urgencyLevel?: string[];
  appointmentType?: string[];
  startDate?: Date;
  endDate?: Date;
  searchTerm?: string; // Search in reason, notes, symptoms
  includeDeleted?: boolean;
  sortBy?: 'startTime' | 'createdAt' | 'updatedAt' | 'status';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

/**
 * Appointment Search Result
 */
export interface AppointmentSearchResult {
  appointments: Appointment[];
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Appointment Statistics Filters
 */
export interface AppointmentStatisticsFilters {
  providerId?: string;
  departmentCode?: string;
  startDate?: Date;
  endDate?: Date;
  groupBy?: 'day' | 'week' | 'month' | 'provider' | 'department' | 'status';
}

/**
 * Appointment Statistics
 */
export interface AppointmentStatistics {
  totalAppointments: number;
  scheduledAppointments: number;
  confirmedAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  rescheduledAppointments: number;
  noShowAppointments: number;
  
  // By urgency
  routineAppointments: number;
  urgentAppointments: number;
  emergencyAppointments: number;
  
  // By type
  consultationAppointments: number;
  followUpAppointments: number;
  surgeryAppointments: number;
  diagnosticAppointments: number;
  
  // Time-based statistics
  averageDuration: number;
  totalDuration: number;
  
  // Provider statistics
  providerUtilization: { [providerId: string]: number };
  
  // Department statistics
  departmentDistribution: { [departmentCode: string]: number };
  
  // Grouped data (if groupBy is specified)
  groupedData?: { [key: string]: AppointmentStatistics };
}

/**
 * Appointment Count Filters
 */
export interface AppointmentCountFilters {
  patientId?: string;
  providerId?: string;
  departmentCode?: string;
  status?: string[];
  startDate?: Date;
  endDate?: Date;
  urgencyLevel?: string[];
  appointmentType?: string[];
}
