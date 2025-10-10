/**
 * Unit Tests for PermissionService
 * Tests RBAC permission checking with caching
 */

import { PermissionService } from '@infrastructure/services/PermissionService';
import { IPermissionRepository } from '@domain/repositories/IPermissionRepository';
import { PermissionCache } from '@infrastructure/cache/PermissionCache';
import { UserId } from '@domain/value-objects/UserId';
import { Permission } from '@application/services/IPermissionService';

describe('PermissionService', () => {
  let permissionService: PermissionService;
  let mockPermissionRepository: jest.Mocked<IPermissionRepository>;
  let mockCacheService: jest.Mocked<PermissionCache>;

  const testUserId = 'u-123';
  const testUserIdVO = UserId.fromString(testUserId);

  beforeEach(() => {
    // Mock PermissionRepository
    mockPermissionRepository = {
      getUserPermissions: jest.fn(),
      getUserRoles: jest.fn(),
      getRolePermissions: jest.fn(),
      hasPermission: jest.fn(),
      hasPermissionString: jest.fn(),
      assignRole: jest.fn(),
      removeRole: jest.fn(),
      addUserPermission: jest.fn(),
      removeUserPermission: jest.fn(),
      getAllPermissions: jest.fn(),
      getAllRoles: jest.fn(),
      invalidateCache: jest.fn(),
      expandPermissions: jest.fn(),
    } as any;

    // Mock CacheService
    mockCacheService = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
      invalidate: jest.fn(),
      invalidateForRole: jest.fn(),
    } as any;

    permissionService = new PermissionService(
      mockPermissionRepository,
      mockCacheService
    );
  });

  describe('hasAnyPermission', () => {
    it('should return true when user has exact permission', async () => {
      const permissions: Permission[] = ['patients:read', 'patients:write'];
      mockCacheService.get.mockResolvedValue(null);
      mockPermissionRepository.getUserPermissions.mockResolvedValue(permissions);

      const result = await permissionService.hasAnyPermission(testUserIdVO, ['patients:read']);

      expect(result).toBe(true);
      expect(mockPermissionRepository.getUserPermissions).toHaveBeenCalledWith(testUserIdVO);
    });

    it('should return true when user has wildcard permission', async () => {
      const permissions: Permission[] = ['*'];
      mockCacheService.get.mockResolvedValue(null);
      mockPermissionRepository.getUserPermissions.mockResolvedValue(permissions);

      const result = await permissionService.hasAnyPermission(testUserIdVO, ['patients:read']);

      expect(result).toBe(true);
    });

    // TODO: Implement wildcard matching in PermissionService
    // it('should return true when user has resource wildcard', async () => {
    //   const permissions: Permission[] = ['patients:*'];
    //   mockCacheService.get.mockResolvedValue(null);
    //   mockPermissionRepository.getUserPermissions.mockResolvedValue(permissions);

    //   const result = await permissionService.hasAnyPermission(testUserIdVO, ['patients:read']);

    //   expect(result).toBe(true);
    // });

    it('should return false when user lacks permission', async () => {
      const permissions: Permission[] = ['patients:read'];
      mockCacheService.get.mockResolvedValue(null);
      mockPermissionRepository.getUserPermissions.mockResolvedValue(permissions);

      const result = await permissionService.hasAnyPermission(testUserIdVO, ['patients:delete']);

      expect(result).toBe(false);
    });

    // TODO: PermissionService does not use cache directly, it delegates to repository
    // it('should use cached permissions when available', async () => {
    //   const permissions: Permission[] = ['patients:read'];
    //   mockCacheService.get.mockResolvedValue(permissions);

    //   const result = await permissionService.hasAnyPermission(testUserIdVO, ['patients:read']);

    //   expect(result).toBe(true);
    //   expect(mockPermissionRepository.getUserPermissions).not.toHaveBeenCalled();
    // });

    it('should return false on error', async () => {
      mockCacheService.get.mockRejectedValue(new Error('Cache error'));
      mockPermissionRepository.getUserPermissions.mockRejectedValue(new Error('DB error'));

      const result = await permissionService.hasAnyPermission(testUserIdVO, ['patients:read']);

      expect(result).toBe(false);
    });
  });

  // TODO: Refactor these tests to use checkPermissionWithOwnership
  // describe('hasPermission with context', () => {
  //   it('should allow user to access their own resource', async () => {
  //     const permissions: Permission[] = ['patients:read'];
  //     mockCacheService.get.mockResolvedValue(null);
  //     mockPermissionRepository.getUserPermissions.mockResolvedValue(permissions);

  //     const context: PermissionContext = {
  //       userId: testUserId,
  //       resourceOwnerId: testUserId,
  //     };

  //     const result = await permissionService.checkPermissionWithOwnership(testUserIdVO, 'patients:read', testUserId);

  //     expect(result).toBe(true);
  //   });

  //   it('should deny user access to others resource without permission', async () => {
  //     const permissions: Permission[] = ['patients:read'];
  //     mockCacheService.get.mockResolvedValue(null);
  //     mockPermissionRepository.getUserPermissions.mockResolvedValue(permissions);

  //     const result = await permissionService.checkPermissionWithOwnership(testUserIdVO, 'patients:read', 'u-456');

  //     expect(result).toBe(false);
  //   });

  //   it('should allow admin to access any resource', async () => {
  //     const permissions: Permission[] = ['*'];
  //     mockCacheService.get.mockResolvedValue(null);
  //     mockPermissionRepository.getUserPermissions.mockResolvedValue(permissions);

  //     const result = await permissionService.checkPermissionWithOwnership(testUserIdVO, 'patients:read', 'u-456');

  //     expect(result).toBe(true);
  //   });
  // });

  describe('hasAnyPermission - multiple permissions', () => {
    it('should return true if user has any of the permissions', async () => {
      const permissions: Permission[] = ['patients:read'];
      mockCacheService.get.mockResolvedValue(null);
      mockPermissionRepository.getUserPermissions.mockResolvedValue(permissions);

      const result = await permissionService.hasAnyPermission(testUserIdVO, [
        'patients:write',
        'patients:read',
      ]);

      expect(result).toBe(true);
    });

    it('should return false if user has none of the permissions', async () => {
      const permissions: Permission[] = ['patients:read'];
      mockCacheService.get.mockResolvedValue(null);
      mockPermissionRepository.getUserPermissions.mockResolvedValue(permissions);

      const result = await permissionService.hasAnyPermission(testUserIdVO, [
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
      mockPermissionRepository.getUserPermissions.mockResolvedValue(permissions);

      const result = await permissionService.hasAllPermissions(testUserIdVO, [
        'patients:read',
        'patients:write',
      ]);

      expect(result).toBe(true);
    });

    it('should return false if user lacks any permission', async () => {
      const permissions: Permission[] = ['patients:read'];
      mockCacheService.get.mockResolvedValue(null);
      mockPermissionRepository.getUserPermissions.mockResolvedValue(permissions);

      const result = await permissionService.hasAllPermissions(testUserIdVO, [
        'patients:read',
        'patients:write',
      ]);

      expect(result).toBe(false);
    });
  });

  describe('getEffectivePermissions', () => {
    it('should fetch from repository', async () => {
      const permissions: Permission[] = ['patients:read'];
      mockPermissionRepository.getUserPermissions.mockResolvedValue(permissions);

      const result = await permissionService.getEffectivePermissions(testUserIdVO);

      expect(result).toEqual(permissions);
      expect(mockPermissionRepository.getUserPermissions).toHaveBeenCalledWith(testUserIdVO);
    });

    it('should return empty array on error', async () => {
      mockPermissionRepository.getUserPermissions.mockRejectedValue(new Error('DB error'));

      const result = await permissionService.getEffectivePermissions(testUserIdVO);

      expect(result).toEqual([]);
    });
  });

  describe('checkPermission', () => {
    it('should return true when permission allowed', async () => {
      const permissions: Permission[] = ['patients:read'];
      mockPermissionRepository.getUserPermissions.mockResolvedValue(permissions);

      const result = await permissionService.checkPermission(testUserIdVO, 'patients:read');

      expect(result).toBe(true);
    });

    it('should return false when permission denied', async () => {
      const permissions: Permission[] = ['patients:read'];
      mockPermissionRepository.getUserPermissions.mockResolvedValue(permissions);

      const result = await permissionService.checkPermission(testUserIdVO, 'patients:delete');

      expect(result).toBe(false);
    });

    it('should return false when user has no permissions', async () => {
      mockPermissionRepository.getUserPermissions.mockResolvedValue([]);

      const result = await permissionService.checkPermission(testUserIdVO, 'patients:read');

      expect(result).toBe(false);
    });

    it('should support resource and action parameters', async () => {
      const permissions: Permission[] = ['patients:read'];
      mockPermissionRepository.getUserPermissions.mockResolvedValue(permissions);

      const result = await permissionService.checkPermission(testUserIdVO, 'patients', 'read');

      expect(result).toBe(true);
    });
  });

  // TODO: Refactor - canAccessResource method does not exist
  // describe('canAccessResource', () => {
  //   it('should check permission for resource access', async () => {
  //     const permissions: Permission[] = ['patients:read'];
  //     mockCacheService.get.mockResolvedValue(null);
  //     mockPermissionRepository.getUserPermissions.mockResolvedValue(permissions);

  //     const result = await permissionService.canAccessResource(
  //       testUserId,
  //       ResourceType.PATIENTS,
  //       Action.READ
  //     );

  //     expect(result).toBe(true);
  //   });

  //   it('should deny access when permission missing', async () => {
  //     const permissions: Permission[] = ['patients:read'];
  //     mockCacheService.get.mockResolvedValue(null);
  //     mockPermissionRepository.getUserPermissions.mockResolvedValue(permissions);

  //     const result = await permissionService.canAccessResource(
  //       testUserId,
  //       ResourceType.PATIENTS,
  //       Action.DELETE
  //     );

  //     expect(result).toBe(false);
  //   });
  // });

  describe('invalidateCache', () => {
    it('should invalidate user permission cache', async () => {
      await permissionService.invalidateCache(testUserIdVO);

      expect(mockCacheService.invalidate).toHaveBeenCalledWith(testUserIdVO);
    });

    it('should handle cache deletion errors gracefully', async () => {
      mockCacheService.invalidate.mockRejectedValue(new Error('Cache error'));

      await expect(permissionService.invalidateCache(testUserIdVO)).rejects.toThrow('Cache error');
    });
  });

  describe('checkPermission - wildcard support', () => {
    it('should return true for resource wildcard (patients:*)', async () => {
      const permissions: Permission[] = ['patients:*'];
      mockPermissionRepository.getUserPermissions.mockResolvedValue(permissions);

      const result = await permissionService.checkPermission(testUserIdVO, 'patients:read');

      expect(result).toBe(true);
    });

    it('should return true for global wildcard (*)', async () => {
      const permissions: Permission[] = ['*'];
      mockPermissionRepository.getUserPermissions.mockResolvedValue(permissions);

      const result = await permissionService.checkPermission(testUserIdVO, 'patients:read');

      expect(result).toBe(true);
    });

    it('should support overloaded format (resource, action)', async () => {
      const permissions: Permission[] = ['patients:read'];
      mockPermissionRepository.getUserPermissions.mockResolvedValue(permissions);

      const result = await permissionService.checkPermission(testUserIdVO, 'patients', 'read');

      expect(result).toBe(true);
    });

    it('should return false when no wildcard matches', async () => {
      const permissions: Permission[] = ['appointments:read'];
      mockPermissionRepository.getUserPermissions.mockResolvedValue(permissions);

      const result = await permissionService.checkPermission(testUserIdVO, 'patients:read');

      expect(result).toBe(false);
    });
  });

  describe('checkPermissionWithOwnership', () => {
    it('should return true when user is resource owner', async () => {
      const result = await permissionService.checkPermissionWithOwnership(
        testUserIdVO,
        'patients:read',
        testUserId
      );

      expect(result).toBe(true);
    });

    it('should return true when user has wildcard permission', async () => {
      const permissions: Permission[] = ['*'];
      mockPermissionRepository.getUserPermissions.mockResolvedValue(permissions);

      const result = await permissionService.checkPermissionWithOwnership(
        testUserIdVO,
        'patients:read',
        'other-user-id'
      );

      expect(result).toBe(true);
    });

    it('should return false for ownership permission when not owner', async () => {
      const permissions: Permission[] = ['own_patients:read'];
      mockPermissionRepository.getUserPermissions.mockResolvedValue(permissions);

      const result = await permissionService.checkPermissionWithOwnership(
        testUserIdVO,
        'own_patients:read',
        'other-user-id'
      );

      expect(result).toBe(false);
    });

    it('should return false for non-ownership permission when not owner', async () => {
      const permissions: Permission[] = ['patients:read'];
      mockPermissionRepository.getUserPermissions.mockResolvedValue(permissions);

      const result = await permissionService.checkPermissionWithOwnership(
        testUserIdVO,
        'patients:read',
        'other-user-id'
      );

      expect(result).toBe(false);
    });
  });

  describe('hasAnyPermission - wildcard support', () => {
    it('should return true when user has resource wildcard', async () => {
      const permissions: Permission[] = ['patients:*'];
      mockPermissionRepository.getUserPermissions.mockResolvedValue(permissions);

      const result = await permissionService.hasAnyPermission(testUserIdVO, ['patients:read']);

      expect(result).toBe(true);
    });

    it('should return true when any permission matches with wildcard', async () => {
      const permissions: Permission[] = ['patients:*'];
      mockPermissionRepository.getUserPermissions.mockResolvedValue(permissions);

      const result = await permissionService.hasAnyPermission(testUserIdVO, [
        'appointments:read',
        'patients:write',
      ]);

      expect(result).toBe(true);
    });
  });

  describe('isAdmin', () => {
    it('should return true when user has wildcard permission', async () => {
      const permissions: Permission[] = ['*'];
      mockPermissionRepository.getUserPermissions.mockResolvedValue(permissions);

      const result = await permissionService.isAdmin(testUserIdVO);

      expect(result).toBe(true);
    });

    it('should return false when user does not have wildcard permission', async () => {
      const permissions: Permission[] = ['patients:read'];
      mockPermissionRepository.getUserPermissions.mockResolvedValue(permissions);

      const result = await permissionService.isAdmin(testUserIdVO);

      expect(result).toBe(false);
    });
  });

  describe('invalidateCacheForRole', () => {
    it('should invalidate cache for all users with role', async () => {
      await permissionService.invalidateCacheForRole('doctor');

      expect(mockCacheService.invalidateForRole).toHaveBeenCalledWith('doctor');
    });
  });
});
