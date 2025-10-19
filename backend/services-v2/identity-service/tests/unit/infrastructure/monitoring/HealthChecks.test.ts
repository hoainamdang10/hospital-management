import { TestUtils } from '@tests/setup';

// Mock Supabase client with schema() support
const createFromMock = () => ({
  select: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  eq: jest.fn().mockResolvedValue({ error: null, data: [] }),
});

let fromMock = createFromMock();

const mockSupabaseClient = {
  from: jest.fn(() => fromMock as any),
  schema: jest.fn(function(this: any) {
    // Return a new object with from() method for chaining
    return {
      from: jest.fn(() => fromMock as any)
    };
  }),
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
    fromMock = createFromMock();
    fromMock.select.mockReturnThis();
    fromMock.limit.mockReturnThis();
    fromMock.order.mockReturnThis();
    fromMock.eq.mockResolvedValue({ error: null, data: [] });
    mockSupabaseClient.from.mockReturnValue(fromMock as any);
    mockSupabaseClient.schema.mockReturnValue({
      from: jest.fn(() => fromMock as any)
    });

    // Reset circuit breaker mock
    mockCircuitBreakerFactory.getHealthStatus.mockReturnValue({});

    // Reset createClient mock
    mockCreateClient.mockReturnValue(mockSupabaseClient);

    healthCheck = new IdentityServiceHealthCheck('http://localhost', 'test-key', logger);
  });

  describe('checkHealth', () => {
    it('should return HEALTHY when all components are healthy', async () => {
      // Mock all database queries to succeed quickly
      fromMock.eq.mockResolvedValue({ error: null, data: [] });

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

    it.skip('should return DEGRADED when some components are degraded', async () => {
      // Use fake timers for this test
      jest.useFakeTimers();

      // Mock slow database response (> 1000ms for database)
      let callCount = 0;
      const startTime = Date.now();

      // Mock Date.now() to simulate time passing
      const mockNow = jest.spyOn(Date, 'now');
      mockNow.mockReturnValue(startTime);

      fromMock.eq.mockImplementation(async () => {
        callCount++;
        if (callCount === 1) { // First call is database check
          // Simulate 1100ms delay
          await new Promise(resolve => setTimeout(resolve, 1100));
          mockNow.mockReturnValue(startTime + 1100);
        }
        return { error: null, data: [] };
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

      // Restore real timers and mocks
      jest.useRealTimers();
      mockNow.mockRestore();
    });

    it.skip('should return UNHEALTHY when database fails', async () => {
      fromMock.eq.mockResolvedValue({ error: { message: 'Connection failed' }, data: null });

      mockCircuitBreakerFactory.getHealthStatus.mockReturnValue({});

      const health = await healthCheck.checkHealth();

      expect(health.overall).toBe(HealthStatus.UNHEALTHY);
      expect(health.components.database.status).toBe(HealthStatus.UNHEALTHY);
      expect(health.components.database.error).toContain('Database error');
    });

    it('should return DEGRADED when circuit breakers are open', async () => {
      fromMock.eq.mockResolvedValue({ error: null, data: [] });

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
      fromMock.eq.mockResolvedValue({ error: null, data: [] });

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
      fromMock.eq.mockResolvedValue({ error: null, data: [] });
      mockCircuitBreakerFactory.getHealthStatus.mockReturnValue({});

      const health = await healthCheck.checkHealth();

      expect(health.components.database.status).toBe(HealthStatus.HEALTHY);
      expect(health.components.database.responseTime).toBeLessThan(1000);
      expect(health.components.database.details?.tablesAccessible).toBe(true);
    });

    it.skip('should return DEGRADED for slow database response (> 1s)', async () => {
      // Use fake timers for this test
      jest.useFakeTimers();

      const startTime = Date.now();
      const mockNow = jest.spyOn(Date, 'now');
      mockNow.mockReturnValue(startTime);

      fromMock.eq.mockImplementation(async () => {
        // Simulate 1100ms delay
        await new Promise(resolve => setTimeout(resolve, 1100));
        mockNow.mockReturnValue(startTime + 1100);
        return { error: null, data: [] };
      });
      mockCircuitBreakerFactory.getHealthStatus.mockReturnValue({});

      const healthPromise = healthCheck.checkHealth();
      jest.runAllTimers();
      const health = await healthPromise;

      expect(health.components.database.status).toBe(HealthStatus.DEGRADED);
      expect(health.components.database.responseTime).toBeGreaterThan(1000);

      // Restore real timers
      jest.useRealTimers();
      mockNow.mockRestore();
    });

    it.skip('should return UNHEALTHY for very slow database response (> 5s)', async () => {
      // Use fake timers for this test
      jest.useFakeTimers();

      const startTime = Date.now();
      const mockNow = jest.spyOn(Date, 'now');
      mockNow.mockReturnValue(startTime);

      fromMock.eq.mockImplementation(async () => {
        // Simulate 5100ms delay
        await new Promise(resolve => setTimeout(resolve, 5100));
        mockNow.mockReturnValue(startTime + 5100);
        return { error: null, data: [] };
      });
      mockCircuitBreakerFactory.getHealthStatus.mockReturnValue({});

      const healthPromise = healthCheck.checkHealth();
      jest.runAllTimers();
      const health = await healthPromise;

      expect(health.components.database.status).toBe(HealthStatus.UNHEALTHY);
      expect(health.components.database.responseTime).toBeGreaterThan(5000);

      // Restore real timers
      jest.useRealTimers();
      mockNow.mockRestore();
    });
  });

  describe('checkAuthentication', () => {
    it('should return HEALTHY when authentication is operational', async () => {
      fromMock.eq.mockResolvedValue({ error: null, data: [] });

      mockCircuitBreakerFactory.getHealthStatus.mockReturnValue({});

      const health = await healthCheck.checkHealth();

      expect(health.components.authentication.status).toBe(HealthStatus.HEALTHY);
      expect(health.components.authentication.details?.rolesAccessible).toBe(true);
    });

    it.skip('should return UNHEALTHY when authentication fails', async () => {
      let callCount = 0;
      fromMock.eq.mockImplementation(() => {
        callCount++;
        if (callCount === 2) { // Second call is authentication check
          return Promise.resolve({ error: { message: 'Auth failed' }, data: null });
        }
        return Promise.resolve({ error: null, data: [] });
      });

      mockCircuitBreakerFactory.getHealthStatus.mockReturnValue({});

      const health = await healthCheck.checkHealth();

      expect(health.components.authentication.status).toBe(HealthStatus.UNHEALTHY);
    });
  });

  describe('checkCircuitBreakers', () => {
    it('should return HEALTHY when all breakers are closed', async () => {
      fromMock.eq.mockResolvedValue({ error: null, data: [] });

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
      fromMock.eq.mockResolvedValue({ error: null, data: [] });

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
      fromMock.eq.mockResolvedValue({ error: null, data: [] });

      mockCircuitBreakerFactory.getHealthStatus.mockImplementation(() => {
        throw new Error('Breaker status unavailable');
      });

      const health = await healthCheck.checkHealth();

      expect(health.components.circuitBreakers.status).toBe(HealthStatus.UNHEALTHY);
      expect(health.components.circuitBreakers.error).toContain('Breaker status unavailable');
    });
  });
});

