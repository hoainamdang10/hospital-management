/**
 * Circuit Breaker Pattern Implementation
 * Prevents cascading failures and provides graceful degradation
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Production-Ready, Anti-Pattern Mitigation
 */

export enum CircuitBreakerState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN'
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  recoveryTimeout: number;
  monitoringWindow: number;
  halfOpenMaxCalls: number;
}

export interface CircuitBreakerMetrics {
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  lastFailureTime?: Date;
  lastSuccessTime?: Date;
  stateChanges: Array<{
    from: CircuitBreakerState;
    to: CircuitBreakerState;
    timestamp: Date;
    reason: string;
  }>;
}

/**
 * Circuit Breaker for Patient Registry Operations
 * Implements fail-fast pattern to prevent system overload
 */
export class PatientRegistryCircuitBreaker {
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private failureCount: number = 0;
  private lastFailureTime?: Date;
  private halfOpenCalls: number = 0;
  private metrics: CircuitBreakerMetrics;

  constructor(
    private config: CircuitBreakerConfig,
    private serviceName: string
  ) {
    this.metrics = {
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      stateChanges: []
    };
  }

  /**
   * Execute operation with circuit breaker protection
   */
  async execute<T>(
    operation: () => Promise<T>,
    fallback?: () => Promise<T>
  ): Promise<T> {
    this.metrics.totalCalls++;

    // Check if circuit is open
    if (this.state === CircuitBreakerState.OPEN) {
      if (this.shouldAttemptReset()) {
        this.transitionTo(CircuitBreakerState.HALF_OPEN, 'Recovery timeout reached');
      } else {
        if (fallback) {
          return await fallback();
        }
        throw new Error(`Circuit breaker is OPEN for ${this.serviceName}`);
      }
    }

    // Check half-open state limits
    if (this.state === CircuitBreakerState.HALF_OPEN) {
      if (this.halfOpenCalls >= this.config.halfOpenMaxCalls) {
        throw new Error(`Circuit breaker HALF_OPEN limit exceeded for ${this.serviceName}`);
      }
      this.halfOpenCalls++;
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error);

      if (fallback) {
        return await fallback();
      }
      throw error;
    }
  }

  /**
   * Handle successful operation
   */
  private onSuccess(): void {
    this.metrics.successfulCalls++;
    this.metrics.lastSuccessTime = new Date();

    if (this.state === CircuitBreakerState.HALF_OPEN) {
      this.transitionTo(CircuitBreakerState.CLOSED, 'Successful recovery');
      this.failureCount = 0;
      this.halfOpenCalls = 0;
    }

    if (this.state === CircuitBreakerState.CLOSED) {
      this.failureCount = 0;
    }
  }

  /**
   * Handle failed operation
   */
  private onFailure(_error: unknown): void {
    this.metrics.failedCalls++;
    this.failureCount++;
    this.lastFailureTime = new Date();
    this.metrics.lastFailureTime = this.lastFailureTime;

    if (this.state === CircuitBreakerState.HALF_OPEN) {
      this.transitionTo(CircuitBreakerState.OPEN, 'Failure during recovery');
      this.halfOpenCalls = 0;
    }

    if (this.state === CircuitBreakerState.CLOSED && this.failureCount >= this.config.failureThreshold) {
      this.transitionTo(CircuitBreakerState.OPEN, 'Failure threshold exceeded');
    }
  }

  /**
   * Check if circuit should attempt reset
   */
  private shouldAttemptReset(): boolean {
    if (!this.lastFailureTime) {
      return false;
    }

    const timeSinceLastFailure = Date.now() - this.lastFailureTime.getTime();
    return timeSinceLastFailure >= this.config.recoveryTimeout;
  }

  /**
   * Transition to new state
   */
  private transitionTo(newState: CircuitBreakerState, reason: string): void {
    const oldState = this.state;
    this.state = newState;

    this.metrics.stateChanges.push({
      from: oldState,
      to: newState,
      timestamp: new Date(),
      reason
    });
  }

  /**
   * Get current state
   */
  getState(): CircuitBreakerState {
    return this.state;
  }

  /**
   * Get metrics
   */
  getMetrics(): CircuitBreakerMetrics {
    return { ...this.metrics };
  }

  /**
   * Get status
   */
  getStatus() {
    return {
      serviceName: this.serviceName,
      state: this.state,
      failureCount: this.failureCount,
      metrics: this.metrics,
      config: this.config
    };
  }

  /**
   * Reset circuit breaker
   */
  reset(): void {
    this.state = CircuitBreakerState.CLOSED;
    this.failureCount = 0;
    this.halfOpenCalls = 0;
    this.lastFailureTime = undefined;
  }
}

/**
 * Circuit Breaker Factory
 * Manages circuit breaker instances
 */
export class CircuitBreakerFactory {
  private static breakers: Map<string, PatientRegistryCircuitBreaker> = new Map();

  static getBreaker(
    serviceName: string,
    config?: Partial<CircuitBreakerConfig>
  ): PatientRegistryCircuitBreaker {
    if (!this.breakers.has(serviceName)) {
      const defaultConfig: CircuitBreakerConfig = {
        failureThreshold: 5,
        recoveryTimeout: 30000, // 30 seconds
        monitoringWindow: 60000, // 1 minute
        halfOpenMaxCalls: 3
      };

      const finalConfig = { ...defaultConfig, ...config };
      this.breakers.set(serviceName, new PatientRegistryCircuitBreaker(finalConfig, serviceName));
    }

    return this.breakers.get(serviceName)!;
  }

  static getAllBreakers(): Map<string, PatientRegistryCircuitBreaker> {
    return this.breakers;
  }

  static getHealthStatus() {
    const status: Record<string, ReturnType<PatientRegistryCircuitBreaker['getStatus']>> = {};
    let openBreakers = 0;

    for (const [name, breaker] of this.breakers) {
      status[name] = breaker.getStatus();
      if (breaker.getState() === CircuitBreakerState.OPEN) {
        openBreakers++;
      }
    }

    return {
      totalBreakers: this.breakers.size,
      openBreakers,
      breakers: status
    };
  }

  static resetAll(): void {
    for (const breaker of this.breakers.values()) {
      breaker.reset();
    }
  }
}

// Export alias for backward compatibility
export { PatientRegistryCircuitBreaker as CircuitBreaker };
