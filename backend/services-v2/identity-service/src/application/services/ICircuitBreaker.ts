/**
 * Circuit Breaker Interface
 * Application layer interface for circuit breaker pattern
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture - Dependency Inversion
 */

/**
 * Circuit Breaker Interface
 * Provides fault tolerance and graceful degradation
 */
export interface ICircuitBreaker {
  /**
   * Execute operation with circuit breaker protection
   * 
   * @param operation Primary operation to execute
   * @param fallback Fallback operation if primary fails
   * @returns Result of operation or fallback
   */
  execute<T>(
    operation: () => Promise<T>,
    fallback: () => Promise<T>
  ): Promise<T>;

  /**
   * Get current circuit breaker state
   */
  getState(): CircuitBreakerState;

  /**
   * Reset circuit breaker to closed state
   */
  reset(): void;
}

/**
 * Circuit Breaker States
 */
export enum CircuitBreakerState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN'
}

