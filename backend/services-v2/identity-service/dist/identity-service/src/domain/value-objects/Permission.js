"use strict";
/**
 * Permission Value Object
 *
 * Represents a permission in the RBAC system.
 * Format: resource:action (e.g., "patients:read", "lab-results:write")
 *
 * Features:
 * - Immutable value object
 * - Format validation (supports numbers and hyphens)
 * - Wildcard support (*)
 * - Resource and action extraction
 * - Equality comparison
 *
 * @example
 * ```typescript
 * const permission = Permission.create('patients', 'read');
 * console.log(permission.value); // "patients:read"
 * console.log(permission.resourceType); // "patients"
 * console.log(permission.action); // "read"
 *
 * const wildcard = Permission.wildcard();
 * console.log(wildcard.isWildcard()); // true
 * ```
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Permission = void 0;
class Permission {
    constructor(_value, _resourceType, _action) {
        this._value = _value;
        this._resourceType = _resourceType;
        this._action = _action;
        Object.freeze(this);
    }
    /**
     * Create a Permission from a permission string
     *
     * @param permissionString - Permission in format "resource:action" or "*"
     * @returns Permission instance
     * @throws Error if format is invalid
     *
     * @example
     * ```typescript
     * Permission.fromString('patients:read');
     * Permission.fromString('lab-results:write');
     * Permission.fromString('medical-records-v2:delete');
     * Permission.fromString('*'); // Wildcard
     * ```
     */
    static fromString(permissionString) {
        if (!permissionString || permissionString.trim() === '') {
            throw new Error('Permission string cannot be empty');
        }
        const trimmed = permissionString.trim();
        // Handle wildcard
        if (trimmed === Permission.WILDCARD) {
            return new Permission(Permission.WILDCARD, Permission.WILDCARD, Permission.WILDCARD);
        }
        // Validate format
        if (!Permission.PERMISSION_PATTERN.test(trimmed)) {
            throw new Error(`Invalid permission format: "${trimmed}". ` +
                `Expected format: "resource:action" (e.g., "patients:read", "lab-results:write"). ` +
                `Allowed characters: lowercase letters, numbers, underscores, colons, hyphens.`);
        }
        // Extract resource and action
        const parts = trimmed.split(':');
        if (parts.length !== 2) {
            throw new Error(`Invalid permission format: "${trimmed}". ` +
                `Expected exactly one colon separator.`);
        }
        const [resourceType, action] = parts;
        if (!resourceType || !action) {
            throw new Error(`Invalid permission format: "${trimmed}". ` +
                `Both resource and action must be non-empty.`);
        }
        return new Permission(trimmed, resourceType, action);
    }
    /**
     * Create a Permission from resource and action
     *
     * @param resourceType - Resource type (e.g., "patients", "lab-results")
     * @param action - Action (e.g., "read", "write", "delete")
     * @returns Permission instance
     *
     * @example
     * ```typescript
     * Permission.create('patients', 'read');
     * Permission.create('lab-results', 'write');
     * Permission.create('medical-records-v2', 'delete');
     * ```
     */
    static create(resourceType, action) {
        if (!resourceType || resourceType.trim() === '') {
            throw new Error('Resource type cannot be empty');
        }
        if (!action || action.trim() === '') {
            throw new Error('Action cannot be empty');
        }
        const permissionString = `${resourceType.trim()}:${action.trim()}`;
        return Permission.fromString(permissionString);
    }
    /**
     * Create a wildcard permission (admin permission)
     *
     * @returns Wildcard permission instance
     *
     * @example
     * ```typescript
     * const adminPermission = Permission.wildcard();
     * console.log(adminPermission.isWildcard()); // true
     * ```
     */
    static wildcard() {
        return new Permission(Permission.WILDCARD, Permission.WILDCARD, Permission.WILDCARD);
    }
    /**
     * Create multiple permissions from an array of strings
     *
     * @param permissionStrings - Array of permission strings
     * @returns Array of Permission instances
     * @throws Error if any permission string is invalid
     *
     * @example
     * ```typescript
     * const permissions = Permission.fromArray([
     *   'patients:read',
     *   'patients:write',
     *   'lab-results:read'
     * ]);
     * ```
     */
    static fromArray(permissionStrings) {
        return permissionStrings.map(str => Permission.fromString(str));
    }
    /**
     * Get the permission value (full string)
     *
     * @example
     * ```typescript
     * const permission = Permission.create('patients', 'read');
     * console.log(permission.value); // "patients:read"
     * ```
     */
    get value() {
        return this._value;
    }
    /**
     * Get the resource type
     *
     * @example
     * ```typescript
     * const permission = Permission.create('patients', 'read');
     * console.log(permission.resourceType); // "patients"
     * ```
     */
    get resourceType() {
        return this._resourceType;
    }
    /**
     * Get the action
     *
     * @example
     * ```typescript
     * const permission = Permission.create('patients', 'read');
     * console.log(permission.action); // "read"
     * ```
     */
    get action() {
        return this._action;
    }
    /**
     * Check if this is a wildcard permission
     *
     * @returns true if wildcard, false otherwise
     *
     * @example
     * ```typescript
     * Permission.wildcard().isWildcard(); // true
     * Permission.create('patients', 'read').isWildcard(); // false
     * ```
     */
    isWildcard() {
        return this._value === Permission.WILDCARD;
    }
    /**
     * Check if this permission matches a resource and action
     *
     * @param resourceType - Resource type to match
     * @param action - Action to match
     * @returns true if matches, false otherwise
     *
     * @example
     * ```typescript
     * const permission = Permission.create('patients', 'read');
     * permission.matches('patients', 'read'); // true
     * permission.matches('patients', 'write'); // false
     *
     * const wildcard = Permission.wildcard();
     * wildcard.matches('patients', 'read'); // true (wildcard matches everything)
     * ```
     */
    matches(resourceType, action) {
        if (this.isWildcard()) {
            return true; // Wildcard matches everything
        }
        return this._resourceType === resourceType && this._action === action;
    }
    /**
     * Check if this permission matches a permission string
     *
     * @param permissionString - Permission string to match
     * @returns true if matches, false otherwise
     *
     * @example
     * ```typescript
     * const permission = Permission.create('patients', 'read');
     * permission.matchesString('patients:read'); // true
     * permission.matchesString('patients:write'); // false
     * ```
     */
    matchesString(permissionString) {
        if (this.isWildcard()) {
            return true; // Wildcard matches everything
        }
        return this._value === permissionString;
    }
    /**
     * Check equality with another Permission
     *
     * @param other - Other Permission to compare
     * @returns true if equal, false otherwise
     *
     * @example
     * ```typescript
     * const p1 = Permission.create('patients', 'read');
     * const p2 = Permission.create('patients', 'read');
     * const p3 = Permission.create('patients', 'write');
     *
     * p1.equals(p2); // true
     * p1.equals(p3); // false
     * ```
     */
    equals(other) {
        if (!(other instanceof Permission)) {
            return false;
        }
        return this._value === other._value;
    }
    /**
     * Convert to string representation
     *
     * @returns Permission string
     *
     * @example
     * ```typescript
     * const permission = Permission.create('patients', 'read');
     * console.log(permission.toString()); // "patients:read"
     * ```
     */
    toString() {
        return this._value;
    }
    /**
     * Convert to JSON representation
     *
     * @returns JSON object
     *
     * @example
     * ```typescript
     * const permission = Permission.create('patients', 'read');
     * console.log(permission.toJSON());
     * // { value: "patients:read", resourceType: "patients", action: "read" }
     * ```
     */
    toJSON() {
        return {
            value: this._value,
            resourceType: this._resourceType,
            action: this._action,
        };
    }
}
exports.Permission = Permission;
// Configurable regex pattern - supports lowercase, numbers, underscores, colons, hyphens
Permission.PERMISSION_PATTERN = /^[a-z0-9_:-]+:[a-z0-9_:-]+$/;
Permission.WILDCARD = '*';
//# sourceMappingURL=Permission.js.map