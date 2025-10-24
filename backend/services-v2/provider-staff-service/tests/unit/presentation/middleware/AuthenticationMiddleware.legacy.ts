/**
 * AuthenticationMiddleware Tests
 * Phase 3: Presentation Layer
 * @version 2.0.0
 */

import { Request, Response, NextFunction } from 'express';
import {
  AuthenticationMiddleware,
  AuthenticatedRequest,
  getUserId,
  getUserRole,
  hasRole,
  hasAnyRole
} from '../../../../src/presentation/middleware/AuthenticationMiddleware';

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn()
    }
  }))
}));

describe('AuthenticationMiddleware', () => {
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;
  let middleware: AuthenticationMiddleware;

  beforeEach(() => {
    mockRequest = {
      headers: {},
      requestId: 'test-request-id'
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    nextFunction = jest.fn();

    middleware = new AuthenticationMiddleware({
      supabaseUrl: 'https://test.supabase.co',
      supabaseKey: 'test-key'
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('authenticate', () => {
    it('should return 401 when no authorization header provided', async () => {
      const config = {
        supabaseUrl: 'https://test.supabase.co',
        supabaseKey: 'test-key',
        requireAuth: true
      };
      const mw = new AuthenticationMiddleware(config);

      await mw.authenticate(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'UNAUTHORIZED',
          message: expect.stringContaining('Token')
        })
      );
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 401 when authorization header does not start with Bearer', async () => {
      mockRequest.headers = { authorization: 'InvalidToken' };
      const config = {
        supabaseUrl: 'https://test.supabase.co',
        supabaseKey: 'test-key',
        requireAuth: true
      };
      const mw = new AuthenticationMiddleware(config);

      await mw.authenticate(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should continue without user when auth is optional and no token provided', async () => {
      const config = {
        supabaseUrl: 'https://test.supabase.co',
        supabaseKey: 'test-key',
        requireAuth: false
      };
      const mw = new AuthenticationMiddleware(config);

      await mw.authenticate(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should return 401 when token is invalid', async () => {
      mockRequest.headers = { authorization: 'Bearer invalid-token' };

      // Mock supabase getUser to return error
      const mockSupabase = (middleware as any).supabase;
      mockSupabase.auth.getUser = jest.fn().mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid token' }
      });

      await middleware.authenticate(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'INVALID_TOKEN',
          message: expect.stringContaining('không hợp lệ')
        })
      );
    });

    it('should attach user to request when token is valid', async () => {
      mockRequest.headers = { authorization: 'Bearer valid-token' };

      const mockUser = {
        id: 'user-123',
        email: 'test@test.com',
        user_metadata: { role: 'admin' },
        app_metadata: { roles: ['admin', 'doctor'] }
      };

      const mockSupabase = (middleware as any).supabase;
      mockSupabase.auth.getUser = jest.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      await middleware.authenticate(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(mockRequest.user).toBeDefined();
      expect(mockRequest.user?.id).toBe('user-123');
      expect(mockRequest.user?.email).toBe('test@test.com');
      expect(mockRequest.user?.role).toBe('admin');
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should return 403 when user does not have required role', async () => {
      mockRequest.headers = { authorization: 'Bearer valid-token' };

      const mockUser = {
        id: 'user-123',
        email: 'test@test.com',
        user_metadata: { role: 'nurse' },
        app_metadata: { roles: ['nurse'] }
      };

      const mockSupabase = (middleware as any).supabase;
      mockSupabase.auth.getUser = jest.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      const config = {
        supabaseUrl: 'https://test.supabase.co',
        supabaseKey: 'test-key',
        requireAuth: true,
        allowedRoles: ['admin', 'doctor']
      };
      const mw = new AuthenticationMiddleware(config);

      await mw.authenticate(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'FORBIDDEN',
          message: expect.stringContaining('không có quyền')
        })
      );
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should allow access when user has one of the required roles', async () => {
      mockRequest.headers = { authorization: 'Bearer valid-token' };

      const mockUser = {
        id: 'user-123',
        email: 'doctor@test.com',
        user_metadata: { role: 'doctor' },
        app_metadata: { roles: ['doctor'] }
      };

      const mockSupabase = (middleware as any).supabase;
      mockSupabase.auth.getUser = jest.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      const config = {
        supabaseUrl: 'https://test.supabase.co',
        supabaseKey: 'test-key',
        requireAuth: true,
        allowedRoles: ['admin', 'doctor']
      };
      const mw = new AuthenticationMiddleware(config);

      await mw.authenticate(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should handle authentication errors gracefully', async () => {
      mockRequest.headers = { authorization: 'Bearer valid-token' };

      const mockSupabase = (middleware as any).supabase;
      mockSupabase.auth.getUser = jest.fn().mockRejectedValue(
        new Error('Network error')
      );

      await middleware.authenticate(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'AUTHENTICATION_ERROR',
          details: 'Network error'
        })
      );
    });
  });

  describe('Static factory methods', () => {
    it('should create requireAuth middleware', () => {
      const mw = AuthenticationMiddleware.requireAuth(
        'https://test.supabase.co',
        'test-key'
      );

      expect(mw).toBeInstanceOf(Function);
    });

    it('should create requireRoles middleware', () => {
      const mw = AuthenticationMiddleware.requireRoles(
        'https://test.supabase.co',
        'test-key',
        ['admin']
      );

      expect(mw).toBeInstanceOf(Function);
    });

    it('should create optional auth middleware', () => {
      const mw = AuthenticationMiddleware.optional(
        'https://test.supabase.co',
        'test-key'
      );

      expect(mw).toBeInstanceOf(Function);
    });

    it('should create adminOnly middleware', () => {
      const mw = AuthenticationMiddleware.adminOnly(
        'https://test.supabase.co',
        'test-key'
      );

      expect(mw).toBeInstanceOf(Function);
    });

    it('should create healthcareStaffOnly middleware', () => {
      const mw = AuthenticationMiddleware.healthcareStaffOnly(
        'https://test.supabase.co',
        'test-key'
      );

      expect(mw).toBeInstanceOf(Function);
    });

    it('should create doctorOnly middleware', () => {
      const mw = AuthenticationMiddleware.doctorOnly(
        'https://test.supabase.co',
        'test-key'
      );

      expect(mw).toBeInstanceOf(Function);
    });
  });

  describe('Helper functions', () => {
    beforeEach(() => {
      mockRequest.user = {
        id: 'user-123',
        email: 'test@test.com',
        role: 'admin',
        roles: ['admin', 'doctor']
      };
    });

    it('getUserId should return user ID', () => {
      const userId = getUserId(mockRequest as AuthenticatedRequest);
      expect(userId).toBe('user-123');
    });

    it('getUserId should return null when no user', () => {
      delete mockRequest.user;
      const userId = getUserId(mockRequest as AuthenticatedRequest);
      expect(userId).toBeNull();
    });

    it('getUserRole should return user role', () => {
      const role = getUserRole(mockRequest as AuthenticatedRequest);
      expect(role).toBe('admin');
    });

    it('getUserRole should return null when no user', () => {
      delete mockRequest.user;
      const role = getUserRole(mockRequest as AuthenticatedRequest);
      expect(role).toBeNull();
    });

    it('hasRole should return true when user has role', () => {
      const result = hasRole(mockRequest as AuthenticatedRequest, 'admin');
      expect(result).toBe(true);
    });

    it('hasRole should check roles array', () => {
      mockRequest.user!.role = 'other';
      const result = hasRole(mockRequest as AuthenticatedRequest, 'doctor');
      expect(result).toBe(true);
    });

    it('hasRole should return false when user does not have role', () => {
      const result = hasRole(mockRequest as AuthenticatedRequest, 'nurse');
      expect(result).toBe(false);
    });

    it('hasAnyRole should return true when user has any of the roles', () => {
      const result = hasAnyRole(mockRequest as AuthenticatedRequest, [
        'nurse',
        'admin',
        'patient'
      ]);
      expect(result).toBe(true);
    });

    it('hasAnyRole should return false when user has none of the roles', () => {
      const result = hasAnyRole(mockRequest as AuthenticatedRequest, [
        'nurse',
        'patient'
      ]);
      expect(result).toBe(false);
    });
  });
});
