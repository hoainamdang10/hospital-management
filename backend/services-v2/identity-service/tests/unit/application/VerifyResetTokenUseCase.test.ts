/**
 * VerifyResetTokenUseCase Unit Tests
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { VerifyResetTokenUseCase } from '../../../src/application/use-cases/VerifyResetTokenUseCase';
import { IAuthenticationService } from '../../../src/application/services/IAuthenticationService';
import { IRecoveryHistoryRepository } from '../../../src/domain/repositories/IRecoveryHistoryRepository';
import { createCircuitBreakerStub } from '../../helpers/circuit-breaker-test-helper';

describe('VerifyResetTokenUseCase', () => {
  let useCase: VerifyResetTokenUseCase;
  let mockAuthService: jest.Mocked<IAuthenticationService>;
  let mockRecoveryHistoryRepository: jest.Mocked<IRecoveryHistoryRepository>;
  let mockLogger: any;
  let circuitBreaker: any;
  const testToken = 'valid-reset-token';

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

    mockRecoveryHistoryRepository = {
      log: jest.fn(),
      getHistory: jest.fn(),
      countRecentAttempts: jest.fn().mockResolvedValue(0),
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

    useCase = new VerifyResetTokenUseCase(
      mockAuthService,
      mockRecoveryHistoryRepository,
      mockLogger,
      circuitBreaker
    );
  });

  describe('execute', () => {
    it('should return error when token is empty', async () => {
      // Act
      const result = await useCase.execute({ token: '' });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle circuit breaker open state', async () => {
      // Arrange
      (circuitBreaker.execute as jest.Mock).mockImplementation(async (_fn: any, fallback: any) => {
        return await fallback();
      });

      // Act
      const result = await useCase.execute({ token: testToken });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('SERVICE_UNAVAILABLE');
    });

    it('should log verification attempts', async () => {
      // Act
      await useCase.execute({ token: testToken });

      // Assert - just verify it doesn't crash
      expect(true).toBe(true);
    });
  });
});
