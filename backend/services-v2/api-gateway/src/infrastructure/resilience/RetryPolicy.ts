import { ILogger } from '@application/services/ILogger';
import { ProxyError, ProxyErrorType } from '@domain/errors/ProxyError';

export interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  retryableErrors: ProxyErrorType[];
}

export interface RetryContext {
  serviceName: string;
  path: string;
  method: string;
  requestId?: string;
}

export class RetryPolicy {
  private config: RetryConfig;

  constructor(
    config: Partial<RetryConfig>,
    private logger: ILogger
  ) {
    this.config = {
      maxRetries: config.maxRetries || 3,
      initialDelayMs: config.initialDelayMs || 100,
      maxDelayMs: config.maxDelayMs || 5000,
      backoffMultiplier: config.backoffMultiplier || 2,
      retryableErrors: config.retryableErrors || [
        ProxyErrorType.TIMEOUT,
        ProxyErrorType.CONNECTION_REFUSED,
        ProxyErrorType.NETWORK_ERROR
      ]
    };

    this.logger.info('RetryPolicy initialized', {
      maxRetries: this.config.maxRetries,
      initialDelayMs: this.config.initialDelayMs,
      maxDelayMs: this.config.maxDelayMs
    });
  }

  async execute<T>(
    operation: () => Promise<T>,
    context: RetryContext
  ): Promise<T> {
    let lastError: Error | null = null;
    let attemptNumber = 0;

    while (attemptNumber <= this.config.maxRetries) {
      attemptNumber++;

      try {
        this.logger.debug('Executing operation', {
          ...context,
          attemptNumber,
          maxRetries: this.config.maxRetries
        });

        const result = await operation();

        if (attemptNumber > 1) {
          this.logger.info('Operation succeeded after retry', {
            ...context,
            attemptNumber,
            totalAttempts: attemptNumber
          });
        }

        return result;

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        const shouldRetry = this.shouldRetry(lastError, attemptNumber);

        this.logger.warn('Operation failed', {
          ...context,
          attemptNumber,
          maxRetries: this.config.maxRetries,
          error: lastError.message,
          willRetry: shouldRetry
        });

        if (!shouldRetry) {
          break;
        }

        const delay = this.calculateDelay(attemptNumber);

        this.logger.debug('Waiting before retry', {
          ...context,
          attemptNumber,
          delayMs: delay
        });

        await this.sleep(delay);
      }
    }

    if (lastError instanceof ProxyError) {
      lastError.context.attemptNumber = attemptNumber;
      lastError.context.maxRetries = this.config.maxRetries;
      throw lastError;
    }

    throw ProxyError.fromError(lastError!, {
      ...context,
      attemptNumber,
      maxRetries: this.config.maxRetries
    });
  }

  private shouldRetry(error: Error, attemptNumber: number): boolean {
    if (attemptNumber >= this.config.maxRetries) {
      return false;
    }

    if (error instanceof ProxyError) {
      return error.retryable && this.config.retryableErrors.includes(error.type);
    }

    const errorMessage = error.message.toLowerCase();
    const retryableKeywords = ['timeout', 'econnrefused', 'enotfound', 'network'];

    return retryableKeywords.some(keyword => errorMessage.includes(keyword));
  }

  private calculateDelay(attemptNumber: number): number {
    const exponentialDelay = this.config.initialDelayMs * Math.pow(
      this.config.backoffMultiplier,
      attemptNumber - 1
    );

    const jitter = Math.random() * 0.3 * exponentialDelay;

    const delay = Math.min(
      exponentialDelay + jitter,
      this.config.maxDelayMs
    );

    return Math.floor(delay);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getConfig(): RetryConfig {
    return { ...this.config };
  }
}

