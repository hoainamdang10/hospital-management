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
export declare class Permission {
    private readonly _value;
    private readonly _resourceType;
    private readonly _action;
    private static readonly PERMISSION_PATTERN;
    private static readonly WILDCARD;
    private constructor();
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
    static fromString(permissionString: string): Permission;
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
    static create(resourceType: string, action: string): Permission;
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
    static wildcard(): Permission;
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
    static fromArray(permissionStrings: string[]): Permission[];
    /**
     * Get the permission value (full string)
     *
     * @example
     * ```typescript
     * const permission = Permission.create('patients', 'read');
     * console.log(permission.value); // "patients:read"
     * ```
     */
    get value(): string;
    /**
     * Get the resource type
     *
     * @example
     * ```typescript
     * const permission = Permission.create('patients', 'read');
     * console.log(permission.resourceType); // "patients"
     * ```
     */
    get resourceType(): string;
    /**
     * Get the action
     *
     * @example
     * ```typescript
     * const permission = Permission.create('patients', 'read');
     * console.log(permission.action); // "read"
     * ```
     */
    get action(): string;
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
    isWildcard(): boolean;
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
    matches(resourceType: string, action: string): boolean;
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
    matchesString(permissionString: string): boolean;
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
    equals(other: Permission): boolean;
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
    toString(): string;
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
    toJSON(): {
        value: string;
        resourceType: string;
        action: string;
    };
}
//# sourceMappingURL=Permission.d.ts.map