/**
 * IEmailVerificationTokenRepository - Application Repository Interface
 * Defines contract for email verification token persistence
 * 
 * This interface follows Clean Architecture principles:
 * - Defined in Application layer
 * - Implemented by Infrastructure layer (SupabaseEmailVerificationTokenRepository)
 * - Used by Use Cases
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Dependency Inversion Principle
 */

export interface EmailVerificationTokenData {
  userId: string;
  email: string;
  token: string;
  expiresAt: Date;
  isUsed?: boolean;
  usedAt?: Date;
}

/**
 * Email Verification Token Repository Interface
 * Handles persistence of email verification tokens
 */
export interface IEmailVerificationTokenRepository {
  /**
   * Store verification token
   * Creates new token record in database
   * 
   * @param data Token data to store
   * @throws Error if storage fails
   */
  store(data: {
    userId: string;
    email: string;
    token: string;
    expiresAt: Date;
  }): Promise<void>;

  /**
   * Find token by token string
   * Retrieves token data for verification
   * 
   * @param token Token string to find
   * @returns Token data if found, null otherwise
   */
  findByToken(token: string): Promise<EmailVerificationTokenData | null>;

  /**
   * Find latest token by user ID
   * Retrieves most recent token for a user
   * 
   * @param userId User ID
   * @returns Token data if found, null otherwise
   */
  findLatestByUserId(userId: string): Promise<EmailVerificationTokenData | null>;

  /**
   * Find latest token by email
   * Retrieves most recent token for an email
   * 
   * @param email Email address
   * @returns Token data if found, null otherwise
   */
  findLatestByEmail(email: string): Promise<EmailVerificationTokenData | null>;

  /**
   * Mark token as used
   * Updates token status after successful verification
   * 
   * @param token Token string to mark as used
   * @throws Error if update fails
   */
  markAsUsed(token: string): Promise<void>;

  /**
   * Invalidate all tokens for user
   * Marks all user's tokens as used (for resend scenario)
   * 
   * @param userId User ID
   * @throws Error if update fails
   */
  invalidateAllForUser(userId: string): Promise<void>;

  /**
   * Invalidate all tokens for email
   * Marks all email's tokens as used (for resend scenario)
   * 
   * @param email Email address
   * @throws Error if update fails
   */
  invalidateAllForEmail(email: string): Promise<void>;

  /**
   * Delete expired tokens
   * Cleanup job to remove old tokens
   * 
   * @returns Number of deleted tokens
   */
  deleteExpired(): Promise<number>;

  /**
   * Count active tokens for user
   * Check how many valid tokens exist for a user
   * 
   * @param userId User ID
   * @returns Number of active tokens
   */
  countActiveForUser(userId: string): Promise<number>;

  /**
   * Count active tokens for email
   * Check how many valid tokens exist for an email
   * 
   * @param email Email address
   * @returns Number of active tokens
   */
  countActiveForEmail(email: string): Promise<number>;
}

