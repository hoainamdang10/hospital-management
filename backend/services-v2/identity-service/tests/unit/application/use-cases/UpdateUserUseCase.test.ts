/**
 * UpdateUserUseCase - Unit Tests
 * 
 * Tests all scenarios for updating user information including:
 * - Happy path
 * - Partial updates
 * - Email immutability
 * - Validation
 * - Error handling
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { UpdateUserUseCase, UpdateUserRequest } from '../../../../src/application/use-cases/UpdateUserUseCase';
import { IUserRepository } from '../../../../src/application/repositories/IUserRepository';
import { createMockUser } from '../../../helpers/user-test-helper';
import { createCircuitBreakerStub } from '../../../helpers/circuit-breaker-test-helper';

describe('UpdateUserUseCase', () => {
  let useCase: UpdateUserUseCase;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockLogger: any;
  let circuitBreaker = createCircuitBreakerStub();

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

    circuitBreaker = createCircuitBreakerStub();

    useCase = new UpdateUserUseCase(
      mockUserRepository,
      mockLogger,
      circuitBreaker
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Happy Path', () => {
    it('should update user with valid data', async () => {
      // Arrange
      const mockUser = createMockUser({
        userId: 'user-123',
        email: 'test@hospital.vn',
        fullName: 'Old Name',
        roleType: 'PATIENT',
        isActive: true,
        isEmailVerified: true
      });

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.update.mockResolvedValue(undefined);

      const request: UpdateUserRequest = {
        userId: 'user-123',
        requesterId: 'admin-123',
        updates: {
          fullName: 'New Name',
          phoneNumber: '0987654321'
        }
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(true);
      expect(result.user?.fullName).toBe('New Name');
      expect(result.user?.phoneNumber).toBe('0987654321');
      expect(mockUserRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          personalInfo: expect.objectContaining({
            fullName: 'New Name',
            phoneNumber: '0987654321'
          })
        })
      );
    });

    it('should update only provided fields', async () => {
      // Arrange
      const mockUser = createMockUser({
        userId: 'user-123',
        email: 'test@hospital.vn',
        fullName: 'Test User',
        phoneNumber: '0912345678',
        roleType: 'PATIENT',
        isActive: true,
        isEmailVerified: true
      });

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.update.mockResolvedValue(undefined);

      const request: UpdateUserRequest = {
        userId: 'user-123',
        requesterId: 'admin-123',
        updates: {
          address: '456 New Street'
        }
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(true);
      expect(mockUserRepository.update).toHaveBeenCalled();
    });

    it('should update active status', async () => {
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

      const request: UpdateUserRequest = {
        userId: 'user-123',
        requesterId: 'admin-123',
        updates: {
          isActive: false
        }
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(true);
      expect(mockUserRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          isActive: false
        })
      );
    });

    it('should log update for audit', async () => {
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

      const request: UpdateUserRequest = {
        userId: 'user-123',
        requesterId: 'admin-123',
        updates: {
          fullName: 'Updated Name'
        }
      };

      // Act
      await useCase.execute(request);

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith(
        'User information updated',
        expect.objectContaining({
          userId: 'user-123',
          requesterId: 'admin-123',
          updatedFields: ['fullName'],
          timestamp: expect.any(String)
        })
      );
    });
  });

  describe('Email Immutability', () => {
    it('should reject email change attempts', async () => {
      // Arrange
      const mockUser = createMockUser({
        userId: 'user-123',
        email: 'old@hospital.vn',
        fullName: 'Test User',
        roleType: 'PATIENT',
        isActive: true,
        isEmailVerified: true
      });

      mockUserRepository.findById.mockResolvedValue(mockUser);

      const request: UpdateUserRequest = {
        userId: 'user-123',
        requesterId: 'admin-123',
        updates: {
          email: 'new@hospital.vn'
        }
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Email cannot be changed');
      expect(result.message).toContain('Không thể thay đổi email');
      expect(mockUserRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('Validation', () => {
    it('should reject missing userId', async () => {
      // Arrange
      const request: UpdateUserRequest = {
        userId: '',
        requesterId: 'admin-123',
        updates: { fullName: 'New Name' }
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Missing required fields');
    });

    it('should reject empty updates', async () => {
      // Arrange
      const request: UpdateUserRequest = {
        userId: 'user-123',
        requesterId: 'admin-123',
        updates: {}
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('No updates provided');
      expect(result.message).toContain('Không có thông tin');
    });
  });

  describe('User Not Found', () => {
    it('should return error when user does not exist', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(null);

      const request: UpdateUserRequest = {
        userId: 'non-existent-user',
        requesterId: 'admin-123',
        updates: { fullName: 'New Name' }
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

      const request: UpdateUserRequest = {
        userId: 'user-123',
        requesterId: 'admin-123',
        updates: { fullName: 'New Name' }
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(false);
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
});
