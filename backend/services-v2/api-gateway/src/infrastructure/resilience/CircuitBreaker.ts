export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN'
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number;
  monitoringPeriod: number;
  halfOpenMaxCalls?: number;
}

export interface CircuitBreakerMetrics {
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  lastFailureTime?: Date;
  lastSuccessTime?: Date;
  stateTransitions: StateTransition[];
}

export interface StateTransition {
  from: CircuitState;
  to: CircuitState;
  timestamp: Date;
  reason: string;
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private lastFailureTime: number = 0;
  private successCount: number = 0;
  private halfOpenCalls: number = 0;
  private metrics: CircuitBreakerMetrics = {
    totalCalls: 0,
    successfulCalls: 0,
    failedCalls: 0,
    stateTransitions: []
  };

  constructor(
    private serviceName: string,
    private config: CircuitBreakerConfig
  ) {}

  async execute<T>(
    operation: () => Promise<T>,
    fallback?: () => Promise<T>
  ): Promise<T> {
    this.metrics.totalCalls++;

    if (this.state === CircuitState.OPEN) {
      if (this.shouldAttemptReset()) {
        this.transitionTo(CircuitState.HALF_OPEN, 'Recovery timeout reached');
      } else {
        if (fallback) {
          console.warn(`Circuit breaker OPEN for ${this.serviceName}, using fallback`);
          return await fallback();
        }
        throw new Error(`Circuit breaker is OPEN for ${this.serviceName}`);
      }
    }

    if (this.state === CircuitState.HALF_OPEN) {
      const maxCalls = this.config.halfOpenMaxCalls || 3;
      if (this.halfOpenCalls >= maxCalls) {
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
      throw error;
    }
  }

  private shouldAttemptReset(): boolean {
    return Date.now() - this.lastFailureTime >= this.config.resetTimeout;
  }

  private onSuccess(): void {
    this.metrics.successfulCalls++;
    this.metrics.lastSuccessTime = new Date();

    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= (this.config.halfOpenMaxCalls || 3)) {
        this.transitionTo(CircuitState.CLOSED, 'Recovery successful');
        this.failureCount = 0;
        this.halfOpenCalls = 0;
      }
    }
  }

  private onFailure(error: unknown): void {
    this.metrics.failedCalls++;
    this.metrics.lastFailureTime = new Date();
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === CircuitState.HALF_OPEN) {
      this.transitionTo(CircuitState.OPEN, `Failure during recovery: ${error instanceof Error ? error.message : 'Unknown error'}`);
      this.halfOpenCalls = 0;
    }

    if (this.state === CircuitState.CLOSED && this.failureCount >= this.config.failureThreshold) {
      this.transitionTo(CircuitState.OPEN, 'Failure threshold exceeded');
    }
  }

  private transitionTo(newState: CircuitState, reason: string): void {
    const transition: StateTransition = {
      from: this.state,
      to: newState,
      timestamp: new Date(),
      reason
    };

    this.metrics.stateTransitions.push(transition);

    console.warn(`Circuit breaker state transition for ${this.serviceName}`, {
      from: this.state,
      to: newState,
      reason,
      timestamp: transition.timestamp.toISOString()
    });

    this.state = newState;
  }

  getState(): CircuitState {
    return this.state;
  }

  reset(): void {
    this.transitionTo(CircuitState.CLOSED, 'Manual reset');
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = 0;
    this.halfOpenCalls = 0;
  }

  getMetrics(): CircuitBreakerMetrics {
    return {
      ...this.metrics,
      stateTransitions: [...this.metrics.stateTransitions]
    };
  }

  getStats(): {
    serviceName: string;
    state: CircuitState;
    failureCount: number;
    successCount: number;
    metrics: CircuitBreakerMetrics;
  } {
    return {
      serviceName: this.serviceName,
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      metrics: this.getMetrics()
    };
  }
}

