/**
 * Unit Tests for AuthenticationMiddleware
 * Tests JWT token verification and user attachment
 */

import { Response, NextFunction } from 'express';
import { AuthenticationMiddleware, AuthenticatedRequest } from '@presentation/middleware/AuthenticationMiddleware';
import { SupabaseAuthClient } from '@infrastructure/auth/SupabaseAuthClient';
import { IPermissionService } from '@application/services/IPermissionService';
import { TestUtils } from '@tests/setup';

describe('AuthenticationMiddleware', () => {
  let middleware: AuthenticationMiddleware;
  let mockAuthClient: jest.Mocked<SupabaseAuthClient>;
  let mockPermissionService: jest.Mocked<IPermissionService>;
  let logger: any;
  let mockReq: Partial<AuthenticatedRequest>;
  let mockRes: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    // Mock AuthClient
    mockAuthClient = {
      verifyToken: jest.fn(),
    } as any;

    // Mock PermissionService
    mockPermissionService = {
      getUserPermissions: jest.fn(),
    } as any;

    logger = TestUtils.createMockLogger();

    middleware = new AuthenticationMiddleware(
      mockAuthClient,
      mockPermissionService,
      logger
    );

    // Mock Express request/response
    mockReq = {
      headers: {},
      path: '/api/test',
      method: 'GET',
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  describe('authenticate', () => {
    it('should authenticate user with valid token', async () => {
      const mockUser = {
        id: 'u-123',
        email: 'doctor@hospital.vn',
        user_metadata: { roles: ['doctor'] },
      };

      mockReq.headers = {
        authorization: 'Bearer valid-token',
      };

      mockAuthClient.verifyToken.mockResolvedValue(mockUser as any);
      mockPermissionService.getUserPermissions.mockResolvedValue(['patients:read', 'patients:write']);

      const authenticateMiddleware = middleware.authenticate();
      await authenticateMiddleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockAuthClient.verifyToken).toHaveBeenCalledWith('valid-token');
      expect(mockPermissionService.getUserPermissions).toHaveBeenCalledWith('u-123');
      expect(mockReq.user).toEqual({
        userId: 'u-123',
        email: 'doctor@hospital.vn',
        roles: ['doctor'],
        permissions: ['patients:read', 'patients:write'],
      });
      expect(mockNext).toHaveBeenCalled();
      expect(logger.debug).toHaveBeenCalled();
    });

    it('should return 401 when authorization header is missing', async () => {
      mockReq.headers = {};

      const authenticateMiddleware = middleware.authenticate();
      await authenticateMiddleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized',
        message: 'Missing or invalid authorization header',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when authorization header does not start with Bearer', async () => {
      mockReq.headers = {
        authorization: 'Basic invalid-token',
      };

      const authenticateMiddleware = middleware.authenticate();
      await authenticateMiddleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized',
        message: 'Missing or invalid authorization header',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when token is invalid', async () => {
      mockReq.headers = {
        authorization: 'Bearer invalid-token',
      };

      mockAuthClient.verifyToken.mockResolvedValue(null);

      const authenticateMiddleware = middleware.authenticate();
      await authenticateMiddleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid or expired token',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when token verification throws error', async () => {
      mockReq.headers = {
        authorization: 'Bearer error-token',
      };

      mockAuthClient.verifyToken.mockRejectedValue(new Error('Token verification failed'));

      const authenticateMiddleware = middleware.authenticate();
      await authenticateMiddleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication failed',
      });
      expect(logger.error).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should use default patient role when user_metadata.roles is missing', async () => {
      const mockUser = {
        id: 'u-123',
        email: 'patient@example.com',
        user_metadata: {},
      };

      mockReq.headers = {
        authorization: 'Bearer valid-token',
      };

      mockAuthClient.verifyToken.mockResolvedValue(mockUser as any);
      mockPermissionService.getUserPermissions.mockResolvedValue(['patients:read_own']);

      const authenticateMiddleware = middleware.authenticate();
      await authenticateMiddleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockReq.user?.roles).toEqual(['patient']);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle permission service errors gracefully', async () => {
      const mockUser = {
        id: 'u-123',
        email: 'doctor@hospital.vn',
        user_metadata: { roles: ['doctor'] },
      };

      mockReq.headers = {
        authorization: 'Bearer valid-token',
      };

      mockAuthClient.verifyToken.mockResolvedValue(mockUser as any);
      mockPermissionService.getUserPermissions.mockRejectedValue(new Error('Permission service error'));

      const authenticateMiddleware = middleware.authenticate();
      await authenticateMiddleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(logger.error).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('optionalAuthenticate', () => {
    it('should authenticate user when valid token provided', async () => {
      const mockUser = {
        id: 'u-123',
        email: 'doctor@hospital.vn',
        user_metadata: { roles: ['doctor'] },
      };

      mockReq.headers = {
        authorization: 'Bearer valid-token',
      };

      mockAuthClient.verifyToken.mockResolvedValue(mockUser as any);
      mockPermissionService.getUserPermissions.mockResolvedValue(['patients:read']);

      const optionalMiddleware = middleware.optionalAuthenticate();
      await optionalMiddleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockReq.user).toBeDefined();
      expect(mockReq.user?.userId).toBe('u-123');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should continue without user when no token provided', async () => {
      mockReq.headers = {};

      const optionalMiddleware = middleware.optionalAuthenticate();
      await optionalMiddleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockReq.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
      expect(mockAuthClient.verifyToken).not.toHaveBeenCalled();
    });

    it('should continue without user when token is invalid', async () => {
      mockReq.headers = {
        authorization: 'Bearer invalid-token',
      };

      mockAuthClient.verifyToken.mockResolvedValue(null);

      const optionalMiddleware = middleware.optionalAuthenticate();
      await optionalMiddleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockReq.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should continue without user when verification throws error', async () => {
      mockReq.headers = {
        authorization: 'Bearer error-token',
      };

      mockAuthClient.verifyToken.mockRejectedValue(new Error('Verification error'));

      const optionalMiddleware = middleware.optionalAuthenticate();
      await optionalMiddleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockReq.user).toBeUndefined();
      expect(logger.warn).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('requireRole', () => {
    it('should allow request when user has required role', () => {
      mockReq.user = {
        userId: 'u-123',
        email: 'doctor@hospital.vn',
        roles: ['doctor'],
        permissions: [],
      };

      const roleMiddleware = middleware.requireRole('doctor');
      roleMiddleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should allow request when user has one of multiple required roles', () => {
      mockReq.user = {
        userId: 'u-123',
        email: 'doctor@hospital.vn',
        roles: ['doctor'],
        permissions: [],
      };

      const roleMiddleware = middleware.requireRole('doctor', 'nurse');
      roleMiddleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 401 when user is not authenticated', () => {
      mockReq.user = undefined;

      const roleMiddleware = middleware.requireRole('doctor');
      roleMiddleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 403 when user lacks required role', () => {
      mockReq.user = {
        userId: 'u-123',
        email: 'patient@example.com',
        roles: ['patient'],
        permissions: [],
      };

      const roleMiddleware = middleware.requireRole('doctor');
      roleMiddleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Forbidden',
        message: 'Required role: doctor',
        requiredRoles: ['doctor'],
      });
      expect(logger.warn).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireAdmin', () => {
    it('should allow request when user is admin', () => {
      mockReq.user = {
        userId: 'u-123',
        email: 'admin@hospital.vn',
        roles: ['admin'],
        permissions: [],
      };

      const adminMiddleware = middleware.requireAdmin();
      adminMiddleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should deny request when user is not admin', () => {
      mockReq.user = {
        userId: 'u-123',
        email: 'doctor@hospital.vn',
        roles: ['doctor'],
        permissions: [],
      };

      const adminMiddleware = middleware.requireAdmin();
      adminMiddleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireDoctor', () => {
    it('should allow request when user is doctor', () => {
      mockReq.user = {
        userId: 'u-123',
        email: 'doctor@hospital.vn',
        roles: ['doctor'],
        permissions: [],
      };

      const doctorMiddleware = middleware.requireDoctor();
      doctorMiddleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('requirePatient', () => {
    it('should allow request when user is patient', () => {
      mockReq.user = {
        userId: 'u-123',
        email: 'patient@example.com',
        roles: ['patient'],
        permissions: [],
      };

      const patientMiddleware = middleware.requirePatient();
      patientMiddleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });
});

