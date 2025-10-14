import { createProxyRoute, ProxyRouteConfig } from '@presentation/routes/proxyRoutes';
import { ILogger } from '@application/services/ILogger';
import { AuthenticatedRequest } from '@presentation/middleware/AuthenticationMiddleware';
import { UserId } from '@domain/value-objects/UserId';
import { AuthenticatedUser } from '@domain/entities/AuthenticatedUser';

jest.mock('http-proxy-middleware', () => ({
  createProxyMiddleware: jest.fn((options) => {
    return (req: any, res: any, next: any) => {
      if (options.onProxyReq) {
        const mockProxyReq = {
          setHeader: jest.fn()
        };
        options.onProxyReq(mockProxyReq, req, res);
      }
      
      if (options.onProxyRes) {
        const mockProxyRes = {
          statusCode: 200
        };
        options.onProxyRes(mockProxyRes, req, res);
      }
      
      next();
    };
  })
}));

describe('proxyRoutes', () => {
  let mockLogger: jest.Mocked<ILogger>;
  let config: ProxyRouteConfig;

  beforeEach(() => {
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    };

    config = {
      pathPrefix: '/api/v1/patients',
      target: 'http://patient-registry-service:3003',
      requiresAuth: true,
      changeOrigin: true,
      pathRewrite: {
        '^/api/v1/patients': '/api/v1/patients'
      }
    };

    jest.clearAllMocks();
  });

  describe('createProxyRoute', () => {
    it('should create a router', () => {
      const router = createProxyRoute(config, mockLogger);

      expect(router).toBeDefined();
      expect(typeof router).toBe('function');
    });

    it('should create router with default changeOrigin', () => {
      const configWithoutChangeOrigin = {
        ...config,
        changeOrigin: undefined
      };

      const router = createProxyRoute(configWithoutChangeOrigin, mockLogger);

      expect(router).toBeDefined();
    });

    it('should create router with pathRewrite', () => {
      const router = createProxyRoute(config, mockLogger);

      expect(router).toBeDefined();
    });

    it('should create router without pathRewrite', () => {
      const configWithoutPathRewrite = {
        ...config,
        pathRewrite: undefined
      };

      const router = createProxyRoute(configWithoutPathRewrite, mockLogger);

      expect(router).toBeDefined();
    });
  });

  describe('onProxyReq - User context headers', () => {
    it('should set user context headers when user is authenticated', () => {
      const router = createProxyRoute(config, mockLogger);
      
      const mockProxyReq = {
        setHeader: jest.fn()
      };

      const mockReq: Partial<AuthenticatedRequest> = {
        user: AuthenticatedUser.create({
          userId: UserId.create('550e8400-e29b-41d4-a716-446655440000'),
          email: 'test@example.com',
          roles: ['doctor'],
          permissions: ['patient:read', 'patient:write']
        }),
        requestId: 'req-123',
        ip: '127.0.0.1',
        protocol: 'http',
        hostname: 'localhost'
      };

      const { createProxyMiddleware } = require('http-proxy-middleware');
      const lastCall = createProxyMiddleware.mock.calls[createProxyMiddleware.mock.calls.length - 1];
      const options = lastCall[0];

      options.onProxyReq(mockProxyReq, mockReq);

      expect(mockProxyReq.setHeader).toHaveBeenCalledWith('X-User-Id', mockReq.user?.userId);
      expect(mockProxyReq.setHeader).toHaveBeenCalledWith('X-User-Email', mockReq.user?.email);
      expect(mockProxyReq.setHeader).toHaveBeenCalledWith('X-User-Roles', JSON.stringify(mockReq.user?.roles));
      expect(mockProxyReq.setHeader).toHaveBeenCalledWith('X-User-Permissions', JSON.stringify(mockReq.user?.permissions));
    });

    it('should not set user headers when user is not authenticated', () => {
      const router = createProxyRoute(config, mockLogger);
      
      const mockProxyReq = {
        setHeader: jest.fn()
      };

      const mockReq: Partial<AuthenticatedRequest> = {
        user: undefined,
        requestId: 'req-123',
        ip: '127.0.0.1',
        protocol: 'http',
        hostname: 'localhost'
      };

      const { createProxyMiddleware } = require('http-proxy-middleware');
      const lastCall = createProxyMiddleware.mock.calls[createProxyMiddleware.mock.calls.length - 1];
      const options = lastCall[0];

      options.onProxyReq(mockProxyReq, mockReq);

      expect(mockProxyReq.setHeader).not.toHaveBeenCalledWith('X-User-Id', expect.anything());
      expect(mockProxyReq.setHeader).not.toHaveBeenCalledWith('X-User-Email', expect.anything());
    });

    it('should set request ID header', () => {
      const router = createProxyRoute(config, mockLogger);
      
      const mockProxyReq = {
        setHeader: jest.fn()
      };

      const mockReq: Partial<AuthenticatedRequest> = {
        requestId: 'req-456',
        ip: '127.0.0.1',
        protocol: 'http',
        hostname: 'localhost'
      };

      const { createProxyMiddleware } = require('http-proxy-middleware');
      const lastCall = createProxyMiddleware.mock.calls[createProxyMiddleware.mock.calls.length - 1];
      const options = lastCall[0];

      options.onProxyReq(mockProxyReq, mockReq);

      expect(mockProxyReq.setHeader).toHaveBeenCalledWith('X-Request-Id', 'req-456');
    });

    it('should set forwarded headers', () => {
      const router = createProxyRoute(config, mockLogger);
      
      const mockProxyReq = {
        setHeader: jest.fn()
      };

      const mockReq: Partial<AuthenticatedRequest> = {
        requestId: 'req-123',
        ip: '192.168.1.1',
        protocol: 'https',
        hostname: 'api.example.com'
      };

      const { createProxyMiddleware } = require('http-proxy-middleware');
      const lastCall = createProxyMiddleware.mock.calls[createProxyMiddleware.mock.calls.length - 1];
      const options = lastCall[0];

      options.onProxyReq(mockProxyReq, mockReq);

      expect(mockProxyReq.setHeader).toHaveBeenCalledWith('X-Forwarded-For', '192.168.1.1');
      expect(mockProxyReq.setHeader).toHaveBeenCalledWith('X-Forwarded-Proto', 'https');
      expect(mockProxyReq.setHeader).toHaveBeenCalledWith('X-Forwarded-Host', 'api.example.com');
    });

    it('should handle missing IP address', () => {
      const router = createProxyRoute(config, mockLogger);
      
      const mockProxyReq = {
        setHeader: jest.fn()
      };

      const mockReq: Partial<AuthenticatedRequest> = {
        requestId: 'req-123',
        ip: undefined,
        protocol: 'http',
        hostname: 'localhost'
      };

      const { createProxyMiddleware } = require('http-proxy-middleware');
      const lastCall = createProxyMiddleware.mock.calls[createProxyMiddleware.mock.calls.length - 1];
      const options = lastCall[0];

      options.onProxyReq(mockProxyReq, mockReq);

      expect(mockProxyReq.setHeader).toHaveBeenCalledWith('X-Forwarded-For', 'unknown');
    });

    it('should log proxy request', () => {
      const router = createProxyRoute(config, mockLogger);
      
      const mockProxyReq = {
        setHeader: jest.fn()
      };

      const mockReq: Partial<AuthenticatedRequest> = {
        requestId: 'req-123',
        path: '/api/v1/patients/123',
        ip: '127.0.0.1',
        protocol: 'http',
        hostname: 'localhost'
      };

      const { createProxyMiddleware } = require('http-proxy-middleware');
      const lastCall = createProxyMiddleware.mock.calls[createProxyMiddleware.mock.calls.length - 1];
      const options = lastCall[0];

      options.onProxyReq(mockProxyReq, mockReq);

      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Proxying request',
        expect.objectContaining({
          requestId: 'req-123',
          path: '/api/v1/patients/123',
          target: config.target
        })
      );
    });
  });

  describe('onProxyRes - Response handling', () => {
    it('should log proxy response', () => {
      const router = createProxyRoute(config, mockLogger);
      
      const mockProxyRes = {
        statusCode: 200
      };

      const mockReq: Partial<AuthenticatedRequest> = {
        requestId: 'req-123',
        path: '/api/v1/patients/123',
        ip: '127.0.0.1',
        protocol: 'http',
        hostname: 'localhost'
      };

      const { createProxyMiddleware } = require('http-proxy-middleware');
      const lastCall = createProxyMiddleware.mock.calls[createProxyMiddleware.mock.calls.length - 1];
      const options = lastCall[0];

      options.onProxyRes(mockProxyRes, mockReq);

      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Proxy response received',
        expect.objectContaining({
          requestId: 'req-123',
          path: '/api/v1/patients/123',
          statusCode: 200
        })
      );
    });
  });

  describe('Proxy configuration', () => {
    it('should configure timeout', () => {
      const router = createProxyRoute(config, mockLogger);

      const { createProxyMiddleware } = require('http-proxy-middleware');
      const lastCall = createProxyMiddleware.mock.calls[createProxyMiddleware.mock.calls.length - 1];
      const options = lastCall[0];

      expect(options.timeout).toBe(30000);
      expect(options.proxyTimeout).toBe(30000);
    });

    it('should configure target', () => {
      const router = createProxyRoute(config, mockLogger);

      const { createProxyMiddleware } = require('http-proxy-middleware');
      const lastCall = createProxyMiddleware.mock.calls[createProxyMiddleware.mock.calls.length - 1];
      const options = lastCall[0];

      expect(options.target).toBe('http://patient-registry-service:3003');
    });

    it('should configure changeOrigin', () => {
      const router = createProxyRoute(config, mockLogger);

      const { createProxyMiddleware } = require('http-proxy-middleware');
      const lastCall = createProxyMiddleware.mock.calls[createProxyMiddleware.mock.calls.length - 1];
      const options = lastCall[0];

      expect(options.changeOrigin).toBe(true);
    });

    it('should configure pathRewrite', () => {
      const router = createProxyRoute(config, mockLogger);

      const { createProxyMiddleware } = require('http-proxy-middleware');
      const lastCall = createProxyMiddleware.mock.calls[createProxyMiddleware.mock.calls.length - 1];
      const options = lastCall[0];

      expect(options.pathRewrite).toEqual(config.pathRewrite);
    });
  });
});

