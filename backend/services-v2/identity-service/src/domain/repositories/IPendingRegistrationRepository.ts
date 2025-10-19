/**
 * IPendingRegistrationRepository Interface
 * Repository contract for PendingRegistration entity
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD
 */

import { PendingRegistration, PendingRegistrationStatus } from '../entities/PendingRegistration';
import { Email } from '../value-objects/Email';

export interface IPendingRegistrationRepository {
  /**
   * Store new pending registration
   * 
   * @param pendingRegistration Pending registration entity
   * @throws Error if email already has pending registration
   */
  store(pendingRegistration: PendingRegistration): Promise<void>;

  /**
   * Find pending registration by verification token
   * 
   * @param token Verification token
   * @returns PendingRegistration if found, null otherwise
   */
  findByToken(token: string): Promise<PendingRegistration | null>;

  /**
   * Find pending registration by email
   * 
   * @param email User email
   * @returns PendingRegistration if found, null otherwise
   */
  findByEmail(email: Email): Promise<PendingRegistration | null>;

  /**
   * Delete pending registration by ID
   * 
   * @param id Pending registration ID
   */
  delete(id: string): Promise<void>;

  /**
   * Delete pending registration by email
   * Useful for cleanup when user successfully verifies
   * 
   * @param email User email
   */
  deleteByEmail(email: Email): Promise<void>;

  /**
   * Delete all expired pending registrations
   * Cleanup job to remove old pending registrations
   * 
   * @returns Number of deleted records
   */
  deleteExpired(): Promise<number>;

  /**
   * Mark pending registration as used
   * 
   * @param id Pending registration ID
   */
  markAsUsed(id: string): Promise<void>;

  /**
   * Count active (not expired, not used) pending registrations for email
   * 
   * @param email User email
   * @returns Number of active pending registrations
   */
  countActiveForEmail(email: Email): Promise<number>;

  /**
   * Check if email has active pending registration
   *
   * @param email User email
   * @returns True if has active pending registration
   */
  hasActivePendingRegistration(email: Email): Promise<boolean>;

  /**
   * Update status of pending registration
   *
   * @param id Pending registration ID
   * @param status New status
   */
  updateStatus(id: string, status: PendingRegistrationStatus): Promise<void>;

  /**
   * Update verification token for pending registration
   * Used when resending verification email
   *
   * @param id Pending registration ID
   * @param newToken New verification token
   * @param expiresAt New expiration date
   */
  updateToken(id: string, newToken: string, expiresAt: Date): Promise<void>;
}

