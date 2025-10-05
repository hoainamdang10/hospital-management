/**
 * DeleteUserUseCase - Unit Tests
 * 
 * Tests all scenarios for deleting users including:
 * - Soft delete (deactivate)
 * - Hard delete (permanent)
 * - Self-deletion prevention
 * - Audit logging
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { DeleteUserUseCase, DeleteUserRequest } from '../../../../src/application/use-cases/DeleteUserUseCase';
import { IUserRepository } from '../../../../src/application/repositories/IUserRepository';
import { createMockUser } from '../../../helpers/user-test-helper';

describe('DeleteUserUseCase', () => {
  let useCase: DeleteUserUseCase;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockLogger: any;

  beforeEach(() => {
    mockUserRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findAll: jest.fn()
    } as any;

    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    };

    useCase = new DeleteUserUseCase(mockUserRepository, mockLogger);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Soft Delete (Deactivate)', () => {
    it('should soft delete user by default', async () => {
      // Arrange
      const mockUser = createMockUser({
        userId: 'user-123',
        email: 'test@hospital.vn',
        fullName: 'Test User',
        roleType: 'PATIENT',
        isActive: true,
        isEmailVerified: true
      });

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.update.mockResolvedValue(undefined);

      const request: DeleteUserRequest = {
        userId: 'user-123',
        requesterId: 'admin-123',
        reason: 'User requested account closure'
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(true);
      expect(result.deletionType).toBe('soft');
      expect(result.message).toContain('vô hiệu hóa');
      expect(mockUserRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          isActive: false
        })
      );
      expect(mockUserRepository.delete).not.toHaveBeenCalled();
    });

    it('should log soft deletion for audit', async () => {
      // Arrange
      const mockUser = createMockUser({
        userId: 'user-123',
        email: 'test@hospital.vn',
        fullName: 'Test User',
        roleType: 'PATIENT',
        isActive: true,
        isEmailVerified: true
      });

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.update.mockResolvedValue(undefined);

      const request: DeleteUserRequest = {
        userId: 'user-123',
        requesterId: 'admin-123',
        reason: 'Account closure requested'
      };

      // Act
      await useCase.execute(request);

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith(
        'User deactivated',
        expect.objectContaining({
          userId: 'user-123',
          requesterId: 'admin-123',
          reason: 'Account closure requested',
          userEmail: 'test@hospital.vn',
          timestamp: expect.any(String)
        })
      );
    });

    it('should reject soft delete of already inactive user', async () => {
      // Arrange
      const mockUser = createMockUser({
        userId: 'user-123',
        email: 'test@hospital.vn',
        fullName: 'Test User',
        roleType: 'PATIENT',
        isActive: false, // Already inactive
        isEmailVerified: true
      });

      mockUserRepository.findById.mockResolvedValue(mockUser);

      const request: DeleteUserRequest = {
        userId: 'user-123',
        requesterId: 'admin-123'
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('User already deactivated');
      expect(mockUserRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('Hard Delete (Permanent)', () => {
    it('should permanently delete user when hardDelete is true', async () => {
      // Arrange
      const mockUser = createMockUser({
        userId: 'user-123',
        email: 'test@hospital.vn',
        fullName: 'Test User',
        roleType: 'PATIENT',
        isActive: true,
        isEmailVerified: true
      });

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.delete.mockResolvedValue(undefined);

      const request: DeleteUserRequest = {
        userId: 'user-123',
        requesterId: 'admin-123',
        hardDelete: true,
        reason: 'GDPR data deletion request'
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(true);
      expect(result.deletionType).toBe('hard');
      expect(result.message).toContain('xóa vĩnh viễn');
      expect(mockUserRepository.delete).toHaveBeenCalledWith(
        expect.objectContaining({ value: 'user-123' })
      );
      expect(mockUserRepository.update).not.toHaveBeenCalled();
    });

    it('should log hard deletion with CRITICAL severity', async () => {
      // Arrange
      const mockUser = createMockUser({
        userId: 'user-123',
        email: 'test@hospital.vn',
        fullName: 'Test User',
        roleType: 'PATIENT',
        isActive: true,
        isEmailVerified: true
      });

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.delete.mockResolvedValue(undefined);

      const request: DeleteUserRequest = {
        userId: 'user-123',
        requesterId: 'admin-123',
        hardDelete: true,
        reason: 'GDPR compliance'
      };

      // Act
      await useCase.execute(request);

      // Assert
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'User permanently deleted',
        expect.objectContaining({
          userId: 'user-123',
          requesterId: 'admin-123',
          reason: 'GDPR compliance',
          userEmail: 'test@hospital.vn',
          severity: 'CRITICAL',
          timestamp: expect.any(String)
        })
      );
    });
  });

  describe('Self-Deletion Prevention', () => {
    it('should prevent user from deleting themselves', async () => {
      // Arrange
      const request: DeleteUserRequest = {
        userId: 'user-123',
        requesterId: 'user-123', // Same as userId
        reason: 'Self deletion attempt'
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Cannot delete yourself');
      expect(result.message).toContain('Không thể xóa chính mình');
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'User attempted to delete themselves',
        expect.objectContaining({
          userId: 'user-123',
          requesterId: 'user-123'
        })
      );
      expect(mockUserRepository.delete).not.toHaveBeenCalled();
      expect(mockUserRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('Validation', () => {
    it('should reject missing userId', async () => {
      // Arrange
      const request: DeleteUserRequest = {
        userId: '',
        requesterId: 'admin-123'
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Missing required fields');
    });

    it('should reject missing requesterId', async () => {
      // Arrange
      const request: DeleteUserRequest = {
        userId: 'user-123',
        requesterId: ''
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Missing required fields');
    });
  });

  describe('User Not Found', () => {
    it('should return error when user does not exist', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(null);

      const request: DeleteUserRequest = {
        userId: 'non-existent-user',
        requesterId: 'admin-123'
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('User not found');
      expect(mockLogger.warn).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle repository errors gracefully', async () => {
      // Arrange
      const mockUser = createMockUser({
        userId: 'user-123',
        email: 'test@hospital.vn',
        fullName: 'Test User',
        roleType: 'PATIENT',
        isActive: true,
        isEmailVerified: true
      });

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.update.mockRejectedValue(new Error('Database error'));

      const request: DeleteUserRequest = {
        userId: 'user-123',
        requesterId: 'admin-123'
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(false);
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
});

