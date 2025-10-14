import { TestUtils } from '@tests/setup';

// Mock Supabase client
const fromMock = {
  select: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  then: jest.fn(),
};

const mockSupabaseClient = {
  from: jest.fn(() => fromMock as any),
};

const mockCreateClient = jest.fn(() => mockSupabaseClient);

jest.mock('@supabase/supabase-js', () => ({
  createClient: mockCreateClient,
}));

jest.mock('@infrastructure/resilience/CircuitBreaker', () => ({
  CircuitBreakerFactory: {
    getHealthStatus: jest.fn(),
  },
}));

// Import after mocks are set up
import { IdentityServiceHealthCheck, HealthStatus } from '@infrastructure/monitoring/HealthChecks';

describe('IdentityServiceHealthCheck', () => {
  let healthCheck: IdentityServiceHealthCheck;
  let logger: any;
  let mockCircuitBreakerFactory: any;

  beforeEach(() => {
    jest.clearAllMocks();
    // Use real timers by default
    jest.useRealTimers();
    logger = TestUtils.createMockLogger();

    // Get mocked CircuitBreakerFactory
    const { CircuitBreakerFactory } = require('@infrastructure/resilience/CircuitBreaker');
    mockCircuitBreakerFactory = CircuitBreakerFactory;

    // Reset fromMock to default behavior
    fromMock.select.mockReturnThis();
    fromMock.limit.mockReturnThis();
    fromMock.then.mockImplementation((resolve) => resolve({ error: null }));
    mockSupabaseClient.from.mockReturnValue(fromMock as any);

    // Reset circuit breaker mock
    mockCircuitBreakerFactory.getHealthStatus.mockReturnValue({});

    // Reset createClient mock
    mockCreateClient.mockReturnValue(mockSupabaseClient);

    healthCheck = new IdentityServiceHealthCheck('http://localhost', 'test-key', logger);
  });

  describe('checkHealth', () => {
    it('should return HEALTHY when all components are healthy', async () => {
      // Mock all database queries to succeed quickly
      fromMock.then.mockImplementation((resolve) => resolve({ error: null }));

      mockCircuitBreakerFactory.getHealthStatus.mockReturnValue({
        'user-repository': { state: 'CLOSED' },
      });

      const health = await healthCheck.checkHealth();

      expect(health.overall).toBe(HealthStatus.HEALTHY);
      expect(health.components.database.status).toBe(HealthStatus.HEALTHY);
      expect(health.components.authentication.status).toBe(HealthStatus.HEALTHY);
      expect(health.components.authorization.status).toBe(HealthStatus.HEALTHY);
      expect(health.components.sessions.status).toBe(HealthStatus.HEALTHY);
      expect(health.components.audit.status).toBe(HealthStatus.HEALTHY);
      expect(health.components.circuitBreakers.status).toBe(HealthStatus.HEALTHY);
    });

    it('should return DEGRADED when some components are degraded', async () => {
      // Use fake timers for this test
      jest.useFakeTimers();

      // Mock slow database response (> 1000ms for database, > 500ms for others)
      let callCount = 0;
      const startTime = Date.now();
      fromMock.then.mockImplementation(async (resolve) => {
        callCount++;
        if (callCount === 1) { // First call is database check
          // Simulate 1100ms delay
          jest.advanceTimersByTime(1100);
          // Mock that 1100ms has passed
          jest.spyOn(Date, 'now').mockReturnValue(startTime + 1100);
        }
        return resolve({ error: null });
      });

      mockCircuitBreakerFactory.getHealthStatus.mockReturnValue({
        'user-repository': { state: 'CLOSED' },
      });

      const healthPromise = healthCheck.checkHealth();

      // Run all pending timers
      jest.runAllTimers();

      const health = await healthPromise;

      expect(health.overall).toBe(HealthStatus.DEGRADED);
      expect(health.components.database.status).toBe(HealthStatus.DEGRADED);

      // Restore real timers
      jest.useRealTimers();
    });

    it('should return UNHEALTHY when database fails', async () => {
      fromMock.then.mockImplementation((resolve) => resolve({ error: { message: 'Connection failed' } }));

      mockCircuitBreakerFactory.getHealthStatus.mockReturnValue({});

      const health = await healthCheck.checkHealth();

      expect(health.overall).toBe(HealthStatus.UNHEALTHY);
      expect(health.components.database.status).toBe(HealthStatus.UNHEALTHY);
      expect(health.components.database.error).toContain('Database error');
    });

    it('should return DEGRADED when circuit breakers are open', async () => {
      fromMock.then.mockImplementation((resolve) => resolve({ error: null }));

      mockCircuitBreakerFactory.getHealthStatus.mockReturnValue({
        'user-repository': { state: 'OPEN' },
        'auth-service': { state: 'CLOSED' },
      });

      const health = await healthCheck.checkHealth();

      expect(health.overall).toBe(HealthStatus.DEGRADED);
      expect(health.components.circuitBreakers.status).toBe(HealthStatus.DEGRADED);
      expect(health.components.circuitBreakers.details?.openBreakers).toBe(1);
    });

    it('should include metadata in health response', async () => {
      fromMock.then.mockImplementation((resolve) => resolve({ error: null }));

      mockCircuitBreakerFactory.getHealthStatus.mockReturnValue({});

      const health = await healthCheck.checkHealth();

      expect(health.metadata).toBeDefined();
      expect(health.metadata.version).toBe('2.0.0');
      expect(health.metadata.uptime).toBeGreaterThanOrEqual(0);
      expect(health.metadata.environment).toBeDefined();
      expect(health.metadata.timestamp).toBeInstanceOf(Date);
    });

    it('should handle complete health check failure', async () => {
      // Mock Promise.allSettled to throw
      jest.spyOn(Promise, 'allSettled').mockRejectedValueOnce(new Error('Critical failure'));

      const health = await healthCheck.checkHealth();

      expect(health.overall).toBe(HealthStatus.UNHEALTHY);
      expect(logger.error).toHaveBeenCalledWith('Health check failed', expect.any(Object));
    });
  });

  describe('checkDatabase', () => {
    it('should return HEALTHY for fast database response', async () => {
      fromMock.then.mockImplementation((resolve) => resolve({ error: null }));
      mockCircuitBreakerFactory.getHealthStatus.mockReturnValue({});

      const health = await healthCheck.checkHealth();

      expect(health.components.database.status).toBe(HealthStatus.HEALTHY);
      expect(health.components.database.responseTime).toBeLessThan(1000);
      expect(health.components.database.details?.tablesAccessible).toBe(true);
    });

    it('should return DEGRADED for slow database response (> 1s)', async () => {
      // Use fake timers for this test
      jest.useFakeTimers();

      const startTime = Date.now();
      fromMock.then.mockImplementation(async (resolve) => {
        // Simulate 1100ms delay
        jest.advanceTimersByTime(1100);
        jest.spyOn(Date, 'now').mockReturnValue(startTime + 1100);
        return resolve({ error: null });
      });
      mockCircuitBreakerFactory.getHealthStatus.mockReturnValue({});

      const healthPromise = healthCheck.checkHealth();
      jest.runAllTimers();
      const health = await healthPromise;

      expect(health.components.database.status).toBe(HealthStatus.DEGRADED);
      expect(health.components.database.responseTime).toBeGreaterThan(1000);

      // Restore real timers
      jest.useRealTimers();
    });

    it('should return UNHEALTHY for very slow database response (> 5s)', async () => {
      // Use fake timers for this test
      jest.useFakeTimers();

      const startTime = Date.now();
      fromMock.then.mockImplementation(async (resolve) => {
        // Simulate 5100ms delay
        jest.advanceTimersByTime(5100);
        jest.spyOn(Date, 'now').mockReturnValue(startTime + 5100);
        return resolve({ error: null });
      });
      mockCircuitBreakerFactory.getHealthStatus.mockReturnValue({});

      const healthPromise = healthCheck.checkHealth();
      jest.runAllTimers();
      const health = await healthPromise;

      expect(health.components.database.status).toBe(HealthStatus.UNHEALTHY);
      expect(health.components.database.responseTime).toBeGreaterThan(5000);

      // Restore real timers
      jest.useRealTimers();
    });
  });

  describe('checkAuthentication', () => {
    it('should return HEALTHY when authentication is operational', async () => {
      fromMock.then.mockImplementation((resolve) => resolve({ error: null }));

      mockCircuitBreakerFactory.getHealthStatus.mockReturnValue({});

      const health = await healthCheck.checkHealth();

      expect(health.components.authentication.status).toBe(HealthStatus.HEALTHY);
      expect(health.components.authentication.details?.rolesAccessible).toBe(true);
    });

    it('should return UNHEALTHY when authentication fails', async () => {
      let callCount = 0;
      fromMock.then.mockImplementation((resolve) => {
        callCount++;
        if (callCount === 2) { // Second call is authentication check
          return resolve({ error: { message: 'Auth failed' } });
        }
        return resolve({ error: null });
      });

      mockCircuitBreakerFactory.getHealthStatus.mockReturnValue({});

      const health = await healthCheck.checkHealth();

      expect(health.components.authentication.status).toBe(HealthStatus.UNHEALTHY);
    });
  });

  describe('checkCircuitBreakers', () => {
    it('should return HEALTHY when all breakers are closed', async () => {
      fromMock.then.mockImplementation((resolve) => resolve({ error: null }));

      mockCircuitBreakerFactory.getHealthStatus.mockReturnValue({
        'user-repository': { state: 'CLOSED' },
        'auth-service': { state: 'CLOSED' },
      });

      const health = await healthCheck.checkHealth();

      expect(health.components.circuitBreakers.status).toBe(HealthStatus.HEALTHY);
      expect(health.components.circuitBreakers.details?.totalBreakers).toBe(2);
      expect(health.components.circuitBreakers.details?.openBreakers).toBe(0);
    });

    it('should return DEGRADED when some breakers are open', async () => {
      fromMock.then.mockImplementation((resolve) => resolve({ error: null }));

      mockCircuitBreakerFactory.getHealthStatus.mockReturnValue({
        'user-repository': { state: 'OPEN' },
        'auth-service': { state: 'HALF_OPEN' },
        'cache-service': { state: 'CLOSED' },
      });

      const health = await healthCheck.checkHealth();

      expect(health.components.circuitBreakers.status).toBe(HealthStatus.DEGRADED);
      expect(health.components.circuitBreakers.details?.openBreakers).toBe(1);
    });

    it('should handle circuit breaker check errors', async () => {
      fromMock.then.mockImplementation((resolve) => resolve({ error: null }));

      mockCircuitBreakerFactory.getHealthStatus.mockImplementation(() => {
        throw new Error('Breaker status unavailable');
      });

      const health = await healthCheck.checkHealth();

      expect(health.components.circuitBreakers.status).toBe(HealthStatus.UNHEALTHY);
      expect(health.components.circuitBreakers.error).toContain('Breaker status unavailable');
    });
  });
});

