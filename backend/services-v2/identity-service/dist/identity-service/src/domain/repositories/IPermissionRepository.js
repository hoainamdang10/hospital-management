"use strict";
/**
 * IPermissionRepository Interface
 *
 * Repository interface for RBAC permission management.
 * Follows Clean Architecture - interface in domain layer, implementation in infrastructure.
 *
 * Pure RBAC Design:
 * - Query user roles from user_roles table
 * - Query role permissions from role_permissions table
 * - Query user-specific overrides from user_permissions table
 * - Expand permissions with hierarchy from permission_inheritance table
 * - Cache results in Redis for performance
 *
 * @author Hospital Management Team
 * @version 3.0.0 - Pure RBAC
 */
Object.defineProperty(exports, "__esModule", { value: true });
//# sourceMappingURL=IPermissionRepository.js.map