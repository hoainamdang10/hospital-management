import { UserId } from '../value-objects/UserId';

export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
}

export interface IPermissionChecker {
  checkPermission(userId: UserId, permission: string): Promise<PermissionCheckResult>;
  
  checkAnyPermission(userId: UserId, permissions: string[]): Promise<PermissionCheckResult>;
  
  checkAllPermissions(userId: UserId, permissions: string[]): Promise<PermissionCheckResult>;
  
  checkRole(userId: UserId, role: string): Promise<PermissionCheckResult>;
  
  checkAnyRole(userId: UserId, roles: string[]): Promise<PermissionCheckResult>;
  
  checkAllRoles(userId: UserId, roles: string[]): Promise<PermissionCheckResult>;
}

