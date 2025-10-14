import { ProxyRequestUseCase } from '@application/use-cases/ProxyRequestUseCase';
import { IServiceRegistry } from '@application/services/IServiceRegistry';
import { ILogger } from '@application/services/ILogger';
import { ServiceRoute } from '@domain/value-objects/ServiceRoute';

describe('ProxyRequestUseCase', () => {
  let useCase: ProxyRequestUseCase;
  let mockServiceRegistry: jest.Mocked<IServiceRegistry>;
  let mockLogger: jest.Mocked<ILogger>;

  const mockRoute = ServiceRoute.create({
    serviceName: 'patient-registry-service',
    baseUrl: 'http://patient-registry-service:3003',
    pathPrefix: '/api/v1/patients',
    requiresAuth: true,
    requiredPermissions: ['patient:read']
  });

  beforeEach(() => {
    mockServiceRegistry = {
      getRouteForPath: jest.fn(),
      getAllRoutes: jest.fn(),
      registerRoute: jest.fn(),
      isHealthy: jest.fn()
    };

    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    };

    useCase = new ProxyRequestUseCase(mockServiceRegistry, mockLogger);
  });

  const validInput = {
    path: '/api/v1/patients/123',
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    userId: '550e8400-e29b-41d4-a716-446655440000',
    userEmail: 'test@example.com',
    userRoles: ['doctor'],
    userPermissions: ['patient:read'],
    requestId: 'test-request-id',
    ip: '127.0.0.1'
  };

  describe('execute - successful proxy', () => {
    it('should return route and target URL for valid path', async () => {
      mockServiceRegistry.getRouteForPath.mockReturnValue(mockRoute);
      mockServiceRegistry.isHealthy.mockResolvedValue(true);

      const result = await useCase.execute(validInput);

      expect(result.success).toBe(true);
      expect(result.route).toBe(mockRoute);
      expect(result.targetUrl).toBe('http://patient-registry-service:3003/123');
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Proxying request to service',
        expect.objectContaining({
          requestId: validInput.requestId,
          path: validInput.path,
          serviceName: mockRoute.serviceName
        })
      );
    });

    it('should handle root path correctly', async () => {
      mockServiceRegistry.getRouteForPath.mockReturnValue(mockRoute);
      mockServiceRegistry.isHealthy.mockResolvedValue(true);

      const result = await useCase.execute({
        ...validInput,
        path: '/api/v1/patients'
      });

      expect(result.success).toBe(true);
      expect(result.targetUrl).toBe('http://patient-registry-service:3003');
    });

    it('should handle nested paths correctly', async () => {
      mockServiceRegistry.getRouteForPath.mockReturnValue(mockRoute);
      mockServiceRegistry.isHealthy.mockResolvedValue(true);

      const result = await useCase.execute({
        ...validInput,
        path: '/api/v1/patients/123/appointments/456'
      });

      expect(result.success).toBe(true);
      expect(result.targetUrl).toBe('http://patient-registry-service:3003/123/appointments/456');
    });
  });

  describe('execute - route not found', () => {
    it('should fail if no route found for path', async () => {
      mockServiceRegistry.getRouteForPath.mockReturnValue(null);

      const result = await useCase.execute(validInput);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No service route found for path: /api/v1/patients/123');
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'No route found for path',
        expect.objectContaining({
          path: validInput.path
        })
      );
    });
  });

  describe('execute - service unhealthy', () => {
    it('should fail if target service is unhealthy', async () => {
      mockServiceRegistry.getRouteForPath.mockReturnValue(mockRoute);
      mockServiceRegistry.isHealthy.mockResolvedValue(false);

      const result = await useCase.execute(validInput);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Service patient-registry-service is currently unavailable');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Target service is unhealthy',
        expect.objectContaining({
          serviceName: mockRoute.serviceName
        })
      );
    });
  });

  describe('execute - error handling', () => {
    it('should handle unexpected errors gracefully', async () => {
      mockServiceRegistry.getRouteForPath.mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const result = await useCase.execute(validInput);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Internal proxy error');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Proxy request error',
        expect.objectContaining({
          error: 'Database connection failed'
        })
      );
    });
  });

  describe('execute - user context', () => {
    it('should include user context in logs', async () => {
      mockServiceRegistry.getRouteForPath.mockReturnValue(mockRoute);
      mockServiceRegistry.isHealthy.mockResolvedValue(true);

      await useCase.execute(validInput);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Proxying request to service',
        expect.objectContaining({
          userId: validInput.userId,
          ip: validInput.ip
        })
      );
    });

    it('should work without user context (public endpoints)', async () => {
      mockServiceRegistry.getRouteForPath.mockReturnValue(mockRoute);
      mockServiceRegistry.isHealthy.mockResolvedValue(true);

      const result = await useCase.execute({
        path: '/api/v1/auth/login',
        method: 'POST',
        headers: {},
        requestId: 'test-request-id',
        ip: '127.0.0.1'
      });

      expect(result.success).toBe(true);
    });
  });
});

