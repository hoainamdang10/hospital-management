/**
 * ErrorHandlingMiddleware Tests
 * @version 2.0.0
 */

import { Request, Response, NextFunction } from 'express';
import {
  ErrorHandlingMiddleware,
  ApplicationError,
  DomainError,
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  ResponseHelper,
  getUserId,
  getUserRole,
  hasRole,
  hasPermission
} from '../../../../src/presentation/middleware/ErrorHandlingMiddleware';
import { ILogger } from '../../../../src/application/interfaces/ILogger';

describe('ErrorHandlingMiddleware', () => {
  let middleware: ErrorHandlingMiddleware;
  let mockLogger: jest.Mocked<ILogger>;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn()
    } as any;

    mockReq = {
      path: '/test',
      method: 'GET',
      body: {},
      query: {},
      params: {}
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    mockNext = jest.fn();

    middleware = new ErrorHandlingMiddleware(mockLogger);
  });

  describe('Error Classes', () => {
    it('should create ApplicationError', () => {
      const error = new ApplicationError('Test error', 500, 'TEST_CODE');
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('TEST_CODE');
    });

    it('should create DomainError with 400 status', () => {
      const error = new DomainError('Domain validation failed');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('DOMAIN_ERROR');
    });

    it('should create NotFoundError with resource info', () => {
      const error = new NotFoundError('Staff', 'staff-123');
      expect(error.message).toContain('Staff');
      expect(error.message).toContain('staff-123');
      expect(error.statusCode).toBe(404);
    });

    it('should create ValidationError', () => {
      const error = new ValidationError('Invalid input', { field: 'email' });
      expect(error.statusCode).toBe(400);
      expect(error.details).toEqual({ field: 'email' });
    });

    it('should create UnauthorizedError', () => {
      const error = new UnauthorizedError();
      expect(error.statusCode).toBe(401);
    });

    it('should create ForbiddenError', () => {
      const error = new ForbiddenError();
      expect(error.statusCode).toBe(403);
    });

    it('should create ConflictError', () => {
      const error = new ConflictError('Resource conflict');
      expect(error.statusCode).toBe(409);
    });
  });

  describe('handle', () => {
    it('should handle ApplicationError', () => {
      const handler = middleware.handle();
      const error = new ApplicationError('Test error', 400, 'TEST_CODE');

      handler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'TEST_CODE',
        message: 'Test error',
        details: undefined
      });
    });

    it('should handle domain errors', () => {
      const handler = middleware.handle();
      const error = new Error('không được để trống');

      handler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'DOMAIN_ERROR',
        message: 'không được để trống'
      });
    });

    it('should handle validation errors', () => {
      const handler = middleware.handle();
      const error = new Error('Validation failed');
      error.name = 'ValidationError';

      handler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should handle unknown errors', () => {
      const handler = middleware.handle();
      const error = new Error('Unknown error');

      handler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Đã xảy ra lỗi hệ thống, vui lòng thử lại sau'
      });
    });

    it('should log all errors', () => {
      const handler = middleware.handle();
      const error = new Error('Test error');

      handler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('asyncHandler', () => {
    it('should wrap async functions', async () => {
      const asyncFn = jest.fn().mockResolvedValue('success');
      const wrapped = ErrorHandlingMiddleware.asyncHandler(asyncFn);

      await wrapped(mockReq as Request, mockRes as Response, mockNext);

      expect(asyncFn).toHaveBeenCalled();
    });

    it('should catch async errors', async () => {
      const asyncFn = jest.fn().mockRejectedValue(new Error('Async error'));
      const wrapped = ErrorHandlingMiddleware.asyncHandler(asyncFn);

      await wrapped(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});

describe('ResponseHelper', () => {
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn()
    };
  });

  describe('success', () => {
    it('should send success response', () => {
      ResponseHelper.success(mockRes as Response, { id: 1 }, 'Success', 200);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Success',
        data: { id: 1 }
      });
    });
  });

  describe('created', () => {
    it('should send created response', () => {
      ResponseHelper.created(mockRes as Response, { id: 1 });

      expect(mockRes.status).toHaveBeenCalledWith(201);
    });
  });

  describe('paginated', () => {
    it('should send paginated response', () => {
      const data = [{ id: 1 }, { id: 2 }];
      ResponseHelper.paginated(mockRes as Response, data, 1, 10, 50);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data,
          pagination: {
            page: 1,
            limit: 10,
            total: 50,
            totalPages: 5
          }
        })
      );
    });
  });

  describe('noContent', () => {
    it('should send 204 response', () => {
      ResponseHelper.noContent(mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(204);
      expect(mockRes.send).toHaveBeenCalled();
    });
  });

  describe('error', () => {
    it('should send error response', () => {
      ResponseHelper.error(mockRes as Response, 'Error', 400, 'BAD_REQUEST');

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'BAD_REQUEST',
        message: 'Error',
        details: undefined
      });
    });
  });
});

describe('Helper Functions', () => {
  describe('getUserId', () => {
    it('should extract user ID from request', () => {
      const req = { user: { userId: 'user-123' } };
      expect(getUserId(req)).toBe('user-123');
    });

    it('should return system if no user', () => {
      const req = {};
      expect(getUserId(req)).toBe('system');
    });
  });

  describe('getUserRole', () => {
    it('should extract user role from request', () => {
      const req = { user: { roles: ['admin'] } };
      expect(getUserRole(req)).toBe('admin');
    });

    it('should return patient as default', () => {
      const req = {};
      expect(getUserRole(req)).toBe('patient');
    });
  });

  describe('hasRole', () => {
    it('should check if user has role', () => {
      const req = { user: { roles: ['admin', 'doctor'] } };
      expect(hasRole(req, 'admin')).toBe(true);
      expect(hasRole(req, ['doctor', 'nurse'])).toBe(true);
      expect(hasRole(req, 'patient')).toBe(false);
    });
  });

  describe('hasPermission', () => {
    it('should check if user has permission', () => {
      const req = { user: { permissions: ['read', 'write'] } };
      expect(hasPermission(req, 'read')).toBe(true);
      expect(hasPermission(req, 'delete')).toBe(false);
    });
  });
});
