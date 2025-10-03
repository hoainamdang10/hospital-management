"use strict";
/**
 * Authentication Service Interface
 * Application layer defines the contract for authentication operations
 * Infrastructure layer provides concrete implementation
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Dependency Inversion Principle
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceMode = void 0;
/**
 * Service mode for graceful degradation
 */
var ServiceMode;
(function (ServiceMode) {
    ServiceMode["FULL"] = "FULL";
    ServiceMode["DEGRADED"] = "DEGRADED";
    ServiceMode["EMERGENCY"] = "EMERGENCY"; // Emergency mode for critical operations
})(ServiceMode || (exports.ServiceMode = ServiceMode = {}));
//# sourceMappingURL=IAuthenticationService.js.map