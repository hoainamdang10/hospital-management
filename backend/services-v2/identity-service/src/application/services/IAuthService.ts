/**
 * IAuthService - Application Service Interface
 * V2 Clean Architecture + DDD Implementation
 * Defines contract for authentication operations
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, HIPAA
 */

import { User } from '../../domain/aggregates/User';
import { Email } from '../../domain/value-objects/Email';

export interface AuthenticationResult {
  success: boolean;
  user?: User;
  sessionToken?: string;
  expiresAt?: Date;
  requiresMFA?: boolean;
  error?: string;
}

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Authentication Service Interface
 * Handles authentication operations with Supabase Auth
 */
export interface IAuthService {
  /**
   * Authenticate user with email and password
   * @param email User email
   * @param password User password
   * @param ipAddress IP address of request
   * @param userAgent User agent string
   * @returns Authentication result
   */
  authenticate(
    email: Email,
    password: string,
    ipAddress: string,
    userAgent: string
  ): Promise<AuthenticationResult>;

  /**
   * Verify MFA code
   * @param userId User ID
   * @param mfaCode MFA code to verify
   * @returns Whether code is valid
   */
  verifyMFA(userId: string, mfaCode: string): Promise<boolean>;

  /**
   * Validate password strength
   * @param password Password to validate
   * @returns Validation result
   */
  validatePassword(password: string): PasswordValidationResult;

  /**
   * Hash password
   * @param password Plain text password
   * @returns Hashed password
   */
  hashPassword(password: string): Promise<string>;

  /**
   * Verify password against hash
   * @param password Plain text password
   * @param hash Hashed password
   * @returns Whether password matches
   */
  verifyPassword(password: string, hash: string): Promise<boolean>;

  /**
   * Generate session token
   * @param userId User ID
   * @returns Session token
   */
  generateSessionToken(userId: string): string;

  /**
   * Verify session token
   * @param token Session token
   * @returns User ID if valid, null otherwise
   */
  verifySessionToken(token: string): Promise<string | null>;
}

