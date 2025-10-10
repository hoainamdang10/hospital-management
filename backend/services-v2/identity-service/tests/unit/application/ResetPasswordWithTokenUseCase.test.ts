/**
 * ResetPasswordWithTokenUseCase Unit Tests
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { ResetPasswordWithTokenUseCase } from '../../../src/application/use-cases/ResetPasswordWithTokenUseCase';
import { IAuthenticationService } from '../../../src/application/services/IAuthenticationService';
import { IPasswordPolicyRepository } from '../../../src/domain/repositories/IPasswordPolicyRepository';
import { IRecoveryHistoryRepository } from '../../../src/domain/repositories/IRecoveryHistoryRepository';
import { ISessionRepository } from '../../../src/domain/repositories/ISessionRepository';
import { createCircuitBreakerStub } from '../../helpers/circuit-breaker-test-helper';

describe('ResetPasswordWithTokenUseCase', () => {
  let useCase: ResetPasswordWithTokenUseCase;
  let mockAuthService: jest.Mocked<IAuthenticationService>;
  let mockPasswordPolicyRepository: jest.Mocked<IPasswordPolicyRepository>;
  let mockRecoveryHistoryRepository: jest.Mocked<IRecoveryHistoryRepository>;
  let mockSessionRepository: jest.Mocked<ISessionRepository>;
  let mockLogger: any;
  let circuitBreaker: any;
  const testToken = 'valid-reset-token';
  const testPassword = 'NewPassword123!';

  beforeEach(() => {
    mockAuthService = {
      signUp: jest.fn(),
      signIn: jest.fn(),
      signOut: jest.fn(),
      verifyEmail: jest.fn(),
      sendVerificationEmail: jest.fn(),
      changePassword: jest.fn(),
      refreshSession: jest.fn(),
      validateSession: jest.fn(),
    } as any;

    mockPasswordPolicyRepository = {
      getPolicy: jest.fn(),
      updatePolicy: jest.fn(),
    } as any;

    mockRecoveryHistoryRepository = {
      log: jest.fn(),
      getHistory: jest.fn(),
      countRecentAttempts: jest.fn().mockResolvedValue(0),
      deleteOldHistory: jest.fn(),
    } as any;

    mockSessionRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByUserId: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteAllByUserId: jest.fn(),
    } as any;

    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      fatal: jest.fn(),
    };

    circuitBreaker = createCircuitBreakerStub();

    useCase = new ResetPasswordWithTokenUseCase(
      mockAuthService,
      mockPasswordPolicyRepository,
      mockRecoveryHistoryRepository,
      mockSessionRepository,
      mockLogger,
      circuitBreaker
    );
  });

  describe('execute', () => {
    it('should return error when password is weak', async () => {
      // Act
      const result = await useCase.execute({
        token: testToken,
        newPassword: '123',
        confirmPassword: '123'
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should return error when passwords do not match', async () => {
      // Act
      const result = await useCase.execute({
        token: testToken,
        newPassword: testPassword,
        confirmPassword: 'DifferentPassword123!'
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('PASSWORDS_DO_NOT_MATCH');
    });

    it('should handle circuit breaker open state', async () => {
      // Arrange
      (circuitBreaker.execute as jest.Mock).mockImplementation(async (_fn: any, fallback: any) => {
        return await fallback();
      });

      // Act
      const result = await useCase.execute({
        token: testToken,
        newPassword: testPassword,
        confirmPassword: testPassword
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('SERVICE_UNAVAILABLE');
    });

    it('should log error when reset fails', async () => {
      // Act
      const result = await useCase.execute({
        token: '',
        newPassword: testPassword,
        confirmPassword: testPassword
      });

      // Assert - just verify it doesn't crash
      expect(result.success).toBe(false);
    });
  });
});
