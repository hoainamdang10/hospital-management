"use strict";
/**
 * Circuit Breaker Interface
 * Application layer interface for circuit breaker pattern
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture - Dependency Inversion
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CircuitBreakerState = void 0;
/**
 * Circuit Breaker States
 */
var CircuitBreakerState;
(function (CircuitBreakerState) {
    CircuitBreakerState["CLOSED"] = "CLOSED";
    CircuitBreakerState["OPEN"] = "OPEN";
    CircuitBreakerState["HALF_OPEN"] = "HALF_OPEN";
})(CircuitBreakerState || (exports.CircuitBreakerState = CircuitBreakerState = {}));
//# sourceMappingURL=ICircuitBreaker.js.map