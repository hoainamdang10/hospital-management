import { createHealthRoutes } from '@presentation/routes/healthRoutes';
import { IServiceRegistry } from '@application/services/IServiceRegistry';
import { ILogger } from '@application/services/ILogger';
import { ServiceRoute } from '@domain/value-objects/ServiceRoute';
import request from 'supertest';
import express from 'express';

describe('healthRoutes', () => {
  let app: express.Application;
  let mockServiceRegistry: jest.Mocked<IServiceRegistry>;
  let mockLogger: jest.Mocked<ILogger>;

  const mockPatientRoute = ServiceRoute.create({
    serviceName: 'patient-registry-service',
    baseUrl: 'http://patient-registry-service:3003',
    pathPrefix: '/api/v1/patients',
    requiresAuth: true
  });

  const mockIdentityRoute = ServiceRoute.create({
    serviceName: 'identity-service',
    baseUrl: 'http://identity-service:3001',
    pathPrefix: '/api/v1/auth',
    requiresAuth: false
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

    app = express();
    app.use(express.json());
    app.use('/', createHealthRoutes(mockServiceRegistry, mockLogger));
  });

  describe('GET /health', () => {
    it('should return healthy status when all services are healthy', async () => {
      mockServiceRegistry.getAllRoutes.mockReturnValue([mockPatientRoute, mockIdentityRoute]);
      mockServiceRegistry.isHealthy.mockResolvedValue(true);

      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        status: 'healthy',
        services: [
          {
            service: 'patient-registry-service',
            healthy: true,
            url: 'http://patient-registry-service:3003'
          },
          {
            service: 'identity-service',
            healthy: true,
            url: 'http://identity-service:3001'
          }
        ]
      });
      expect(response.body.timestamp).toBeDefined();
    });

    it('should return degraded status when some services are unhealthy', async () => {
      mockServiceRegistry.getAllRoutes.mockReturnValue([mockPatientRoute, mockIdentityRoute]);
      mockServiceRegistry.isHealthy
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);

      const response = await request(app).get('/health');

      expect(response.status).toBe(503);
      expect(response.body).toMatchObject({
        success: true,
        status: 'degraded',
        services: [
          {
            service: 'patient-registry-service',
            healthy: true
          },
          {
            service: 'identity-service',
            healthy: false
          }
        ]
      });
    });

    it('should return degraded status when all services are unhealthy', async () => {
      mockServiceRegistry.getAllRoutes.mockReturnValue([mockPatientRoute, mockIdentityRoute]);
      mockServiceRegistry.isHealthy.mockResolvedValue(false);

      const response = await request(app).get('/health');

      expect(response.status).toBe(503);
      expect(response.body.status).toBe('degraded');
      expect(response.body.services.every((s: any) => !s.healthy)).toBe(true);
    });

    it('should return healthy status when no services are registered', async () => {
      mockServiceRegistry.getAllRoutes.mockReturnValue([]);

      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        status: 'healthy',
        services: []
      });
    });

    it('should handle errors gracefully', async () => {
      mockServiceRegistry.getAllRoutes.mockImplementation(() => {
        throw new Error('Service registry error');
      });

      const response = await request(app).get('/health');

      expect(response.status).toBe(500);
      expect(response.body).toMatchObject({
        success: false,
        status: 'unhealthy',
        error: 'Health check failed'
      });
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Health check failed',
        expect.objectContaining({
          error: 'Service registry error'
        })
      );
    });

    it('should handle isHealthy errors gracefully', async () => {
      mockServiceRegistry.getAllRoutes.mockReturnValue([mockPatientRoute]);
      mockServiceRegistry.isHealthy.mockRejectedValue(new Error('Health check timeout'));

      const response = await request(app).get('/health');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should check health for all registered services', async () => {
      const routes = [mockPatientRoute, mockIdentityRoute];
      mockServiceRegistry.getAllRoutes.mockReturnValue(routes);
      mockServiceRegistry.isHealthy.mockResolvedValue(true);

      await request(app).get('/health');

      expect(mockServiceRegistry.isHealthy).toHaveBeenCalledTimes(2);
      expect(mockServiceRegistry.isHealthy).toHaveBeenCalledWith('patient-registry-service');
      expect(mockServiceRegistry.isHealthy).toHaveBeenCalledWith('identity-service');
    });

    it('should include timestamp in ISO format', async () => {
      mockServiceRegistry.getAllRoutes.mockReturnValue([]);

      const response = await request(app).get('/health');

      expect(response.body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });

  describe('GET /health/ready', () => {
    it('should return ready status', async () => {
      const response = await request(app).get('/health/ready');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        status: 'ready'
      });
      expect(response.body.timestamp).toBeDefined();
    });

    it('should always return 200 regardless of service health', async () => {
      mockServiceRegistry.getAllRoutes.mockReturnValue([mockPatientRoute]);
      mockServiceRegistry.isHealthy.mockResolvedValue(false);

      const response = await request(app).get('/health/ready');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ready');
    });

    it('should include timestamp in ISO format', async () => {
      const response = await request(app).get('/health/ready');

      expect(response.body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });

  describe('GET /health/live', () => {
    it('should return alive status', async () => {
      const response = await request(app).get('/health/live');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        status: 'alive'
      });
      expect(response.body.timestamp).toBeDefined();
    });

    it('should always return 200 regardless of service health', async () => {
      mockServiceRegistry.getAllRoutes.mockReturnValue([mockPatientRoute]);
      mockServiceRegistry.isHealthy.mockResolvedValue(false);

      const response = await request(app).get('/health/live');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('alive');
    });

    it('should include timestamp in ISO format', async () => {
      const response = await request(app).get('/health/live');

      expect(response.body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });

  describe('Router creation', () => {
    it('should return an Express Router', () => {
      const router = createHealthRoutes(mockServiceRegistry, mockLogger);

      expect(router).toBeDefined();
      expect(typeof router).toBe('function');
    });

    it('should handle multiple concurrent health checks', async () => {
      mockServiceRegistry.getAllRoutes.mockReturnValue([mockPatientRoute, mockIdentityRoute]);
      mockServiceRegistry.isHealthy.mockResolvedValue(true);

      const requests = [
        request(app).get('/health'),
        request(app).get('/health'),
        request(app).get('/health')
      ];

      const responses = await Promise.all(requests);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.status).toBe('healthy');
      });
    });
  });

  describe('Error scenarios', () => {
    it('should handle null service registry gracefully', async () => {
      const nullRegistryApp = express();
      nullRegistryApp.use(express.json());
      
      mockServiceRegistry.getAllRoutes.mockReturnValue([]);

      nullRegistryApp.use('/', createHealthRoutes(mockServiceRegistry, mockLogger));

      const response = await request(nullRegistryApp).get('/health');

      expect(response.status).toBe(200);
    });

    it('should handle logger errors gracefully', async () => {
      mockLogger.error.mockImplementation(() => {
        throw new Error('Logger error');
      });
      mockServiceRegistry.getAllRoutes.mockImplementation(() => {
        throw new Error('Test error');
      });

      const response = await request(app).get('/health');

      expect(response.status).toBe(500);
    });
  });

  describe('Service health check details', () => {
    it('should include service name in health check response', async () => {
      mockServiceRegistry.getAllRoutes.mockReturnValue([mockPatientRoute]);
      mockServiceRegistry.isHealthy.mockResolvedValue(true);

      const response = await request(app).get('/health');

      expect(response.body.services[0].service).toBe('patient-registry-service');
    });

    it('should include service URL in health check response', async () => {
      mockServiceRegistry.getAllRoutes.mockReturnValue([mockPatientRoute]);
      mockServiceRegistry.isHealthy.mockResolvedValue(true);

      const response = await request(app).get('/health');

      expect(response.body.services[0].url).toBe('http://patient-registry-service:3003');
    });

    it('should include healthy status in health check response', async () => {
      mockServiceRegistry.getAllRoutes.mockReturnValue([mockPatientRoute]);
      mockServiceRegistry.isHealthy.mockResolvedValue(true);

      const response = await request(app).get('/health');

      expect(response.body.services[0].healthy).toBe(true);
    });
  });
});

