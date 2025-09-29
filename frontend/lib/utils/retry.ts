import React from 'react';
import { toast } from 'sonner';

export interface RetryOptions {
  maxAttempts?: number;
  delay?: number;
  backoff?: 'linear' | 'exponential';
  retryCondition?: (error: any) => boolean;
  onRetry?: (attempt: number, error: any) => void;
  onMaxAttemptsReached?: (error: any) => void;
}

export class RetryError extends Error {
  constructor(
    message: string,
    public readonly attempts: number,
    public readonly lastError: any
  ) {
    super(message);
    this.name = 'RetryError';
  }
}

/**
 * Retry a function with configurable options
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    delay = 1000,
    backoff = 'exponential',
    retryCondition = (error) => true,
    onRetry,
    onMaxAttemptsReached
  } = options;

  let lastError: any;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Check if we should retry this error
      if (!retryCondition(error)) {
        throw error;
      }
      
      // If this was the last attempt, throw the error
      if (attempt === maxAttempts) {
        if (onMaxAttemptsReached) {
          onMaxAttemptsReached(error);
        }
        throw new RetryError(
          `Failed after ${maxAttempts} attempts`,
          attempt,
          error
        );
      }
      
      // Call retry callback
      if (onRetry) {
        onRetry(attempt, error);
      }
      
      // Calculate delay for next attempt
      const nextDelay = backoff === 'exponential' 
        ? delay * Math.pow(2, attempt - 1)
        : delay * attempt;
      
      // Wait before next attempt
      await new Promise(resolve => setTimeout(resolve, nextDelay));
    }
  }
  
  throw lastError;
}

/**
 * Retry wrapper for API calls with user feedback
 */
export async function retryWithFeedback<T>(
  fn: () => Promise<T>,
  options: RetryOptions & {
    loadingMessage?: string;
    successMessage?: string;
    errorMessage?: string;
    showRetryToast?: boolean;
  } = {}
): Promise<T> {
  const {
    loadingMessage = 'Processing...',
    successMessage,
    errorMessage = 'Operation failed',
    showRetryToast = true,
    ...retryOptions
  } = options;

  let toastId: string | number | undefined;

  try {
    // Show loading toast
    if (loadingMessage) {
      toastId = toast.loading(loadingMessage);
    }

    const result = await retry(fn, {
      ...retryOptions,
      onRetry: (attempt, error) => {
        if (showRetryToast) {
          toast.info(`Retrying... (Attempt ${attempt + 1}/${retryOptions.maxAttempts || 3})`);
        }
        retryOptions.onRetry?.(attempt, error);
      },
      onMaxAttemptsReached: (error) => {
        toast.error(`${errorMessage}. Please try again later.`);
        retryOptions.onMaxAttemptsReached?.(error);
      }
    });

    // Show success toast
    if (successMessage) {
      toast.success(successMessage);
    } else if (toastId) {
      toast.dismiss(toastId);
    }

    return result;
  } catch (error) {
    // Dismiss loading toast and show error
    if (toastId) {
      toast.dismiss(toastId);
    }
    
    if (!(error instanceof RetryError)) {
      toast.error(errorMessage);
    }
    
    throw error;
  }
}

/**
 * Default retry condition for network errors
 */
export const networkRetryCondition = (error: any): boolean => {
  // Retry on network errors, timeouts, and 5xx server errors
  if (error.name === 'NetworkError' || error.name === 'TimeoutError') {
    return true;
  }
  
  if (error.response?.status >= 500) {
    return true;
  }
  
  // Don't retry on client errors (4xx)
  if (error.response?.status >= 400 && error.response?.status < 500) {
    return false;
  }
  
  return true;
};

/**
 * Retry hook for React components
 */
export function useRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
) {
  const [isRetrying, setIsRetrying] = React.useState(false);
  const [retryCount, setRetryCount] = React.useState(0);
  const [lastError, setLastError] = React.useState<any>(null);

  const executeWithRetry = React.useCallback(async () => {
    setIsRetrying(true);
    setLastError(null);
    
    try {
      const result = await retry(fn, {
        ...options,
        onRetry: (attempt, error) => {
          setRetryCount(attempt);
          options.onRetry?.(attempt, error);
        }
      });
      
      setRetryCount(0);
      return result;
    } catch (error) {
      setLastError(error);
      throw error;
    } finally {
      setIsRetrying(false);
    }
  }, [fn, options]);

  return {
    executeWithRetry,
    isRetrying,
    retryCount,
    lastError
  };
}

/**
 * Circuit breaker pattern for preventing cascading failures
 */
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private threshold: number = 5,
    private timeout: number = 60000 // 1 minute
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime < this.timeout) {
        throw new Error('Circuit breaker is open');
      } else {
        this.state = 'half-open';
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = 'closed';
  }

  private onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.threshold) {
      this.state = 'open';
    }
  }

  getState() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime
    };
  }

  reset() {
    this.failures = 0;
    this.lastFailureTime = 0;
    this.state = 'closed';
  }
}

/**
 * Enhanced API client with retry and circuit breaker
 */
export class ResilientApiClient {
  private circuitBreaker: CircuitBreaker;

  constructor(
    private baseURL: string,
    private defaultRetryOptions: RetryOptions = {},
    circuitBreakerOptions?: { threshold?: number; timeout?: number }
  ) {
    this.circuitBreaker = new CircuitBreaker(
      circuitBreakerOptions?.threshold,
      circuitBreakerOptions?.timeout
    );
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryOptions: RetryOptions = {}
  ): Promise<T> {
    const mergedRetryOptions = {
      ...this.defaultRetryOptions,
      ...retryOptions,
      retryCondition: retryOptions.retryCondition || networkRetryCondition
    };

    return this.circuitBreaker.execute(async () => {
      return retry(async () => {
        const response = await fetch(`${this.baseURL}${endpoint}`, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...options.headers
          }
        });

        if (!response.ok) {
          const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
          (error as any).response = response;
          throw error;
        }

        return response.json();
      }, mergedRetryOptions);
    });
  }

  getCircuitBreakerState() {
    return this.circuitBreaker.getState();
  }

  resetCircuitBreaker() {
    this.circuitBreaker.reset();
  }
}
