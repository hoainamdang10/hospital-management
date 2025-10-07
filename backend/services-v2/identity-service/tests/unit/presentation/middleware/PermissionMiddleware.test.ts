/**
 * Unit Tests for PermissionMiddleware
 * Tests RBAC permission checking and resource ownership
 */

import { Response, NextFunction } from 'express';
import {
  PermissionMiddleware,
  AuthenticatedRequest,
  getUserIdFromParams,
  getPatientIdFromParams,
  getOwnerIdFromBody,
  ResourceType,
  Action
} from '@presentation/middleware/PermissionMiddleware';
import { IPermissionService } from '@domain/services/IPermissionService';
import { TestUtils } from '@tests/setup';

describe('PermissionMiddleware', () => {
  let middleware: PermissionMiddleware;
  let mockPermissionService: jest.Mocked<IPermissionService>;
  let logger: any;
  let mockReq: Partial<AuthenticatedRequest>;
  let mockRes: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    // Mock PermissionService (domain interface)
    mockPermissionService = {
      checkPermission: jest.fn(),
      checkPermissionWithOwnership: jest.fn(),
      hasAnyPermission: jest.fn(),
      hasAllPermissions: jest.fn(),
      getEffectivePermissions: jest.fn(),
      getEffectivePermissionsAsObjects: jest.fn(),
      invalidateCache: jest.fn(),
      invalidateCacheForRole: jest.fn(),
      expandPermissions: jest.fn(),
      isAdmin: jest.fn(),
      getPermissionsGroupedByResource: jest.fn(),
      warmUpCache: jest.fn(),
      getCacheStats: jest.fn(),
    } as any;

    logger = TestUtils.createMockLogger();

    middleware = new PermissionMiddleware(mockPermissionService, logger);

    // Mock Express request/response
    mockReq = {
      headers: {},
      path: '/api/test',
      method: 'GET',
      params: {},
      body: {},
      user: {
        userId: 'u-123',
        email: 'doctor@hospital.vn',
        roles: ['doctor'],
        permissions: ['patients:read', 'patients:write'],
      },
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  describe('requirePermission', () => {
    it('should allow request when user has required permission', async () => {
      mockPermissionService.hasAnyPermission.mockResolvedValue(true);

      const permissionMiddleware = middleware.requirePermission({
        permissions: ['patients:read'],
      });

      await permissionMiddleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockPermissionService.hasAnyPermission).toHaveBeenCalledWith(
        expect.objectContaining({ props: expect.objectContaining({ value: 'u-123' }) }),
        ['patients:read']
      );
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should allow request when user has resource and action permission', async () => {
      mockPermissionService.hasAnyPermission.mockResolvedValue(true);

      const permissionMiddleware = middleware.requirePermission({
        resource: ResourceType.PATIENTS,
        action: Action.READ,
      });

      await permissionMiddleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockPermissionService.hasAnyPermission).toHaveBeenCalledWith(
        expect.objectContaining({ props: expect.objectContaining({ value: 'u-123' }) }),
        ['patients:read']
      );
      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 401 when user is not authenticated', async () => {
      mockReq.user = undefined;

      const permissionMiddleware = middleware.requirePermission({
        permissions: ['patients:read'],
      });

      await permissionMiddleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 403 when user lacks required permission', async () => {
      mockPermissionService.hasAnyPermission.mockResolvedValue(false);

      const permissionMiddleware = middleware.requirePermission({
        permissions: ['patients:delete'],
      });

      await permissionMiddleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Forbidden',
        message: 'You do not have permission to perform this action',
        requiredPermissions: ['patients:delete'],
      });
      expect(logger.warn).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should use custom error message when provided', async () => {
      mockPermissionService.hasAnyPermission.mockResolvedValue(false);

      const permissionMiddleware = middleware.requirePermission({
        permissions: ['patients:delete'],
        errorMessage: 'Custom error message',
      });

      await permissionMiddleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Forbidden',
        message: 'Custom error message',
        requiredPermissions: ['patients:delete'],
      });
    });

    it('should check all permissions when requireAll is true', async () => {
      mockPermissionService.hasAllPermissions.mockResolvedValue(true);

      const permissionMiddleware = middleware.requirePermission({
        permissions: ['patients:read', 'patients:write'],
        requireAll: true,
      });

      await permissionMiddleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockPermissionService.hasAllPermissions).toHaveBeenCalledWith(
        expect.objectContaining({ props: expect.objectContaining({ value: 'u-123' }) }),
        ['patients:read', 'patients:write']
      );
      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 500 when permission options are invalid', async () => {
      const permissionMiddleware = middleware.requirePermission({});

      await permissionMiddleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Internal Server Error',
        message: 'Invalid permission configuration',
      });
      expect(logger.error).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle permission service errors', async () => {
      mockPermissionService.hasAnyPermission.mockRejectedValue(new Error('Permission service error'));

      const permissionMiddleware = middleware.requirePermission({
        permissions: ['patients:read'],
      });

      await permissionMiddleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to check permissions',
      });
      expect(logger.error).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requirePermission with ownership check', () => {
    it('should allow owner to access own resource', async () => {
      mockPermissionService.hasAnyPermission.mockResolvedValue(true);
      mockReq.params = { userId: 'u-123' };

      const permissionMiddleware = middleware.requirePermission({
        permissions: ['patients:read'],
        checkOwnership: true,
        getResourceOwnerId: (req) => req.params?.userId,
      });

      await permissionMiddleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should allow admin to access any resource', async () => {
      mockPermissionService.hasAnyPermission.mockResolvedValue(true);
      mockPermissionService.checkPermissionWithOwnership.mockResolvedValue(true);
      mockReq.params = { userId: 'u-456' }; // Different user

      const permissionMiddleware = middleware.requirePermission({
        permissions: ['patients:read'],
        checkOwnership: true,
        getResourceOwnerId: (req) => req.params?.userId,
      });

      await permissionMiddleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockPermissionService.checkPermissionWithOwnership).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should deny non-owner without permission', async () => {
      mockPermissionService.hasAnyPermission.mockResolvedValue(true);
      mockPermissionService.checkPermissionWithOwnership.mockResolvedValue(false);
      mockReq.params = { userId: 'u-456' }; // Different user

      const permissionMiddleware = middleware.requirePermission({
        permissions: ['patients:read'],
        checkOwnership: true,
        getResourceOwnerId: (req) => req.params?.userId,
      });

      await permissionMiddleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Forbidden',
        message: 'You can only access your own resources',
      });
      expect(logger.warn).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should skip ownership check when resource owner ID is undefined', async () => {
      mockPermissionService.hasAnyPermission.mockResolvedValue(true);

      const permissionMiddleware = middleware.requirePermission({
        permissions: ['patients:read'],
        checkOwnership: true,
        getResourceOwnerId: () => undefined,
      });

      await permissionMiddleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockPermissionService.checkPermissionWithOwnership).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('requireAny', () => {
    it('should allow when user has any of the permissions', async () => {
      mockPermissionService.hasAnyPermission.mockResolvedValue(true);

      const permissionMiddleware = middleware.requireAny('patients:read', 'patients:write');

      await permissionMiddleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockPermissionService.hasAnyPermission).toHaveBeenCalledWith(
        expect.objectContaining({ props: expect.objectContaining({ value: 'u-123' }) }),
        ['patients:read', 'patients:write']
      );
      expect(mockNext).toHaveBeenCalled();
    });

    it('should deny when user has none of the permissions', async () => {
      mockPermissionService.hasAnyPermission.mockResolvedValue(false);

      const permissionMiddleware = middleware.requireAny('patients:delete', 'patients:admin');

      await permissionMiddleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireAll', () => {
    it('should allow when user has all permissions', async () => {
      mockPermissionService.hasAllPermissions.mockResolvedValue(true);

      const permissionMiddleware = middleware.requireAll('patients:read', 'patients:write');

      await permissionMiddleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockPermissionService.hasAllPermissions).toHaveBeenCalledWith(
        expect.objectContaining({ props: expect.objectContaining({ value: 'u-123' }) }),
        ['patients:read', 'patients:write']
      );
      expect(mockNext).toHaveBeenCalled();
    });

    it('should deny when user lacks any permission', async () => {
      mockPermissionService.hasAllPermissions.mockResolvedValue(false);

      const permissionMiddleware = middleware.requireAll('patients:read', 'patients:delete');

      await permissionMiddleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireResource', () => {
    it('should allow when user has resource permission', async () => {
      mockPermissionService.hasAnyPermission.mockResolvedValue(true);

      const permissionMiddleware = middleware.requireResource(ResourceType.PATIENTS, Action.READ);

      await permissionMiddleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockPermissionService.hasAnyPermission).toHaveBeenCalledWith(
        expect.objectContaining({ props: expect.objectContaining({ value: 'u-123' }) }),
        ['patients:read']
      );
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('requireAdmin', () => {
    it('should allow when user has admin permission', async () => {
      mockPermissionService.hasAnyPermission.mockResolvedValue(true);

      const permissionMiddleware = middleware.requireAdmin();

      await permissionMiddleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockPermissionService.hasAnyPermission).toHaveBeenCalledWith(
        expect.objectContaining({ props: expect.objectContaining({ value: 'u-123' }) }),
        ['*']
      );
      expect(mockNext).toHaveBeenCalled();
    });

    it('should deny when user is not admin', async () => {
      mockPermissionService.hasAnyPermission.mockResolvedValue(false);

      const permissionMiddleware = middleware.requireAdmin();

      await permissionMiddleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Admin access required',
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireOwnershipOrAdmin', () => {
    it('should allow owner to access own resource', async () => {
      mockPermissionService.hasAnyPermission.mockResolvedValue(true);
      mockReq.params = { userId: 'u-123' };

      const permissionMiddleware = middleware.requireOwnershipOrAdmin((req) => req.params?.userId);

      await permissionMiddleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should allow admin to access any resource', async () => {
      mockPermissionService.hasAnyPermission.mockResolvedValue(true);
      mockPermissionService.checkPermissionWithOwnership.mockResolvedValue(true);
      mockReq.params = { userId: 'u-456' };

      const permissionMiddleware = middleware.requireOwnershipOrAdmin((req) => req.params?.userId);

      await permissionMiddleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('Helper functions', () => {
    it('getUserIdFromParams should extract userId from params', () => {
      mockReq.params = { userId: 'u-123' };
      expect(getUserIdFromParams(mockReq as AuthenticatedRequest)).toBe('u-123');
    });

    it('getUserIdFromParams should extract id from params', () => {
      mockReq.params = { id: 'u-456' };
      expect(getUserIdFromParams(mockReq as AuthenticatedRequest)).toBe('u-456');
    });

    it('getPatientIdFromParams should extract patientId from params', () => {
      mockReq.params = { patientId: 'p-123' };
      expect(getPatientIdFromParams(mockReq as AuthenticatedRequest)).toBe('p-123');
    });

    it('getOwnerIdFromBody should extract userId from body', () => {
      mockReq.body = { userId: 'u-789' };
      expect(getOwnerIdFromBody(mockReq as AuthenticatedRequest)).toBe('u-789');
    });

    it('getOwnerIdFromBody should extract ownerId from body', () => {
      mockReq.body = { ownerId: 'u-999' };
      expect(getOwnerIdFromBody(mockReq as AuthenticatedRequest)).toBe('u-999');
    });
  });
});

