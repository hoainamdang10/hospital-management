/**
 * Assign Role Use Case (Admin Only)
 * Allows administrators to assign/change user roles
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS Command Pattern
 */

import { IUseCase } from '@shared/application/use-cases/base/use-case.interface';
import { IUserRepository } from '../repositories/IUserRepository';
import { IPermissionRepository } from '../../domain/repositories/IPermissionRepository';
import { HealthcareRole } from '../../domain/entities/HealthcareRole';
import { CircuitBreakerFactory } from '../../infrastructure/resilience/CircuitBreaker';

export interface AssignRoleRequest {
  userId: string; // User to assign role to
  roleType: string; // Role to assign (ADMIN, DOCTOR, NURSE, RECEPTIONIST, PATIENT)
  assignedBy: string; // Admin who is assigning
  reason: string; // Reason for role assignment
}

export interface AssignRoleResponse {
  success: boolean;
  message: string;
  previousRole?: string;
  newRole?: string;
  error?: string;
}

/**
 * Assign Role Use Case
 * Allows administrators to assign/change user roles
 * Validates role type, records audit trail
 */
export class AssignRoleUseCase
  implements IUseCase<AssignRoleRequest, AssignRoleResponse>
{
  private circuitBreaker = CircuitBreakerFactory.getBreaker('assign-role-use-case');

  // Valid role types (5 core roles)
  private readonly VALID_ROLES = ['ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'PATIENT'];

  constructor(
    private userRepository: IUserRepository,
    private permissionRepository: IPermissionRepository,
    private logger: any
  ) {}

  async execute(request: AssignRoleRequest): Promise<AssignRoleResponse> {
    return await this.circuitBreaker.execute(
      async () => this.executeImpl(request),
      async () => {
        this.logger.error('Circuit breaker open for AssignRoleUseCase');
        return {
          success: false,
          message: 'Dịch vụ gán vai trò tạm thời không khả dụng. Vui lòng thử lại sau.',
          error: 'SERVICE_UNAVAILABLE'
        };
      }
    );
  }

  private async executeImpl(request: AssignRoleRequest): Promise<AssignRoleResponse> {
    try {
      this.logger.info('Processing role assignment request', {
        userId: request.userId,
        roleType: request.roleType,
        assignedBy: request.assignedBy,
        reason: request.reason
      });

      // 1. Validate input
      const validationError = this.validateRequest(request);
      if (validationError) {
        return {
          success: false,
          message: validationError,
          error: 'VALIDATION_ERROR'
        };
      }

      // 2. Get user
      const user = await this.userRepository.findById(request.userId);
      if (!user) {
        return {
          success: false,
          message: 'Người dùng không tồn tại',
          error: 'USER_NOT_FOUND'
        };
      }

      // 3. Get current role
      const currentRoles = user.healthcareRoles;
      const currentPrimaryRole = currentRoles.length > 0 ? currentRoles[0] : null;
      const previousRoleType = currentPrimaryRole?.roleType || 'NONE';

      // 4. Check if role is already assigned
      if (previousRoleType === request.roleType) {
        return {
          success: false,
          message: `Người dùng đã có vai trò ${request.roleType}`,
          error: 'ROLE_ALREADY_ASSIGNED'
        };
      }

      // 5. Prevent changing own role
      if (request.userId === request.assignedBy) {
        return {
          success: false,
          message: 'Không thể thay đổi vai trò của chính mình',
          error: 'CANNOT_CHANGE_OWN_ROLE'
        };
      }

      // 6. Get role definition from database
      const roleDefinition = await this.permissionRepository.getRoleByType(request.roleType);
      if (!roleDefinition) {
        return {
          success: false,
          message: `Vai trò ${request.roleType} không tồn tại trong hệ thống`,
          error: 'ROLE_NOT_FOUND'
        };
      }

      // 7. Create new HealthcareRole entity
      const newRole = HealthcareRole.create({
        roleType: request.roleType,
        roleName: roleDefinition.roleName,
        description: roleDefinition.description,
        permissions: roleDefinition.permissions,
        isActive: true,
        assignedAt: new Date(),
        assignedBy: request.assignedBy
      });

      // 8. Remove old roles and assign new role
      currentRoles.forEach(role => user.removeRole(role));
      user.addRole(newRole);

      // 9. Save user
      await this.userRepository.save(user);

      // 10. Log audit trail
      this.logger.info('Role assigned successfully', {
        userId: request.userId,
        previousRole: previousRoleType,
        newRole: request.roleType,
        assignedBy: request.assignedBy,
        reason: request.reason
      });

      return {
        success: true,
        message: `Vai trò đã được thay đổi từ ${previousRoleType} sang ${request.roleType}. Lý do: ${request.reason}`,
        previousRole: previousRoleType,
        newRole: request.roleType
      };
    } catch (error: any) {
      this.logger.error('Failed to assign role', {
        userId: request.userId,
        roleType: request.roleType,
        assignedBy: request.assignedBy,
        error: error.message
      });

      return {
        success: false,
        message: 'Không thể gán vai trò. Vui lòng thử lại sau.',
        error: 'ASSIGN_ROLE_FAILED'
      };
    }
  }

  private validateRequest(request: AssignRoleRequest): string | null {
    if (!request.userId || request.userId.trim().length === 0) {
      return 'User ID là bắt buộc';
    }

    if (!request.roleType || request.roleType.trim().length === 0) {
      return 'Role Type là bắt buộc';
    }

    // Validate role type
    const roleTypeUpper = request.roleType.toUpperCase();
    if (!this.VALID_ROLES.includes(roleTypeUpper)) {
      return `Role Type không hợp lệ. Các vai trò hợp lệ: ${this.VALID_ROLES.join(', ')}`;
    }

    // Normalize role type to uppercase
    request.roleType = roleTypeUpper;

    if (!request.assignedBy || request.assignedBy.trim().length === 0) {
      return 'Assigned By (Admin ID) là bắt buộc';
    }

    if (!request.reason || request.reason.trim().length === 0) {
      return 'Lý do gán vai trò là bắt buộc';
    }

    if (request.reason.length < 10) {
      return 'Lý do gán vai trò phải có ít nhất 10 ký tự';
    }

    return null;
  }
}

