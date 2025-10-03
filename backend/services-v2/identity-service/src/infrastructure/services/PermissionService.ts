/**
 * Permission Service Implementation
 * Implements RBAC permission checking with caching
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, RBAC, HIPAA
 */

import { 
  IPermissionService, 
  Permission, 
  PermissionCheckResult, 
  PermissionContext,
  ResourceType,
  Action,
  matchesPermission
} from '../../application/services/IPermissionService';
import { IUserRepository } from '../../application/repositories/IUserRepository';
import { UserId } from '../../domain/value-objects/UserId';
import { RedisCacheService } from '../cache/RedisCacheService';
import { getErrorMessage } from '../../utils/error-helper';

/**
 * Permission Service
 * Handles permission checking with caching and conditional logic
 */
export class PermissionService implements IPermissionService {
  private readonly CACHE_TTL = 300; // 5 minutes
  private readonly CACHE_PREFIX = 'permissions:';

  constructor(
    private userRepository: IUserRepository,
    private cacheService: RedisCacheService | null,
    private logger: any
  ) {}

  /**
   * Check if user has specific permission
   */
  async hasPermission(
    userId: string,
    permission: Permission,
    context?: PermissionContext
  ): Promise<boolean> {
    try {
      const userPermissions = await this.getUserPermissions(userId);

      // Check if any user permission matches required permission
      const hasPermission = userPermissions.some(userPerm => 
        matchesPermission(userPerm, permission)
      );

      // Apply conditional logic if context provided
      if (hasPermission && context) {
        return await this.checkConditionalPermission(userId, permission, context);
      }

      return hasPermission;
    } catch (error) {
      this.logger.error('Permission check failed', {
        userId,
        permission,
        error: getErrorMessage(error)
      });
      return false;
    }
  }

  /**
   * Check if user has any of the permissions
   */
  async hasAnyPermission(
    userId: string,
    permissions: Permission[],
    context?: PermissionContext
  ): Promise<boolean> {
    for (const permission of permissions) {
      if (await this.hasPermission(userId, permission, context)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if user has all permissions
   */
  async hasAllPermissions(
    userId: string,
    permissions: Permission[],
    context?: PermissionContext
  ): Promise<boolean> {
    for (const permission of permissions) {
      if (!(await this.hasPermission(userId, permission, context))) {
        return false;
      }
    }
    return true;
  }

  /**
   * Get all permissions for user (with caching)
   */
  async getUserPermissions(userId: string): Promise<Permission[]> {
    try {
      // Try cache first
      const cacheKey = `${this.CACHE_PREFIX}${userId}`;
      if (this.cacheService) {
        const cached = await this.cacheService.get<Permission[]>(cacheKey);
        if (cached) {
          return cached;
        }
      }

      // Load from repository
      const userIdVO = UserId.fromString(userId);
      const permissions = await this.userRepository.getUserPermissions(userIdVO);

      // Cache for future use
      if (this.cacheService) {
        await this.cacheService.set(cacheKey, permissions, { ttl: this.CACHE_TTL });
      }

      return permissions;
    } catch (error) {
      this.logger.error('Failed to get user permissions', {
        userId,
        error: getErrorMessage(error)
      });
      return [];
    }
  }

  /**
   * Check permission with detailed result
   */
  async checkPermission(
    userId: string,
    permission: Permission,
    context?: PermissionContext
  ): Promise<PermissionCheckResult> {
    const userPermissions = await this.getUserPermissions(userId);
    const allowed = await this.hasPermission(userId, permission, context);

    let reason: string | undefined;
    if (!allowed) {
      if (userPermissions.length === 0) {
        reason = 'User has no permissions';
      } else if (context?.resourceOwnerId && context.resourceOwnerId !== userId) {
        reason = 'User does not own this resource';
      } else {
        reason = `Missing required permission: ${permission}`;
      }
    }

    return {
      allowed,
      reason,
      requiredPermissions: [permission],
      userPermissions
    };
  }

  /**
   * Check if user can access resource
   */
  async canAccessResource(
    userId: string,
    resourceType: ResourceType,
    action: Action,
    resourceId?: string
  ): Promise<boolean> {
    const permission = `${resourceType}:${action}`;
    const context: PermissionContext = {
      userId,
      resourceId
    };

    return await this.hasPermission(userId, permission, context);
  }

  /**
   * Invalidate permission cache for user
   */
  async invalidateCache(userId: string): Promise<void> {
    try {
      if (this.cacheService) {
        const cacheKey = `${this.CACHE_PREFIX}${userId}`;
        await this.cacheService.delete(cacheKey);
        this.logger.info('Permission cache invalidated', { userId });
      }
    } catch (error) {
      this.logger.error('Failed to invalidate permission cache', {
        userId,
        error: getErrorMessage(error)
      });
    }
  }

  /**
   * Check conditional permissions based on context
   * Examples:
   * - Patient can only read their own medical records
   * - Doctor can only access patients in their department
   */
  private async checkConditionalPermission(
    userId: string,
    permission: Permission,
    context: PermissionContext
  ): Promise<boolean> {
    // Check if user is accessing their own resource
    if (context.resourceOwnerId) {
      // Allow if user owns the resource
      if (context.resourceOwnerId === userId) {
        return true;
      }

      // Check if permission allows accessing others' resources
      const userPermissions = await this.getUserPermissions(userId);
      
      // Admin can access everything
      if (userPermissions.includes('*')) {
        return true;
      }

      // Check for specific "others" permission
      // e.g., "patients:read_others" allows reading other patients' data
      const othersPermission = permission.replace(':', '_others:');
      return userPermissions.some(p => matchesPermission(p, othersPermission));
    }

    // Additional conditional checks can be added here
    // e.g., department-based access, time-based access, etc.

    return true;
  }
}

