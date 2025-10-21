import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authMiddleware } from '../../../../src/presentation/middleware/authMiddleware';

describe('authMiddleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  const originalEnv = process.env;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockNext = jest.fn();

    mockRequest = {
      headers: {}
    };

    mockResponse = {
      status: statusMock,
      json: jsonMock
    };

    process.env = { ...originalEnv, JWT_SECRET: 'test-secret' };

    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  describe('valid token', () => {
    it('should authenticate with valid token', () => {
      const payload = { sub: 'user-123', email: 'test@example.com', role: 'admin' };
      const token = jwt.sign(payload, 'test-secret');

      mockRequest.headers = { authorization: `Bearer ${token}` };

      authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.user).toEqual(expect.objectContaining({
        sub: payload.sub,
        role: payload.role,
        email: payload.email,
        iat: expect.any(Number) // JWT adds iat (issued at) timestamp
      }));
      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should decode service token', () => {
      const payload = { sub: 'service-123', service: 'scheduling-service' };
      const token = jwt.sign(payload, 'test-secret');

      mockRequest.headers = { authorization: `Bearer ${token}` };

      authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.user).toEqual(expect.objectContaining({
        sub: payload.sub,
        service: payload.service,
        iat: expect.any(Number)
      }));
      expect(mockNext).toHaveBeenCalled();
    });

    it('should use SUPABASE_JWT_SECRET if JWT_SECRET not set', () => {
      delete process.env.JWT_SECRET;
      process.env.SUPABASE_JWT_SECRET = 'supabase-secret';

      const payload = { sub: 'user-123' };
      const token = jwt.sign(payload, 'supabase-secret');

      mockRequest.headers = { authorization: `Bearer ${token}` };

      authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.user).toEqual(expect.objectContaining({
        sub: payload.sub,
        iat: expect.any(Number)
      }));
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('missing authorization', () => {
    it('should return 401 if authorization header is missing', () => {
      mockRequest.headers = {};

      authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Missing authorization header'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 if token is missing', () => {
      mockRequest.headers = { authorization: 'Bearer ' };

      authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Missing token'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 if authorization header is empty', () => {
      mockRequest.headers = { authorization: '' };

      authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Missing authorization header'
      });
    });
  });

  describe('invalid token', () => {
    it('should return 401 for invalid token', () => {
      mockRequest.headers = { authorization: 'Bearer invalid-token' };

      authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid token'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 for expired token', () => {
      const payload = { sub: 'user-123' };
      const token = jwt.sign(payload, 'test-secret', { expiresIn: '-1h' });

      mockRequest.headers = { authorization: `Bearer ${token}` };

      authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Token expired'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 for token with wrong secret', () => {
      const payload = { sub: 'user-123' };
      const token = jwt.sign(payload, 'wrong-secret');

      mockRequest.headers = { authorization: `Bearer ${token}` };

      authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid token'
      });
    });

    it('should return 401 for malformed token', () => {
      mockRequest.headers = { authorization: 'Bearer malformed.token' };

      authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid token'
      });
    });
  });

  describe('configuration errors', () => {
    it('should return 500 if JWT_SECRET is not configured', () => {
      delete process.env.JWT_SECRET;
      delete process.env.SUPABASE_JWT_SECRET;

      const payload = { sub: 'user-123' };
      const token = jwt.sign(payload, 'any-secret');

      mockRequest.headers = { authorization: `Bearer ${token}` };

      authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Server configuration error'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle authorization header without Bearer prefix', () => {
      const payload = { sub: 'user-123' };
      const token = jwt.sign(payload, 'test-secret');

      mockRequest.headers = { authorization: token };

      authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Middleware uses replace('Bearer ', '') so token without prefix still works
      expect(mockRequest.user).toEqual(expect.objectContaining({
        sub: payload.sub,
        iat: expect.any(Number)
      }));
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle non-Error exceptions', () => {
      mockRequest.headers = { authorization: 'Bearer invalid' };

      jest.spyOn(jwt, 'verify').mockImplementation(() => {
        throw 'String error';
      });

      authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Authentication failed'
      });
    });

    it('should trim Bearer prefix correctly', () => {
      const payload = { sub: 'user-123' };
      const token = jwt.sign(payload, 'test-secret');

      mockRequest.headers = { authorization: `Bearer  ${token}` };

      authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.user).toEqual(expect.objectContaining({
        sub: payload.sub,
        iat: expect.any(Number)
      }));
      expect(mockNext).toHaveBeenCalled();
    });
  });
});

