/**
 * ISessionRepository Interface
 * Repository interface for managing user sessions
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { UserSession } from '../entities/UserSession';

export interface ISessionRepository {
  /**
   * Find session by ID
   */
  findById(sessionId: string): Promise<UserSession | null>;

  /**
   * Find session by token
   */
  findByToken(sessionToken: string): Promise<UserSession | null>;

  /**
   * Find all active sessions for a user
   */
  findActiveSessionsByUserId(userId: string): Promise<UserSession[]>;

  /**
   * Find all sessions for a user (active and inactive)
   */
  findAllSessionsByUserId(userId: string): Promise<UserSession[]>;

  /**
   * Create a new session
   */
  create(session: UserSession): Promise<UserSession>;

  /**
   * Update an existing session
   */
  update(session: UserSession): Promise<UserSession>;

  /**
   * Delete a session by ID
   */
  delete(sessionId: string): Promise<void>;

  /**
   * Delete all sessions for a user
   */
  deleteAllByUserId(userId: string): Promise<number>;

  /**
   * Deactivate a session
   */
  deactivate(sessionId: string): Promise<void>;

  /**
   * Deactivate all sessions for a user except the current one
   */
  deactivateAllExcept(userId: string, currentSessionId: string): Promise<number>;

  /**
   * Clean up expired sessions
   */
  cleanupExpiredSessions(): Promise<number>;
}

