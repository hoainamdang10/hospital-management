import { CircuitBreaker, CircuitState } from './CircuitBreaker';

describe('CircuitBreaker', () => {
  let circuitBreaker: CircuitBreaker;
  const serviceName = 'test-service';

  beforeEach(() => {
    circuitBreaker = new CircuitBreaker(serviceName, {
      failureThreshold: 3,
      resetTimeout: 1000,
      monitoringPeriod: 5000,
      halfOpenMaxCalls: 2
    });
  });

  describe('execute', () => {
    it('should execute operation successfully when circuit is closed', async () => {
      const operation = jest.fn().mockResolvedValue('success');

      const result = await circuitBreaker.execute(operation);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);
    });

    it('should open circuit after failure threshold', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Service error'));

      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(operation);
        } catch (error) {
          // Expected
        }
      }

      expect(circuitBreaker.getState()).toBe(CircuitState.OPEN);
    });

    it('should use fallback when circuit is open', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Service error'));
      const fallback = jest.fn().mockResolvedValue('fallback-data');

      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(operation);
        } catch (error) {
          // Expected
        }
      }

      const result = await circuitBreaker.execute(operation, fallback);

      expect(result).toBe('fallback-data');
      expect(fallback).toHaveBeenCalled();
      expect(circuitBreaker.getState()).toBe(CircuitState.OPEN);
    });

    it('should throw error when circuit is open and no fallback', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Service error'));

      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(operation);
        } catch (error) {
          // Expected
        }
      }

      await expect(circuitBreaker.execute(operation)).rejects.toThrow(
        `Circuit breaker is OPEN for ${serviceName}`
      );
    });

    it('should transition to half-open after reset timeout', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Service error'));

      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(operation);
        } catch (error) {
          // Expected
        }
      }

      expect(circuitBreaker.getState()).toBe(CircuitState.OPEN);

      await new Promise(resolve => setTimeout(resolve, 1100));

      operation.mockResolvedValue('success');
      await circuitBreaker.execute(operation);

      expect(circuitBreaker.getState()).toBe(CircuitState.HALF_OPEN);
    });

    it('should close circuit after successful calls in half-open state', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Service error'));

      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(operation);
        } catch (error) {
          // Expected
        }
      }

      await new Promise(resolve => setTimeout(resolve, 1100));

      operation.mockResolvedValue('success');

      await circuitBreaker.execute(operation);
      await circuitBreaker.execute(operation);

      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);
    });

    it('should reopen circuit on failure in half-open state', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Service error'));

      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(operation);
        } catch (error) {
          // Expected
        }
      }

      await new Promise(resolve => setTimeout(resolve, 1100));

      try {
        await circuitBreaker.execute(operation);
      } catch (error) {
        // Expected
      }

      expect(circuitBreaker.getState()).toBe(CircuitState.OPEN);
    });

    it('should limit calls in half-open state', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Service error'));

      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(operation);
        } catch (error) {
          // Expected
        }
      }

      await new Promise(resolve => setTimeout(resolve, 1100));

      operation.mockResolvedValue('success');

      await circuitBreaker.execute(operation);
      await circuitBreaker.execute(operation);

      await expect(circuitBreaker.execute(operation)).rejects.toThrow(
        `Circuit breaker HALF_OPEN limit exceeded for ${serviceName}`
      );
    });
  });

  describe('getMetrics', () => {
    it('should track total calls', async () => {
      const operation = jest.fn().mockResolvedValue('success');

      await circuitBreaker.execute(operation);
      await circuitBreaker.execute(operation);

      const metrics = circuitBreaker.getMetrics();

      expect(metrics.totalCalls).toBe(2);
      expect(metrics.successfulCalls).toBe(2);
      expect(metrics.failedCalls).toBe(0);
    });

    it('should track failed calls', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Service error'));

      try {
        await circuitBreaker.execute(operation);
      } catch (error) {
        // Expected
      }

      const metrics = circuitBreaker.getMetrics();

      expect(metrics.totalCalls).toBe(1);
      expect(metrics.successfulCalls).toBe(0);
      expect(metrics.failedCalls).toBe(1);
    });

    it('should track state transitions', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Service error'));

      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(operation);
        } catch (error) {
          // Expected
        }
      }

      const metrics = circuitBreaker.getMetrics();

      expect(metrics.stateTransitions).toHaveLength(1);
      expect(metrics.stateTransitions[0].from).toBe(CircuitState.CLOSED);
      expect(metrics.stateTransitions[0].to).toBe(CircuitState.OPEN);
      expect(metrics.stateTransitions[0].reason).toBe('Failure threshold exceeded');
    });
  });

  describe('reset', () => {
    it('should reset circuit to closed state', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Service error'));

      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(operation);
        } catch (error) {
          // Expected
        }
      }

      expect(circuitBreaker.getState()).toBe(CircuitState.OPEN);

      circuitBreaker.reset();

      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);
    });
  });

  describe('getStats', () => {
    it('should return comprehensive statistics', async () => {
      const operation = jest.fn().mockResolvedValue('success');

      await circuitBreaker.execute(operation);

      const stats = circuitBreaker.getStats();

      expect(stats.serviceName).toBe(serviceName);
      expect(stats.state).toBe(CircuitState.CLOSED);
      expect(stats.metrics).toBeDefined();
    });
  });
});

