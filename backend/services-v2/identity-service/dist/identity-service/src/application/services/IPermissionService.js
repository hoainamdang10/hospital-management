"use strict";
/**
 * Permission Service Interface - Application Layer
 * Defines contract for RBAC permission checking
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, RBAC, HIPAA
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Action = exports.ResourceType = void 0;
exports.buildPermission = buildPermission;
exports.parsePermission = parsePermission;
exports.matchesPermission = matchesPermission;
/**
 * Resource types in the system
 */
var ResourceType;
(function (ResourceType) {
    ResourceType["PATIENTS"] = "patients";
    ResourceType["APPOINTMENTS"] = "appointments";
    ResourceType["MEDICAL_RECORDS"] = "medical_records";
    ResourceType["PRESCRIPTIONS"] = "prescriptions";
    ResourceType["USERS"] = "users";
    ResourceType["ROLES"] = "roles";
    ResourceType["SYSTEM"] = "system";
})(ResourceType || (exports.ResourceType = ResourceType = {}));
/**
 * Action types
 */
var Action;
(function (Action) {
    Action["CREATE"] = "create";
    Action["READ"] = "read";
    Action["UPDATE"] = "update";
    Action["DELETE"] = "delete";
    Action["WRITE"] = "write";
    Action["MANAGE"] = "manage";
    Action["ADMIN"] = "admin"; // System administration
})(Action || (exports.Action = Action = {}));
/**
 * Helper to build permission string
 */
function buildPermission(resource, action) {
    return `${resource}:${action}`;
}
/**
 * Helper to parse permission string
 */
function parsePermission(permission) {
    const parts = permission.split(':');
    if (parts.length !== 2) {
        return null;
    }
    return {
        resource: parts[0],
        action: parts[1]
    };
}
/**
 * Check if permission matches pattern
 * Supports wildcards: "*", "resource:*", "*:action"
 */
function matchesPermission(userPermission, requiredPermission) {
    // Admin wildcard
    if (userPermission === '*') {
        return true;
    }
    // Exact match
    if (userPermission === requiredPermission) {
        return true;
    }
    const userParts = userPermission.split(':');
    const requiredParts = requiredPermission.split(':');
    if (userParts.length !== 2 || requiredParts.length !== 2) {
        return false;
    }
    const [userResource, userAction] = userParts;
    const [requiredResource, requiredAction] = requiredParts;
    // Resource wildcard: "patients:*" matches "patients:read"
    if (userResource === requiredResource && userAction === '*') {
        return true;
    }
    // Action wildcard: "*:read" matches "patients:read"
    if (userResource === '*' && userAction === requiredAction) {
        return true;
    }
    // Special case: "write" includes "create" and "update"
    if (userAction === 'write' && (requiredAction === 'create' || requiredAction === 'update')) {
        return userResource === requiredResource;
    }
    // Special case: "manage" includes all actions on resource
    if (userAction === 'manage' && userResource === requiredResource) {
        return true;
    }
    return false;
}
//# sourceMappingURL=IPermissionService.js.map