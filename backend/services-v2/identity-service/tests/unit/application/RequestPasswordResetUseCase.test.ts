/**
 * RequestPasswordResetUseCase Unit Tests
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { RequestPasswordResetUseCase } from '../../../src/application/use-cases/RequestPasswordResetUseCase';
import { IAuthenticationService } from '../../../src/application/services/IAuthenticationService';
import { IUserRepository } from '../../../src/application/repositories/IUserRepository';
import { IRecoveryMethodRepository } from '../../../src/domain/repositories/IRecoveryMethodRepository';
import { IRecoveryHistoryRepository } from '../../../src/domain/repositories/IRecoveryHistoryRepository';
import { createCircuitBreakerStub } from '../../helpers/circuit-breaker-test-helper';
import { createMockUser } from '../../helpers/user-test-helper';

describe('RequestPasswordResetUseCase', () => {
  let useCase: RequestPasswordResetUseCase;
  let mockAuthService: jest.Mocked<IAuthenticationService>;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockRecoveryMethodRepository: jest.Mocked<IRecoveryMethodRepository>;
  let mockRecoveryHistoryRepository: jest.Mocked<IRecoveryHistoryRepository>;
  let mockLogger: any;
  let circuitBreaker: any;
  const testEmail = 'test@example.com';
  const testUserId = 'user-123';

  beforeEach(() => {
    mockAuthService = {
      sendPasswordResetEmail: jest.fn(),
      verifyPasswordResetToken: jest.fn(),
      resetPassword: jest.fn(),
    } as any;

    mockUserRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findAll: jest.fn(),
    } as any;

    mockRecoveryMethodRepository = {
      findUserIdByRecoveryEmail: jest.fn(),
      getByUserId: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      isRecoveryEmailUsed: jest.fn(),
    } as any;

    mockRecoveryHistoryRepository = {
      log: jest.fn(),
      countRecentAttempts: jest.fn().mockResolvedValue(0),
      getHistory: jest.fn(),
      deleteOldHistory: jest.fn(),
    } as any;

    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      fatal: jest.fn(),
    };

    circuitBreaker = createCircuitBreakerStub();

    useCase = new RequestPasswordResetUseCase(
      mockAuthService,
      mockUserRepository,
      mockRecoveryMethodRepository,
      mockRecoveryHistoryRepository,
      mockLogger,
      circuitBreaker
    );
  });

  describe('execute', () => {
    it('should send password reset email successfully', async () => {
      // Arrange
      const mockUser = createMockUser({
        userId: testUserId,
        email: testEmail,
        isActive: true,
      });
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockUserRepository.findById.mockResolvedValue(mockUser);

      // Act
      const result = await useCase.execute({ email: testEmail });

      // Assert
      expect(result.success).toBe(true);
      expect(mockAuthService.sendPasswordResetEmail).toHaveBeenCalledWith(testEmail);
      expect(mockRecoveryHistoryRepository.log).toHaveBeenCalled();
    });

    it('should return success even when user not found (security)', async () => {
      // Arrange
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockRecoveryMethodRepository.findUserIdByRecoveryEmail.mockResolvedValue(null);

      // Act
      const result = await useCase.execute({ email: testEmail });

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toContain('email tồn tại');
      expect(mockAuthService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('should return error when email is invalid', async () => {
      // Act
      const result = await useCase.execute({ email: 'invalid-email' });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('INVALID_EMAIL');
    });

    it('should handle rate limiting', async () => {
      // Arrange
      const mockUser = createMockUser({
        userId: testUserId,
        email: testEmail,
        isActive: true,
      });
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockRecoveryHistoryRepository.countRecentAttempts.mockResolvedValue(5);

      // Act
      const result = await useCase.execute({ email: testEmail });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('RATE_LIMIT_EXCEEDED');
    });

    it('should return error when user is inactive', async () => {
      // Arrange
      const mockUser = createMockUser({
        userId: testUserId,
        email: testEmail,
        isActive: false,
      });
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockUserRepository.findById.mockResolvedValue(mockUser);

      // Act
      const result = await useCase.execute({ email: testEmail });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('USER_INACTIVE');
    });

    it('should handle circuit breaker open state', async () => {
      // Arrange
      (circuitBreaker.execute as jest.Mock).mockImplementation(async (_fn: any, fallback: any) => {
        return await fallback();
      });

      // Act
      const result = await useCase.execute({ email: testEmail });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('SERVICE_UNAVAILABLE');
    });
  });
});
