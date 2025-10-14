import { ServiceRegistry } from '@infrastructure/proxy/ServiceRegistry';
import { ServiceRoute } from '@domain/value-objects/ServiceRoute';
import { ILogger } from '@application/services/ILogger';
import { CachedResponseService } from '@infrastructure/cache/CachedResponseService';

const mockLogger: ILogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
};

describe('ServiceRegistry Integration Tests', () => {
  let serviceRegistry: ServiceRegistry;

  beforeEach(() => {
    jest.clearAllMocks();
    serviceRegistry = new ServiceRegistry(mockLogger);
  });

  describe('registerRoute with validation', () => {
    it('should register route with valid circuit breaker config', () => {
      const route = new ServiceRoute(
        'test-service',
        '/api/v1/test',
        'http://localhost:3000',
        true
      );

      expect(() => serviceRegistry.registerRoute(route)).not.toThrow();

      const registeredRoute = serviceRegistry.getRoute('/api/v1/test');
      expect(registeredRoute).toBeDefined();
      expect(registeredRoute?.serviceName).toBe('test-service');
    });

    it('should reject route with invalid circuit breaker config', () => {
      process.env.CIRCUIT_BREAKER_THRESHOLD = '0';

      const route = new ServiceRoute(
        'test-service',
        '/api/v1/test',
        'http://localhost:3000',
        true
      );

      expect(() => serviceRegistry.registerRoute(route)).toThrow(
        /Invalid circuit breaker config/
      );

      delete process.env.CIRCUIT_BREAKER_THRESHOLD;
    });

    it('should log warnings for suboptimal config', () => {
      process.env.CIRCUIT_BREAKER_THRESHOLD = '1';

      const route = new ServiceRoute(
        'test-service',
        '/api/v1/test',
        'http://localhost:3000',
        true
      );

      serviceRegistry.registerRoute(route);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Circuit breaker configuration warnings',
        expect.objectContaining({
          warnings: expect.arrayContaining([
            expect.stringContaining('failureThreshold=1')
          ])
        })
      );

      delete process.env.CIRCUIT_BREAKER_THRESHOLD;
    });
  });

  describe('health check with retry', () => {
    it('should perform health check successfully', async () => {
      const route = new ServiceRoute(
        'test-service',
        '/api/v1/test',
        'http://localhost:3000',
        true
      );

      serviceRegistry.registerRoute(route);

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200
      });

      const isHealthy = await serviceRegistry.isHealthy('test-service');

      expect(isHealthy).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should retry health check on failure', async () => {
      process.env.HEALTH_CHECK_MAX_RETRIES = '2';
      process.env.HEALTH_CHECK_RETRY_DELAY_MS = '10';

      const route = new ServiceRoute(
        'test-service',
        '/api/v1/test',
        'http://localhost:3000',
        true
      );

      serviceRegistry.registerRoute(route);

      global.fetch = jest.fn()
        .mockRejectedValueOnce(new Error('Connection refused'))
        .mockRejectedValueOnce(new Error('Connection refused'))
        .mockResolvedValue({
          ok: true,
          status: 200
        });

      const isHealthy = await serviceRegistry.isHealthy('test-service');

      expect(isHealthy).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(3);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Health check failed, retrying',
        expect.any(Object)
      );

      delete process.env.HEALTH_CHECK_MAX_RETRIES;
      delete process.env.HEALTH_CHECK_RETRY_DELAY_MS;
    });

    it('should use fallback after max retries', async () => {
      process.env.HEALTH_CHECK_MAX_RETRIES = '2';
      process.env.HEALTH_CHECK_RETRY_DELAY_MS = '10';

      const route = new ServiceRoute(
        'test-service',
        '/api/v1/test',
        'http://localhost:3000',
        true
      );

      serviceRegistry.registerRoute(route);

      global.fetch = jest.fn().mockRejectedValue(new Error('Connection refused'));

      const isHealthy = await serviceRegistry.isHealthy('test-service');

      expect(isHealthy).toBe(false);
      expect(global.fetch).toHaveBeenCalledTimes(3);

      delete process.env.HEALTH_CHECK_MAX_RETRIES;
      delete process.env.HEALTH_CHECK_RETRY_DELAY_MS;
    });
  });

  describe('circuit breaker with fallback', () => {
    it('should use cached response when circuit is open', async () => {
      const route = new ServiceRoute(
        'test-service',
        '/api/v1/test',
        'http://localhost:3000',
        true
      );

      serviceRegistry.registerRoute(route);

      global.fetch = jest.fn()
        .mockResolvedValueOnce({ ok: true, status: 200 })
        .mockRejectedValue(new Error('Service error'));

      await serviceRegistry.isHealthy('test-service');

      for (let i = 0; i < 5; i++) {
        try {
          await serviceRegistry.isHealthy('test-service');
        } catch (error) {
          // Expected
        }
      }

      const isHealthy = await serviceRegistry.isHealthy('test-service');

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Using fallback for health check',
        expect.objectContaining({
          reason: 'Circuit breaker OPEN'
        })
      );
    });
  });

  describe('getCircuitBreakerStats', () => {
    it('should return stats for all circuit breakers', () => {
      const route1 = new ServiceRoute(
        'service-1',
        '/api/v1/service1',
        'http://localhost:3001',
        true
      );

      const route2 = new ServiceRoute(
        'service-2',
        '/api/v1/service2',
        'http://localhost:3002',
        true
      );

      serviceRegistry.registerRoute(route1);
      serviceRegistry.registerRoute(route2);

      const stats = serviceRegistry.getCircuitBreakerStats();

      expect(stats).toHaveLength(2);
      expect(stats[0].serviceName).toBe('service-1');
      expect(stats[1].serviceName).toBe('service-2');
      expect(stats[0].state).toBe('CLOSED');
      expect(stats[1].state).toBe('CLOSED');
    });
  });

  describe('getAllRoutes', () => {
    it('should return all registered routes', () => {
      const route1 = new ServiceRoute(
        'service-1',
        '/api/v1/service1',
        'http://localhost:3001',
        true
      );

      const route2 = new ServiceRoute(
        'service-2',
        '/api/v1/service2',
        'http://localhost:3002',
        false
      );

      serviceRegistry.registerRoute(route1);
      serviceRegistry.registerRoute(route2);

      const routes = serviceRegistry.getAllRoutes();

      expect(routes).toHaveLength(2);
      expect(routes[0].serviceName).toBe('service-1');
      expect(routes[1].serviceName).toBe('service-2');
    });
  });
});

