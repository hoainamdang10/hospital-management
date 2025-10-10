/**
 * GetRecoveryMethodsUseCase Unit Tests
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { GetRecoveryMethodsUseCase } from '../../../src/application/use-cases/GetRecoveryMethodsUseCase';
import { IRecoveryMethodRepository } from '../../../src/domain/repositories/IRecoveryMethodRepository';
import { RecoveryMethod } from '../../../src/domain/value-objects/RecoveryMethod';
import { createCircuitBreakerStub } from '../../helpers/circuit-breaker-test-helper';

describe('GetRecoveryMethodsUseCase', () => {
  let useCase: GetRecoveryMethodsUseCase;
  let mockRepository: jest.Mocked<IRecoveryMethodRepository>;
  let mockLogger: any;
  let circuitBreaker: any;
  const testUserId = 'user-123';

  beforeEach(() => {
    mockRepository = {
      getByUserId: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      isRecoveryEmailUsed: jest.fn(),
      findUserIdByRecoveryEmail: jest.fn(),
    } as any;

    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      fatal: jest.fn(),
    };

    circuitBreaker = createCircuitBreakerStub();

    useCase = new GetRecoveryMethodsUseCase(
      mockRepository,
      mockLogger,
      circuitBreaker
    );
  });

  describe('execute', () => {
    it('should get recovery methods successfully', async () => {
      // Arrange
      const recoveryMethod = RecoveryMethod.create({
        userId: testUserId,
        recoveryEmail: 'recovery@example.com',
        recoveryEmailVerified: true,
        recoveryEmailVerifiedAt: new Date(),
        createdAt: new Date(),
        lastUpdatedAt: new Date()
      });
      mockRepository.getByUserId.mockResolvedValue(recoveryMethod);

      // Act
      const result = await useCase.execute({ userId: testUserId });

      // Assert
      expect(result.success).toBe(true);
      expect(result.recoveryMethods).toBeDefined();
      expect(result.recoveryMethods?.recoveryEmail).toBe('recovery@example.com');
      expect(result.recoveryMethods?.recoveryEmailVerified).toBe(true);
    });

    it('should return default when no recovery methods configured', async () => {
      // Arrange
      mockRepository.getByUserId.mockResolvedValue(null);

      // Act
      const result = await useCase.execute({ userId: testUserId });

      // Assert
      expect(result.success).toBe(true);
      expect(result.recoveryMethods).toBeDefined();
      expect(result.recoveryMethods?.recoveryEmail).toBeNull();
      expect(result.recoveryMethods?.recoveryEmailVerified).toBe(false);
    });

    it('should return error when userId is empty', async () => {
      // Act
      const result = await useCase.execute({ userId: '' });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('INVALID_USER_ID');
      expect(result.message).toContain('không hợp lệ');
    });

    it('should handle repository errors gracefully', async () => {
      // Arrange
      jest.spyOn(mockRepository, 'getByUserId').mockRejectedValue(new Error('Database error'));

      // Act
      const result = await useCase.execute({ userId: testUserId });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('GET_RECOVERY_METHODS_FAILED');
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should handle circuit breaker open state', async () => {
      // Arrange
      (circuitBreaker.execute as jest.Mock).mockImplementation(async (_fn: any, fallback: any) => {
        return await fallback();
      });

      // Act
      const result = await useCase.execute({ userId: testUserId });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('SERVICE_UNAVAILABLE');
    });

    it('should log info when recovery methods retrieved', async () => {
      // Arrange
      const recoveryMethod = RecoveryMethod.create({
        userId: testUserId,
        recoveryEmail: 'recovery@example.com',
        recoveryEmailVerified: false,
        recoveryEmailVerifiedAt: null,
        createdAt: new Date(),
        lastUpdatedAt: new Date()
      });
      mockRepository.getByUserId.mockResolvedValue(recoveryMethod);

      // Act
      await useCase.execute({ userId: testUserId });

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Getting recovery methods',
        expect.objectContaining({ userId: testUserId })
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Recovery methods retrieved successfully',
        expect.any(Object)
      );
    });
  });
});

