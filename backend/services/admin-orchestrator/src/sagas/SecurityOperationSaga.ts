import { SagaStep, SagaCoordinator } from '../orchestrator/SagaCoordinator';
import { supabase } from '@/backend/lib/supabase';
import { logSagaTransaction } from '@/backend/api/admin/audit-logs/route';

export interface SecurityOperationPayload {
  operationType: 'role_assignment' | 'permission_update' | 'security_incident_response' | 'bulk_user_update';
  userId?: string;
  roleId?: string;
  permissions?: string[];
  incidentId?: string;
  userIds?: string[];
  details: Record<string, any>;
}

export class SecurityOperationSaga {
  private sagaId: string;
  private operationId: string;
  private payload: SecurityOperationPayload;
  private coordinator: SagaCoordinator;

  constructor(sagaId: string, operationId: string, payload: SecurityOperationPayload) {
    this.sagaId = sagaId;
    this.operationId = operationId;
    this.payload = payload;
    this.coordinator = new SagaCoordinator();
  }

  async execute(): Promise<{ success: boolean; result?: any; error?: string }> {
    try {
      await logSagaTransaction(
        this.sagaId,
        this.operationId,
        'security_operation',
        'started',
        { operationType: this.payload.operationType }
      );

      let steps: SagaStep[] = [];

      switch (this.payload.operationType) {
        case 'role_assignment':
          steps = this.buildRoleAssignmentSteps();
          break;
        case 'permission_update':
          steps = this.buildPermissionUpdateSteps();
          break;
        case 'security_incident_response':
          steps = this.buildIncidentResponseSteps();
          break;
        case 'bulk_user_update':
          steps = this.buildBulkUserUpdateSteps();
          break;
        default:
          throw new Error(`Unknown security operation type: ${this.payload.operationType}`);
      }

      const result = await this.coordinator.executeSaga(this.sagaId, steps);

      await logSagaTransaction(
        this.sagaId,
        this.operationId,
        'security_operation',
        result.success ? 'completed' : 'failed',
        { result }
      );

      return result;

    } catch (error: any) {
      await logSagaTransaction(
        this.sagaId,
        this.operationId,
        'security_operation',
        'failed',
        { error: error.message }
      );

      return { success: false, error: error.message };
    }
  }

  private buildRoleAssignmentSteps(): SagaStep[] {
    return [
      {
        id: 'validate_role_assignment',
        name: 'Validate Role Assignment',
        service: 'security-service',
        action: async () => {
          // Validate user exists and role exists
          const { data: user, error: userError } = await supabase
            .from('profiles')
            .select('id, full_name, role')
            .eq('id', this.payload.userId)
            .single();

          if (userError || !user) {
            throw new Error('User not found');
          }

          const { data: role, error: roleError } = await supabase
            .from('roles')
            .select('id, name, is_system_role')
            .eq('id', this.payload.roleId)
            .single();

          if (roleError || !role) {
            throw new Error('Role not found');
          }

          // Check if user already has this role
          const { data: existingRole, error: existingError } = await supabase
            .from('user_roles')
            .select('id')
            .eq('user_id', this.payload.userId)
            .eq('role_id', this.payload.roleId)
            .eq('is_active', true)
            .single();

          if (existingRole) {
            throw new Error('User already has this role');
          }

          return { user, role };
        },
        compensationAction: async () => {
          // No compensation needed for validation
        }
      },
      {
        id: 'assign_role',
        name: 'Assign Role to User',
        service: 'security-service',
        action: async () => {
          const { data, error } = await supabase
            .from('user_roles')
            .insert({
              user_id: this.payload.userId,
              role_id: this.payload.roleId,
              assigned_by: this.payload.details.assignedBy,
              is_active: true
            })
            .select()
            .single();

          if (error) {
            throw new Error(`Failed to assign role: ${error.message}`);
          }

          return data;
        },
        compensationAction: async () => {
          // Remove the role assignment
          await supabase
            .from('user_roles')
            .delete()
            .eq('user_id', this.payload.userId)
            .eq('role_id', this.payload.roleId);
        }
      },
      {
        id: 'update_user_profile',
        name: 'Update User Profile Role',
        service: 'user-service',
        action: async () => {
          // Get the role name to update profile
          const { data: role } = await supabase
            .from('roles')
            .select('name')
            .eq('id', this.payload.roleId)
            .single();

          const { error } = await supabase
            .from('profiles')
            .update({ role: role?.name })
            .eq('id', this.payload.userId);

          if (error) {
            throw new Error(`Failed to update user profile: ${error.message}`);
          }

          return { updated: true };
        },
        compensationAction: async (originalData: any) => {
          // Restore original role in profile
          if (originalData?.previousRole) {
            await supabase
              .from('profiles')
              .update({ role: originalData.previousRole })
              .eq('id', this.payload.userId);
          }
        }
      },
      {
        id: 'log_role_assignment',
        name: 'Log Role Assignment',
        service: 'audit-service',
        action: async () => {
          await supabase.from('audit_logs').insert({
            action: 'role_assigned',
            resource_type: 'user_role',
            resource_id: this.payload.userId,
            user_id: this.payload.details.assignedBy,
            details: {
              userId: this.payload.userId,
              roleId: this.payload.roleId,
              sagaId: this.sagaId,
              operationId: this.operationId
            },
            saga_id: this.sagaId,
            operation_id: this.operationId,
            status: 'success',
            timestamp: new Date().toISOString()
          });

          return { logged: true };
        },
        compensationAction: async () => {
          // Log compensation action
          await supabase.from('audit_logs').insert({
            action: 'role_assignment_compensated',
            resource_type: 'user_role',
            resource_id: this.payload.userId,
            details: {
              reason: 'Saga compensation',
              sagaId: this.sagaId,
              operationId: this.operationId
            },
            saga_id: this.sagaId,
            operation_id: this.operationId,
            status: 'warning',
            timestamp: new Date().toISOString()
          });
        }
      },
      {
        id: 'notify_role_assignment',
        name: 'Send Role Assignment Notification',
        service: 'notification-service',
        action: async () => {
          // Get user and role details for notification
          const { data: user } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', this.payload.userId)
            .single();

          const { data: role } = await supabase
            .from('roles')
            .select('name, description')
            .eq('id', this.payload.roleId)
            .single();

          // Send notification (implement based on your notification service)
          const notificationData = {
            to: user?.email,
            subject: 'Vai trò mới được phân quyền',
            template: 'role_assignment',
            data: {
              userName: user?.full_name,
              roleName: role?.name,
              roleDescription: role?.description
            }
          };

          // Here you would call your notification service
          // await notificationService.send(notificationData);

          return { notificationSent: true };
        },
        compensationAction: async () => {
          // Send role removal notification
          const { data: user } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', this.payload.userId)
            .single();

          const { data: role } = await supabase
            .from('roles')
            .select('name')
            .eq('id', this.payload.roleId)
            .single();

          // Send compensation notification
          const compensationNotification = {
            to: user?.email,
            subject: 'Thay đổi vai trò',
            template: 'role_change',
            data: {
              userName: user?.full_name,
              message: `Vai trò ${role?.name} đã được thu hồi do lỗi hệ thống.`
            }
          };

          // await notificationService.send(compensationNotification);
        }
      }
    ];
  }

  private buildPermissionUpdateSteps(): SagaStep[] {
    return [
      {
        id: 'validate_permission_update',
        name: 'Validate Permission Update',
        service: 'security-service',
        action: async () => {
          // Validate role exists and permissions exist
          const { data: role, error: roleError } = await supabase
            .from('roles')
            .select('id, name, is_system_role')
            .eq('id', this.payload.roleId)
            .single();

          if (roleError || !role) {
            throw new Error('Role not found');
          }

          if (role.is_system_role) {
            throw new Error('Cannot modify system role permissions');
          }

          // Validate all permissions exist
          const { data: permissions, error: permError } = await supabase
            .from('permissions')
            .select('id, name')
            .in('id', this.payload.permissions || []);

          if (permError) {
            throw new Error('Failed to validate permissions');
          }

          if (permissions?.length !== this.payload.permissions?.length) {
            throw new Error('Some permissions not found');
          }

          return { role, permissions };
        },
        compensationAction: async () => {
          // No compensation needed for validation
        }
      },
      {
        id: 'backup_current_permissions',
        name: 'Backup Current Permissions',
        service: 'security-service',
        action: async () => {
          const { data: currentPermissions, error } = await supabase
            .from('role_permissions')
            .select('permission_id')
            .eq('role_id', this.payload.roleId);

          if (error) {
            throw new Error('Failed to backup current permissions');
          }

          return { 
            currentPermissions: currentPermissions?.map(p => p.permission_id) || [] 
          };
        },
        compensationAction: async () => {
          // Backup is for restoration, no compensation needed
        }
      },
      {
        id: 'update_role_permissions',
        name: 'Update Role Permissions',
        service: 'security-service',
        action: async (context: any) => {
          // Delete existing permissions
          await supabase
            .from('role_permissions')
            .delete()
            .eq('role_id', this.payload.roleId);

          // Insert new permissions
          if (this.payload.permissions && this.payload.permissions.length > 0) {
            const rolePermissions = this.payload.permissions.map(permissionId => ({
              role_id: this.payload.roleId,
              permission_id: permissionId,
              granted_by: this.payload.details.updatedBy
            }));

            const { error } = await supabase
              .from('role_permissions')
              .insert(rolePermissions);

            if (error) {
              throw new Error(`Failed to update permissions: ${error.message}`);
            }
          }

          return { updated: true };
        },
        compensationAction: async (context: any) => {
          // Restore original permissions
          const currentPermissions = context.backup_current_permissions?.currentPermissions || [];
          
          // Delete current permissions
          await supabase
            .from('role_permissions')
            .delete()
            .eq('role_id', this.payload.roleId);

          // Restore original permissions
          if (currentPermissions.length > 0) {
            const originalPermissions = currentPermissions.map((permissionId: string) => ({
              role_id: this.payload.roleId,
              permission_id: permissionId,
              granted_by: this.payload.details.updatedBy
            }));

            await supabase
              .from('role_permissions')
              .insert(originalPermissions);
          }
        }
      },
      {
        id: 'log_permission_update',
        name: 'Log Permission Update',
        service: 'audit-service',
        action: async () => {
          await supabase.from('audit_logs').insert({
            action: 'role_permissions_updated',
            resource_type: 'role',
            resource_id: this.payload.roleId,
            user_id: this.payload.details.updatedBy,
            details: {
              roleId: this.payload.roleId,
              newPermissions: this.payload.permissions,
              sagaId: this.sagaId,
              operationId: this.operationId
            },
            saga_id: this.sagaId,
            operation_id: this.operationId,
            status: 'success',
            timestamp: new Date().toISOString()
          });

          return { logged: true };
        },
        compensationAction: async () => {
          await supabase.from('audit_logs').insert({
            action: 'role_permissions_update_compensated',
            resource_type: 'role',
            resource_id: this.payload.roleId,
            details: {
              reason: 'Saga compensation',
              sagaId: this.sagaId,
              operationId: this.operationId
            },
            saga_id: this.sagaId,
            operation_id: this.operationId,
            status: 'warning',
            timestamp: new Date().toISOString()
          });
        }
      }
    ];
  }

  private buildIncidentResponseSteps(): SagaStep[] {
    // Implementation for security incident response saga
    return [];
  }

  private buildBulkUserUpdateSteps(): SagaStep[] {
    // Implementation for bulk user update saga
    return [];
  }
}
