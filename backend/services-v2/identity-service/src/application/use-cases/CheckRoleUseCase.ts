/**
 * CheckRoleUseCase
 * 
 * Use case để check role của user
 * Được gọi bởi API Gateway để verify roles
 * 
 * @author Hospital Management Team
 * @version 1.0.0
 */

import { IPermissionService } from '../../domain/services/IPermissionService';
import { UserId } from '../../domain/value-objects/UserId';
import { ILogger } from '../services/ILogger';

export interface CheckRoleRequest {
  userId: string;
  role: string;
}

export interface CheckRoleResponse {
  success: boolean;
  allowed: boolean;
  reason?: string;
}

export class CheckRoleUseCase {
  constructor(
    private permissionService: IPermissionService,
    private logger: ILogger
  ) {}

  async execute(request: CheckRoleRequest): Promise<CheckRoleResponse> {
    try {
      this.logger.debug('Checking role', {
        userId: request.userId,
        role: request.role
      });

      const userId = UserId.fromString(request.userId);
      const allowed = await this.permissionService.hasRole(userId, request.role);

      this.logger.debug('Role check result', {
        userId: request.userId,
        role: request.role,
        allowed
      });

      return {
        success: true,
        allowed,
        reason: allowed ? undefined : `Missing role: ${request.role}`
      };

    } catch (error) {
      this.logger.error('Role check error', {
        userId: request.userId,
        role: request.role,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        allowed: false,
        reason: 'Role check failed'
      };
    }
  }
}

