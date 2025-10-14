/**
 * GetRecoveryHistoryUseCase Unit Tests
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { GetRecoveryHistoryUseCase } from '../../../src/application/use-cases/GetRecoveryHistoryUseCase';
import { IRecoveryHistoryRepository } from '../../../src/domain/repositories/IRecoveryHistoryRepository';
import { RecoveryAttempt } from '../../../src/domain/value-objects/RecoveryAttempt';
import { createCircuitBreakerStub } from '../../helpers/circuit-breaker-test-helper';

describe('GetRecoveryHistoryUseCase', () => {
  let useCase: GetRecoveryHistoryUseCase;
  let mockRepository: jest.Mocked<IRecoveryHistoryRepository>;
  let mockLogger: any;
  let circuitBreaker: any;
  const testUserId = 'user-123';

  beforeEach(() => {
    mockRepository = {
      log: jest.fn(),
      getHistory: jest.fn(),
      countRecentAttempts: jest.fn(),
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

    useCase = new GetRecoveryHistoryUseCase(
      mockRepository,
      mockLogger,
      circuitBreaker
    );
  });

  describe('execute', () => {
    it('should get recovery history successfully', async () => {
      // Arrange
      const attempt = RecoveryAttempt.createSuccess(
        testUserId,
        'primary_email',
        'request_reset'
      );
      mockRepository.getHistory.mockResolvedValue({
        attempts: [attempt],
        totalCount: 1,
        page: 1,
        pageSize: 10,
        totalPages: 1
      });

      // Act
      const result = await useCase.execute({ userId: testUserId });

      // Assert
      expect(result.success).toBe(true);
      expect(result.history).toBeDefined();
      expect(result.history?.length).toBeGreaterThan(0);
    });

    it('should return empty history when no attempts', async () => {
      // Arrange
      mockRepository.getHistory.mockResolvedValue({
        attempts: [],
        totalCount: 0,
        page: 1,
        pageSize: 10,
        totalPages: 0
      });

      // Act
      const result = await useCase.execute({ userId: testUserId });

      // Assert
      expect(result.success).toBe(true);
      expect(result.history).toBeDefined();
      expect(result.history?.length).toBe(0);
    });

    it('should return error when userId is invalid', async () => {
      // Act
      const result = await useCase.execute({ userId: '' });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle repository errors gracefully', async () => {
      // Arrange
      mockRepository.getHistory.mockRejectedValue(new Error('Database error'));

      // Act
      const result = await useCase.execute({ userId: testUserId });

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
      const result = await useCase.execute({ userId: testUserId });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('SERVICE_UNAVAILABLE');
    });
  });
});

