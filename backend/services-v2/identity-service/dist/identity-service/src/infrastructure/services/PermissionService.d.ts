/**
 * Permission Service Implementation
 * Implements RBAC permission checking with caching
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, RBAC, HIPAA
 */
import { IPermissionService, Permission, PermissionCheckResult, PermissionContext, ResourceType, Action } from '../../application/services/IPermissionService';
import { IUserRepository } from '../../application/repositories/IUserRepository';
import { RedisCacheService } from '../cache/RedisCacheService';
/**
 * Permission Service
 * Handles permission checking with caching and conditional logic
 */
export declare class PermissionService implements IPermissionService {
    private userRepository;
    private cacheService;
    private logger;
    private readonly CACHE_TTL;
    private readonly CACHE_PREFIX;
    constructor(userRepository: IUserRepository, cacheService: RedisCacheService | null, logger: any);
    /**
     * Check if user has specific permission
     */
    hasPermission(userId: string, permission: Permission, context?: PermissionContext): Promise<boolean>;
    /**
     * Check if user has any of the permissions
     */
    hasAnyPermission(userId: string, permissions: Permission[], context?: PermissionContext): Promise<boolean>;
    /**
     * Check if user has all permissions
     */
    hasAllPermissions(userId: string, permissions: Permission[], context?: PermissionContext): Promise<boolean>;
    /**
     * Get all permissions for user (with caching)
     */
    getUserPermissions(userId: string): Promise<Permission[]>;
    /**
     * Check permission with detailed result
     */
    checkPermission(userId: string, permission: Permission, context?: PermissionContext): Promise<PermissionCheckResult>;
    /**
     * Check if user can access resource
     */
    canAccessResource(userId: string, resourceType: ResourceType, action: Action, resourceId?: string): Promise<boolean>;
    /**
     * Invalidate permission cache for user
     */
    invalidateCache(userId: string): Promise<void>;
    /**
     * Check conditional permissions based on context
     * Examples:
     * - Patient can only read their own medical records
     * - Doctor can only access patients in their department
     */
    private checkConditionalPermission;
}
//# sourceMappingURL=PermissionService.d.ts.map