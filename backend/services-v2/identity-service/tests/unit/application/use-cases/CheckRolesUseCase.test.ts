/**
 * CheckRolesUseCase - Unit Tests
 * 
 * Tests for checking if a user has multiple roles with AND/OR logic
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { CheckRolesUseCase, CheckRolesRequest } from '../../../../src/application/use-cases/CheckRolesUseCase';
import { IPermissionService } from '../../../../src/domain/services/IPermissionService';
import { UserId } from '../../../../src/domain/value-objects/UserId';
import { ILogger } from '../../../../src/application/services/ILogger';

describe('CheckRolesUseCase', () => {
  let useCase: CheckRolesUseCase;
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

    useCase = new CheckRolesUseCase(mockPermissionService, mockLogger);
  });

  describe('execute - requireAll=true (AND logic)', () => {
    it('should return allowed=true when user has all roles', async () => {
      const request: CheckRolesRequest = {
        userId: 'user-123',
        roles: ['admin', 'doctor'],
        requireAll: true
      };

      mockPermissionService.hasAllRoles.mockResolvedValue(true);

      const response = await useCase.execute(request);

      expect(response.success).toBe(true);
      expect(response.allowed).toBe(true);
      expect(mockPermissionService.hasAllRoles).toHaveBeenCalledWith(
        expect.any(UserId),
        ['admin', 'doctor']
      );
    });

    it('should return allowed=false when user is missing some roles', async () => {
      const request: CheckRolesRequest = {
        userId: 'user-123',
        roles: ['admin', 'doctor'],
        requireAll: true
      };

      mockPermissionService.hasAllRoles.mockResolvedValue(false);

      const response = await useCase.execute(request);

      expect(response.success).toBe(true);
      expect(response.allowed).toBe(false);
    });
  });

  describe('execute - requireAll=false (OR logic)', () => {
    it('should return allowed=true when user has any of the roles', async () => {
      const request: CheckRolesRequest = {
        userId: 'user-123',
        roles: ['admin', 'doctor', 'nurse'],
        requireAll: false
      };

      mockPermissionService.hasAnyRole.mockResolvedValue(true);

      const response = await useCase.execute(request);

      expect(response.success).toBe(true);
      expect(response.allowed).toBe(true);
      expect(mockPermissionService.hasAnyRole).toHaveBeenCalledWith(
        expect.any(UserId),
        ['admin', 'doctor', 'nurse']
      );
    });

    it('should return allowed=false when user has none of the roles', async () => {
      const request: CheckRolesRequest = {
        userId: 'user-123',
        roles: ['admin', 'doctor'],
        requireAll: false
      };

      mockPermissionService.hasAnyRole.mockResolvedValue(false);

      const response = await useCase.execute(request);

      expect(response.success).toBe(true);
      expect(response.allowed).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should handle errors gracefully', async () => {
      const request: CheckRolesRequest = {
        userId: 'user-123',
        roles: ['admin'],
        requireAll: true
      };

      mockPermissionService.hasAllRoles.mockRejectedValue(new Error('Database error'));

      const response = await useCase.execute(request);

      expect(response.success).toBe(false);
      expect(response.allowed).toBe(false);
      expect(response.reason).toBe('Roles check failed');
    });
  });

  describe('logging', () => {
    it('should log debug messages for requireAll=true', async () => {
      const request: CheckRolesRequest = {
        userId: 'user-123',
        roles: ['admin', 'doctor'],
        requireAll: true
      };

      mockPermissionService.hasAllRoles.mockResolvedValue(true);

      await useCase.execute(request);

      expect(mockLogger.debug).toHaveBeenCalledWith('Checking roles', {
        userId: 'user-123',
        roles: ['admin', 'doctor'],
        requireAll: true
      });

      expect(mockLogger.debug).toHaveBeenCalledWith('Roles check result', {
        userId: 'user-123',
        roles: ['admin', 'doctor'],
        requireAll: true,
        allowed: true
      });
    });

    it('should log debug messages for requireAll=false', async () => {
      const request: CheckRolesRequest = {
        userId: 'user-123',
        roles: ['nurse', 'patient'],
        requireAll: false
      };

      mockPermissionService.hasAnyRole.mockResolvedValue(false);

      await useCase.execute(request);

      expect(mockLogger.debug).toHaveBeenCalledWith('Checking roles', {
        userId: 'user-123',
        roles: ['nurse', 'patient'],
        requireAll: false
      });
    });
  });

  describe('edge cases', () => {
    it('should handle empty roles array', async () => {
      const request: CheckRolesRequest = {
        userId: 'user-123',
        roles: [],
        requireAll: true
      };

      mockPermissionService.hasAllRoles.mockResolvedValue(true);

      const response = await useCase.execute(request);

      expect(response.success).toBe(true);
    });

    it('should handle single role in array', async () => {
      const request: CheckRolesRequest = {
        userId: 'user-123',
        roles: ['admin'],
        requireAll: true
      };

      mockPermissionService.hasAllRoles.mockResolvedValue(true);

      const response = await useCase.execute(request);

      expect(response.allowed).toBe(true);
    });

    it('should handle many roles', async () => {
      const request: CheckRolesRequest = {
        userId: 'user-123',
        roles: ['admin', 'doctor', 'nurse', 'receptionist', 'patient'],
        requireAll: false
      };

      mockPermissionService.hasAnyRole.mockResolvedValue(true);

      const response = await useCase.execute(request);

      expect(response.allowed).toBe(true);
    });
  });
});

