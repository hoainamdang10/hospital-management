/**
 * AssignRoleUseCase - Unit Tests
 * 
 * Tests all scenarios for assigning roles to users including:
 * - Happy path (admin assigns role to user)
 * - Invalid role type
 * - Role already assigned
 * - Self-assignment prevention
 * - Error handling
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { AssignRoleUseCase, AssignRoleRequest } from '../../../../src/application/use-cases/AssignRoleUseCase';
import { IUserRepository } from '../../../../src/application/repositories/IUserRepository';
import { IPermissionRepository } from '../../../../src/domain/repositories/IPermissionRepository';
import { createMockUser } from '../../../helpers/user-test-helper';
import { createCircuitBreakerStub } from '../../../helpers/circuit-breaker-test-helper';

describe('AssignRoleUseCase', () => {
  let useCase: AssignRoleUseCase;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockPermissionRepository: jest.Mocked<IPermissionRepository>;
  let mockLogger: any;
  let circuitBreaker = createCircuitBreakerStub();

  beforeEach(() => {
    mockUserRepository = {
      findById: jest.fn()
    } as any;

    mockPermissionRepository = {
      getAllRoles: jest.fn(),
      assignRole: jest.fn()
    } as any;

    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    };

    circuitBreaker = createCircuitBreakerStub();

    useCase = new AssignRoleUseCase(
      mockUserRepository,
      mockPermissionRepository,
      mockLogger,
      circuitBreaker
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Happy Path', () => {
    it('should assign role successfully', async () => {
      // Arrange
      const mockUser = createMockUser({
        userId: 'user-123',
        email: 'test@hospital.vn',
        fullName: 'Nguyễn Văn Test',
        roleType: 'PATIENT'
      });

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockPermissionRepository.getAllRoles.mockResolvedValue(['PATIENT', 'DOCTOR', 'NURSE', 'ADMIN']);
      mockPermissionRepository.assignRole.mockResolvedValue(undefined);

      const request: AssignRoleRequest = {
        userId: 'user-123',
        roleType: 'DOCTOR',
        assignedBy: 'admin-456',
        reason: 'User completed medical training'
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toContain('Vai trò đã được thay đổi');
      expect(result.message).toContain('PATIENT');
      expect(result.message).toContain('DOCTOR');
      expect(result.previousRole).toBe('PATIENT');
      expect(result.newRole).toBe('DOCTOR');
      expect(mockPermissionRepository.assignRole).toHaveBeenCalledWith(
        expect.objectContaining({ value: 'user-123' }),
        'DOCTOR',
        'admin-456'
      );
    });

    it('should log audit trail', async () => {
      // Arrange
      const mockUser = createMockUser({
        userId: 'user-123',
        email: 'test@hospital.vn',
        roleType: 'PATIENT'
      });

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockPermissionRepository.getAllRoles.mockResolvedValue(['PATIENT', 'DOCTOR']);
      mockPermissionRepository.assignRole.mockResolvedValue(undefined);

      const request: AssignRoleRequest = {
        userId: 'user-123',
        roleType: 'DOCTOR',
        assignedBy: 'admin-456',
        reason: 'Promotion to Doctor' // Must be >= 10 chars
      };

      // Act
      await useCase.execute(request);

      // Assert
      // Logger is called at start and at end - check the last call
      const lastCall = mockLogger.info.mock.calls[mockLogger.info.mock.calls.length - 1];
      expect(lastCall[0]).toBe('Role assigned successfully');
      expect(lastCall[1]).toMatchObject({
        userId: 'user-123',
        previousRole: 'PATIENT',
        newRole: 'DOCTOR',
        assignedBy: 'admin-456',
        reason: 'Promotion to Doctor'
      });
    });
  });

  describe('Validation Errors', () => {
    it('should reject if user not found', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(null);

      const request: AssignRoleRequest = {
        userId: 'user-123',
        roleType: 'DOCTOR',
        assignedBy: 'admin-456',
        reason: 'User completed medical training' // Must be >= 10 chars
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('USER_NOT_FOUND');
      expect(result.message).toContain('không tồn tại');
    });

    it('should reject if role already assigned', async () => {
      // Arrange
      const mockUser = createMockUser({
        userId: 'user-123',
        email: 'test@hospital.vn',
        roleType: 'DOCTOR'
      });

      // Mock hasRole to return true
      mockUser.hasRole = jest.fn().mockReturnValue(true);

      mockUserRepository.findById.mockResolvedValue(mockUser);

      const request: AssignRoleRequest = {
        userId: 'user-123',
        roleType: 'DOCTOR', // Same role
        assignedBy: 'admin-456',
        reason: 'Testing role assignment' // Must be >= 10 chars
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('ROLE_ALREADY_ASSIGNED');
      expect(result.message).toContain('đã có vai trò');
    });

    it('should reject if trying to assign own role', async () => {
      // Arrange
      const mockUser = createMockUser({
        userId: 'admin-456',
        email: 'admin@hospital.vn',
        roleType: 'ADMIN'
      });

      mockUserRepository.findById.mockResolvedValue(mockUser);

      const request: AssignRoleRequest = {
        userId: 'admin-456',
        roleType: 'DOCTOR', // Use valid role
        assignedBy: 'admin-456', // Same user
        reason: 'Testing self assignment' // Must be >= 10 chars
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('CANNOT_CHANGE_OWN_ROLE');
      expect(result.message).toContain('chính mình');
    });

    it('should reject if role type is invalid', async () => {
      // Arrange
      const mockUser = createMockUser({
        userId: 'user-123',
        email: 'test@hospital.vn',
        roleType: 'PATIENT'
      });

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockPermissionRepository.getAllRoles.mockResolvedValue(['PATIENT', 'DOCTOR', 'NURSE', 'ADMIN']);

      const request: AssignRoleRequest = {
        userId: 'user-123',
        roleType: 'INVALID_ROLE',
        assignedBy: 'admin-456',
        reason: 'Testing invalid role' // Must be >= 10 chars
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      // Validation catches invalid role first
      expect(result.success).toBe(false);
      expect(result.error).toBe('VALIDATION_ERROR');
      expect(result.message).toContain('không hợp lệ');
    });

    it('should reject if userId is empty', async () => {
      // Arrange
      const request: AssignRoleRequest = {
        userId: '',
        roleType: 'DOCTOR',
        assignedBy: 'admin-456',
        reason: 'Test'
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('VALIDATION_ERROR');
    });

    it('should reject if roleType is empty', async () => {
      // Arrange
      const request: AssignRoleRequest = {
        userId: 'user-123',
        roleType: '',
        assignedBy: 'admin-456',
        reason: 'Test'
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('VALIDATION_ERROR');
    });

    it('should reject if assignedBy is empty', async () => {
      // Arrange
      const request: AssignRoleRequest = {
        userId: 'user-123',
        roleType: 'DOCTOR',
        assignedBy: '',
        reason: 'Test'
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('VALIDATION_ERROR');
    });
  });

  describe('Error Handling', () => {
    it('should handle repository errors gracefully', async () => {
      // Arrange
      mockUserRepository.findById.mockRejectedValue(new Error('Database connection failed'));

      const request: AssignRoleRequest = {
        userId: 'user-123',
        roleType: 'DOCTOR',
        assignedBy: 'admin-456',
        reason: 'Testing error handling' // Must be >= 10 chars
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('ASSIGN_ROLE_FAILED');
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should handle permission repository errors gracefully', async () => {
      // Arrange
      const mockUser = createMockUser({
        userId: 'user-123',
        email: 'test@hospital.vn',
        roleType: 'PATIENT'
      });

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockPermissionRepository.getAllRoles.mockResolvedValue(['PATIENT', 'DOCTOR']);
      mockPermissionRepository.assignRole.mockRejectedValue(new Error('Permission service unavailable'));

      const request: AssignRoleRequest = {
        userId: 'user-123',
        roleType: 'DOCTOR',
        assignedBy: 'admin-456',
        reason: 'Testing error handling' // Must be >= 10 chars
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('ASSIGN_ROLE_FAILED');
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
});
