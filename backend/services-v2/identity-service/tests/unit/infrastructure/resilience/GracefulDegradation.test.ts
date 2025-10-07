import { IdentityServiceDegradation, DegradationConfig } from '@infrastructure/resilience/GracefulDegradation';
import { ServiceMode, AuthResult, UserCredentials } from '@application/services/IDegradationService';
import { SupabaseAuthConfig } from '@infrastructure/auth/SupabaseAuthClient';
import { TestUtils } from '@tests/setup';

// Mock CircuitBreakerFactory
const mockCircuitBreaker = {
  execute: jest.fn(),
  reset: jest.fn(),
};

jest.mock('@infrastructure/resilience/CircuitBreaker', () => ({
  CircuitBreakerFactory: {
    getBreaker: jest.fn(() => mockCircuitBreaker),
  },
}));

// Mock SupabaseAuthClient
const mockAuthClient = {
  signInWithPassword: jest.fn(),
};

jest.mock('@infrastructure/auth/SupabaseAuthClient', () => ({
  SupabaseAuthClient: jest.fn(() => mockAuthClient),
}));

describe('IdentityServiceDegradation', () => {
  let degradationService: IdentityServiceDegradation;
  let logger: any;
  let config: DegradationConfig;
  let authConfig: SupabaseAuthConfig;
  let mockCircuitBreakerFactory: any;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    logger = TestUtils.createMockLogger();

    // Get mocked CircuitBreakerFactory
    const { CircuitBreakerFactory } = require('@infrastructure/resilience/CircuitBreaker');
    mockCircuitBreakerFactory = CircuitBreakerFactory;

    config = {
      enableReadOnlyFallback: true,
      enableCacheFallback: true,
      enableEmergencyMode: true,
      maxDegradationTime: 300000, // 5 minutes
    };

    authConfig = {
      supabaseUrl: 'http://localhost',
      supabaseServiceRoleKey: 'test-key',
      jwtSecret: 'test-jwt-secret',
    };

    // Reset circuit breaker mock
    mockCircuitBreakerFactory.getBreaker.mockReturnValue(mockCircuitBreaker);
    // Set default implementation - call primary function
    mockCircuitBreaker.execute.mockImplementation(async (primary) => await primary());

    degradationService = new IdentityServiceDegradation(config, authConfig, logger);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('authenticateUser', () => {
    const credentials: UserCredentials = {
      email: 'doctor@hospital.vn',
      password: 'Test123!@#',
    };

    it('should authenticate successfully with primary authentication', async () => {
      const authResult: AuthResult = {
        success: true,
        userId: 'u-123',
        roles: ['DOCTOR'],
        permissions: ['patient:read', 'patient:write'],
        mode: ServiceMode.FULL_SERVICE,
      };

      // Spy on private method primaryAuthentication
      const primaryAuthSpy = jest.spyOn(degradationService as any, 'primaryAuthentication')
        .mockResolvedValue(authResult);

      mockCircuitBreaker.execute.mockImplementation(async (primary) => {
        return await primary();
      });

      const result = await degradationService.authenticateUser(credentials);

      expect(primaryAuthSpy).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.mode).toBe(ServiceMode.FULL_SERVICE);
    });

    it('should cache successful authentication', async () => {
      const authResult: AuthResult = {
        success: true,
        userId: 'u-123',
        roles: ['DOCTOR'],
        permissions: ['patient:read'],
        mode: ServiceMode.FULL_SERVICE,
      };

      // Test cacheAuthentication method directly
      await degradationService.cacheAuthentication(credentials.email, authResult);

      // Verify cache was set
      const cached = await degradationService.getCachedAuthentication(credentials.email);
      expect(cached).toBeDefined();
      expect(cached?.userId).toBe('u-123');
      expect(cached?.mode).toBe(ServiceMode.FULL_SERVICE);
      expect(cached?.cachedAt).toBeInstanceOf(Date);
    });

    it('should use fallback authentication when primary fails', async () => {
      const authResult: AuthResult = {
        success: true,
        userId: 'u-123',
        roles: ['DOCTOR'],
        permissions: ['patient:read'],
        mode: ServiceMode.FULL_SERVICE,
      };

      // First cache a successful auth
      await degradationService.cacheAuthentication(credentials.email, authResult);

      // Spy on fallbackAuthentication
      const fallbackSpy = jest.spyOn(degradationService as any, 'fallbackAuthentication')
        .mockResolvedValue({
          ...authResult,
          mode: ServiceMode.DEGRADED_SERVICE,
          degradationReason: 'Using cached credentials'
        });

      // Simulate primary failure, fallback should use cache
      mockCircuitBreaker.execute.mockImplementation(async (_primary, fallback) => await fallback());

      const result = await degradationService.authenticateUser(credentials);

      expect(fallbackSpy).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.mode).toBe(ServiceMode.DEGRADED_SERVICE);
      expect(result.degradationReason).toContain('cached');
    });

    it('should use emergency authentication when all else fails', async () => {
      const authResult: AuthResult = {
        success: true,
        userId: 'u-123',
        roles: ['DOCTOR'],
        permissions: ['patient:read'],
        mode: ServiceMode.FULL_SERVICE,
      };

      // Prime cache via successful primary authentication
      await degradationService.cacheAuthentication(credentials.email, authResult);

      const cachedAuth = await degradationService.getCachedAuthentication(credentials.email);
      expect(cachedAuth).toBeDefined();

      // Disable cache fallback
      config.enableCacheFallback = false;
      config.enableReadOnlyFallback = false;

      const cachedAfterConfig = await degradationService.getCachedAuthentication(credentials.email);
      expect(cachedAfterConfig).toBeDefined();

      // Simulate complete failure
      mockCircuitBreaker.execute.mockImplementationOnce(async () => {
        throw new Error('All methods failed');
      });

      const result = await degradationService.authenticateUser(credentials);

      expect(result.success).toBe(true);
      expect(result.mode).toBe(ServiceMode.EMERGENCY_MODE);
      expect(result.roles).toEqual(['emergency_read_only']);
    });

    it('should throw error when emergency mode disabled and all fail', async () => {
      config.enableEmergencyMode = false;
      
      mockCircuitBreaker.execute.mockRejectedValue(new Error('Auth failed'));

      await expect(degradationService.authenticateUser(credentials)).rejects.toThrow('Auth failed');
    });
  });

  describe('cacheAuthentication', () => {
    it('should cache successful FULL_SERVICE authentication', async () => {
      const authResult: AuthResult = {
        success: true,
        userId: 'u-123',
        roles: ['DOCTOR'],
        permissions: ['patient:read'],
        mode: ServiceMode.FULL_SERVICE,
      };

      await degradationService.cacheAuthentication('test@example.com', authResult);

      const cached = await degradationService.getCachedAuthentication('test@example.com');
      expect(cached).toBeDefined();
      expect(cached?.userId).toBe('u-123');
    });

    it('should not cache failed authentication', async () => {
      const authResult: AuthResult = {
        success: false,
        mode: ServiceMode.FULL_SERVICE,
      };

      await degradationService.cacheAuthentication('test@example.com', authResult);

      const cached = await degradationService.getCachedAuthentication('test@example.com');
      expect(cached).toBeNull();
    });

    it('should not cache degraded mode authentication', async () => {
      const authResult: AuthResult = {
        success: true,
        userId: 'u-123',
        roles: ['DOCTOR'],
        permissions: ['patient:read'],
        mode: ServiceMode.DEGRADED_SERVICE,
      };

      await degradationService.cacheAuthentication('test@example.com', authResult);

      const cached = await degradationService.getCachedAuthentication('test@example.com');
      expect(cached).toBeNull();
    });

    it('should auto-expire cache after 30 minutes', async () => {
      const authResult: AuthResult = {
        success: true,
        userId: 'u-123',
        roles: ['DOCTOR'],
        permissions: ['patient:read'],
        mode: ServiceMode.FULL_SERVICE,
      };

      await degradationService.cacheAuthentication('test@example.com', authResult);

      // Fast-forward 31 minutes
      jest.advanceTimersByTime(1860000);

      const cached = await degradationService.getCachedAuthentication('test@example.com');
      expect(cached).toBeNull();
    });
  });

  describe('getCachedAuthentication', () => {
    it('should return null for non-existent cache', async () => {
      const cached = await degradationService.getCachedAuthentication('nonexistent@example.com');
      expect(cached).toBeNull();
    });

    it('should return cached authentication within 30 minutes', async () => {
      const authResult: AuthResult = {
        success: true,
        userId: 'u-123',
        roles: ['DOCTOR'],
        permissions: ['patient:read'],
        mode: ServiceMode.FULL_SERVICE,
      };

      await degradationService.cacheAuthentication('test@example.com', authResult);

      // Fast-forward 29 minutes
      jest.advanceTimersByTime(1740000);

      const cached = await degradationService.getCachedAuthentication('test@example.com');
      expect(cached).toBeDefined();
      expect(cached?.userId).toBe('u-123');
    });

    it('should return null for expired cache (> 30 minutes)', async () => {
      const authResult: AuthResult = {
        success: true,
        userId: 'u-123',
        roles: ['DOCTOR'],
        permissions: ['patient:read'],
        mode: ServiceMode.FULL_SERVICE,
      };

      await degradationService.cacheAuthentication('test@example.com', authResult);

      // Fast-forward 31 minutes
      jest.advanceTimersByTime(1860000);

      const cached = await degradationService.getCachedAuthentication('test@example.com');
      expect(cached).toBeNull();
    });
  });

  describe('checkRecovery', () => {
    it('should not recover if still in degradation time window', () => {
      // Manually enter degraded mode
      (degradationService as any).currentMode = ServiceMode.DEGRADED_SERVICE;
      (degradationService as any).degradationStartTime = new Date();

      // Fast-forward 4 minutes (less than maxDegradationTime of 5 minutes)
      jest.advanceTimersByTime(240000);

      degradationService.checkRecovery();

      expect(degradationService.getCurrentMode()).toBe(ServiceMode.DEGRADED_SERVICE);
    });

    it('should recover after maxDegradationTime', () => {
      // Manually enter degraded mode
      (degradationService as any).currentMode = ServiceMode.DEGRADED_SERVICE;
      (degradationService as any).degradationStartTime = new Date();

      // Fast-forward 6 minutes (more than maxDegradationTime of 5 minutes)
      jest.advanceTimersByTime(360000);

      degradationService.checkRecovery();

      expect(degradationService.getCurrentMode()).toBe(ServiceMode.FULL_SERVICE);
      expect(logger.info).toHaveBeenCalledWith('Recovered to full service mode');
    });
  });

  describe('forceRecovery', () => {
    it('should force recovery to full service', () => {
      // Manually enter degraded mode
      (degradationService as any).currentMode = ServiceMode.DEGRADED_SERVICE;
      (degradationService as any).degradationStartTime = new Date();

      degradationService.forceRecovery();

      expect(degradationService.getCurrentMode()).toBe(ServiceMode.FULL_SERVICE);
      expect(logger.info).toHaveBeenCalledWith('Forced recovery to full service mode');
    });
  });

  describe('getCurrentMode', () => {
    it('should return current service mode', () => {
      expect(degradationService.getCurrentMode()).toBe(ServiceMode.FULL_SERVICE);
    });
  });

  describe('isHealthy', () => {
    it('should return true when in FULL_SERVICE mode', async () => {
      const healthy = await degradationService.isHealthy();
      expect(healthy).toBe(true);
    });

    it('should return false when in DEGRADED_SERVICE mode', async () => {
      (degradationService as any).currentMode = ServiceMode.DEGRADED_SERVICE;
      
      const healthy = await degradationService.isHealthy();
      expect(healthy).toBe(false);
    });
  });

  describe('getStatus', () => {
    it('should return current status', () => {
      const status = degradationService.getStatus();

      expect(status.mode).toBe(ServiceMode.FULL_SERVICE);
      expect(status.cacheSize).toBe(0);
      expect(status.config).toEqual(config);
    });
  });

  describe('read-only path scenarios', () => {
    const credentials: UserCredentials = {
      email: 'doctor@hospital.vn',
      password: 'Test123!@#',
    };

    it('should enter read-only mode when cache fallback enabled and cached auth exists', async () => {
      const authResult: AuthResult = {
        success: true,
        userId: 'u-123',
        roles: ['DOCTOR'],
        permissions: ['patient:read', 'patient:write'],
        mode: ServiceMode.FULL_SERVICE,
      };

      // Cache successful authentication
      await degradationService.cacheAuthentication(credentials.email, authResult);

      // Disable cache fallback to force read-only path
      config.enableCacheFallback = false;
      config.enableReadOnlyFallback = true;

      // Simulate primary failure
      mockCircuitBreaker.execute.mockImplementationOnce(async (_primary, fallback) => {
        return await fallback();
      });

      const result = await degradationService.authenticateUser(credentials);

      expect(result.success).toBe(true);
      expect(result.mode).toBe(ServiceMode.READ_ONLY);
      expect(result.roles).toEqual(['read_only']);
      expect(result.permissions).toEqual(['read_own_data']);
      expect(result.degradationReason).toContain('read-only');
    });

    it('should deny read-only access when no cached credentials exist', async () => {
      config.enableCacheFallback = false;
      config.enableReadOnlyFallback = true;
      config.enableEmergencyMode = false;

      // Simulate primary failure
      mockCircuitBreaker.execute.mockImplementationOnce(async (_primary, fallback) => {
        return await fallback();
      });

      await expect(degradationService.authenticateUser(credentials)).rejects.toThrow(
        'No cached credentials available'
      );
    });

    it('should scrub privileged roles in read-only mode', async () => {
      const authResult: AuthResult = {
        success: true,
        userId: 'u-123',
        roles: ['ADMIN', 'DOCTOR'], // Privileged roles
        permissions: ['patient:read', 'patient:write', 'patient:delete'],
        mode: ServiceMode.FULL_SERVICE,
      };

      await degradationService.cacheAuthentication(credentials.email, authResult);

      config.enableCacheFallback = false;
      config.enableReadOnlyFallback = true;

      mockCircuitBreaker.execute.mockImplementationOnce(async (_primary, fallback) => {
        return await fallback();
      });

      const result = await degradationService.authenticateUser(credentials);

      // Should scrub roles to read_only only
      expect(result.roles).toEqual(['read_only']);
      expect(result.roles).not.toContain('ADMIN');
      expect(result.roles).not.toContain('DOCTOR');

      // Should limit permissions
      expect(result.permissions).toEqual(['read_own_data']);
    });

    it('should set 15-minute expiration for read-only access', async () => {
      const authResult: AuthResult = {
        success: true,
        userId: 'u-123',
        roles: ['DOCTOR'],
        permissions: ['patient:read'],
        mode: ServiceMode.FULL_SERVICE,
      };

      await degradationService.cacheAuthentication(credentials.email, authResult);

      config.enableCacheFallback = false;
      config.enableReadOnlyFallback = true;

      mockCircuitBreaker.execute.mockImplementationOnce(async (_primary, fallback) => {
        return await fallback();
      });

      const result = await degradationService.authenticateUser(credentials);

      expect(result.expiresAt).toBeDefined();
      const expirationTime = result.expiresAt!.getTime() - Date.now();
      expect(expirationTime).toBeGreaterThan(14 * 60 * 1000); // > 14 minutes
      expect(expirationTime).toBeLessThanOrEqual(15 * 60 * 1000); // <= 15 minutes
    });
  });

  describe('cache expired scenarios', () => {
    const credentials: UserCredentials = {
      email: 'doctor@hospital.vn',
      password: 'Test123!@#',
    };

    it('should reject authentication when cache is expired (> 30 minutes)', async () => {
      const authResult: AuthResult = {
        success: true,
        userId: 'u-123',
        roles: ['DOCTOR'],
        permissions: ['patient:read'],
        mode: ServiceMode.FULL_SERVICE,
      };

      await degradationService.cacheAuthentication(credentials.email, authResult);

      // Fast-forward 31 minutes
      jest.advanceTimersByTime(1860000);

      config.enableCacheFallback = true;
      config.enableReadOnlyFallback = false;
      config.enableEmergencyMode = false;

      mockCircuitBreaker.execute.mockImplementationOnce(async (_primary, fallback) => {
        return await fallback();
      });

      await expect(degradationService.authenticateUser(credentials)).rejects.toThrow();
    });

    it('should reject emergency access when cache is too old (> 1 hour)', async () => {
      const authResult: AuthResult = {
        success: true,
        userId: 'u-123',
        roles: ['DOCTOR'],
        permissions: ['patient:read'],
        mode: ServiceMode.FULL_SERVICE,
      };

      // Manually set cache with old timestamp (61 minutes ago - > 1 hour for emergency check)
      // We need to bypass the 30-minute check in getCachedAuthentication
      const oldCachedAuth = {
        ...authResult,
        cachedAt: new Date(Date.now() - 3660000) // 61 minutes ago
      };
      (degradationService as any).cache.set(`auth:${credentials.email}`, oldCachedAuth);

      // Mock getCachedAuthentication to return the old cache
      jest.spyOn(degradationService as any, 'getCachedAuthentication').mockResolvedValue(oldCachedAuth);

      config.enableEmergencyMode = true;

      mockCircuitBreaker.execute.mockRejectedValue(new Error('All methods failed'));

      await expect(degradationService.authenticateUser(credentials)).rejects.toThrow(
        'Emergency access denied - cached credentials expired'
      );

      expect(logger.error).toHaveBeenCalledWith(
        'SECURITY ALERT: Emergency access denied - cached credentials too old',
        expect.any(Object)
      );
    });
  });

  describe('non-healthcare email scenarios', () => {
    it('should deny emergency access for non-healthcare email', async () => {
      const nonHealthcareCredentials: UserCredentials = {
        email: 'user@gmail.com',
        password: 'Test123!@#',
      };

      const authResult: AuthResult = {
        success: true,
        userId: 'u-123',
        roles: ['PATIENT'],
        permissions: ['read_own_data'],
        mode: ServiceMode.FULL_SERVICE,
      };

      await degradationService.cacheAuthentication(nonHealthcareCredentials.email, authResult);

      config.enableEmergencyMode = true;

      mockCircuitBreaker.execute.mockRejectedValue(new Error('All methods failed'));

      await expect(degradationService.authenticateUser(nonHealthcareCredentials)).rejects.toThrow(
        'Emergency access denied - not authorized'
      );

      expect(logger.error).toHaveBeenCalledWith(
        'SECURITY ALERT: Emergency access denied - not healthcare staff',
        expect.any(Object)
      );
    });

    it('should allow emergency access for healthcare domain email', async () => {
      const healthcareCredentials: UserCredentials = {
        email: 'staff@hospital.vn',
        password: 'Test123!@#',
      };

      const authResult: AuthResult = {
        success: true,
        userId: 'u-123',
        roles: ['STAFF'],
        permissions: ['patient:read'],
        mode: ServiceMode.FULL_SERVICE,
      };

      await degradationService.cacheAuthentication(healthcareCredentials.email, authResult);

      config.enableEmergencyMode = true;

      mockCircuitBreaker.execute.mockRejectedValue(new Error('All methods failed'));

      const result = await degradationService.authenticateUser(healthcareCredentials);

      expect(result.success).toBe(true);
      expect(result.mode).toBe(ServiceMode.EMERGENCY_MODE);
    });

    it('should allow emergency access for doctor email pattern', async () => {
      const doctorCredentials: UserCredentials = {
        email: 'doctor.smith@example.com',
        password: 'Test123!@#',
      };

      const authResult: AuthResult = {
        success: true,
        userId: 'u-123',
        roles: ['DOCTOR'],
        permissions: ['patient:read'],
        mode: ServiceMode.FULL_SERVICE,
      };

      await degradationService.cacheAuthentication(doctorCredentials.email, authResult);

      config.enableEmergencyMode = true;

      mockCircuitBreaker.execute.mockRejectedValue(new Error('All methods failed'));

      const result = await degradationService.authenticateUser(doctorCredentials);

      expect(result.success).toBe(true);
      expect(result.mode).toBe(ServiceMode.EMERGENCY_MODE);
    });

    it('should allow emergency access for nurse email pattern', async () => {
      const nurseCredentials: UserCredentials = {
        email: 'nurse.jane@example.com',
        password: 'Test123!@#',
      };

      const authResult: AuthResult = {
        success: true,
        userId: 'u-123',
        roles: ['NURSE'],
        permissions: ['patient:read'],
        mode: ServiceMode.FULL_SERVICE,
      };

      await degradationService.cacheAuthentication(nurseCredentials.email, authResult);

      config.enableEmergencyMode = true;

      mockCircuitBreaker.execute.mockRejectedValue(new Error('All methods failed'));

      const result = await degradationService.authenticateUser(nurseCredentials);

      expect(result.success).toBe(true);
      expect(result.mode).toBe(ServiceMode.EMERGENCY_MODE);
    });
  });
});
