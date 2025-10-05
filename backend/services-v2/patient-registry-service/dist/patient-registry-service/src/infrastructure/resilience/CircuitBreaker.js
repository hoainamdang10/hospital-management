"use strict";
/**
 * Circuit Breaker Pattern Implementation
 * Prevents cascading failures and provides graceful degradation
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Production-Ready, Anti-Pattern Mitigation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CircuitBreaker = exports.CircuitBreakerFactory = exports.PatientRegistryCircuitBreaker = exports.CircuitBreakerState = void 0;
var CircuitBreakerState;
(function (CircuitBreakerState) {
    CircuitBreakerState["CLOSED"] = "CLOSED";
    CircuitBreakerState["OPEN"] = "OPEN";
    CircuitBreakerState["HALF_OPEN"] = "HALF_OPEN";
})(CircuitBreakerState || (exports.CircuitBreakerState = CircuitBreakerState = {}));
/**
 * Circuit Breaker for Patient Registry Operations
 * Implements fail-fast pattern to prevent system overload
 */
class PatientRegistryCircuitBreaker {
    constructor(config, serviceName) {
        this.config = config;
        this.serviceName = serviceName;
        this.state = CircuitBreakerState.CLOSED;
        this.failureCount = 0;
        this.halfOpenCalls = 0;
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
    async execute(operation, fallback) {
        this.metrics.totalCalls++;
        // Check if circuit is open
        if (this.state === CircuitBreakerState.OPEN) {
            if (this.shouldAttemptReset()) {
                this.transitionTo(CircuitBreakerState.HALF_OPEN, 'Recovery timeout reached');
            }
            else {
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
        }
        catch (error) {
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
    onSuccess() {
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
    onFailure(_error) {
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
    shouldAttemptReset() {
        if (!this.lastFailureTime) {
            return false;
        }
        const timeSinceLastFailure = Date.now() - this.lastFailureTime.getTime();
        return timeSinceLastFailure >= this.config.recoveryTimeout;
    }
    /**
     * Transition to new state
     */
    transitionTo(newState, reason) {
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
    getState() {
        return this.state;
    }
    /**
     * Get metrics
     */
    getMetrics() {
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
    reset() {
        this.state = CircuitBreakerState.CLOSED;
        this.failureCount = 0;
        this.halfOpenCalls = 0;
        this.lastFailureTime = undefined;
    }
}
exports.PatientRegistryCircuitBreaker = PatientRegistryCircuitBreaker;
exports.CircuitBreaker = PatientRegistryCircuitBreaker;
/**
 * Circuit Breaker Factory
 * Manages circuit breaker instances
 */
class CircuitBreakerFactory {
    static getBreaker(serviceName, config) {
        if (!this.breakers.has(serviceName)) {
            const defaultConfig = {
                failureThreshold: 5,
                recoveryTimeout: 30000, // 30 seconds
                monitoringWindow: 60000, // 1 minute
                halfOpenMaxCalls: 3
            };
            const finalConfig = { ...defaultConfig, ...config };
            this.breakers.set(serviceName, new PatientRegistryCircuitBreaker(finalConfig, serviceName));
        }
        return this.breakers.get(serviceName);
    }
    static getAllBreakers() {
        return this.breakers;
    }
    static getHealthStatus() {
        const status = {};
        for (const [name, breaker] of this.breakers) {
            status[name] = breaker.getStatus();
        }
        return status;
    }
    static resetAll() {
        for (const breaker of this.breakers.values()) {
            breaker.reset();
        }
    }
}
exports.CircuitBreakerFactory = CircuitBreakerFactory;
CircuitBreakerFactory.breakers = new Map();
//# sourceMappingURL=CircuitBreaker.js.map