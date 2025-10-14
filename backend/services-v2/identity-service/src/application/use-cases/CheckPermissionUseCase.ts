/**
 * CheckPermissionUseCase
 *
 * Use case để check permission của user
 * Được gọi bởi API Gateway để verify permissions
 *
 * @author Hospital Management Team
 * @version 1.0.0
 */

import { IPermissionService } from '../../domain/services/IPermissionService';
import { UserId } from '../../domain/value-objects/UserId';
import { ILogger } from '../services/ILogger';

export interface CheckPermissionRequest {
  userId: string;
  permission: string;
}

export interface CheckPermissionResponse {
  success: boolean;
  allowed: boolean;
  reason?: string;
}

export class CheckPermissionUseCase {
  constructor(
    private permissionService: IPermissionService,
    private logger: ILogger
  ) {}

  async execute(request: CheckPermissionRequest): Promise<CheckPermissionResponse> {
    try {
      this.logger.debug('Checking permission', {
        userId: request.userId,
        permission: request.permission
      });

      const userId = UserId.fromString(request.userId);
      const allowed = await this.permissionService.checkPermission(userId, request.permission);

      this.logger.debug('Permission check result', {
        userId: request.userId,
        permission: request.permission,
        allowed
      });

      return {
        success: true,
        allowed,
        reason: allowed ? undefined : `Missing permission: ${request.permission}`
      };

    } catch (error) {
      this.logger.error('Permission check error', {
        userId: request.userId,
        permission: request.permission,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        allowed: false,
        reason: 'Permission check failed'
      };
    }
  }
}

