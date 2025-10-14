import { Response, NextFunction } from 'express';
import { ErrorHandlingMiddleware } from '@presentation/middleware/ErrorHandlingMiddleware';
import { AuthenticatedRequest } from '@presentation/middleware/AuthenticationMiddleware';
import { ILogger } from '@application/services/ILogger';

describe('ErrorHandlingMiddleware', () => {
  let middleware: ErrorHandlingMiddleware;
  let mockLogger: jest.Mocked<ILogger>;
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    };

    middleware = new ErrorHandlingMiddleware(mockLogger);

    mockRequest = {
      requestId: 'req-123',
      method: 'GET',
      path: '/api/v1/patients',
      user: undefined
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    mockNext = jest.fn();
  });

  describe('handleErrors', () => {
    it('should handle generic errors with 500 status', () => {
      const error = new Error('Internal server error');
      const handler = middleware.handleErrors();

      handler(error, mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Unhandled error',
        expect.objectContaining({
          requestId: 'req-123',
          method: 'GET',
          path: '/api/v1/patients',
          error: 'Internal server error'
        })
      );
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Internal server error',
        requestId: 'req-123'
      });
    });

    it('should handle 404 errors', () => {
      const error = new Error('Resource not found');
      const handler = middleware.handleErrors();

      handler(error, mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Resource not found',
        requestId: 'req-123'
      });
    });

    it('should handle 401 unauthorized errors', () => {
      const error = new Error('Unauthorized access');
      const handler = middleware.handleErrors();

      handler(error, mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized access',
        requestId: 'req-123'
      });
    });

    it('should handle 401 authentication errors', () => {
      const error = new Error('Authentication failed');
      const handler = middleware.handleErrors();

      handler(error, mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
    });

    it('should handle 403 forbidden errors', () => {
      const error = new Error('Forbidden resource');
      const handler = middleware.handleErrors();

      handler(error, mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Forbidden resource',
        requestId: 'req-123'
      });
    });

    it('should handle 403 permission errors', () => {
      const error = new Error('Insufficient permissions');
      const handler = middleware.handleErrors();

      handler(error, mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
    });

    it('should handle 400 validation errors', () => {
      const error = new Error('Validation failed');
      const handler = middleware.handleErrors();

      handler(error, mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Validation failed',
        requestId: 'req-123'
      });
    });

    it('should handle 400 invalid errors', () => {
      const error = new Error('Invalid input');
      const handler = middleware.handleErrors();

      handler(error, mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('should handle errors with custom statusCode property', () => {
      const error: any = new Error('Custom error');
      error.statusCode = 418;
      const handler = middleware.handleErrors();

      handler(error, mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(418);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Custom error',
        requestId: 'req-123'
      });
    });

    it('should sanitize error messages for 500 errors', () => {
      const error = new Error('Database connection failed: password=secret123');
      const handler = middleware.handleErrors();

      handler(error, mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Internal server error',
        requestId: 'req-123'
      });
    });

    it('should include user ID in logs when user is authenticated', () => {
      mockRequest.user = {
        userId: 'user-456',
        email: 'test@example.com',
        roles: ['doctor'],
        permissions: []
      } as any;

      const error = new Error('Test error');
      const handler = middleware.handleErrors();

      handler(error, mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Unhandled error',
        expect.objectContaining({
          userId: 'user-456'
        })
      );
    });

    it('should include error stack trace in logs', () => {
      const error = new Error('Test error');
      const handler = middleware.handleErrors();

      handler(error, mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Unhandled error',
        expect.objectContaining({
          stack: expect.any(String)
        })
      );
    });
  });

  describe('handleNotFound', () => {
    it('should handle 404 not found', () => {
      const handler = middleware.handleNotFound();

      handler(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Route not found',
        expect.objectContaining({
          requestId: 'req-123',
          method: 'GET',
          path: '/api/v1/patients'
        })
      );
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Route not found: GET /api/v1/patients',
        requestId: 'req-123'
      });
    });

    it('should include user ID in logs when user is authenticated', () => {
      mockRequest.user = {
        userId: 'user-789',
        email: 'test@example.com',
        roles: ['doctor'],
        permissions: []
      } as any;

      const handler = middleware.handleNotFound();

      handler(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Route not found',
        expect.objectContaining({
          userId: 'user-789'
        })
      );
    });

    it('should handle different HTTP methods', () => {
      mockRequest.method = 'POST';
      mockRequest.path = '/api/v1/nonexistent';

      const handler = middleware.handleNotFound();

      handler(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Route not found: POST /api/v1/nonexistent',
        requestId: 'req-123'
      });
    });
  });

  describe('Error status code detection', () => {
    it('should detect not found errors', () => {
      const errors = [
        new Error('User not found'),
        new Error('Resource not found'),
        new Error('Page not found')
      ];

      errors.forEach(error => {
        const handler = middleware.handleErrors();
        handler(error, mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);
        expect(mockResponse.status).toHaveBeenCalledWith(404);
      });
    });

    it('should detect unauthorized errors', () => {
      const errors = [
        new Error('Unauthorized'),
        new Error('Authentication required'),
        new Error('Invalid authentication token')
      ];

      errors.forEach(error => {
        jest.clearAllMocks();
        const handler = middleware.handleErrors();
        handler(error, mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);
        expect(mockResponse.status).toHaveBeenCalledWith(401);
      });
    });

    it('should detect forbidden errors', () => {
      const errors = [
        new Error('Forbidden'),
        new Error('Insufficient permissions'),
        new Error('Permission denied')
      ];

      errors.forEach(error => {
        jest.clearAllMocks();
        const handler = middleware.handleErrors();
        handler(error, mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);
        expect(mockResponse.status).toHaveBeenCalledWith(403);
      });
    });

    it('should detect validation errors', () => {
      const errors = [
        new Error('Validation failed'),
        new Error('Invalid email format'),
        new Error('Invalid input data')
      ];

      errors.forEach(error => {
        jest.clearAllMocks();
        const handler = middleware.handleErrors();
        handler(error, mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);
        expect(mockResponse.status).toHaveBeenCalledWith(400);
      });
    });
  });
});

