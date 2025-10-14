/**
 * Circuit Breaker Pattern Implementation
 * Prevents cascading failures and provides graceful degradation
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Production-Ready, Anti-Pattern Mitigation
 */
import { ICircuitBreaker, CircuitBreakerState } from '../../application/services/ICircuitBreaker';
export { CircuitBreakerState };
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
 * Circuit Breaker for Identity Service Operations
 * Implements fail-fast pattern to prevent system overload
 */
export declare class IdentityServiceCircuitBreaker implements ICircuitBreaker {
    private config;
    private serviceName;
    private state;
    private failureCount;
    private lastFailureTime?;
    private halfOpenCalls;
    private metrics;
    constructor(config: CircuitBreakerConfig, serviceName: string);
    /**
     * Execute operation with circuit breaker protection
     */
    execute<T>(operation: () => Promise<T>, fallback?: () => Promise<T>): Promise<T>;
    /**
     * Handle successful operation
     */
    private onSuccess;
    /**
     * Handle failed operation
     */
    private onFailure;
    /**
     * Check if circuit breaker should attempt reset
     */
    private shouldAttemptReset;
    /**
     * Transition circuit breaker state
     */
    private transitionTo;
    /**
     * Get current circuit breaker state (ICircuitBreaker interface)
     */
    getState(): CircuitBreakerState;
    /**
     * Get current circuit breaker status (detailed)
     */
    getStatus(): {
        state: CircuitBreakerState;
        failureCount: number;
        lastFailureTime: Date | undefined;
        metrics: CircuitBreakerMetrics;
        config: CircuitBreakerConfig;
    };
    /**
     * Reset circuit breaker manually
     */
    reset(): void;
}
/**
 * Circuit Breaker Factory for different service operations
 */
export declare class CircuitBreakerFactory {
    private static breakers;
    static getBreaker(serviceName: string, config?: Partial<CircuitBreakerConfig>): IdentityServiceCircuitBreaker;
    static getAllBreakers(): Map<string, IdentityServiceCircuitBreaker>;
    static getHealthStatus(): Record<string, any>;
    static resetAll(): void;
    static clearAll(): void;
}
//# sourceMappingURL=CircuitBreaker.d.ts.map