/**
 * Unit Tests for PermissionService
 * Tests RBAC permission checking with caching
 */

import { PermissionService } from '@infrastructure/services/PermissionService';
import { IUserRepository } from '@application/repositories/IUserRepository';
import { RedisCacheService } from '@infrastructure/cache/RedisCacheService';
import { UserId } from '@domain/value-objects/UserId';
import { Permission, PermissionContext, ResourceType, Action } from '@application/services/IPermissionService';
import { TestUtils } from '@tests/setup';

describe('PermissionService', () => {
  let permissionService: PermissionService;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockCacheService: jest.Mocked<RedisCacheService>;
  let logger: any;

  const testUserId = 'u-123';
  const testUserIdVO = UserId.fromString(testUserId);

  beforeEach(() => {
    // Mock UserRepository
    mockUserRepository = {
      getUserPermissions: jest.fn(),
    } as any;

    // Mock CacheService
    mockCacheService = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
    } as any;

    logger = TestUtils.createMockLogger();

    permissionService = new PermissionService(
      mockUserRepository,
      mockCacheService,
      logger
    );
  });

  describe('hasPermission', () => {
    it('should return true when user has exact permission', async () => {
      const permissions: Permission[] = ['patients:read', 'patients:write'];
      mockCacheService.get.mockResolvedValue(null);
      mockUserRepository.getUserPermissions.mockResolvedValue(permissions);

      const result = await permissionService.hasPermission(testUserId, 'patients:read');

      expect(result).toBe(true);
      expect(mockUserRepository.getUserPermissions).toHaveBeenCalledWith(testUserIdVO);
    });

    it('should return true when user has wildcard permission', async () => {
      const permissions: Permission[] = ['*'];
      mockCacheService.get.mockResolvedValue(null);
      mockUserRepository.getUserPermissions.mockResolvedValue(permissions);

      const result = await permissionService.hasPermission(testUserId, 'patients:read');

      expect(result).toBe(true);
    });

    it('should return true when user has resource wildcard', async () => {
      const permissions: Permission[] = ['patients:*'];
      mockCacheService.get.mockResolvedValue(null);
      mockUserRepository.getUserPermissions.mockResolvedValue(permissions);

      const result = await permissionService.hasPermission(testUserId, 'patients:read');

      expect(result).toBe(true);
    });

    it('should return false when user lacks permission', async () => {
      const permissions: Permission[] = ['patients:read'];
      mockCacheService.get.mockResolvedValue(null);
      mockUserRepository.getUserPermissions.mockResolvedValue(permissions);

      const result = await permissionService.hasPermission(testUserId, 'patients:delete');

      expect(result).toBe(false);
    });

    it('should use cached permissions when available', async () => {
      const permissions: Permission[] = ['patients:read'];
      mockCacheService.get.mockResolvedValue(permissions);

      const result = await permissionService.hasPermission(testUserId, 'patients:read');

      expect(result).toBe(true);
      expect(mockUserRepository.getUserPermissions).not.toHaveBeenCalled();
    });

    it('should return false on error', async () => {
      mockCacheService.get.mockRejectedValue(new Error('Cache error'));
      mockUserRepository.getUserPermissions.mockRejectedValue(new Error('DB error'));

      const result = await permissionService.hasPermission(testUserId, 'patients:read');

      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('hasPermission with context', () => {
    it('should allow user to access their own resource', async () => {
      const permissions: Permission[] = ['patients:read'];
      mockCacheService.get.mockResolvedValue(null);
      mockUserRepository.getUserPermissions.mockResolvedValue(permissions);

      const context: PermissionContext = {
        userId: testUserId,
        resourceOwnerId: testUserId,
      };

      const result = await permissionService.hasPermission(testUserId, 'patients:read', context);

      expect(result).toBe(true);
    });

    it('should deny user access to others resource without permission', async () => {
      const permissions: Permission[] = ['patients:read'];
      mockCacheService.get.mockResolvedValue(null);
      mockUserRepository.getUserPermissions.mockResolvedValue(permissions);

      const context: PermissionContext = {
        userId: testUserId,
        resourceOwnerId: 'u-456', // Different owner
      };

      const result = await permissionService.hasPermission(testUserId, 'patients:read', context);

      expect(result).toBe(false);
    });

    it('should allow admin to access any resource', async () => {
      const permissions: Permission[] = ['*'];
      mockCacheService.get.mockResolvedValue(null);
      mockUserRepository.getUserPermissions.mockResolvedValue(permissions);

      const context: PermissionContext = {
        userId: testUserId,
        resourceOwnerId: 'u-456',
      };

      const result = await permissionService.hasPermission(testUserId, 'patients:read', context);

      expect(result).toBe(true);
    });
  });

  describe('hasAnyPermission', () => {
    it('should return true if user has any of the permissions', async () => {
      const permissions: Permission[] = ['patients:read'];
      mockCacheService.get.mockResolvedValue(null);
      mockUserRepository.getUserPermissions.mockResolvedValue(permissions);

      const result = await permissionService.hasAnyPermission(testUserId, [
        'patients:write',
        'patients:read',
      ]);

      expect(result).toBe(true);
    });

    it('should return false if user has none of the permissions', async () => {
      const permissions: Permission[] = ['patients:read'];
      mockCacheService.get.mockResolvedValue(null);
      mockUserRepository.getUserPermissions.mockResolvedValue(permissions);

      const result = await permissionService.hasAnyPermission(testUserId, [
        'patients:write',
        'patients:delete',
      ]);

      expect(result).toBe(false);
    });
  });

  describe('hasAllPermissions', () => {
    it('should return true if user has all permissions', async () => {
      const permissions: Permission[] = ['patients:read', 'patients:write'];
      mockCacheService.get.mockResolvedValue(null);
      mockUserRepository.getUserPermissions.mockResolvedValue(permissions);

      const result = await permissionService.hasAllPermissions(testUserId, [
        'patients:read',
        'patients:write',
      ]);

      expect(result).toBe(true);
    });

    it('should return false if user lacks any permission', async () => {
      const permissions: Permission[] = ['patients:read'];
      mockCacheService.get.mockResolvedValue(null);
      mockUserRepository.getUserPermissions.mockResolvedValue(permissions);

      const result = await permissionService.hasAllPermissions(testUserId, [
        'patients:read',
        'patients:write',
      ]);

      expect(result).toBe(false);
    });
  });

  describe('getUserPermissions', () => {
    it('should fetch from cache when available', async () => {
      const permissions: Permission[] = ['patients:read'];
      mockCacheService.get.mockResolvedValue(permissions);

      const result = await permissionService.getUserPermissions(testUserId);

      expect(result).toEqual(permissions);
      expect(mockCacheService.get).toHaveBeenCalledWith('permissions:u-123');
      expect(mockUserRepository.getUserPermissions).not.toHaveBeenCalled();
    });

    it('should fetch from repository and cache when cache miss', async () => {
      const permissions: Permission[] = ['patients:read', 'patients:write'];
      mockCacheService.get.mockResolvedValue(null);
      mockUserRepository.getUserPermissions.mockResolvedValue(permissions);

      const result = await permissionService.getUserPermissions(testUserId);

      expect(result).toEqual(permissions);
      expect(mockUserRepository.getUserPermissions).toHaveBeenCalledWith(testUserIdVO);
      expect(mockCacheService.set).toHaveBeenCalledWith(
        'permissions:u-123',
        permissions,
        { ttl: 300 }
      );
    });

    it('should return empty array on error', async () => {
      mockCacheService.get.mockRejectedValue(new Error('Cache error'));
      mockUserRepository.getUserPermissions.mockRejectedValue(new Error('DB error'));

      const result = await permissionService.getUserPermissions(testUserId);

      expect(result).toEqual([]);
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('checkPermission', () => {
    it('should return detailed result when permission allowed', async () => {
      const permissions: Permission[] = ['patients:read'];
      mockCacheService.get.mockResolvedValue(null);
      mockUserRepository.getUserPermissions.mockResolvedValue(permissions);

      const result = await permissionService.checkPermission(testUserId, 'patients:read');

      expect(result.allowed).toBe(true);
      expect(result.reason).toBeUndefined();
      expect(result.requiredPermissions).toEqual(['patients:read']);
      expect(result.userPermissions).toEqual(permissions);
    });

    it('should return reason when permission denied', async () => {
      const permissions: Permission[] = ['patients:read'];
      mockCacheService.get.mockResolvedValue(null);
      mockUserRepository.getUserPermissions.mockResolvedValue(permissions);

      const result = await permissionService.checkPermission(testUserId, 'patients:delete');

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Missing required permission: patients:delete');
    });

    it('should return reason when user has no permissions', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockUserRepository.getUserPermissions.mockResolvedValue([]);

      const result = await permissionService.checkPermission(testUserId, 'patients:read');

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('User has no permissions');
    });
  });

  describe('canAccessResource', () => {
    it('should check permission for resource access', async () => {
      const permissions: Permission[] = ['patients:read'];
      mockCacheService.get.mockResolvedValue(null);
      mockUserRepository.getUserPermissions.mockResolvedValue(permissions);

      const result = await permissionService.canAccessResource(
        testUserId,
        ResourceType.PATIENTS,
        Action.READ
      );

      expect(result).toBe(true);
    });

    it('should deny access when permission missing', async () => {
      const permissions: Permission[] = ['patients:read'];
      mockCacheService.get.mockResolvedValue(null);
      mockUserRepository.getUserPermissions.mockResolvedValue(permissions);

      const result = await permissionService.canAccessResource(
        testUserId,
        ResourceType.PATIENTS,
        Action.DELETE
      );

      expect(result).toBe(false);
    });
  });

  describe('invalidateCache', () => {
    it('should invalidate user permission cache', async () => {
      await permissionService.invalidateCache(testUserId);

      expect(mockCacheService.delete).toHaveBeenCalledWith('permissions:u-123');
      expect(logger.info).toHaveBeenCalledWith('Permission cache invalidated', { userId: testUserId });
    });

    it('should handle cache deletion errors gracefully', async () => {
      mockCacheService.delete.mockRejectedValue(new Error('Cache error'));

      await permissionService.invalidateCache(testUserId);

      expect(logger.error).toHaveBeenCalled();
    });

    it('should work when cache service is null', async () => {
      const serviceWithoutCache = new PermissionService(
        mockUserRepository,
        null,
        logger
      );

      await serviceWithoutCache.invalidateCache(testUserId);

      expect(mockCacheService.delete).not.toHaveBeenCalled();
    });
  });

  describe('permission matching edge cases', () => {
    it('should match write permission for create action', async () => {
      const permissions: Permission[] = ['patients:write'];
      mockCacheService.get.mockResolvedValue(null);
      mockUserRepository.getUserPermissions.mockResolvedValue(permissions);

      const result = await permissionService.hasPermission(testUserId, 'patients:create');

      expect(result).toBe(true);
    });

    it('should match write permission for update action', async () => {
      const permissions: Permission[] = ['patients:write'];
      mockCacheService.get.mockResolvedValue(null);
      mockUserRepository.getUserPermissions.mockResolvedValue(permissions);

      const result = await permissionService.hasPermission(testUserId, 'patients:update');

      expect(result).toBe(true);
    });

    it('should match manage permission for any action', async () => {
      const permissions: Permission[] = ['patients:manage'];
      mockCacheService.get.mockResolvedValue(null);
      mockUserRepository.getUserPermissions.mockResolvedValue(permissions);

      const result = await permissionService.hasPermission(testUserId, 'patients:delete');

      expect(result).toBe(true);
    });

    it('should match action wildcard', async () => {
      const permissions: Permission[] = ['*:read'];
      mockCacheService.get.mockResolvedValue(null);
      mockUserRepository.getUserPermissions.mockResolvedValue(permissions);

      const result = await permissionService.hasPermission(testUserId, 'patients:read');

      expect(result).toBe(true);
    });
  });

  describe('getUserPermissions without cache service', () => {
    it('should work without cache service', async () => {
      const serviceWithoutCache = new PermissionService(
        mockUserRepository,
        null,
        logger
      );

      const permissions: Permission[] = ['patients:read'];
      mockUserRepository.getUserPermissions.mockResolvedValue(permissions);

      const result = await serviceWithoutCache.getUserPermissions(testUserId);

      expect(result).toEqual(permissions);
      expect(mockUserRepository.getUserPermissions).toHaveBeenCalledWith(testUserIdVO);
    });
  });
});
