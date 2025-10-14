"use strict";
/**
 * Circuit Breaker Service - Infrastructure Layer
 * Implements circuit breaker pattern for external service calls
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Resilience Patterns
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.circuitBreakerService = exports.CircuitBreakerService = void 0;
const opossum_1 = __importDefault(require("opossum"));
/**
 * Default Circuit Breaker Options
 */
const DEFAULT_OPTIONS = {
    timeout: 5000,
    errorThresholdPercentage: 50,
    resetTimeout: 30000,
    rollingCountTimeout: 10000,
    rollingCountBuckets: 10,
    name: 'default-circuit-breaker'
};
/**
 * Circuit Breaker Service
 * Wraps HTTP calls with circuit breaker pattern
 */
class CircuitBreakerService {
    constructor() {
        this.breakers = new Map();
    }
    /**
     * Create or get circuit breaker for a service
     */
    getBreaker(serviceName, options = {}) {
        if (this.breakers.has(serviceName)) {
            return this.breakers.get(serviceName);
        }
        const breakerOptions = {
            ...DEFAULT_OPTIONS,
            ...options,
            name: serviceName
        };
        const breaker = new opossum_1.default(async (fn) => fn(), breakerOptions);
        this.setupEventListeners(breaker, serviceName);
        this.breakers.set(serviceName, breaker);
        return breaker;
    }
    /**
     * Execute HTTP call with circuit breaker
     */
    async execute(serviceName, fn, options) {
        const breaker = this.getBreaker(serviceName, options);
        return breaker.fire(fn);
    }
    /**
     * Execute HTTP GET with circuit breaker
     */
    async executeGet(serviceName, client, url, options) {
        return this.execute(serviceName, () => client.get(url), options);
    }
    /**
     * Execute HTTP POST with circuit breaker
     */
    async executePost(serviceName, client, url, data, options) {
        return this.execute(serviceName, () => client.post(url, data), options);
    }
    /**
     * Execute HTTP PUT with circuit breaker
     */
    async executePut(serviceName, client, url, data, options) {
        return this.execute(serviceName, () => client.put(url, data), options);
    }
    /**
     * Execute HTTP DELETE with circuit breaker
     */
    async executeDelete(serviceName, client, url, options) {
        return this.execute(serviceName, () => client.delete(url), options);
    }
    /**
     * Get circuit breaker status
     */
    getStatus(serviceName) {
        const breaker = this.breakers.get(serviceName);
        if (!breaker) {
            return null;
        }
        return {
            isOpen: breaker.opened,
            isHalfOpen: breaker.halfOpen,
            isClosed: breaker.closed,
            stats: breaker.stats
        };
    }
    /**
     * Reset circuit breaker
     */
    reset(serviceName) {
        const breaker = this.breakers.get(serviceName);
        if (breaker) {
            breaker.close();
        }
    }
    /**
     * Reset all circuit breakers
     */
    resetAll() {
        this.breakers.forEach(breaker => breaker.close());
    }
    /**
     * Setup event listeners for monitoring
     */
    setupEventListeners(breaker, serviceName) {
        breaker.on('open', () => {
            console.warn(`[CircuitBreaker] ${serviceName} - Circuit OPENED`);
        });
        breaker.on('halfOpen', () => {
            console.log(`[CircuitBreaker] ${serviceName} - Circuit HALF-OPEN`);
        });
        breaker.on('close', () => {
            console.log(`[CircuitBreaker] ${serviceName} - Circuit CLOSED`);
        });
        breaker.on('success', (result) => {
            console.debug(`[CircuitBreaker] ${serviceName} - Success`);
        });
        breaker.on('failure', (error) => {
            console.error(`[CircuitBreaker] ${serviceName} - Failure:`, error.message);
        });
        breaker.on('timeout', () => {
            console.error(`[CircuitBreaker] ${serviceName} - Timeout`);
        });
        breaker.on('reject', () => {
            console.error(`[CircuitBreaker] ${serviceName} - Rejected (circuit open)`);
        });
        breaker.on('fallback', (result) => {
            console.log(`[CircuitBreaker] ${serviceName} - Fallback executed`);
        });
    }
    /**
     * Get all circuit breaker statuses
     */
    getAllStatuses() {
        const statuses = new Map();
        this.breakers.forEach((breaker, serviceName) => {
            statuses.set(serviceName, {
                isOpen: breaker.opened,
                isHalfOpen: breaker.halfOpen,
                isClosed: breaker.closed,
                stats: breaker.stats
            });
        });
        return statuses;
    }
    /**
     * Shutdown all circuit breakers
     */
    shutdown() {
        this.breakers.forEach(breaker => breaker.shutdown());
        this.breakers.clear();
    }
}
exports.CircuitBreakerService = CircuitBreakerService;
exports.circuitBreakerService = new CircuitBreakerService();
//# sourceMappingURL=CircuitBreakerService.js.map