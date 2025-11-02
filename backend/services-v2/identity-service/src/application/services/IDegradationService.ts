/**
 * IDegradationService - Application Service Interface
 * V2 Clean Architecture + DDD Implementation
 * Defines contract for graceful degradation operations
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, HIPAA
 */

export enum ServiceMode {
  FULL_SERVICE = 'FULL_SERVICE',
  DEGRADED_SERVICE = 'DEGRADED_SERVICE',
  READ_ONLY = 'READ_ONLY',
  EMERGENCY_MODE = 'EMERGENCY_MODE'
}

export interface AuthResult {
  success: boolean;
  userId?: string;
  email?: string;
  accessToken?: string; // Supabase access token (JWT)
  sessionToken?: string; // Deprecated - use accessToken instead
  refreshToken?: string;
  roles?: string[];
  permissions?: string[];
  mode: ServiceMode;
  expiresAt?: Date;
  degradationReason?: string;
  metadata?: Record<string, unknown>;
}

export interface UserCredentials {
  email: string;
  password: string;
  mfaCode?: string;
  ipAddress?: string; // IP address for audit logging
  userAgent?: string; // User agent for audit logging
}

/**
 * Degradation Service Interface
 * Handles graceful degradation and fallback authentication
 */
export interface IDegradationService {
  /**
   * Authenticate user with graceful degradation
   * @param credentials User credentials
   * @returns Authentication result with service mode
   */
  authenticateUser(credentials: UserCredentials): Promise<AuthResult>;

  /**
   * Get current service mode
   * @returns Current service mode
   */
  getCurrentMode(): ServiceMode;

  /**
   * Check if service is healthy
   * @returns Whether service is healthy
   */
  isHealthy(): Promise<boolean>;

  /**
   * Cache authentication result for fallback
   * @param email User email
   * @param authResult Authentication result to cache
   */
  cacheAuthentication(
    email: string,
    authResult: AuthResult,
    plaintextPassword: string
  ): Promise<void>;

  /**
   * Get cached authentication result
   * @param email User email
   * @returns Cached authentication result or null
   */
  getCachedAuthentication(
    email: string
  ): Promise<(AuthResult & { cachedAt?: Date }) | null>;

  /**
   * Get current service status
   * @returns Service status with mode, degradation time, cache size, config
   */
  getStatus(): {
    mode: ServiceMode;
    degradationStartTime?: Date;
    cacheSize: number;
    config: any;
  };

  /**
   * Force recovery to full service mode
   * Used for manual recovery or testing
   */
  forceRecovery(): void;
}
