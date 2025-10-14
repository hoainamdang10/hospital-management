/**
 * CheckRolesUseCase
 * 
 * Use case để check multiple roles của user
 * Hỗ trợ requireAll (AND) hoặc requireAny (OR)
 * 
 * @author Hospital Management Team
 * @version 1.0.0
 */

import { IPermissionService } from '../../domain/services/IPermissionService';
import { UserId } from '../../domain/value-objects/UserId';
import { ILogger } from '../services/ILogger';

export interface CheckRolesRequest {
  userId: string;
  roles: string[];
  requireAll: boolean;
}

export interface CheckRolesResponse {
  success: boolean;
  allowed: boolean;
  reason?: string;
}

export class CheckRolesUseCase {
  constructor(
    private permissionService: IPermissionService,
    private logger: ILogger
  ) {}

  async execute(request: CheckRolesRequest): Promise<CheckRolesResponse> {
    try {
      this.logger.debug('Checking roles', {
        userId: request.userId,
        roles: request.roles,
        requireAll: request.requireAll
      });

      const userId = UserId.fromString(request.userId);
      
      let allowed: boolean;
      
      if (request.requireAll) {
        allowed = await this.permissionService.hasAllRoles(userId, request.roles);
      } else {
        allowed = await this.permissionService.hasAnyRole(userId, request.roles);
      }

      this.logger.debug('Roles check result', {
        userId: request.userId,
        roles: request.roles,
        requireAll: request.requireAll,
        allowed
      });

      return {
        success: true,
        allowed,
        reason: allowed 
          ? undefined 
          : request.requireAll
            ? `Missing all required roles: ${request.roles.join(', ')}`
            : `Missing any of required roles: ${request.roles.join(', ')}`
      };

    } catch (error) {
      this.logger.error('Roles check error', {
        userId: request.userId,
        roles: request.roles,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        allowed: false,
        reason: 'Roles check failed'
      };
    }
  }
}

