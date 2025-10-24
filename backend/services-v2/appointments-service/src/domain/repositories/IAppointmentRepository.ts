/**
 * Appointment Repository Interface - Domain Layer
 * V2 Clean Architecture + DDD Implementation
 * Repository pattern for Appointment aggregate persistence
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Repository Pattern, Vietnamese Healthcare Standards
 */

import { Appointment } from '../aggregates/Appointment.aggregate';
import { AppointmentId } from '../value-objects/AppointmentId.vo';

export interface AppointmentSearchCriteria {
  patientId?: string;
  providerId?: string;
  department?: string;
  status?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  appointmentType?: string;
  priority?: string;
  roomId?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'startTime' | 'createdAt' | 'priority';
  sortOrder?: 'asc' | 'desc';
}

export interface AppointmentSearchResult {
  appointments: Appointment[];
  totalCount: number;
  hasMore: boolean;
}

export interface AppointmentConflictCheck {
  hasConflicts: boolean;
  conflicts: {
    appointmentId: string;
    startTime: Date;
    endTime: Date;
    reason: string;
  }[];
}

export interface AppointmentStatistics {
  totalAppointments: number;
  scheduledAppointments: number;
  confirmedAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  noShowAppointments: number;
  averageDuration: number;
  busyHours: { hour: number; count: number }[];
  departmentStats: { department: string; count: number }[];
}

/**
 * Appointment Repository Interface
 * Defines contract for appointment persistence operations
 */
export interface IAppointmentRepository {
  /**
   * Save appointment (create or update)
   */
  save(appointment: Appointment): Promise<void>;

  /**
   * Find appointment by ID
   */
  findById(appointmentId: AppointmentId): Promise<Appointment | null>;

  /**
   * Find appointment by ID string
   */
  findByIdString(appointmentId: string): Promise<Appointment | null>;

  /**
   * Find appointment by appointment ID (alias for findByIdString)
   */
  findByAppointmentId(appointmentId: string): Promise<Appointment | null>;

  /**
   * Find appointments by patient ID
   */
  findByPatientId(patientId: string, limit?: number, offset?: number): Promise<Appointment[]>;

  /**
   * Find appointments by provider ID
   */
  findByProviderId(providerId: string, limit?: number, offset?: number): Promise<Appointment[]>;

  /**
   * Find appointments by doctor ID (alias for findByProviderId)
   */
  findByDoctorId(doctorId: string, limit?: number, offset?: number): Promise<Appointment[]>;

  /**
   * Find appointments by date range
   */
  findByDateRange(startDate: Date, endDate: Date, limit?: number, offset?: number): Promise<Appointment[]>;

  /**
   * Search appointments with complex criteria
   */
  search(criteria: AppointmentSearchCriteria): Promise<AppointmentSearchResult>;

  /**
   * Check for appointment conflicts
   */
  checkConflicts(
    providerId: string,
    startTime: Date,
    endTime: Date,
    excludeAppointmentId?: string
  ): Promise<AppointmentConflictCheck>;

  /**
   * Find upcoming appointments for patient
   */
  findUpcomingByPatientId(patientId: string, limit?: number): Promise<Appointment[]>;

  /**
   * Find upcoming appointments for provider
   */
  findUpcomingByProviderId(providerId: string, limit?: number): Promise<Appointment[]>;

  /**
   * Find appointments by status
   */
  findByStatus(status: string, limit?: number, offset?: number): Promise<Appointment[]>;

  /**
   * Find appointments requiring reminders
   */
  findRequiringReminders(reminderType: '24h' | '2h' | '30min'): Promise<Appointment[]>;

  /**
   * Find overdue appointments (past start time but not started)
   */
  findOverdue(): Promise<Appointment[]>;

  /**
   * Get appointment statistics
   */
  getStatistics(
    dateFrom?: Date,
    dateTo?: Date,
    providerId?: string,
    department?: string
  ): Promise<AppointmentStatistics>;

  /**
   * Count appointments by criteria
   */
  count(criteria: Partial<AppointmentSearchCriteria>): Promise<number>;

  /**
   * Delete appointment (soft delete)
   */
  delete(appointmentId: AppointmentId): Promise<void>;

  /**
   * Check if appointment exists
   */
  exists(appointmentId: AppointmentId): Promise<boolean>;

  /**
   * Find appointments by multiple IDs
   */
  findByIds(appointmentIds: AppointmentId[]): Promise<Appointment[]>;

  /**
   * Find appointments for specific time slot
   */
  findByTimeSlot(
    providerId: string,
    startTime: Date,
    endTime: Date
  ): Promise<Appointment[]>;

  /**
   * Find follow-up appointments
   */
  findFollowUpAppointments(originalAppointmentId: string): Promise<Appointment[]>;

  /**
   * Get patient appointment history
   */
  getPatientHistory(
    patientId: string,
    limit?: number,
    offset?: number
  ): Promise<{
    appointments: Appointment[];
    totalCount: number;
    completedCount: number;
    cancelledCount: number;
    noShowCount: number;
  }>;

  /**
   * Get provider schedule for date range
   */
  getProviderSchedule(
    providerId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Appointment[]>;

  /**
   * Find appointments by department
   */
  findByDepartment(
    department: string,
    dateFrom?: Date,
    dateTo?: Date,
    limit?: number,
    offset?: number
  ): Promise<Appointment[]>;

  /**
   * Find emergency appointments
   */
  findEmergencyAppointments(limit?: number): Promise<Appointment[]>;

  /**
   * Find appointments requiring preparation
   */
  findRequiringPreparation(
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<Appointment[]>;

  /**
   * Update appointment status
   */
  updateStatus(appointmentId: AppointmentId, status: string): Promise<void>;

  /**
   * Bulk update appointments
   */
  bulkUpdate(appointments: Appointment[]): Promise<void>;

  /**
   * Get daily appointment summary
   */
  getDailySummary(date: Date, providerId?: string): Promise<{
    totalAppointments: number;
    scheduledAppointments: number;
    completedAppointments: number;
    cancelledAppointments: number;
    averageDuration: number;
    busyPeriods: { startTime: Date; endTime: Date; appointmentCount: number }[];
  }>;

  /**
   * Find available time slots for provider
   */
  findAvailableTimeSlots(
    providerId: string,
    date: Date,
    duration: number
  ): Promise<{ startTime: Date; endTime: Date }[]>;

  /**
   * Get appointment utilization rate
   */
  getUtilizationRate(
    providerId?: string,
    department?: string,
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<{
    totalSlots: number;
    bookedSlots: number;
    utilizationRate: number;
    noShowRate: number;
    cancellationRate: number;
  }>;
}
