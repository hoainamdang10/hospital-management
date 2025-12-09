"use strict";
/**
 * Authorization Service Interface
 * Handles RBAC (Role-Based Access Control) for appointments service
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthorizationError = exports.UserRole = void 0;
/**
 * User roles in the system
 */
var UserRole;
(function (UserRole) {
    UserRole["SUPER_ADMIN"] = "SUPER_ADMIN";
    UserRole["ADMIN"] = "ADMIN";
    UserRole["DOCTOR"] = "DOCTOR";
    UserRole["NURSE"] = "NURSE";
    UserRole["RECEPTIONIST"] = "RECEPTIONIST";
    UserRole["PATIENT"] = "PATIENT";
})(UserRole || (exports.UserRole = UserRole = {}));
/**
 * Authorization error
 */
class AuthorizationError extends Error {
    constructor(message, userId, action, resource) {
        super(message);
        this.userId = userId;
        this.action = action;
        this.resource = resource;
        this.name = "AuthorizationError";
    }
}
exports.AuthorizationError = AuthorizationError;
//# sourceMappingURL=IAuthorizationService.js.map