"use strict";
/**
 * IDegradationService - Application Service Interface
 * V2 Clean Architecture + DDD Implementation
 * Defines contract for graceful degradation operations
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, HIPAA
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceMode = void 0;
var ServiceMode;
(function (ServiceMode) {
    ServiceMode["FULL_SERVICE"] = "FULL_SERVICE";
    ServiceMode["DEGRADED_SERVICE"] = "DEGRADED_SERVICE";
    ServiceMode["READ_ONLY"] = "READ_ONLY";
    ServiceMode["EMERGENCY_MODE"] = "EMERGENCY_MODE";
})(ServiceMode || (exports.ServiceMode = ServiceMode = {}));
//# sourceMappingURL=IDegradationService.js.map