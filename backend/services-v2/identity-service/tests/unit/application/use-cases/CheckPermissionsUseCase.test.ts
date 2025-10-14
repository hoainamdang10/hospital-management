import { CheckPermissionsUseCase } from '../../../../src/application/use-cases/CheckPermissionsUseCase';
import { IPermissionService } from '../../../../src/domain/services/IPermissionService';
import { ILogger } from '../../../../src/application/services/ILogger';
import { UserId } from '../../../../src/domain/value-objects/UserId';

describe('CheckPermissionsUseCase', () => {
  let useCase: CheckPermissionsUseCase;
  let mockPermissionService: jest.Mocked<IPermissionService>;
  let mockLogger: jest.Mocked<ILogger>;

  beforeEach(() => {
    mockPermissionService = {
      checkPermission: jest.fn(),
      checkPermissionWithOwnership: jest.fn(),
      hasAnyPermission: jest.fn(),
      hasAllPermissions: jest.fn(),
      hasRole: jest.fn(),
      hasAnyRole: jest.fn(),
      hasAllRoles: jest.fn(),
      getEffectivePermissions: jest.fn(),
      getEffectivePermissionsAsObjects: jest.fn(),
      invalidateCache: jest.fn(),
      invalidateCacheForRole: jest.fn(),
      expandPermissions: jest.fn(),
      isAdmin: jest.fn(),
      getPermissionsGroupedByResource: jest.fn(),
      warmUpCache: jest.fn(),
      getCacheStats: jest.fn()
    } as any;

    mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    } as any;

    useCase = new CheckPermissionsUseCase(mockPermissionService, mockLogger);
  });

  describe('execute - requireAll=false (ANY)', () => {
    it('should return allowed=true when user has any permission', async () => {
      const userId = 'user-123';
      const permissions = ['patient:read', 'patient:write'];

      mockPermissionService.hasAnyPermission.mockResolvedValue(true);

      const result = await useCase.execute({ 
        userId, 
        permissions, 
        requireAll: false 
      });

      expect(result).toEqual({
        success: true,
        allowed: true,
        reason: undefined
      });

      expect(mockPermissionService.hasAnyPermission).toHaveBeenCalledWith(
        expect.any(UserId),
        permissions
      );
    });

    it('should return allowed=false when user has none of the permissions', async () => {
      const userId = 'user-123';
      const permissions = ['patient:read', 'patient:write'];

      mockPermissionService.hasAnyPermission.mockResolvedValue(false);

      const result = await useCase.execute({ 
        userId, 
        permissions, 
        requireAll: false 
      });

      expect(result).toEqual({
        success: true,
        allowed: false,
        reason: 'Missing any of required permissions: patient:read, patient:write'
      });
    });
  });

  describe('execute - requireAll=true (ALL)', () => {
    it('should return allowed=true when user has all permissions', async () => {
      const userId = 'user-123';
      const permissions = ['patient:read', 'patient:write'];

      mockPermissionService.hasAllPermissions.mockResolvedValue(true);

      const result = await useCase.execute({ 
        userId, 
        permissions, 
        requireAll: true 
      });

      expect(result).toEqual({
        success: true,
        allowed: true,
        reason: undefined
      });

      expect(mockPermissionService.hasAllPermissions).toHaveBeenCalledWith(
        expect.any(UserId),
        permissions
      );
    });

    it('should return allowed=false when user is missing some permissions', async () => {
      const userId = 'user-123';
      const permissions = ['patient:read', 'patient:write'];

      mockPermissionService.hasAllPermissions.mockResolvedValue(false);

      const result = await useCase.execute({ 
        userId, 
        permissions, 
        requireAll: true 
      });

      expect(result).toEqual({
        success: true,
        allowed: false,
        reason: 'Missing all required permissions: patient:read, patient:write'
      });
    });
  });

  describe('error handling', () => {
    it('should handle errors gracefully', async () => {
      const userId = 'user-123';
      const permissions = ['patient:read'];

      mockPermissionService.hasAnyPermission.mockRejectedValue(
        new Error('Database error')
      );

      const result = await useCase.execute({ 
        userId, 
        permissions, 
        requireAll: false 
      });

      expect(result).toEqual({
        success: false,
        allowed: false,
        reason: 'Permissions check failed'
      });

      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('logging', () => {
    it('should log debug messages', async () => {
      const userId = 'user-123';
      const permissions = ['patient:read'];

      mockPermissionService.hasAnyPermission.mockResolvedValue(true);

      await useCase.execute({ 
        userId, 
        permissions, 
        requireAll: false 
      });

      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Checking permissions',
        expect.objectContaining({
          userId,
          permissions,
          requireAll: false
        })
      );

      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Permissions check result',
        expect.objectContaining({
          userId,
          permissions,
          allowed: true
        })
      );
    });
  });
});

