/**
 * Supabase Authentication Middleware - Shared Infrastructure
 * JWT token validation middleware for all microservices
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Supabase Auth, Healthcare Security, Service Integration
 */

import { Request, Response, NextFunction } from 'express';
import { SupabaseClient, User as SupabaseUser } from '@supabase/supabase-js';
import { HealthcareRole, HealthcareRoleType } from '../../../identity-access-service/src/domain/value-objects/healthcare-role';
import { ILogger } from '../logging/logger.interface';
import { IAuditService } from '../../application/services/audit.service.interface';

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      permissions?: string[];
      correlationId?: string;
    }
  }
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string;
  roles: HealthcareRole[];
  permissions: string[];
  profile: {
    phone?: string;
    department?: string;
    licenseNumber?: string;
  };
  lastLogin: Date;
  isActive: boolean;
}

export interface SupabaseAuthMiddlewareConfig {
  supabaseClient: SupabaseClient;
  logger: ILogger;
  auditService?: IAuditService;
  skipPaths?: string[];
  requireEmailVerification?: boolean;
  enableAuditLogging?: boolean;
}

/**
 * Supabase Authentication Middleware
 * Validates JWT tokens and loads user context for all services
 */
export class SupabaseAuthMiddleware {
  private readonly supabaseClient: SupabaseClient;
  private readonly logger: ILogger;
  private readonly auditService?: IAuditService;
  private readonly skipPaths: string[];
  private readonly requireEmailVerification: boolean;
  private readonly enableAuditLogging: boolean;

  constructor(config: SupabaseAuthMiddlewareConfig) {
    this.supabaseClient = config.supabaseClient;
    this.logger = config.logger;
    this.auditService = config.auditService;
    this.skipPaths = config.skipPaths || ['/health', '/metrics', '/auth/login', '/auth/register'];
    this.requireEmailVerification = config.requireEmailVerification ?? true;
    this.enableAuditLogging = config.enableAuditLogging ?? true;
  }

  /**
   * Authentication middleware function
   */
  authenticate() {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const correlationId = req.headers['x-correlation-id'] as string || 
        `auth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      req.correlationId = correlationId;

      try {
        // Skip authentication for certain paths
        if (this.shouldSkipAuthentication(req.path)) {
          return next();
        }

        // Extract JWT token from Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return this.handleAuthenticationError(
            res,
            'MISSING_TOKEN',
            'Token xác thực không được cung cấp',
            'Authentication token is required',
            401,
            correlationId
          );
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        // Validate token with Supabase
        const { data: { user }, error } = await this.supabaseClient.auth.getUser(token);

        if (error || !user) {
          await this.logSecurityEvent('INVALID_TOKEN_ATTEMPT', null, req, correlationId);
          
          return this.handleAuthenticationError(
            res,
            'INVALID_TOKEN',
            'Token xác thực không hợp lệ hoặc đã hết hạn',
            'Invalid or expired authentication token',
            401,
            correlationId
          );
        }

        // Check email verification if required
        if (this.requireEmailVerification && !user.email_confirmed_at) {
          return this.handleAuthenticationError(
            res,
            'EMAIL_NOT_VERIFIED',
            'Vui lòng xác thực email trước khi sử dụng hệ thống',
            'Email verification required',
            403,
            correlationId
          );
        }

        // Load user profile and roles
        const authenticatedUser = await this.loadUserContext(user);
        if (!authenticatedUser) {
          return this.handleAuthenticationError(
            res,
            'USER_PROFILE_NOT_FOUND',
            'Không tìm thấy thông tin người dùng',
            'User profile not found',
            404,
            correlationId
          );
        }

        // Check if user is active
        if (!authenticatedUser.isActive) {
          await this.logSecurityEvent('INACTIVE_USER_ACCESS_ATTEMPT', user.id, req, correlationId);
          
          return this.handleAuthenticationError(
            res,
            'USER_INACTIVE',
            'Tài khoản đã bị vô hiệu hóa',
            'User account is inactive',
            403,
            correlationId
          );
        }

        // Attach user context to request
        req.user = authenticatedUser;
        req.permissions = authenticatedUser.permissions;

        // Log successful authentication
        await this.logSecurityEvent('AUTHENTICATION_SUCCESS', user.id, req, correlationId);

        // Add security headers
        res.setHeader('X-User-ID', authenticatedUser.id);
        res.setHeader('X-User-Roles', authenticatedUser.roles.map(r => r.type).join(','));

        next();

      } catch (error) {
        this.logger.error('Authentication middleware error', {
          error: error.message,
          stack: error.stack,
          correlationId,
          path: req.path,
          method: req.method
        });

        return this.handleAuthenticationError(
          res,
          'AUTHENTICATION_ERROR',
          'Lỗi hệ thống trong quá trình xác thực',
          'Internal authentication error',
          500,
          correlationId
        );
      }
    };
  }

  /**
   * Role-based authorization middleware
   */
  requireRole(allowedRoles: HealthcareRoleType | HealthcareRoleType[]) {
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    return (req: Request, res: Response, next: NextFunction): void => {
      const correlationId = req.correlationId || 'unknown';

      if (!req.user) {
        return this.handleAuthenticationError(
          res,
          'UNAUTHENTICATED',
          'Người dùng chưa được xác thực',
          'User not authenticated',
          401,
          correlationId
        );
      }

      // Check if user has any of the required roles
      const userRoleTypes = req.user.roles.map(role => role.type);
      const hasRequiredRole = roles.some(role => userRoleTypes.includes(role));

      if (!hasRequiredRole) {
        this.logSecurityEvent('UNAUTHORIZED_ACCESS_ATTEMPT', req.user.id, req, correlationId);
        
        return this.handleAuthenticationError(
          res,
          'INSUFFICIENT_PERMISSIONS',
          'Không có quyền truy cập chức năng này',
          'Insufficient permissions',
          403,
          correlationId
        );
      }

      next();
    };
  }

  /**
   * Permission-based authorization middleware
   */
  requirePermission(requiredPermission: string) {
    return (req: Request, res: Response, next: NextFunction): void => {
      const correlationId = req.correlationId || 'unknown';

      if (!req.user) {
        return this.handleAuthenticationError(
          res,
          'UNAUTHENTICATED',
          'Người dùng chưa được xác thực',
          'User not authenticated',
          401,
          correlationId
        );
      }

      // Check if user has the required permission
      const hasPermission = req.user.roles.some(role => role.hasPermission(requiredPermission));

      if (!hasPermission) {
        this.logSecurityEvent('UNAUTHORIZED_PERMISSION_ATTEMPT', req.user.id, req, correlationId, {
          requiredPermission,
          userPermissions: req.user.permissions
        });
        
        return this.handleAuthenticationError(
          res,
          'INSUFFICIENT_PERMISSIONS',
          `Không có quyền: ${requiredPermission}`,
          `Missing permission: ${requiredPermission}`,
          403,
          correlationId
        );
      }

      next();
    };
  }

  /**
   * Resource ownership authorization middleware
   */
  requireOwnership(resourceIdParam: string = 'id', allowedRoles: HealthcareRoleType[] = ['admin']) {
    return (req: Request, res: Response, next: NextFunction): void => {
      const correlationId = req.correlationId || 'unknown';

      if (!req.user) {
        return this.handleAuthenticationError(
          res,
          'UNAUTHENTICATED',
          'Người dùng chưa được xác thực',
          'User not authenticated',
          401,
          correlationId
        );
      }

      const resourceId = req.params[resourceIdParam];
      const userRoleTypes = req.user.roles.map(role => role.type);

      // Allow if user has privileged role
      if (allowedRoles.some(role => userRoleTypes.includes(role))) {
        return next();
      }

      // Allow if user owns the resource
      if (resourceId === req.user.id) {
        return next();
      }

      this.logSecurityEvent('UNAUTHORIZED_RESOURCE_ACCESS', req.user.id, req, correlationId, {
        resourceId,
        resourceType: resourceIdParam
      });

      return this.handleAuthenticationError(
        res,
        'RESOURCE_ACCESS_DENIED',
        'Không có quyền truy cập tài nguyên này',
        'Resource access denied',
        403,
        correlationId
      );
    };
  }

  /**
   * Load user context from Supabase user
   */
  private async loadUserContext(supabaseUser: SupabaseUser): Promise<AuthenticatedUser | null> {
    try {
      // Get user profile from database
      const { data: profile, error: profileError } = await this.supabaseClient
        .from('user_profiles')
        .select(`
          *,
          user_role_assignments!inner(
            is_active,
            expires_at,
            healthcare_roles(*)
          )
        `)
        .eq('user_id', supabaseUser.id)
        .eq('user_role_assignments.is_active', true)
        .single();

      if (profileError || !profile) {
        this.logger.warn('User profile not found', {
          userId: supabaseUser.id,
          email: supabaseUser.email,
          error: profileError?.message
        });
        return null;
      }

      // Convert database roles to domain objects
      const roles: HealthcareRole[] = [];
      const allPermissions = new Set<string>();

      for (const assignment of profile.user_role_assignments) {
        // Check if role assignment is not expired
        if (assignment.expires_at && new Date(assignment.expires_at) < new Date()) {
          continue;
        }

        const roleData = assignment.healthcare_roles;
        const role = HealthcareRole.fromObject({
          type: roleData.role_name as HealthcareRoleType,
          name: roleData.role_name,
          nameVietnamese: roleData.role_name_vietnamese,
          description: roleData.description || '',
          descriptionVietnamese: roleData.description || '',
          permissions: [], // Will be loaded from role_permissions table
          isActive: roleData.is_active,
          hierarchy: this.getRoleHierarchy(roleData.role_name as HealthcareRoleType)
        });

        roles.push(role);

        // Collect permissions
        role.permissions.forEach(permission => allPermissions.add(permission));
      }

      if (roles.length === 0) {
        this.logger.warn('User has no active roles', {
          userId: supabaseUser.id,
          email: supabaseUser.email
        });
        return null;
      }

      return {
        id: supabaseUser.id,
        email: supabaseUser.email!,
        fullName: profile.full_name,
        roles,
        permissions: Array.from(allPermissions),
        profile: {
          phone: profile.phone_number,
          department: profile.department,
          licenseNumber: profile.license_number
        },
        lastLogin: new Date(profile.last_login || profile.created_at),
        isActive: profile.is_active
      };

    } catch (error) {
      this.logger.error('Error loading user context', {
        userId: supabaseUser.id,
        error: error.message,
        stack: error.stack
      });
      return null;
    }
  }

  /**
   * Check if authentication should be skipped for this path
   */
  private shouldSkipAuthentication(path: string): boolean {
    return this.skipPaths.some(skipPath => {
      if (skipPath.endsWith('*')) {
        return path.startsWith(skipPath.slice(0, -1));
      }
      return path === skipPath;
    });
  }

  /**
   * Handle authentication errors
   */
  private handleAuthenticationError(
    res: Response,
    code: string,
    messageVietnamese: string,
    message: string,
    statusCode: number,
    correlationId: string
  ): void {
    res.status(statusCode).json({
      success: false,
      message,
      messageVietnamese,
      code,
      timestamp: new Date().toISOString(),
      correlationId
    });
  }

  /**
   * Log security events
   */
  private async logSecurityEvent(
    eventType: string,
    userId: string | null,
    req: Request,
    correlationId: string,
    additionalData?: any
  ): Promise<void> {
    if (!this.enableAuditLogging || !this.auditService) {
      return;
    }

    try {
      await this.auditService.logSecurityEvent({
        eventType,
        userId,
        email: req.user?.email,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        path: req.path,
        method: req.method,
        details: additionalData,
        correlationId
      });
    } catch (error) {
      this.logger.error('Failed to log security event', {
        eventType,
        userId,
        error: error.message,
        correlationId
      });
    }
  }

  /**
   * Get role hierarchy for ordering
   */
  private getRoleHierarchy(roleType: HealthcareRoleType): number {
    const hierarchyMap: Record<HealthcareRoleType, number> = {
      [HealthcareRoleType.ADMIN]: 1,
      [HealthcareRoleType.DOCTOR]: 2,
      [HealthcareRoleType.NURSE]: 3,
      [HealthcareRoleType.PHARMACIST]: 4,
      [HealthcareRoleType.RECEPTIONIST]: 5,
      [HealthcareRoleType.LAB_TECHNICIAN]: 6,
      [HealthcareRoleType.RADIOLOGIST]: 7,
      [HealthcareRoleType.PATIENT]: 8
    };

    return hierarchyMap[roleType] || 10;
  }

  /**
   * Create middleware factory for easy integration
   */
  static create(config: SupabaseAuthMiddlewareConfig): SupabaseAuthMiddleware {
    return new SupabaseAuthMiddleware(config);
  }

  /**
   * Get middleware functions for easy use
   */
  getMiddleware() {
    return {
      authenticate: this.authenticate(),
      requireRole: this.requireRole.bind(this),
      requirePermission: this.requirePermission.bind(this),
      requireOwnership: this.requireOwnership.bind(this)
    };
  }
}
