import { TestUtils } from '@tests/setup';

type QueryMock = {
  select: jest.Mock;
  limit: jest.Mock;
  order: jest.Mock;
  eq: jest.Mock;
};

const createQueryMock = (): QueryMock => {
  const builder: Record<string, jest.Mock> = {} as any;
  builder.select = jest.fn(() => builder);
  builder.order = jest.fn(() => builder);
  builder.limit = jest.fn(() => Promise.resolve({ error: null, data: [] }));
  builder.eq = jest.fn(() => Promise.resolve({ error: null, data: [] }));
  return builder as QueryMock;
};

let queryMocks: Record<string, QueryMock>;

const mockSupabaseClient = {
  from: jest.fn((table: string) => {
    if (!queryMocks[table]) {
      queryMocks[table] = createQueryMock();
    }
    return queryMocks[table];
  }),
  schema: jest.fn((schema: string) => ({
    from: (table: string) => {
      const key = `${schema}:${table}`;
      if (!queryMocks[key]) {
        queryMocks[key] = createQueryMock();
      }
      return queryMocks[key];
    },
  })),
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
    jest.useRealTimers();
    logger = TestUtils.createMockLogger();
    const { CircuitBreakerFactory } = require('@infrastructure/resilience/CircuitBreaker');
    mockCircuitBreakerFactory = CircuitBreakerFactory;

    queryMocks = {
      user_profiles: createQueryMock(),
      'auth_schema:healthcare_roles': createQueryMock(),
      role_permissions: createQueryMock(),
      'auth_schema:user_sessions': createQueryMock(),
      'auth_schema:audit_logs': createQueryMock(),
    };

    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (!queryMocks[table]) {
        queryMocks[table] = createQueryMock();
      }
      return queryMocks[table];
    });

    mockSupabaseClient.schema.mockImplementation((schema: string) => ({
      from: (table: string) => {
        const key = `${schema}:${table}`;
        if (!queryMocks[key]) {
          queryMocks[key] = createQueryMock();
        }
        return queryMocks[key];
      },
    }));

    mockCircuitBreakerFactory.getHealthStatus.mockReturnValue({});
    mockCreateClient.mockReturnValue(mockSupabaseClient);

    healthCheck = new IdentityServiceHealthCheck('http://localhost', 'test-key', logger);
  });

  describe('checkHealth', () => {
    it('should return HEALTHY when all components are healthy', async () => {
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

    it('should return DEGRADED when database response time is slow', async () => {
      let currentTime = 1_000;
      const nowSpy = jest.spyOn(Date, 'now').mockImplementation(() => currentTime);
      queryMocks['user_profiles'].limit.mockImplementationOnce(async () => {
        currentTime += 1_100;
        return { error: null, data: [] };
      });

      mockCircuitBreakerFactory.getHealthStatus.mockReturnValue({
        'user-repository': { state: 'CLOSED' },
      });

      try {
        const health = await healthCheck.checkHealth();

        expect(health.overall).toBe(HealthStatus.DEGRADED);
        expect(health.components.database.status).toBe(HealthStatus.DEGRADED);
      } finally {
        nowSpy.mockRestore();
      }
    });

    it('should return UNHEALTHY when database fails', async () => {
      queryMocks['user_profiles'].limit.mockResolvedValueOnce({
        error: { message: 'Connection failed' },
        data: null,
      });
      mockCircuitBreakerFactory.getHealthStatus.mockReturnValue({});

      const health = await healthCheck.checkHealth();

      expect(health.overall).toBe(HealthStatus.UNHEALTHY);
      expect(health.components.database.status).toBe(HealthStatus.UNHEALTHY);
      expect(health.components.database.error).toContain('Database error');
    });

    it('should return DEGRADED when circuit breakers are open', async () => {
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
      mockCircuitBreakerFactory.getHealthStatus.mockReturnValue({});

      const health = await healthCheck.checkHealth();

      expect(health.components.database.status).toBe(HealthStatus.HEALTHY);
      expect(health.components.database.responseTime).toBeLessThan(1000);
      expect(health.components.database.details?.tablesAccessible).toBe(true);
    });

    it('should return DEGRADED for slow database response (> 1s)', async () => {
      let currentTime = 5_000;
      const nowSpy = jest.spyOn(Date, 'now').mockImplementation(() => currentTime);

      queryMocks['user_profiles'].limit.mockImplementationOnce(async () => {
        currentTime += 1_100;
        return { error: null, data: [] };
      });

      mockCircuitBreakerFactory.getHealthStatus.mockReturnValue({});

      try {
        const health = await healthCheck.checkHealth();
        expect(health.components.database.status).toBe(HealthStatus.DEGRADED);
        expect(health.components.database.responseTime).toBeGreaterThan(1000);
      } finally {
        nowSpy.mockRestore();
      }
    });

    it('should return UNHEALTHY for very slow database response (> 5s)', async () => {
      let currentTime = 10_000;
      const nowSpy = jest.spyOn(Date, 'now').mockImplementation(() => currentTime);

      queryMocks['user_profiles'].limit.mockImplementationOnce(async () => {
        currentTime += 5_100;
        return { error: null, data: [] };
      });

      mockCircuitBreakerFactory.getHealthStatus.mockReturnValue({});

      try {
        const health = await healthCheck.checkHealth();
        expect(health.components.database.status).toBe(HealthStatus.UNHEALTHY);
        expect(health.components.database.responseTime).toBeGreaterThan(5000);
      } finally {
        nowSpy.mockRestore();
      }
    });
  });

  describe('checkAuthentication', () => {
    it('should return HEALTHY when authentication is operational', async () => {
      mockCircuitBreakerFactory.getHealthStatus.mockReturnValue({});

      const health = await healthCheck.checkHealth();

      expect(health.components.authentication.status).toBe(HealthStatus.HEALTHY);
      expect(health.components.authentication.details?.rolesAccessible).toBe(true);
    });

    it('should return UNHEALTHY when authentication fails', async () => {
      queryMocks['auth_schema:healthcare_roles'].limit.mockResolvedValueOnce({
        error: { message: 'Auth failed' },
        data: null,
      });

      mockCircuitBreakerFactory.getHealthStatus.mockReturnValue({});

      const health = await healthCheck.checkHealth();

      expect(health.components.authentication.status).toBe(HealthStatus.UNHEALTHY);
    });
  });

  describe('checkCircuitBreakers', () => {
    it('should return HEALTHY when all breakers are closed', async () => {
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
      mockCircuitBreakerFactory.getHealthStatus.mockImplementation(() => {
        throw new Error('Breaker status unavailable');
      });

      const health = await healthCheck.checkHealth();

      expect(health.components.circuitBreakers.status).toBe(HealthStatus.UNHEALTHY);
      expect(health.components.circuitBreakers.error).toContain('Breaker status unavailable');
    });
  });
});
