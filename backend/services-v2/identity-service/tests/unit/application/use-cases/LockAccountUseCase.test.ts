/**
 * LockAccountUseCase - Unit Tests
 * 
 * Tests all scenarios for locking user accounts including:
 * - Happy path (admin locks user account)
 * - Already locked account
 * - Self-lock prevention
 * - Session termination
 * - Error handling
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { LockAccountUseCase, LockAccountRequest } from '../../../../src/application/use-cases/LockAccountUseCase';
import { IUserRepository } from '../../../../src/application/repositories/IUserRepository';
import { ISessionRepository } from '../../../../src/domain/repositories/ISessionRepository';
import { createMockUser } from '../../../helpers/user-test-helper';
import { createCircuitBreakerStub } from '../../../helpers/circuit-breaker-test-helper';

describe('LockAccountUseCase', () => {
  let useCase: LockAccountUseCase;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockSessionRepository: jest.Mocked<ISessionRepository>;
  let mockLogger: any;
  let circuitBreaker = createCircuitBreakerStub();

  beforeEach(() => {
    mockUserRepository = {
      findById: jest.fn(),
      save: jest.fn()
    } as any;

    mockSessionRepository = {
      deleteAllByUserId: jest.fn()
    } as any;

    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    };

    circuitBreaker = createCircuitBreakerStub();

    useCase = new LockAccountUseCase(
      mockUserRepository,
      mockSessionRepository,
      mockLogger,
      circuitBreaker
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Happy Path', () => {
    it('should lock account successfully', async () => {
      // Arrange
      const mockUser = createMockUser({
        userId: 'user-123',
        email: 'test@hospital.vn',
        fullName: 'Nguyễn Văn Test',
        roleType: 'PATIENT',
        isActive: true
      });

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.save.mockResolvedValue(undefined);
      mockSessionRepository.deleteAllByUserId.mockResolvedValue(3);

      const request: LockAccountRequest = {
        userId: 'user-123',
        lockedBy: 'admin-456',
        reason: 'Suspicious activity detected',
        terminateSessions: true
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toContain('Tài khoản đã bị khóa');
      expect(result.message).toContain('Suspicious activity detected');
      expect(mockUser.isActive).toBe(false);
      expect(mockUserRepository.save).toHaveBeenCalledWith(mockUser);
      expect(mockSessionRepository.deleteAllByUserId).toHaveBeenCalledWith('user-123');
    });

    it('should lock account without terminating sessions', async () => {
      // Arrange
      const mockUser = createMockUser({
        userId: 'user-123',
        email: 'test@hospital.vn',
        isActive: true
      });

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.save.mockResolvedValue(undefined);

      const request: LockAccountRequest = {
        userId: 'user-123',
        lockedBy: 'admin-456',
        reason: 'Account review',
        terminateSessions: false
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(true);
      expect(mockSessionRepository.deleteAllByUserId).not.toHaveBeenCalled();
    });

    it('should log audit trail', async () => {
      // Arrange
      const mockUser = createMockUser({
        userId: 'user-123',
        email: 'test@hospital.vn',
        isActive: true
      });

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.save.mockResolvedValue(undefined);
      mockSessionRepository.deleteAllByUserId.mockResolvedValue(2);

      const request: LockAccountRequest = {
        userId: 'user-123',
        lockedBy: 'admin-456',
        reason: 'Policy violation'
      };

      // Act
      await useCase.execute(request);

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Account locked successfully',
        expect.objectContaining({
          userId: 'user-123',
          lockedBy: 'admin-456',
          reason: 'Policy violation'
        })
      );
    });
  });

  describe('Validation Errors', () => {
    it('should reject if user not found', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(null);

      const request: LockAccountRequest = {
        userId: 'user-123',
        lockedBy: 'admin-456',
        reason: 'Testing lock account' // Must be >= 10 chars
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('USER_NOT_FOUND');
      expect(result.message).toContain('không tồn tại');
    });

    it('should reject if account already locked', async () => {
      // Arrange
      const mockUser = createMockUser({
        userId: 'user-123',
        email: 'test@hospital.vn',
        isActive: false // Already locked
      });

      mockUserRepository.findById.mockResolvedValue(mockUser);

      const request: LockAccountRequest = {
        userId: 'user-123',
        lockedBy: 'admin-456',
        reason: 'Testing already locked' // Must be >= 10 chars
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('ALREADY_LOCKED');
      expect(result.message).toContain('đã bị khóa');
    });

    it('should reject if trying to lock self', async () => {
      // Arrange
      const mockUser = createMockUser({
        userId: 'admin-456',
        email: 'admin@hospital.vn',
        isActive: true
      });

      mockUserRepository.findById.mockResolvedValue(mockUser);

      const request: LockAccountRequest = {
        userId: 'admin-456',
        lockedBy: 'admin-456', // Same user
        reason: 'Testing self lock' // Must be >= 10 chars
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('CANNOT_LOCK_SELF');
      expect(result.message).toContain('chính mình');
    });

    it('should reject if userId is empty', async () => {
      // Arrange
      const request: LockAccountRequest = {
        userId: '',
        lockedBy: 'admin-456',
        reason: 'Test'
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('VALIDATION_ERROR');
    });

    it('should reject if lockedBy is empty', async () => {
      // Arrange
      const request: LockAccountRequest = {
        userId: 'user-123',
        lockedBy: '',
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
      const request: LockAccountRequest = {
        userId: 'user-123',
        lockedBy: 'admin-456',
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

      const request: LockAccountRequest = {
        userId: 'user-123',
        lockedBy: 'admin-456',
        reason: 'Testing error handling' // Must be >= 10 chars
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('LOCK_ACCOUNT_FAILED');
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should handle session termination errors gracefully', async () => {
      // Arrange
      const mockUser = createMockUser({
        userId: 'user-123',
        email: 'test@hospital.vn',
        isActive: true
      });

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.save.mockResolvedValue(undefined);
      mockSessionRepository.deleteAllByUserId.mockRejectedValue(new Error('Session service unavailable'));

      const request: LockAccountRequest = {
        userId: 'user-123',
        lockedBy: 'admin-456',
        reason: 'Testing session error', // Must be >= 10 chars
        terminateSessions: true
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      // Session termination error causes the whole operation to fail
      expect(result.success).toBe(false);
      expect(result.error).toBe('LOCK_ACCOUNT_FAILED');
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
});
