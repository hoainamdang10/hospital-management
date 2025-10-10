/**
 * UnlockAccountUseCase - Unit Tests
 * 
 * Tests all scenarios for unlocking user accounts including:
 * - Happy path (admin unlocks user account)
 * - Already unlocked account
 * - Error handling
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { UnlockAccountUseCase, UnlockAccountRequest } from '../../../../src/application/use-cases/UnlockAccountUseCase';
import { IUserRepository } from '../../../../src/application/repositories/IUserRepository';
import { createMockUser } from '../../../helpers/user-test-helper';
import { createCircuitBreakerStub } from '../../../helpers/circuit-breaker-test-helper';

describe('UnlockAccountUseCase', () => {
  let useCase: UnlockAccountUseCase;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockLogger: any;
  let circuitBreaker = createCircuitBreakerStub();

  beforeEach(() => {
    mockUserRepository = {
      findById: jest.fn(),
      save: jest.fn()
    } as any;

    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    };

    circuitBreaker = createCircuitBreakerStub();

    useCase = new UnlockAccountUseCase(
      mockUserRepository,
      mockLogger,
      circuitBreaker
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Happy Path', () => {
    it('should unlock account successfully', async () => {
      // Arrange
      const mockUser = createMockUser({
        userId: 'user-123',
        email: 'test@hospital.vn',
        fullName: 'Nguyễn Văn Test',
        roleType: 'PATIENT',
        isActive: false // Locked
      });

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.save.mockResolvedValue(undefined);

      const request: UnlockAccountRequest = {
        userId: 'user-123',
        unlockedBy: 'admin-456',
        reason: 'Issue resolved'
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toContain('Tài khoản đã được mở khóa');
      expect(result.message).toContain('Issue resolved');
      expect(mockUser.isActive).toBe(true);
      expect(mockUserRepository.save).toHaveBeenCalledWith(mockUser);
    });

    it('should log audit trail', async () => {
      // Arrange
      const mockUser = createMockUser({
        userId: 'user-123',
        email: 'test@hospital.vn',
        isActive: false
      });

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.save.mockResolvedValue(undefined);

      const request: UnlockAccountRequest = {
        userId: 'user-123',
        unlockedBy: 'admin-456',
        reason: 'Account review completed'
      };

      // Act
      await useCase.execute(request);

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Account unlocked successfully',
        expect.objectContaining({
          userId: 'user-123',
          unlockedBy: 'admin-456',
          reason: 'Account review completed'
        })
      );
    });
  });

  describe('Validation Errors', () => {
    it('should reject if user not found', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(null);

      const request: UnlockAccountRequest = {
        userId: 'user-123',
        unlockedBy: 'admin-456',
        reason: 'Testing unlock account' // Must be >= 10 chars
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('USER_NOT_FOUND');
      expect(result.message).toContain('không tồn tại');
    });

    it('should reject if account already unlocked', async () => {
      // Arrange
      const mockUser = createMockUser({
        userId: 'user-123',
        email: 'test@hospital.vn',
        isActive: true // Already unlocked
      });

      mockUserRepository.findById.mockResolvedValue(mockUser);

      const request: UnlockAccountRequest = {
        userId: 'user-123',
        unlockedBy: 'admin-456',
        reason: 'Testing already unlocked' // Must be >= 10 chars
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('ALREADY_UNLOCKED');
      expect(result.message).toContain('đã được mở khóa');
    });

    it('should reject if userId is empty', async () => {
      // Arrange
      const request: UnlockAccountRequest = {
        userId: '',
        unlockedBy: 'admin-456',
        reason: 'Test'
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('VALIDATION_ERROR');
    });

    it('should reject if unlockedBy is empty', async () => {
      // Arrange
      const request: UnlockAccountRequest = {
        userId: 'user-123',
        unlockedBy: '',
        reason: 'Test'
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('VALIDATION_ERROR');
    });

    it('should reject if reason is empty', async () => {
      // Arrange
      const request: UnlockAccountRequest = {
        userId: 'user-123',
        unlockedBy: 'admin-456',
        reason: ''
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

      const request: UnlockAccountRequest = {
        userId: 'user-123',
        unlockedBy: 'admin-456',
        reason: 'Testing error handling' // Must be >= 10 chars
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('UNLOCK_ACCOUNT_FAILED');
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should handle save errors gracefully', async () => {
      // Arrange
      const mockUser = createMockUser({
        userId: 'user-123',
        email: 'test@hospital.vn',
        isActive: false
      });

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.save.mockRejectedValue(new Error('Save failed'));

      const request: UnlockAccountRequest = {
        userId: 'user-123',
        unlockedBy: 'admin-456',
        reason: 'Testing save error' // Must be >= 10 chars
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('UNLOCK_ACCOUNT_FAILED');
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
});
