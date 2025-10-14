import { CheckPermissionUseCase } from '../../../../src/application/use-cases/CheckPermissionUseCase';
import { IPermissionService } from '../../../../src/domain/services/IPermissionService';
import { ILogger } from '../../../../src/application/services/ILogger';
import { UserId } from '../../../../src/domain/value-objects/UserId';

describe('CheckPermissionUseCase', () => {
  let useCase: CheckPermissionUseCase;
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

    useCase = new CheckPermissionUseCase(mockPermissionService, mockLogger);
  });

  describe('execute', () => {
    it('should return allowed=true when user has permission', async () => {
      const userId = 'user-123';
      const permission = 'patient:read';

      mockPermissionService.checkPermission.mockResolvedValue(true);

      const result = await useCase.execute({ userId, permission });

      expect(result).toEqual({
        success: true,
        allowed: true,
        reason: undefined
      });

      expect(mockPermissionService.checkPermission).toHaveBeenCalledWith(
        expect.any(UserId),
        permission
      );
    });

    it('should return allowed=false when user does not have permission', async () => {
      const userId = 'user-123';
      const permission = 'patient:write';

      mockPermissionService.checkPermission.mockResolvedValue(false);

      const result = await useCase.execute({ userId, permission });

      expect(result).toEqual({
        success: true,
        allowed: false,
        reason: 'Missing permission: patient:write'
      });
    });

    it('should handle errors gracefully', async () => {
      const userId = 'user-123';
      const permission = 'patient:read';

      mockPermissionService.checkPermission.mockRejectedValue(
        new Error('Database error')
      );

      const result = await useCase.execute({ userId, permission });

      expect(result).toEqual({
        success: false,
        allowed: false,
        reason: 'Permission check failed'
      });

      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should log debug messages', async () => {
      const userId = 'user-123';
      const permission = 'patient:read';

      mockPermissionService.checkPermission.mockResolvedValue(true);

      await useCase.execute({ userId, permission });

      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Checking permission',
        expect.objectContaining({
          userId,
          permission
        })
      );

      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Permission check result',
        expect.objectContaining({
          userId,
          permission,
          allowed: true
        })
      );
    });
  });
});

