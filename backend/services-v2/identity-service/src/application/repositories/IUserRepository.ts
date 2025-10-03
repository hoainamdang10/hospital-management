/**
 * User Repository Interface - Application Layer
 * Defines contract for user persistence operations
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Dependency Inversion Principle
 */

import { User } from '../../domain/aggregates/User';
import { UserId } from '../../domain/value-objects/UserId';
import { Email } from '../../domain/value-objects/Email';
import { UserSession } from '../../domain/entities/UserSession';
import { HealthcareRole } from '../../domain/entities/HealthcareRole';

/**
 * User Repository Interface
 * Application layer defines the contract, infrastructure implements it
 */
export interface IUserRepository {
  /**
   * Find user by ID
   */
  findById(userId: UserId): Promise<User | null>;

  /**
   * Find user by email
   */
  findByEmail(email: Email): Promise<User | null>;

  /**
   * Save new user
   */
  save(user: User): Promise<void>;

  /**
   * Update existing user
   * Accepts full User aggregate for consistency with domain model
   */
  update(user: User): Promise<void>;

  /**
   * Delete user
   */
  delete(userId: UserId): Promise<void>;

  /**
   * Check if email exists
   */
  emailExists(email: Email): Promise<boolean>;

  /**
   * Get user roles
   */
  getUserRoles(userId: UserId): Promise<string[]>;

  /**
   * Get user permissions
   */
  getUserPermissions(userId: UserId): Promise<string[]>;

  /**
   * Create user session
   */
  createSession(session: UserSession): Promise<void>;

  /**
   * Get active sessions for user
   */
  getActiveSessions(userId: UserId): Promise<UserSession[]>;

  /**
   * Invalidate session
   */
  invalidateSession(sessionId: string): Promise<void>;

  /**
   * Deactivate session
   */
  deactivateSession(sessionId: string): Promise<void>;

  /**
   * Get healthcare role by type
   */
  getHealthcareRoleByType(roleType: string): Promise<HealthcareRole | null>;

  /**
   * List all users (with pagination)
   */
  list(options?: {
    limit?: number;
    offset?: number;
    filters?: Record<string, any>;
  }): Promise<User[]>;

  /**
   * Count total users
   */
  count(filters?: Record<string, any>): Promise<number>;
}

