/**
 * Circuit Breaker Pattern Implementation
 * Prevents cascading failures and provides graceful degradation
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Production-Ready, Anti-Pattern Mitigation
 */
export declare enum CircuitBreakerState {
    CLOSED = "CLOSED",
    OPEN = "OPEN",
    HALF_OPEN = "HALF_OPEN"
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
export declare class PatientRegistryCircuitBreaker {
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
     * Check if circuit should attempt reset
     */
    private shouldAttemptReset;
    /**
     * Transition to new state
     */
    private transitionTo;
    /**
     * Get current state
     */
    getState(): CircuitBreakerState;
    /**
     * Get metrics
     */
    getMetrics(): CircuitBreakerMetrics;
    /**
     * Get status
     */
    getStatus(): {
        serviceName: string;
        state: CircuitBreakerState;
        failureCount: number;
        metrics: CircuitBreakerMetrics;
        config: CircuitBreakerConfig;
    };
    /**
     * Reset circuit breaker
     */
    reset(): void;
}
/**
 * Circuit Breaker Factory
 * Manages circuit breaker instances
 */
export declare class CircuitBreakerFactory {
    private static breakers;
    static getBreaker(serviceName: string, config?: Partial<CircuitBreakerConfig>): PatientRegistryCircuitBreaker;
    static getAllBreakers(): Map<string, PatientRegistryCircuitBreaker>;
    static getHealthStatus(): {
        totalBreakers: number;
        openBreakers: number;
        breakers: Record<string, {
            serviceName: string;
            state: CircuitBreakerState;
            failureCount: number;
            metrics: CircuitBreakerMetrics;
            config: CircuitBreakerConfig;
        }>;
    };
    static resetAll(): void;
}
export { PatientRegistryCircuitBreaker as CircuitBreaker };
//# sourceMappingURL=CircuitBreaker.d.ts.map