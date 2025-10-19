/**
 * CheckRoleUseCase - Unit Tests
 * 
 * Tests for checking if a user has a specific role
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { CheckRoleUseCase, CheckRoleRequest } from '../../../../src/application/use-cases/CheckRoleUseCase';
import { IPermissionService } from '../../../../src/domain/services/IPermissionService';
import { UserId } from '../../../../src/domain/value-objects/UserId';
import { ILogger } from '../../../../src/application/services/ILogger';

describe('CheckRoleUseCase', () => {
  let useCase: CheckRoleUseCase;
  let mockPermissionService: jest.Mocked<IPermissionService>;
  let mockLogger: jest.Mocked<ILogger>;

  beforeEach(() => {
    mockPermissionService = {
      hasRole: jest.fn(),
      hasAnyRole: jest.fn(),
      hasAllRoles: jest.fn(),
      hasPermission: jest.fn(),
      hasAnyPermission: jest.fn(),
      hasAllPermissions: jest.fn(),
      checkPermissionWithOwnership: jest.fn(),
      getUserRoles: jest.fn(),
    } as any;

    mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      fatal: jest.fn(),
    } as any;

    useCase = new CheckRoleUseCase(mockPermissionService, mockLogger);
  });

  describe('execute', () => {
    it('should return allowed=true when user has the role', async () => {
      const request: CheckRoleRequest = {
        userId: 'user-123',
        role: 'admin'
      };

      mockPermissionService.hasRole.mockResolvedValue(true);

      const response = await useCase.execute(request);

      expect(response.success).toBe(true);
      expect(response.allowed).toBe(true);
      expect(mockPermissionService.hasRole).toHaveBeenCalledWith(
        expect.any(UserId),
        'admin'
      );
    });

    it('should return allowed=false when user does not have the role', async () => {
      const request: CheckRoleRequest = {
        userId: 'user-123',
        role: 'admin'
      };

      mockPermissionService.hasRole.mockResolvedValue(false);

      const response = await useCase.execute(request);

      expect(response.success).toBe(true);
      expect(response.allowed).toBe(false);
    });

    it('should handle errors gracefully', async () => {
      const request: CheckRoleRequest = {
        userId: 'user-123',
        role: 'admin'
      };

      mockPermissionService.hasRole.mockRejectedValue(new Error('Database error'));

      const response = await useCase.execute(request);

      expect(response.success).toBe(false);
      expect(response.allowed).toBe(false);
      expect(response.reason).toBe('Role check failed');
    });

    it('should log debug messages', async () => {
      const request: CheckRoleRequest = {
        userId: 'user-123',
        role: 'doctor'
      };

      mockPermissionService.hasRole.mockResolvedValue(true);

      await useCase.execute(request);

      expect(mockLogger.debug).toHaveBeenCalledWith('Checking role', {
        userId: 'user-123',
        role: 'doctor'
      });

      expect(mockLogger.debug).toHaveBeenCalledWith('Role check result', {
        userId: 'user-123',
        role: 'doctor',
        allowed: true
      });
    });

    it('should check different roles correctly', async () => {
      const roles = ['admin', 'doctor', 'nurse', 'patient'];

      for (const role of roles) {
        mockPermissionService.hasRole.mockResolvedValue(true);

        const response = await useCase.execute({
          userId: 'user-123',
          role
        });

        expect(response.allowed).toBe(true);
        expect(mockPermissionService.hasRole).toHaveBeenCalledWith(
          expect.any(UserId),
          role
        );
      }
    });

    it('should handle case-sensitive role names', async () => {
      const request: CheckRoleRequest = {
        userId: 'user-123',
        role: 'ADMIN'
      };

      mockPermissionService.hasRole.mockResolvedValue(false);

      await useCase.execute(request);

      expect(mockPermissionService.hasRole).toHaveBeenCalledWith(
        expect.any(UserId),
        'ADMIN'
      );
    });
  });
});

