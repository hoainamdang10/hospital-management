import {
  ICircuitBreaker,
  CircuitBreakerState
} from '../../src/application/services/ICircuitBreaker';

export const createCircuitBreakerStub = (): jest.Mocked<ICircuitBreaker> => {
  const executeMock = jest.fn(
    async <T>(operation: () => Promise<T>, fallback?: () => Promise<T>) => {
      try {
        return await operation();
      } catch (error) {
        if (fallback) {
          return await fallback();
        }
        throw error;
      }
    }
  );

  const breaker = {
    execute: executeMock,
    getState: jest.fn().mockReturnValue(CircuitBreakerState.CLOSED),
    reset: jest.fn()
  } as unknown as jest.Mocked<ICircuitBreaker>;

  return breaker;
};
