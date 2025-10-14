import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { IPermissionChecker, PermissionCheckResult } from '@domain/services/IPermissionChecker';
import { UserId } from '@domain/value-objects/UserId';
import { ILogger } from '@application/services/ILogger';

export interface SupabasePermissionCheckerConfig {
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
}

export class SupabasePermissionChecker implements IPermissionChecker {
  private supabase: SupabaseClient;

  constructor(
    config: SupabasePermissionCheckerConfig,
    private logger: ILogger
  ) {
    this.supabase = createClient(
      config.supabaseUrl,
      config.supabaseServiceRoleKey
    );
  }

  async checkPermission(userId: UserId, permission: string): Promise<PermissionCheckResult> {
    try {
      const { data, error } = await this.supabase
        .rpc('check_user_permission', {
          p_user_id: userId.value,
          p_permission: permission
        });

      if (error) {
        this.logger.error('Permission check failed', {
          userId: userId.value,
          permission,
          error: error.message
        });

        return {
          allowed: false,
          reason: 'Permission check failed'
        };
      }

      const allowed = data === true;

      this.logger.debug('Permission check result', {
        userId: userId.value,
        permission,
        allowed
      });

      return {
        allowed,
        reason: allowed ? undefined : `Missing permission: ${permission}`
      };

    } catch (error) {
      this.logger.error('Permission check error', {
        userId: userId.value,
        permission,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        allowed: false,
        reason: 'Permission check error'
      };
    }
  }

  async checkAnyPermission(userId: UserId, permissions: string[]): Promise<PermissionCheckResult> {
    try {
      const results = await Promise.all(
        permissions.map(permission => this.checkPermission(userId, permission))
      );

      const allowed = results.some(result => result.allowed);

      this.logger.debug('Any permission check result', {
        userId: userId.value,
        permissions,
        allowed
      });

      return {
        allowed,
        reason: allowed ? undefined : `Missing any of permissions: ${permissions.join(', ')}`
      };

    } catch (error) {
      this.logger.error('Any permission check error', {
        userId: userId.value,
        permissions,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        allowed: false,
        reason: 'Permission check error'
      };
    }
  }

  async checkAllPermissions(userId: UserId, permissions: string[]): Promise<PermissionCheckResult> {
    try {
      const results = await Promise.all(
        permissions.map(permission => this.checkPermission(userId, permission))
      );

      const allowed = results.every(result => result.allowed);
      const missingPermissions = permissions.filter((_, index) => !results[index].allowed);

      this.logger.debug('All permissions check result', {
        userId: userId.value,
        permissions,
        allowed,
        missingPermissions
      });

      return {
        allowed,
        reason: allowed ? undefined : `Missing permissions: ${missingPermissions.join(', ')}`
      };

    } catch (error) {
      this.logger.error('All permissions check error', {
        userId: userId.value,
        permissions,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        allowed: false,
        reason: 'Permission check error'
      };
    }
  }

  async checkRole(userId: UserId, role: string): Promise<PermissionCheckResult> {
    try {
      const { data, error } = await this.supabase
        .from('auth_schema.user_roles')
        .select('role_name')
        .eq('user_id', userId.value)
        .eq('role_name', role)
        .single();

      if (error && error.code !== 'PGRST116') {
        this.logger.error('Role check failed', {
          userId: userId.value,
          role,
          error: error.message
        });

        return {
          allowed: false,
          reason: 'Role check failed'
        };
      }

      const allowed = !!data;

      this.logger.debug('Role check result', {
        userId: userId.value,
        role,
        allowed
      });

      return {
        allowed,
        reason: allowed ? undefined : `Missing role: ${role}`
      };

    } catch (error) {
      this.logger.error('Role check error', {
        userId: userId.value,
        role,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        allowed: false,
        reason: 'Role check error'
      };
    }
  }

  async checkAnyRole(userId: UserId, roles: string[]): Promise<PermissionCheckResult> {
    try {
      const { data, error } = await this.supabase
        .from('auth_schema.user_roles')
        .select('role_name')
        .eq('user_id', userId.value)
        .in('role_name', roles);

      if (error) {
        this.logger.error('Any role check failed', {
          userId: userId.value,
          roles,
          error: error.message
        });

        return {
          allowed: false,
          reason: 'Role check failed'
        };
      }

      const allowed = data && data.length > 0;

      this.logger.debug('Any role check result', {
        userId: userId.value,
        roles,
        allowed,
        foundRoles: data?.map(r => r.role_name)
      });

      return {
        allowed,
        reason: allowed ? undefined : `Missing any of roles: ${roles.join(', ')}`
      };

    } catch (error) {
      this.logger.error('Any role check error', {
        userId: userId.value,
        roles,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        allowed: false,
        reason: 'Role check error'
      };
    }
  }

  async checkAllRoles(userId: UserId, roles: string[]): Promise<PermissionCheckResult> {
    try {
      const { data, error } = await this.supabase
        .from('auth_schema.user_roles')
        .select('role_name')
        .eq('user_id', userId.value)
        .in('role_name', roles);

      if (error) {
        this.logger.error('All roles check failed', {
          userId: userId.value,
          roles,
          error: error.message
        });

        return {
          allowed: false,
          reason: 'Role check failed'
        };
      }

      const foundRoles = data?.map(r => r.role_name) || [];
      const allowed = roles.every(role => foundRoles.includes(role));
      const missingRoles = roles.filter(role => !foundRoles.includes(role));

      this.logger.debug('All roles check result', {
        userId: userId.value,
        roles,
        allowed,
        foundRoles,
        missingRoles
      });

      return {
        allowed,
        reason: allowed ? undefined : `Missing roles: ${missingRoles.join(', ')}`
      };

    } catch (error) {
      this.logger.error('All roles check error', {
        userId: userId.value,
        roles,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        allowed: false,
        reason: 'Role check error'
      };
    }
  }
}

