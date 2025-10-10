/**
 * UpdateRecoveryMethodsUseCase Unit Tests
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { UpdateRecoveryMethodsUseCase } from '../../../src/application/use-cases/UpdateRecoveryMethodsUseCase';
import { IRecoveryMethodRepository } from '../../../src/domain/repositories/IRecoveryMethodRepository';
import { RecoveryMethod } from '../../../src/domain/value-objects/RecoveryMethod';
import { createCircuitBreakerStub } from '../../helpers/circuit-breaker-test-helper';

describe('UpdateRecoveryMethodsUseCase', () => {
  let useCase: UpdateRecoveryMethodsUseCase;
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

    const mockUserRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findAll: jest.fn(),
    } as any;

    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      fatal: jest.fn(),
    };

    circuitBreaker = createCircuitBreakerStub();

    useCase = new UpdateRecoveryMethodsUseCase(
      mockRepository,
      mockUserRepository,
      mockLogger,
      circuitBreaker
    );
  });

  describe('execute', () => {
    it('should update recovery email successfully', async () => {
      // Arrange
      mockRepository.getByUserId.mockResolvedValue(null);
      mockRepository.isRecoveryEmailUsed.mockResolvedValue(false);
      mockRepository.save.mockResolvedValue({} as any);

      // Act
      const result = await useCase.execute({
        userId: testUserId,
        recoveryEmail: 'new-recovery@example.com'
      });

      // Assert
      expect(result.success).toBe(true);
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should update existing recovery method', async () => {
      // Arrange
      const existing = RecoveryMethod.create({
        userId: testUserId,
        recoveryEmail: 'old@example.com',
        recoveryEmailVerified: false,
        recoveryEmailVerifiedAt: null,
        createdAt: new Date(),
        lastUpdatedAt: new Date()
      });
      mockRepository.getByUserId.mockResolvedValue(existing);
      mockRepository.isRecoveryEmailUsed.mockResolvedValue(false);
      mockRepository.save.mockResolvedValue({} as any);

      // Act
      const result = await useCase.execute({
        userId: testUserId,
        recoveryEmail: 'new@example.com'
      });

      // Assert
      expect(result.success).toBe(true);
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should return error when userId is invalid', async () => {
      // Act
      const result = await useCase.execute({
        userId: '',
        recoveryEmail: 'test@example.com'
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should return error when email is invalid', async () => {
      // Act
      const result = await useCase.execute({
        userId: testUserId,
        recoveryEmail: 'invalid-email'
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle repository errors gracefully', async () => {
      // Arrange
      mockRepository.getByUserId.mockRejectedValue(new Error('Database error'));

      // Act
      const result = await useCase.execute({
        userId: testUserId,
        recoveryEmail: 'test@example.com'
      });

      // Assert
      expect(result.success).toBe(false);
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should handle circuit breaker open state', async () => {
      // Arrange
      (circuitBreaker.execute as jest.Mock).mockImplementation(async (_fn: any, fallback: any) => {
        return await fallback();
      });

      // Act
      const result = await useCase.execute({
        userId: testUserId,
        recoveryEmail: 'test@example.com'
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('SERVICE_UNAVAILABLE');
    });
  });
});
