import { UserId } from '@domain/value-objects/UserId';
import { IPermissionChecker, PermissionCheckResult } from '@domain/services/IPermissionChecker';
import { ILogger } from '../services/ILogger';

export interface AuthorizeRequestInput {
  userId: string;
  requiredPermissions?: string[];
  requiredRoles?: string[];
  requireAll?: boolean;
  requestId: string;
  path: string;
}

export interface AuthorizeRequestOutput {
  allowed: boolean;
  reason?: string;
}

export class AuthorizeRequestUseCase {
  constructor(
    private permissionChecker: IPermissionChecker,
    private logger: ILogger
  ) {}

  async execute(input: AuthorizeRequestInput): Promise<AuthorizeRequestOutput> {
    try {
      const userId = UserId.create(input.userId);

      if (!input.requiredPermissions && !input.requiredRoles) {
        this.logger.debug('No authorization requirements - allowing request', {
          requestId: input.requestId,
          userId: input.userId,
          path: input.path
        });

        return { allowed: true };
      }

      if (input.requiredPermissions && input.requiredPermissions.length > 0) {
        const permissionResult: PermissionCheckResult = input.requireAll
          ? await this.permissionChecker.checkAllPermissions(userId, input.requiredPermissions)
          : await this.permissionChecker.checkAnyPermission(userId, input.requiredPermissions);

        if (!permissionResult.allowed) {
          this.logger.warn('Permission check failed', {
            requestId: input.requestId,
            userId: input.userId,
            path: input.path,
            requiredPermissions: input.requiredPermissions,
            requireAll: input.requireAll,
            reason: permissionResult.reason
          });

          return {
            allowed: false,
            reason: permissionResult.reason || 'Insufficient permissions'
          };
        }
      }

      if (input.requiredRoles && input.requiredRoles.length > 0) {
        const roleResult: PermissionCheckResult = input.requireAll
          ? await this.permissionChecker.checkAllRoles(userId, input.requiredRoles)
          : await this.permissionChecker.checkAnyRole(userId, input.requiredRoles);

        if (!roleResult.allowed) {
          this.logger.warn('Role check failed', {
            requestId: input.requestId,
            userId: input.userId,
            path: input.path,
            requiredRoles: input.requiredRoles,
            requireAll: input.requireAll,
            reason: roleResult.reason
          });

          return {
            allowed: false,
            reason: roleResult.reason || 'Insufficient roles'
          };
        }
      }

      this.logger.info('Request authorized successfully', {
        requestId: input.requestId,
        userId: input.userId,
        path: input.path,
        requiredPermissions: input.requiredPermissions,
        requiredRoles: input.requiredRoles
      });

      return { allowed: true };

    } catch (error) {
      this.logger.error('Authorization error', {
        requestId: input.requestId,
        userId: input.userId,
        path: input.path,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });

      return {
        allowed: false,
        reason: 'Internal authorization error'
      };
    }
  }
}

