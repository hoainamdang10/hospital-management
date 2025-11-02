/**
 * Graceful Degradation Pattern Implementation
 * Provides fallback mechanisms for critical identity operations
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Production-Ready, HIPAA-Compliant Fallbacks
 */

import bcrypt from 'bcrypt';
import { CircuitBreakerFactory } from './CircuitBreaker';
import { getErrorMessage } from '../../utils/error-helper';
import { SupabaseAuthClient, SupabaseAuthConfig } from '../auth/SupabaseAuthClient';
import { ILogger } from '../../application/services/ILogger';
import { ServiceMode, AuthResult, UserCredentials, IDegradationService } from '../../application/services/IDegradationService';

export interface DegradationConfig {
  enableReadOnlyFallback: boolean;
  enableCacheFallback: boolean;
  enableEmergencyMode: boolean;
  maxDegradationTime: number; // milliseconds
}

interface CachedAuthEntry {
  auth: AuthResult;
  passwordHash: string;
  cachedAt: Date;
}

/**
 * Graceful Degradation Service for Identity Operations
 * Ensures system availability even during partial failures
 */
export class IdentityServiceDegradation implements IDegradationService {
  private currentMode: ServiceMode = ServiceMode.FULL_SERVICE;
  private degradationStartTime?: Date;
  private cache = new Map<string, CachedAuthEntry>();
  private authClient: SupabaseAuthClient;
  private readonly MAX_CACHE_SIZE = 1000; // Prevent unbounded growth
  private readonly CACHE_CLEANUP_INTERVAL = 300000; // 5 minutes
  private cleanupIntervalId?: NodeJS.Timeout;

  constructor(
    private config: DegradationConfig,
    authConfig: SupabaseAuthConfig,
    private logger: ILogger
  ) {
    this.authClient = new SupabaseAuthClient(authConfig, logger);
    this.startCacheCleanup();
  }

  /**
   * Periodic cache cleanup to prevent memory leaks
   */
  private startCacheCleanup(): void {
    this.cleanupIntervalId = setInterval(() => {
      const now = Date.now();
      let cleanedCount = 0;

      for (const [cacheKey, entry] of this.cache.entries()) {
        const expiresAt = entry.auth.expiresAt?.getTime();

        if (expiresAt && expiresAt < now) {
          this.cache.delete(cacheKey);
          cleanedCount++;
          continue;
        }

        if (now - entry.cachedAt.getTime() > 1800000) {
          this.cache.delete(cacheKey);
          cleanedCount++;
        }
      }

      if (this.cache.size > this.MAX_CACHE_SIZE) {
        const overflow = this.cache.size - this.MAX_CACHE_SIZE;
        const keys = Array.from(this.cache.keys());
        for (let i = 0; i < overflow; i++) {
          this.cache.delete(keys[i]);
          cleanedCount++;
        }
      }

      if (cleanedCount > 0) {
        this.logger.info('Cache cleanup completed', {
          cleanedCount,
          remainingSize: this.cache.size
        });
      }
    }, this.CACHE_CLEANUP_INTERVAL);

    if (typeof this.cleanupIntervalId.unref === 'function') {
      this.cleanupIntervalId.unref();
    }
  }

  /**
   * Authenticate user with graceful degradation
   */
  async authenticateUser(credentials: UserCredentials): Promise<AuthResult> {
    const circuitBreaker = CircuitBreakerFactory.getBreaker('authentication');

    try {
      return await circuitBreaker.execute(
        () => this.primaryAuthentication(credentials),
        () => this.fallbackAuthentication(credentials)
      );
    } catch (error) {
      this.logger.error('Authentication failed completely', {
        email: credentials.email,
        error: getErrorMessage(error),
        mode: this.currentMode
      });

      if (this.config.enableEmergencyMode) {
        return this.emergencyAuthentication(credentials);
      }

      throw error;
    }
  }

  /**
   * Primary authentication with full database access
   * Uses real Supabase authentication
   */
  private async primaryAuthentication(credentials: UserCredentials): Promise<AuthResult> {
    this.logger.info('Attempting primary authentication', {
      email: credentials.email,
      mode: ServiceMode.FULL_SERVICE
    });

    const authResult = await this.authClient.signInWithPassword(credentials);

    if (authResult.success) {
      await this.cacheAuthentication(
        credentials.email,
        authResult,
        credentials.password
      );
    }

    return authResult;
  }

  /**
   * Fallback authentication with limited functionality
   */
  private async fallbackAuthentication(credentials: UserCredentials): Promise<AuthResult> {
    this.enterDegradedMode('Primary authentication failed');

    const cacheKey = this.getCacheKey(credentials.email);

    if (this.config.enableCacheFallback) {
      const cachedEntry = this.cache.get(cacheKey);

      if (cachedEntry) {
        await this.assertPassword(credentials.password, cachedEntry.passwordHash, 'cached authentication');

        const cachedDuration = Date.now() - cachedEntry.cachedAt.getTime();
        if (cachedDuration > this.config.maxDegradationTime) {
          this.logger.warn('Cached authentication expired', {
            email: credentials.email,
            cachedDuration
          });
          this.cache.delete(cacheKey);
        } else {
          this.logger.warn('Using cached authentication', {
            email: credentials.email,
            cachedAt: cachedEntry.cachedAt,
            mode: ServiceMode.DEGRADED_SERVICE
          });

          return {
            ...cachedEntry.auth,
            mode: ServiceMode.DEGRADED_SERVICE,
            degradationReason: 'Using cached credentials'
          };
        }
      }
    }

    if (this.config.enableReadOnlyFallback) {
      return this.readOnlyAuthentication(credentials);
    }

    throw new Error('All authentication methods failed');
  }

  /**
   * Read-only authentication for emergency access
   * SECURITY: Only grants access if cached credentials exist
   */
  private async readOnlyAuthentication(credentials: UserCredentials): Promise<AuthResult> {
    this.logger.warn('Entering read-only mode', {
      email: credentials.email,
      mode: ServiceMode.READ_ONLY
    });

    const entry = this.cache.get(this.getCacheKey(credentials.email));
    if (!entry) {
      throw new Error('No cached credentials available - authentication failed');
    }

    await this.assertPassword(credentials.password, entry.passwordHash, 'read-only fallback');

    return {
      success: true,
      userId: entry.auth.userId,
      roles: ['read_only'],
      permissions: ['read_own_data'],
      mode: ServiceMode.READ_ONLY,
      degradationReason: 'Database unavailable - using cached read-only access',
      expiresAt: new Date(Date.now() + 900000) // 15 minutes
    };
  }

  /**
   * Emergency authentication for critical healthcare scenarios
   * SECURITY: Requires pre-cached successful authentication
   */
  private async emergencyAuthentication(credentials: UserCredentials): Promise<AuthResult> {
    this.logger.error('Emergency mode requested', {
      email: credentials.email,
      mode: ServiceMode.EMERGENCY_MODE
    });

    const entry = this.cache.get(this.getCacheKey(credentials.email));

    if (!entry) {
      this.logger.error('SECURITY ALERT: Emergency access denied - no cached credentials', {
        email: credentials.email,
        timestamp: new Date().toISOString(),
        reason: 'No pre-cached successful authentication found'
      });

      throw new Error('Emergency access denied - authentication required');
    }

    await this.assertPassword(credentials.password, entry.passwordHash, 'emergency fallback');

    const cacheAge = Date.now() - entry.cachedAt.getTime();
    const MAX_CACHE_AGE = 3600000; // 1 hour

    if (cacheAge > MAX_CACHE_AGE) {
      this.logger.error('SECURITY ALERT: Emergency access denied - cached credentials too old', {
        email: credentials.email,
        cacheAge: Math.floor(cacheAge / 1000) + 's',
        maxAge: Math.floor(MAX_CACHE_AGE / 1000) + 's'
      });

      throw new Error('Emergency access denied - cached credentials expired');
    }

    if (!this.isHealthcareStaffEmail(credentials.email)) {
      this.logger.error('SECURITY ALERT: Emergency access denied - not healthcare staff', {
        email: credentials.email
      });

      throw new Error('Emergency access denied - not authorized');
    }

    this.logger.error('EMERGENCY ACCESS GRANTED', {
      email: credentials.email,
      userId: entry.auth.userId,
      timestamp: new Date().toISOString(),
      expiresIn: '5 minutes'
    });

    return {
      success: true,
      userId: entry.auth.userId,
      roles: ['emergency_read_only'],
      permissions: ['read_own_data', 'read_patient_critical'],
      mode: ServiceMode.EMERGENCY_MODE,
      degradationReason: 'Emergency mode - minimal access for healthcare staff',
      expiresAt: new Date(Date.now() + 300000) // 5 minutes
    };
  }

  /**
   * Cache authentication result for fallback
   */
  public async cacheAuthentication(
    email: string,
    authResult: AuthResult,
    plaintextPassword: string
  ): Promise<void> {
    if (!authResult.success || authResult.mode !== ServiceMode.FULL_SERVICE) {
      return;
    }

    if (!plaintextPassword || plaintextPassword.length === 0) {
      this.logger.warn('Skipping authentication cache due to missing password', { email });
      return;
    }

    const passwordHash = await bcrypt.hash(plaintextPassword, 12);
    const cacheKey = this.getCacheKey(email);

    this.cache.set(cacheKey, {
      auth: { ...authResult },
      passwordHash,
      cachedAt: new Date()
    });

    setTimeout(() => {
      this.cache.delete(cacheKey);
    }, 1800000);
  }

  /**
   * Get cached authentication (sanitized copy)
   */
  public async getCachedAuthentication(
    email: string
  ): Promise<(AuthResult & { cachedAt?: Date }) | null> {
    const cached = this.cache.get(this.getCacheKey(email));
    if (!cached) {
      return null;
    }

    const cacheAge = Date.now() - cached.cachedAt.getTime();
    if (cacheAge > 1800000) {
      this.cache.delete(this.getCacheKey(email));
      return null;
    }

    return {
      ...cached.auth,
      cachedAt: cached.cachedAt
    };
  }

  /**
   * Enter degraded mode
   */
  private enterDegradedMode(reason: string): void {
    if (this.currentMode === ServiceMode.FULL_SERVICE) {
      this.currentMode = ServiceMode.DEGRADED_SERVICE;
      this.degradationStartTime = new Date();

      this.logger.warn('Entering degraded mode', {
        reason,
        timestamp: this.degradationStartTime
      });
    }
  }

  /**
   * Check if we should exit degraded mode
   */
  checkRecovery(): void {
    if (this.currentMode !== ServiceMode.FULL_SERVICE && this.degradationStartTime) {
      const degradationTime = Date.now() - this.degradationStartTime.getTime();

      if (degradationTime > this.config.maxDegradationTime) {
        this.currentMode = ServiceMode.FULL_SERVICE;
        this.degradationStartTime = undefined;
        this.logger.info('Recovered to full service mode');
      }
    }
  }

  public getCurrentMode(): ServiceMode {
    return this.currentMode;
  }

  public async isHealthy(): Promise<boolean> {
    return this.currentMode === ServiceMode.FULL_SERVICE;
  }

  private isHealthcareStaffEmail(email: string): boolean {
    const healthcareDomains = ['hospital.vn', 'clinic.vn', 'doctor.vn'];
    const domain = email.split('@')[1];
    return healthcareDomains.includes(domain) || email.includes('doctor') || email.includes('nurse');
  }

  getStatus() {
    return {
      mode: this.currentMode,
      degradationStartTime: this.degradationStartTime,
      cacheSize: this.cache.size,
      config: this.config
    };
  }

  forceRecovery(): void {
    this.currentMode = ServiceMode.FULL_SERVICE;
    this.degradationStartTime = undefined;
    this.logger.info('Forced recovery to full service mode');
  }

  stop(): void {
    if (this.cleanupIntervalId) {
      clearInterval(this.cleanupIntervalId);
      this.cleanupIntervalId = undefined;
      this.logger.info('Degradation service stopped');
    }
  }

  private getCacheKey(email: string): string {
    return `auth:${email}`;
  }

  private async assertPassword(
    password: string | undefined,
    passwordHash: string,
    context: string
  ): Promise<void> {
    if (!password || password.length === 0) {
      throw new Error(`Password required for ${context}`);
    }

    const isValid = await bcrypt.compare(password, passwordHash);
    if (!isValid) {
      throw new Error(`Invalid credentials for ${context}`);
    }
  }
}
