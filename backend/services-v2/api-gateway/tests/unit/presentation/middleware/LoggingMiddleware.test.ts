import { Response, NextFunction } from 'express';
import { LoggingMiddleware } from '@presentation/middleware/LoggingMiddleware';
import { AuthenticatedRequest } from '@presentation/middleware/AuthenticationMiddleware';
import { ILogger } from '@application/services/ILogger';
import { EventEmitter } from 'events';

describe('LoggingMiddleware', () => {
  let middleware: LoggingMiddleware;
  let mockLogger: jest.Mocked<ILogger>;
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response> & EventEmitter;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    };

    middleware = new LoggingMiddleware(mockLogger);

    mockRequest = {
      requestId: 'req-123',
      method: 'GET',
      path: '/api/v1/patients',
      query: { page: '1', limit: '10' },
      ip: '127.0.0.1',
      headers: {
        'user-agent': 'Mozilla/5.0'
      },
      user: undefined
    };

    mockResponse = Object.assign(new EventEmitter(), {
      statusCode: 200,
      on: jest.fn()
    });

    mockNext = jest.fn();

    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('logRequests', () => {
    it('should log incoming request', () => {
      const handler = middleware.logRequests();

      handler(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Incoming request',
        expect.objectContaining({
          requestId: 'req-123',
          method: 'GET',
          path: '/api/v1/patients',
          query: { page: '1', limit: '10' },
          ip: '127.0.0.1',
          userAgent: 'Mozilla/5.0'
        })
      );
      expect(mockNext).toHaveBeenCalled();
    });

    it('should log incoming request with user ID when authenticated', () => {
      mockRequest.user = {
        userId: 'user-456',
        email: 'test@example.com',
        roles: ['doctor'],
        permissions: []
      } as any;

      const handler = middleware.logRequests();

      handler(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Incoming request',
        expect.objectContaining({
          userId: 'user-456'
        })
      );
    });

    it('should log outgoing response on finish event', () => {
      const handler = middleware.logRequests();

      handler(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      jest.advanceTimersByTime(50);
      mockResponse.emit('finish');

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Outgoing response',
        expect.objectContaining({
          requestId: 'req-123',
          method: 'GET',
          path: '/api/v1/patients',
          statusCode: 200,
          duration: '50ms'
        })
      );
    });

    it('should log with info level for 2xx responses', () => {
      mockResponse.statusCode = 200;
      const handler = middleware.logRequests();

      handler(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      jest.advanceTimersByTime(100);
      mockResponse.emit('finish');

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Outgoing response',
        expect.any(Object)
      );
    });

    it('should log with info level for 3xx responses', () => {
      mockResponse.statusCode = 301;
      const handler = middleware.logRequests();

      handler(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      jest.advanceTimersByTime(100);
      mockResponse.emit('finish');

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Outgoing response',
        expect.any(Object)
      );
    });

    it('should log with warn level for 4xx responses', () => {
      mockResponse.statusCode = 404;
      const handler = middleware.logRequests();

      handler(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      jest.advanceTimersByTime(100);
      mockResponse.emit('finish');

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Outgoing response',
        expect.objectContaining({
          statusCode: 404
        })
      );
    });

    it('should log with error level for 5xx responses', () => {
      mockResponse.statusCode = 500;
      const handler = middleware.logRequests();

      handler(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      jest.advanceTimersByTime(100);
      mockResponse.emit('finish');

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Outgoing response',
        expect.objectContaining({
          statusCode: 500
        })
      );
    });

    it('should calculate request duration correctly', () => {
      const handler = middleware.logRequests();

      handler(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      jest.advanceTimersByTime(250);
      mockResponse.emit('finish');

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Outgoing response',
        expect.objectContaining({
          duration: '250ms'
        })
      );
    });

    it('should include user ID in response log when authenticated', () => {
      mockRequest.user = {
        userId: 'user-789',
        email: 'test@example.com',
        roles: ['doctor'],
        permissions: []
      } as any;

      const handler = middleware.logRequests();

      handler(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      jest.advanceTimersByTime(100);
      mockResponse.emit('finish');

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Outgoing response',
        expect.objectContaining({
          userId: 'user-789'
        })
      );
    });

    it('should handle missing query parameters', () => {
      mockRequest.query = undefined;
      const handler = middleware.logRequests();

      handler(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Incoming request',
        expect.objectContaining({
          query: undefined
        })
      );
    });

    it('should handle missing user agent', () => {
      mockRequest.headers = {};
      const handler = middleware.logRequests();

      handler(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Incoming request',
        expect.objectContaining({
          userAgent: undefined
        })
      );
    });

    it('should handle missing IP address', () => {
      mockRequest.ip = undefined;
      const handler = middleware.logRequests();

      handler(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Incoming request',
        expect.objectContaining({
          ip: undefined
        })
      );
    });

    it('should call next middleware', () => {
      const handler = middleware.logRequests();

      handler(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple requests concurrently', () => {
      const handler = middleware.logRequests();

      const req1 = { ...mockRequest, requestId: 'req-1' };
      const req2 = { ...mockRequest, requestId: 'req-2' };
      const res1 = Object.assign(new EventEmitter(), { statusCode: 200 });
      const res2 = Object.assign(new EventEmitter(), { statusCode: 404 });

      handler(req1 as AuthenticatedRequest, res1 as Response, mockNext);
      handler(req2 as AuthenticatedRequest, res2 as Response, mockNext);

      jest.advanceTimersByTime(100);
      res1.emit('finish');
      
      jest.advanceTimersByTime(50);
      res2.emit('finish');

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Outgoing response',
        expect.objectContaining({
          requestId: 'req-1',
          duration: '100ms'
        })
      );

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Outgoing response',
        expect.objectContaining({
          requestId: 'req-2',
          duration: '150ms'
        })
      );
    });

    it('should handle different HTTP methods', () => {
      const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

      methods.forEach(method => {
        jest.clearAllMocks();
        mockRequest.method = method;
        const handler = middleware.logRequests();

        handler(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

        expect(mockLogger.info).toHaveBeenCalledWith(
          'Incoming request',
          expect.objectContaining({
            method
          })
        );
      });
    });

    it('should handle different status codes', () => {
      const statusCodes = [200, 201, 301, 400, 401, 403, 404, 500, 502, 503];

      statusCodes.forEach(statusCode => {
        jest.clearAllMocks();
        mockResponse.statusCode = statusCode;
        const handler = middleware.logRequests();

        handler(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

        jest.advanceTimersByTime(100);
        mockResponse.emit('finish');

        const expectedLogLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
        expect(mockLogger[expectedLogLevel]).toHaveBeenCalledWith(
          'Outgoing response',
          expect.objectContaining({
            statusCode
          })
        );
      });
    });
  });
});
