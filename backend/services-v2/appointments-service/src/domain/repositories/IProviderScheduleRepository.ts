/**
 * IProviderScheduleRepository Interface
 * Repository for managing cached provider work schedules
 * 
 * Bounded Context: Appointments Service
 * - Caches work schedule templates from Provider Staff Service
 * - Used for runtime availability calculation
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { ProviderSchedule } from '../value-objects/ProviderSchedule.vo';

export interface IProviderScheduleRepository {
  /**
   * Find schedule by provider ID
   */
  findByProviderId(providerId: string): Promise<ProviderSchedule | null>;

  /**
   * Find schedules by multiple provider IDs
   */
  findByProviderIds(providerIds: string[]): Promise<ProviderSchedule[]>;

  /**
   * Upsert (insert or update) provider schedule
   * Used by StaffScheduleUpdatedEvent handler
   */
  upsert(schedule: ProviderSchedule): Promise<void>;

  /**
   * Delete schedule by provider ID
   */
  delete(providerId: string): Promise<void>;

  /**
   * Check if schedule exists for provider
   */
  exists(providerId: string): Promise<boolean>;

  /**
   * Get all schedules (for admin/reporting)
   */
  findAll(): Promise<ProviderSchedule[]>;

  /**
   * Count total schedules
   */
  count(): Promise<number>;

  // ==================== MISSING METHODS FROM COMPILE ERRORS ====================

  /**
   * Update provider availability
   * Used by staff event consumers for availability updates
   */
  updateAvailability(providerId: string, availability: any): Promise<void>;

  /**
   * Add shift to provider schedule
   * Used by staff event consumers for shift management
   */
  addShift(providerId: string, shift: any): Promise<void>;

  /**
   * Remove shift from provider schedule
   * Used by staff event consumers for shift management
   */
  removeShift(providerId: string, shiftId: string): Promise<void>;

  /**
   * Update schedule pattern
   * Used by staff event consumers for pattern changes
   */
  updatePattern(providerId: string, pattern: any): Promise<void>;
}
