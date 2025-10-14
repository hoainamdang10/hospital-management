import { RetryPolicy } from './RetryPolicy';
import { ProxyError, ProxyErrorType } from '@domain/errors/ProxyError';
import { ILogger } from '@application/services/ILogger';

const mockLogger: ILogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
};

describe('RetryPolicy', () => {
  let retryPolicy: RetryPolicy;
  const context = {
    serviceName: 'test-service',
    path: '/api/test',
    method: 'GET',
    requestId: 'req-123'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    retryPolicy = new RetryPolicy(
      {
        maxRetries: 3,
        initialDelayMs: 100,
        maxDelayMs: 5000,
        backoffMultiplier: 2
      },
      mockLogger
    );
  });

  describe('execute', () => {
    it('should execute operation successfully on first attempt', async () => {
      const operation = jest.fn().mockResolvedValue('success');

      const result = await retryPolicy.execute(operation, context);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
      expect(mockLogger.debug).toHaveBeenCalled();
    });

    it('should retry on retryable errors', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new ProxyError(
          ProxyErrorType.TIMEOUT,
          'Timeout',
          context,
          504,
          true
        ))
        .mockRejectedValueOnce(new ProxyError(
          ProxyErrorType.TIMEOUT,
          'Timeout',
          context,
          504,
          true
        ))
        .mockResolvedValue('success');

      const result = await retryPolicy.execute(operation, context);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
      expect(mockLogger.warn).toHaveBeenCalledTimes(2);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Operation succeeded after retry',
        expect.objectContaining({
          attemptNumber: 3,
          totalAttempts: 3
        })
      );
    });

    it('should not retry on non-retryable errors', async () => {
      const operation = jest.fn().mockRejectedValue(
        new ProxyError(
          ProxyErrorType.CIRCUIT_BREAKER_OPEN,
          'Circuit breaker open',
          context,
          503,
          false
        )
      );

      await expect(retryPolicy.execute(operation, context)).rejects.toThrow();

      expect(operation).toHaveBeenCalledTimes(1);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Operation failed',
        expect.objectContaining({
          willRetry: false
        })
      );
    });

    it('should stop retrying after max retries', async () => {
      const operation = jest.fn().mockRejectedValue(
        new ProxyError(
          ProxyErrorType.TIMEOUT,
          'Timeout',
          context,
          504,
          true
        )
      );

      await expect(retryPolicy.execute(operation, context)).rejects.toThrow();

      expect(operation).toHaveBeenCalledTimes(4);
    });

    it('should use exponential backoff', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('timeout'))
        .mockRejectedValueOnce(new Error('timeout'))
        .mockResolvedValue('success');

      const startTime = Date.now();
      await retryPolicy.execute(operation, context);
      const duration = Date.now() - startTime;

      expect(duration).toBeGreaterThanOrEqual(300);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Waiting before retry',
        expect.objectContaining({
          attemptNumber: 1
        })
      );
    });

    it('should add jitter to delay', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('timeout'))
        .mockResolvedValue('success');

      const delays: number[] = [];

      for (let i = 0; i < 5; i++) {
        const startTime = Date.now();
        await retryPolicy.execute(operation, context);
        delays.push(Date.now() - startTime);
        operation.mockReset();
        operation.mockRejectedValueOnce(new Error('timeout')).mockResolvedValue('success');
      }

      const uniqueDelays = new Set(delays);
      expect(uniqueDelays.size).toBeGreaterThan(1);
    });

    it('should respect max delay', async () => {
      const shortRetryPolicy = new RetryPolicy(
        {
          maxRetries: 10,
          initialDelayMs: 1000,
          maxDelayMs: 2000,
          backoffMultiplier: 2
        },
        mockLogger
      );

      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('timeout'))
        .mockRejectedValueOnce(new Error('timeout'))
        .mockRejectedValueOnce(new Error('timeout'))
        .mockResolvedValue('success');

      const startTime = Date.now();
      await shortRetryPolicy.execute(operation, context);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(10000);
    });

    it('should convert non-ProxyError to ProxyError', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Generic error'));

      try {
        await retryPolicy.execute(operation, context);
      } catch (error) {
        expect(error).toBeInstanceOf(ProxyError);
        expect((error as ProxyError).context.attemptNumber).toBe(4);
        expect((error as ProxyError).context.maxRetries).toBe(3);
      }
    });

    it('should retry on timeout keyword in error message', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('Request timeout'))
        .mockResolvedValue('success');

      const result = await retryPolicy.execute(operation, context);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should retry on ECONNREFUSED keyword', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('ECONNREFUSED'))
        .mockResolvedValue('success');

      const result = await retryPolicy.execute(operation, context);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });
  });

  describe('getConfig', () => {
    it('should return configuration', () => {
      const config = retryPolicy.getConfig();

      expect(config.maxRetries).toBe(3);
      expect(config.initialDelayMs).toBe(100);
      expect(config.maxDelayMs).toBe(5000);
      expect(config.backoffMultiplier).toBe(2);
    });
  });
});

