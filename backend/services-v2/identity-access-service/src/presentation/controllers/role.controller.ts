/**
 * Role Controller - Presentation Layer
 * Healthcare role management and assignment endpoints
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Healthcare RBAC, Vietnamese Localization, Admin Security
 */

import { Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { HealthcareRole, HealthcareRoleType } from '../../domain/value-objects/healthcare-role';
import { ManageRolesUseCase } from '../../application/use-cases/manage-roles.use-case';
import { AssignUserRoleUseCase } from '../../application/use-cases/assign-user-role.use-case';
import { GetUserRolesUseCase } from '../../application/use-cases/get-user-roles.use-case';
import { ILogger } from '../../../../shared/infrastructure/logging/logger.interface';

export interface RoleControllerDependencies {
  manageRolesUseCase: ManageRolesUseCase;
  assignUserRoleUseCase: AssignUserRoleUseCase;
  getUserRolesUseCase: GetUserRolesUseCase;
  logger: ILogger;
}

/**
 * Role Controller
 * Handles healthcare role management and user role assignments
 */
export class RoleController {
  private readonly manageRolesUseCase: ManageRolesUseCase;
  private readonly assignUserRoleUseCase: AssignUserRoleUseCase;
  private readonly getUserRolesUseCase: GetUserRolesUseCase;
  private readonly logger: ILogger;

  constructor(dependencies: RoleControllerDependencies) {
    this.manageRolesUseCase = dependencies.manageRolesUseCase;
    this.assignUserRoleUseCase = dependencies.assignUserRoleUseCase;
    this.getUserRolesUseCase = dependencies.getUserRolesUseCase;
    this.logger = dependencies.logger;
  }

  /**
   * Get all healthcare roles
   * GET /roles
   */
  async getAllRoles(req: Request, res: Response): Promise<void> {
    const correlationId = req.headers['x-correlation-id'] as string;

    try {
      const { includeInactive = false, language = 'vi' } = req.query;

      // Execute get roles use case
      const result = await this.manageRolesUseCase.getAllRoles({
        includeInactive: includeInactive === 'true',
        requestedBy: req.user!.id
      });

      if (!result.success) {
        res.status(403).json({
          success: false,
          message: result.error!.message,
          messageVietnamese: result.error!.messageVietnamese,
          code: result.error!.code,
          correlationId
        });
        return;
      }

      // Format roles for response
      const formattedRoles = result.roles!.map(role => ({
        id: role.type,
        name: role.getDisplayName(language as 'en' | 'vi'),
        description: role.getDisplayDescription(language as 'en' | 'vi'),
        permissions: role.permissions,
        hierarchy: role.hierarchy,
        isActive: role.isActive,
        metadata: {
          canManageUsers: role.hasPermission('user:*') || role.hasPermission('user:manage'),
          canAccessMedicalRecords: role.canAccessResource('medical_record'),
          canManageAppointments: role.canAccessResource('appointment'),
          canAccessBilling: role.canAccessResource('billing')
        }
      }));

      res.status(200).json({
        success: true,
        data: {
          roles: formattedRoles,
          totalCount: formattedRoles.length,
          predefinedRoles: HealthcareRole.getAllPredefinedRoles().map(role => role.type)
        },
        correlationId
      });

    } catch (error) {
      this.logger.error('Get all roles controller error', {
        error: error.message,
        stack: error.stack,
        correlationId
      });

      res.status(500).json({
        success: false,
        message: 'Lỗi hệ thống trong quá trình lấy danh sách vai trò',
        code: 'INTERNAL_ERROR',
        correlationId
      });
    }
  }

  /**
   * Get role by ID
   * GET /roles/:roleId
   */
  async getRoleById(req: Request, res: Response): Promise<void> {
    const correlationId = req.headers['x-correlation-id'] as string;

    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'ID vai trò không hợp lệ',
          code: 'VALIDATION_ERROR',
          errors: errors.array(),
          correlationId
        });
        return;
      }

      const { roleId } = req.params;
      const { language = 'vi' } = req.query;

      // Execute get role use case
      const result = await this.manageRolesUseCase.getRoleById({
        roleId: roleId as HealthcareRoleType,
        requestedBy: req.user!.id
      });

      if (!result.success) {
        res.status(404).json({
          success: false,
          message: result.error!.message,
          messageVietnamese: result.error!.messageVietnamese,
          code: result.error!.code,
          correlationId
        });
        return;
      }

      const role = result.role!;
      res.status(200).json({
        success: true,
        data: {
          id: role.type,
          name: role.getDisplayName(language as 'en' | 'vi'),
          description: role.getDisplayDescription(language as 'en' | 'vi'),
          permissions: role.permissions,
          hierarchy: role.hierarchy,
          isActive: role.isActive,
          metadata: {
            canManageUsers: role.hasPermission('user:*') || role.hasPermission('user:manage'),
            canAccessMedicalRecords: role.canAccessResource('medical_record'),
            canManageAppointments: role.canAccessResource('appointment'),
            canAccessBilling: role.canAccessResource('billing'),
            permissionsByResource: this.groupPermissionsByResource(role.permissions)
          }
        },
        correlationId
      });

    } catch (error) {
      this.logger.error('Get role by ID controller error', {
        error: error.message,
        stack: error.stack,
        roleId: req.params.roleId,
        correlationId
      });

      res.status(500).json({
        success: false,
        message: 'Lỗi hệ thống trong quá trình lấy thông tin vai trò',
        code: 'INTERNAL_ERROR',
        correlationId
      });
    }
  }

  /**
   * Assign role to user
   * POST /users/:userId/roles
   */
  async assignRoleToUser(req: Request, res: Response): Promise<void> {
    const correlationId = req.headers['x-correlation-id'] as string;

    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Dữ liệu phân quyền không hợp lệ',
          code: 'VALIDATION_ERROR',
          errors: errors.array(),
          correlationId
        });
        return;
      }

      const { userId } = req.params;
      const { roleId, expiresAt, reason } = req.body;

      // Execute assign role use case
      const result = await this.assignUserRoleUseCase.execute({
        userId,
        roleId: roleId as HealthcareRoleType,
        assignedBy: req.user!.id,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        reason,
        metadata: {
          assignmentSource: 'admin_panel',
          userAgent: req.headers['user-agent'],
          ipAddress: req.ip
        }
      });

      if (!result.success) {
        const statusCode = result.error!.code === 'UNAUTHORIZED' ? 403 : 400;
        res.status(statusCode).json({
          success: false,
          message: result.error!.message,
          messageVietnamese: result.error!.messageVietnamese,
          code: result.error!.code,
          correlationId
        });
        return;
      }

      res.status(201).json({
        success: true,
        message: 'Phân quyền thành công',
        data: {
          assignment: result.assignment,
          user: result.user,
          role: result.role
        },
        correlationId
      });

    } catch (error) {
      this.logger.error('Assign role to user controller error', {
        error: error.message,
        stack: error.stack,
        userId: req.params.userId,
        correlationId
      });

      res.status(500).json({
        success: false,
        message: 'Lỗi hệ thống trong quá trình phân quyền',
        code: 'INTERNAL_ERROR',
        correlationId
      });
    }
  }

  /**
   * Remove role from user
   * DELETE /users/:userId/roles/:roleId
   */
  async removeRoleFromUser(req: Request, res: Response): Promise<void> {
    const correlationId = req.headers['x-correlation-id'] as string;

    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Thông tin vai trò không hợp lệ',
          code: 'VALIDATION_ERROR',
          errors: errors.array(),
          correlationId
        });
        return;
      }

      const { userId, roleId } = req.params;
      const { reason } = req.body;

      // Execute remove role use case
      const result = await this.assignUserRoleUseCase.removeRole({
        userId,
        roleId: roleId as HealthcareRoleType,
        removedBy: req.user!.id,
        reason,
        metadata: {
          removalSource: 'admin_panel',
          userAgent: req.headers['user-agent'],
          ipAddress: req.ip
        }
      });

      if (!result.success) {
        const statusCode = result.error!.code === 'UNAUTHORIZED' ? 403 : 400;
        res.status(statusCode).json({
          success: false,
          message: result.error!.message,
          messageVietnamese: result.error!.messageVietnamese,
          code: result.error!.code,
          correlationId
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Đã thu hồi quyền thành công',
        data: {
          userId,
          roleId,
          removedAt: new Date().toISOString(),
          removedBy: req.user!.id
        },
        correlationId
      });

    } catch (error) {
      this.logger.error('Remove role from user controller error', {
        error: error.message,
        stack: error.stack,
        userId: req.params.userId,
        roleId: req.params.roleId,
        correlationId
      });

      res.status(500).json({
        success: false,
        message: 'Lỗi hệ thống trong quá trình thu hồi quyền',
        code: 'INTERNAL_ERROR',
        correlationId
      });
    }
  }

  /**
   * Get user roles
   * GET /users/:userId/roles
   */
  async getUserRoles(req: Request, res: Response): Promise<void> {
    const correlationId = req.headers['x-correlation-id'] as string;

    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'ID người dùng không hợp lệ',
          code: 'VALIDATION_ERROR',
          errors: errors.array(),
          correlationId
        });
        return;
      }

      const { userId } = req.params;
      const { includeExpired = false, language = 'vi' } = req.query;

      // Execute get user roles use case
      const result = await this.getUserRolesUseCase.execute({
        userId,
        includeExpired: includeExpired === 'true',
        requestedBy: req.user!.id
      });

      if (!result.success) {
        const statusCode = result.error!.code === 'UNAUTHORIZED' ? 403 : 404;
        res.status(statusCode).json({
          success: false,
          message: result.error!.message,
          messageVietnamese: result.error!.messageVietnamese,
          code: result.error!.code,
          correlationId
        });
        return;
      }

      // Format roles with assignment information
      const formattedRoles = result.roleAssignments!.map(assignment => ({
        role: {
          id: assignment.role.type,
          name: assignment.role.getDisplayName(language as 'en' | 'vi'),
          description: assignment.role.getDisplayDescription(language as 'en' | 'vi'),
          hierarchy: assignment.role.hierarchy
        },
        assignment: {
          id: assignment.id,
          assignedAt: assignment.assignedAt,
          assignedBy: assignment.assignedBy,
          expiresAt: assignment.expiresAt,
          isActive: assignment.isActive,
          reason: assignment.reason
        },
        permissions: assignment.role.permissions,
        isExpired: assignment.expiresAt ? new Date(assignment.expiresAt) < new Date() : false
      }));

      // Collect all unique permissions
      const allPermissions = new Set<string>();
      result.roleAssignments!.forEach(assignment => {
        assignment.role.permissions.forEach(permission => {
          allPermissions.add(permission);
        });
      });

      res.status(200).json({
        success: true,
        data: {
          userId,
          roles: formattedRoles,
          summary: {
            totalRoles: formattedRoles.length,
            activeRoles: formattedRoles.filter(r => r.assignment.isActive && !r.isExpired).length,
            expiredRoles: formattedRoles.filter(r => r.isExpired).length,
            allPermissions: Array.from(allPermissions),
            highestAuthority: Math.min(...formattedRoles.map(r => r.role.hierarchy))
          }
        },
        correlationId
      });

    } catch (error) {
      this.logger.error('Get user roles controller error', {
        error: error.message,
        stack: error.stack,
        userId: req.params.userId,
        correlationId
      });

      res.status(500).json({
        success: false,
        message: 'Lỗi hệ thống trong quá trình lấy thông tin vai trò người dùng',
        code: 'INTERNAL_ERROR',
        correlationId
      });
    }
  }

  /**
   * Get role statistics
   * GET /roles/statistics
   */
  async getRoleStatistics(req: Request, res: Response): Promise<void> {
    const correlationId = req.headers['x-correlation-id'] as string;

    try {
      // Execute get role statistics use case
      const result = await this.manageRolesUseCase.getRoleStatistics({
        requestedBy: req.user!.id
      });

      if (!result.success) {
        res.status(403).json({
          success: false,
          message: result.error!.message,
          messageVietnamese: result.error!.messageVietnamese,
          code: result.error!.code,
          correlationId
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: result.statistics,
        correlationId
      });

    } catch (error) {
      this.logger.error('Get role statistics controller error', {
        error: error.message,
        stack: error.stack,
        correlationId
      });

      res.status(500).json({
        success: false,
        message: 'Lỗi hệ thống trong quá trình lấy thống kê vai trò',
        code: 'INTERNAL_ERROR',
        correlationId
      });
    }
  }

  /**
   * Validation rules
   */
  static getRoleIdValidation() {
    return [
      param('roleId')
        .isIn(Object.values(HealthcareRoleType))
        .withMessage('ID vai trò không hợp lệ')
    ];
  }

  static getUserIdValidation() {
    return [
      param('userId')
        .isUUID()
        .withMessage('ID người dùng không hợp lệ')
    ];
  }

  static getAssignRoleValidation() {
    return [
      ...RoleController.getUserIdValidation(),
      body('roleId')
        .isIn(Object.values(HealthcareRoleType))
        .withMessage('ID vai trò không hợp lệ'),
      body('expiresAt')
        .optional()
        .isISO8601()
        .withMessage('Ngày hết hạn không hợp lệ')
        .custom((value) => {
          if (value && new Date(value) <= new Date()) {
            throw new Error('Ngày hết hạn phải là thời điểm trong tương lai');
          }
          return true;
        }),
      body('reason')
        .optional()
        .isLength({ min: 10, max: 500 })
        .withMessage('Lý do phải có từ 10-500 ký tự')
    ];
  }

  static getRemoveRoleValidation() {
    return [
      ...RoleController.getUserIdValidation(),
      ...RoleController.getRoleIdValidation(),
      body('reason')
        .isLength({ min: 10, max: 500 })
        .withMessage('Lý do thu hồi quyền phải có từ 10-500 ký tự')
    ];
  }

  /**
   * Helper methods
   */
  private groupPermissionsByResource(permissions: ReadonlyArray<string>): Record<string, string[]> {
    const grouped: Record<string, string[]> = {};

    permissions.forEach(permission => {
      const [resource, action, scope] = permission.split(':');
      if (!grouped[resource]) {
        grouped[resource] = [];
      }
      grouped[resource].push(scope ? `${action}:${scope}` : action);
    });

    return grouped;
  }
}
