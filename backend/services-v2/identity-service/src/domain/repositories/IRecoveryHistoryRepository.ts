/**
 * Recovery History Repository Interface
 * Defines contract for recovery attempt history persistence
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Dependency Inversion Principle
 */

import { RecoveryAttempt, RecoveryMethodType, AttemptType } from '../value-objects/RecoveryAttempt';

export interface RecoveryHistoryFilter {
  userId?: string;
  recoveryMethod?: RecoveryMethodType;
  attemptType?: AttemptType;
  success?: boolean;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  pageSize?: number;
}

export interface RecoveryHistoryResult {
  attempts: RecoveryAttempt[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Recovery History Repository Interface
 * Domain layer defines the contract, infrastructure layer implements it
 */
export interface IRecoveryHistoryRepository {
  /**
   * Log a recovery attempt
   * Creates audit trail record
   * 
   * @param attempt - Recovery attempt to log
   * @returns Logged attempt with ID
   */
  log(attempt: RecoveryAttempt): Promise<RecoveryAttempt>;

  /**
   * Get recovery history for a user
   * Returns paginated results
   * 
   * @param filter - Filter criteria
   * @returns Paginated recovery history
   */
  getHistory(filter: RecoveryHistoryFilter): Promise<RecoveryHistoryResult>;

  /**
   * Count recent recovery attempts
   * Used for rate limiting
   * 
   * @param userId - User ID
   * @param attemptType - Type of attempt to count
   * @param sinceDate - Count attempts since this date
   * @returns Number of attempts
   */
  countRecentAttempts(
    userId: string,
    attemptType: AttemptType,
    sinceDate: Date
  ): Promise<number>;

  /**
   * Get recent failed attempts
   * Used for suspicious activity detection
   * 
   * @param userId - User ID
   * @param sinceDate - Get attempts since this date
   * @returns Failed attempts
   */
  getRecentFailedAttempts(userId: string, sinceDate: Date): Promise<RecoveryAttempt[]>;

  /**
   * Delete old recovery history
   * Used for data retention compliance
   * 
   * @param olderThan - Delete records older than this date
   * @returns Number of records deleted
   */
  deleteOldHistory(olderThan: Date): Promise<number>;
}

