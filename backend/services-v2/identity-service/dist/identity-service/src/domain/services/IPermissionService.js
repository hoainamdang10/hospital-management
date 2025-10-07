"use strict";
/**
 * IPermissionService Interface
 *
 * Domain service interface for permission checking and management.
 * Follows Clean Architecture - interface in domain layer, implementation in infrastructure.
 *
 * Pure RBAC Design:
 * - High-level permission checking with caching
 * - Permission expansion with hierarchy
 * - Cache management
 * - Business logic for permission decisions
 *
 * Difference from IPermissionRepository:
 * - Repository: Low-level data access (CRUD operations)
 * - Service: High-level business logic (permission decisions, caching strategy)
 *
 * @author Hospital Management Team
 * @version 3.0.0 - Pure RBAC
 */
Object.defineProperty(exports, "__esModule", { value: true });
//# sourceMappingURL=IPermissionService.js.map