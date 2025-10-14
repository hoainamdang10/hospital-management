/**
 * CheckPermissionsUseCase
 * 
 * Use case để check multiple permissions của user
 * Hỗ trợ requireAll (AND) hoặc requireAny (OR)
 * 
 * @author Hospital Management Team
 * @version 1.0.0
 */

import { IPermissionService } from '../../domain/services/IPermissionService';
import { UserId } from '../../domain/value-objects/UserId';
import { ILogger } from '../services/ILogger';

export interface CheckPermissionsRequest {
  userId: string;
  permissions: string[];
  requireAll: boolean;
}

export interface CheckPermissionsResponse {
  success: boolean;
  allowed: boolean;
  reason?: string;
}

export class CheckPermissionsUseCase {
  constructor(
    private permissionService: IPermissionService,
    private logger: ILogger
  ) {}

  async execute(request: CheckPermissionsRequest): Promise<CheckPermissionsResponse> {
    try {
      this.logger.debug('Checking permissions', {
        userId: request.userId,
        permissions: request.permissions,
        requireAll: request.requireAll
      });

      const userId = UserId.fromString(request.userId);
      
      let allowed: boolean;
      
      if (request.requireAll) {
        allowed = await this.permissionService.hasAllPermissions(userId, request.permissions);
      } else {
        allowed = await this.permissionService.hasAnyPermission(userId, request.permissions);
      }

      this.logger.debug('Permissions check result', {
        userId: request.userId,
        permissions: request.permissions,
        requireAll: request.requireAll,
        allowed
      });

      return {
        success: true,
        allowed,
        reason: allowed 
          ? undefined 
          : request.requireAll
            ? `Missing all required permissions: ${request.permissions.join(', ')}`
            : `Missing any of required permissions: ${request.permissions.join(', ')}`
      };

    } catch (error) {
      this.logger.error('Permissions check error', {
        userId: request.userId,
        permissions: request.permissions,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        allowed: false,
        reason: 'Permissions check failed'
      };
    }
  }
}

