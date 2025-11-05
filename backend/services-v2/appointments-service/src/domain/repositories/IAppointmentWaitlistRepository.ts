/**
 * IAppointmentWaitlistRepository - Domain Repository Interface
 * Defines contract for waitlist persistence
 *
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance Clean Architecture, DDD
 */

import { AppointmentWaitlist, WaitlistStatus, WaitlistPriority } from '../entities/AppointmentWaitlist.entity';

/**
 * Waitlist filter criteria
 */
export interface WaitlistFilterCriteria {
  patientId?: string;
  doctorId?: string;
  departmentId?: string;
  date?: Date;
  appointmentType?: string;
  priority?: WaitlistPriority;
  status?: WaitlistStatus;
  isExpired?: boolean;
}

/**
 * Repository interface for waitlist management
 */
export interface IAppointmentWaitlistRepository {
  /**
   * Save new waitlist entry
   */
  save(waitlist: AppointmentWaitlist): Promise<void>;

  /**
   * Update existing waitlist entry
   */
  update(waitlist: AppointmentWaitlist): Promise<void>;

  /**
   * Find waitlist entry by ID
   */
  findById(waitlistId: string): Promise<AppointmentWaitlist | null>;

  /**
   * Find waitlist entries by patient ID
   */
  findByPatientId(patientId: string): Promise<AppointmentWaitlist[]>;

  /**
   * Find waitlist entries with filters
   */
  findWithFilters(criteria: WaitlistFilterCriteria, limit?: number, offset?: number): Promise<AppointmentWaitlist[]>;

  /**
   * Find waiting entries (status = WAITING, not expired)
   */
  findWaitingEntries(limit?: number): Promise<AppointmentWaitlist[]>;

  /**
   * Find expired entries that need to be marked as expired
   */
  findExpiredEntries(limit?: number): Promise<AppointmentWaitlist[]>;

  /**
   * Find matching entries for a slot
   * Used for automatic matching when slots become available
   */
  findMatchingEntries(criteria: {
    doctorId?: string;
    departmentId?: string;
    date?: Date;
    timeSlot?: string;
    appointmentType?: string;
  }): Promise<AppointmentWaitlist[]>;

  /**
   * Delete waitlist entry
   */
  delete(waitlistId: string): Promise<void>;

  /**
   * Count waitlist entries by criteria
   */
  count(criteria: WaitlistFilterCriteria): Promise<number>;

  /**
   * Get waitlist position for a patient
   * Returns position in queue based on priority and creation time
   */
  getWaitlistPosition(waitlistId: string): Promise<number>;
}

