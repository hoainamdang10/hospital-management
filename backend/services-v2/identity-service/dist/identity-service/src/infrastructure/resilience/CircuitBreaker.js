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
exports.CircuitBreakerFactory = exports.IdentityServiceCircuitBreaker = exports.CircuitBreakerState = void 0;
const ICircuitBreaker_1 = require("../../application/services/ICircuitBreaker");
Object.defineProperty(exports, "CircuitBreakerState", { enumerable: true, get: function () { return ICircuitBreaker_1.CircuitBreakerState; } });
const error_helper_1 = require("../../utils/error-helper");
/**
 * Circuit Breaker for Identity Service Operations
 * Implements fail-fast pattern to prevent system overload
 */
class IdentityServiceCircuitBreaker {
    constructor(config, serviceName) {
        this.config = config;
        this.serviceName = serviceName;
        this.state = ICircuitBreaker_1.CircuitBreakerState.CLOSED;
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
        if (this.state === ICircuitBreaker_1.CircuitBreakerState.OPEN) {
            if (this.shouldAttemptReset()) {
                this.transitionTo(ICircuitBreaker_1.CircuitBreakerState.HALF_OPEN, 'Recovery timeout reached');
            }
            else {
                if (fallback) {
                    return await fallback();
                }
                throw new Error(`Circuit breaker is OPEN for ${this.serviceName}`);
            }
        }
        // Check half-open state limits
        if (this.state === ICircuitBreaker_1.CircuitBreakerState.HALF_OPEN) {
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
        this.failureCount = 0;
        if (this.state === ICircuitBreaker_1.CircuitBreakerState.HALF_OPEN) {
            this.transitionTo(ICircuitBreaker_1.CircuitBreakerState.CLOSED, 'Successful recovery');
            this.halfOpenCalls = 0;
        }
    }
    /**
     * Handle failed operation
     */
    onFailure(error) {
        this.metrics.failedCalls++;
        this.metrics.lastFailureTime = new Date();
        this.failureCount++;
        this.lastFailureTime = new Date();
        if (this.failureCount >= this.config.failureThreshold) {
            this.transitionTo(ICircuitBreaker_1.CircuitBreakerState.OPEN, `Failure threshold reached: ${(0, error_helper_1.getErrorMessage)(error)}`);
        }
    }
    /**
     * Check if circuit breaker should attempt reset
     */
    shouldAttemptReset() {
        if (!this.lastFailureTime)
            return false;
        const timeSinceLastFailure = Date.now() - this.lastFailureTime.getTime();
        return timeSinceLastFailure >= this.config.recoveryTimeout;
    }
    /**
     * Transition circuit breaker state
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
        console.log(`[CircuitBreaker:${this.serviceName}] ${oldState} -> ${newState}: ${reason}`);
    }
    /**
     * Get current circuit breaker state (ICircuitBreaker interface)
     */
    getState() {
        return this.state;
    }
    /**
     * Get current circuit breaker status (detailed)
     */
    getStatus() {
        return {
            state: this.state,
            failureCount: this.failureCount,
            lastFailureTime: this.lastFailureTime,
            metrics: this.metrics,
            config: this.config
        };
    }
    /**
     * Reset circuit breaker manually
     */
    reset() {
        this.state = ICircuitBreaker_1.CircuitBreakerState.CLOSED;
        this.failureCount = 0;
        this.halfOpenCalls = 0;
        this.lastFailureTime = undefined;
        this.transitionTo(ICircuitBreaker_1.CircuitBreakerState.CLOSED, 'Manual reset');
    }
}
exports.IdentityServiceCircuitBreaker = IdentityServiceCircuitBreaker;
/**
 * Circuit Breaker Factory for different service operations
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
            this.breakers.set(serviceName, new IdentityServiceCircuitBreaker(finalConfig, serviceName));
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
    static clearAll() {
        this.breakers.clear();
    }
}
exports.CircuitBreakerFactory = CircuitBreakerFactory;
CircuitBreakerFactory.breakers = new Map();
//# sourceMappingURL=CircuitBreaker.js.map