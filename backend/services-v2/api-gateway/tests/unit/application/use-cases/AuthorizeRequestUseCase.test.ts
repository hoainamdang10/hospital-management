import { AuthorizeRequestUseCase } from '@application/use-cases/AuthorizeRequestUseCase';
import { IPermissionChecker, PermissionCheckResult } from '@domain/services/IPermissionChecker';
import { ILogger } from '@application/services/ILogger';

describe('AuthorizeRequestUseCase', () => {
  let useCase: AuthorizeRequestUseCase;
  let mockPermissionChecker: jest.Mocked<IPermissionChecker>;
  let mockLogger: jest.Mocked<ILogger>;

  beforeEach(() => {
    mockPermissionChecker = {
      checkPermission: jest.fn(),
      checkAnyPermission: jest.fn(),
      checkAllPermissions: jest.fn(),
      checkRole: jest.fn(),
      checkAnyRole: jest.fn(),
      checkAllRoles: jest.fn()
    };

    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    };

    useCase = new AuthorizeRequestUseCase(mockPermissionChecker, mockLogger);
  });

  const validInput = {
    userId: '550e8400-e29b-41d4-a716-446655440000',
    requestId: 'test-request-id',
    path: '/api/v1/patients'
  };

  describe('execute - no requirements', () => {
    it('should allow request if no permissions or roles required', async () => {
      const result = await useCase.execute(validInput);

      expect(result.allowed).toBe(true);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'No authorization requirements - allowing request',
        expect.any(Object)
      );
    });
  });

  describe('execute - permission checks', () => {
    it('should allow request if user has required permission (requireAll=false)', async () => {
      const mockResult: PermissionCheckResult = { allowed: true };
      mockPermissionChecker.checkAnyPermission.mockResolvedValue(mockResult);

      const result = await useCase.execute({
        ...validInput,
        requiredPermissions: ['patient:read'],
        requireAll: false
      });

      expect(result.allowed).toBe(true);
      expect(mockPermissionChecker.checkAnyPermission).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Request authorized successfully',
        expect.any(Object)
      );
    });

    it('should allow request if user has all required permissions (requireAll=true)', async () => {
      const mockResult: PermissionCheckResult = { allowed: true };
      mockPermissionChecker.checkAllPermissions.mockResolvedValue(mockResult);

      const result = await useCase.execute({
        ...validInput,
        requiredPermissions: ['patient:read', 'patient:write'],
        requireAll: true
      });

      expect(result.allowed).toBe(true);
      expect(mockPermissionChecker.checkAllPermissions).toHaveBeenCalled();
    });

    it('should deny request if user lacks required permission', async () => {
      const mockResult: PermissionCheckResult = {
        allowed: false,
        reason: 'Missing permission: patient:write'
      };
      mockPermissionChecker.checkAnyPermission.mockResolvedValue(mockResult);

      const result = await useCase.execute({
        ...validInput,
        requiredPermissions: ['patient:write']
      });

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Missing permission: patient:write');
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Permission check failed',
        expect.any(Object)
      );
    });
  });

  describe('execute - role checks', () => {
    it('should allow request if user has required role (requireAll=false)', async () => {
      const mockResult: PermissionCheckResult = { allowed: true };
      mockPermissionChecker.checkAnyRole.mockResolvedValue(mockResult);

      const result = await useCase.execute({
        ...validInput,
        requiredRoles: ['doctor'],
        requireAll: false
      });

      expect(result.allowed).toBe(true);
      expect(mockPermissionChecker.checkAnyRole).toHaveBeenCalled();
    });

    it('should allow request if user has all required roles (requireAll=true)', async () => {
      const mockResult: PermissionCheckResult = { allowed: true };
      mockPermissionChecker.checkAllRoles.mockResolvedValue(mockResult);

      const result = await useCase.execute({
        ...validInput,
        requiredRoles: ['doctor', 'admin'],
        requireAll: true
      });

      expect(result.allowed).toBe(true);
      expect(mockPermissionChecker.checkAllRoles).toHaveBeenCalled();
    });

    it('should deny request if user lacks required role', async () => {
      const mockResult: PermissionCheckResult = {
        allowed: false,
        reason: 'Missing role: admin'
      };
      mockPermissionChecker.checkAnyRole.mockResolvedValue(mockResult);

      const result = await useCase.execute({
        ...validInput,
        requiredRoles: ['admin']
      });

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Missing role: admin');
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Role check failed',
        expect.any(Object)
      );
    });
  });

  describe('execute - combined checks', () => {
    it('should check both permissions and roles', async () => {
      const permissionResult: PermissionCheckResult = { allowed: true };
      const roleResult: PermissionCheckResult = { allowed: true };
      
      mockPermissionChecker.checkAnyPermission.mockResolvedValue(permissionResult);
      mockPermissionChecker.checkAnyRole.mockResolvedValue(roleResult);

      const result = await useCase.execute({
        ...validInput,
        requiredPermissions: ['patient:read'],
        requiredRoles: ['doctor']
      });

      expect(result.allowed).toBe(true);
      expect(mockPermissionChecker.checkAnyPermission).toHaveBeenCalled();
      expect(mockPermissionChecker.checkAnyRole).toHaveBeenCalled();
    });

    it('should deny if permission check passes but role check fails', async () => {
      const permissionResult: PermissionCheckResult = { allowed: true };
      const roleResult: PermissionCheckResult = {
        allowed: false,
        reason: 'Missing role: admin'
      };
      
      mockPermissionChecker.checkAnyPermission.mockResolvedValue(permissionResult);
      mockPermissionChecker.checkAnyRole.mockResolvedValue(roleResult);

      const result = await useCase.execute({
        ...validInput,
        requiredPermissions: ['patient:read'],
        requiredRoles: ['admin']
      });

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Missing role: admin');
    });
  });

  describe('execute - error handling', () => {
    it('should handle unexpected errors gracefully', async () => {
      mockPermissionChecker.checkAnyPermission.mockRejectedValue(
        new Error('Database connection failed')
      );

      const result = await useCase.execute({
        ...validInput,
        requiredPermissions: ['patient:read']
      });

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Internal authorization error');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Authorization error',
        expect.objectContaining({
          error: 'Database connection failed'
        })
      );
    });
  });
});

