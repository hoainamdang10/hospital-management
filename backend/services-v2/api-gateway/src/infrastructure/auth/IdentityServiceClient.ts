import axios, { AxiosInstance, AxiosError } from 'axios';
import { IPermissionChecker, PermissionCheckResult } from '@domain/services/IPermissionChecker';
import { UserId } from '@domain/value-objects/UserId';
import { ILogger } from '@application/services/ILogger';

export interface IdentityServiceClientConfig {
  identityServiceUrl: string;
  timeout?: number;
  retries?: number;
}

export interface CheckPermissionRequest {
  userId: string;
  permission: string;
}

export interface CheckPermissionsRequest {
  userId: string;
  permissions: string[];
  requireAll: boolean;
}

export interface CheckRoleRequest {
  userId: string;
  role: string;
}

export interface CheckRolesRequest {
  userId: string;
  roles: string[];
  requireAll: boolean;
}

export interface PermissionCheckResponse {
  success: boolean;
  allowed: boolean;
  reason?: string;
}

/**
 * Identity Service Client
 * Gọi Identity Service API để check permissions thay vì truy cập trực tiếp database
 * Tuân thủ bounded context và microservices principles
 */
export class IdentityServiceClient implements IPermissionChecker {
  private httpClient: AxiosInstance;

  constructor(
    config: IdentityServiceClientConfig,
    private logger: ILogger
  ) {
    this.httpClient = axios.create({
      baseURL: config.identityServiceUrl,
      timeout: config.timeout || 5000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.httpClient.interceptors.request.use(
      (config) => {
        this.logger.debug('Identity Service request', {
          method: config.method,
          url: config.url,
          data: config.data
        });
        return config;
      },
      (error) => {
        this.logger.error('Identity Service request error', {
          error: error.message
        });
        return Promise.reject(error);
      }
    );

    this.httpClient.interceptors.response.use(
      (response) => {
        this.logger.debug('Identity Service response', {
          status: response.status,
          data: response.data
        });
        return response;
      },
      (error: AxiosError) => {
        this.logger.error('Identity Service response error', {
          status: error.response?.status,
          message: error.message,
          data: error.response?.data
        });
        return Promise.reject(error);
      }
    );
  }

  async checkPermission(userId: UserId, permission: string): Promise<PermissionCheckResult> {
    try {
      const response = await this.httpClient.post<PermissionCheckResponse>(
        '/api/v1/auth/check-permission',
        {
          userId: userId.value,
          permission
        } as CheckPermissionRequest
      );

      if (!response.data.success) {
        this.logger.warn('Permission check failed', {
          userId: userId.value,
          permission,
          reason: response.data.reason
        });

        return {
          allowed: false,
          reason: response.data.reason || 'Permission check failed'
        };
      }

      this.logger.debug('Permission check result', {
        userId: userId.value,
        permission,
        allowed: response.data.allowed
      });

      return {
        allowed: response.data.allowed,
        reason: response.data.reason
      };

    } catch (error) {
      this.logger.error('Permission check error', {
        userId: userId.value,
        permission,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        allowed: false,
        reason: 'Permission check service unavailable'
      };
    }
  }

  async checkAnyPermission(userId: UserId, permissions: string[]): Promise<PermissionCheckResult> {
    try {
      const response = await this.httpClient.post<PermissionCheckResponse>(
        '/api/v1/auth/check-permissions',
        {
          userId: userId.value,
          permissions,
          requireAll: false
        } as CheckPermissionsRequest
      );

      if (!response.data.success) {
        return {
          allowed: false,
          reason: response.data.reason || 'Permission check failed'
        };
      }

      this.logger.debug('Any permission check result', {
        userId: userId.value,
        permissions,
        allowed: response.data.allowed
      });

      return {
        allowed: response.data.allowed,
        reason: response.data.reason
      };

    } catch (error) {
      this.logger.error('Any permission check error', {
        userId: userId.value,
        permissions,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        allowed: false,
        reason: 'Permission check service unavailable'
      };
    }
  }

  async checkAllPermissions(userId: UserId, permissions: string[]): Promise<PermissionCheckResult> {
    try {
      const response = await this.httpClient.post<PermissionCheckResponse>(
        '/api/v1/auth/check-permissions',
        {
          userId: userId.value,
          permissions,
          requireAll: true
        } as CheckPermissionsRequest
      );

      if (!response.data.success) {
        return {
          allowed: false,
          reason: response.data.reason || 'Permission check failed'
        };
      }

      this.logger.debug('All permissions check result', {
        userId: userId.value,
        permissions,
        allowed: response.data.allowed
      });

      return {
        allowed: response.data.allowed,
        reason: response.data.reason
      };

    } catch (error) {
      this.logger.error('All permissions check error', {
        userId: userId.value,
        permissions,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        allowed: false,
        reason: 'Permission check service unavailable'
      };
    }
  }

  async checkRole(userId: UserId, role: string): Promise<PermissionCheckResult> {
    try {
      const response = await this.httpClient.post<PermissionCheckResponse>(
        '/api/v1/auth/check-role',
        {
          userId: userId.value,
          role
        } as CheckRoleRequest
      );

      if (!response.data.success) {
        return {
          allowed: false,
          reason: response.data.reason || 'Role check failed'
        };
      }

      this.logger.debug('Role check result', {
        userId: userId.value,
        role,
        allowed: response.data.allowed
      });

      return {
        allowed: response.data.allowed,
        reason: response.data.reason
      };

    } catch (error) {
      this.logger.error('Role check error', {
        userId: userId.value,
        role,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        allowed: false,
        reason: 'Role check service unavailable'
      };
    }
  }

  async checkAnyRole(userId: UserId, roles: string[]): Promise<PermissionCheckResult> {
    try {
      const response = await this.httpClient.post<PermissionCheckResponse>(
        '/api/v1/auth/check-roles',
        {
          userId: userId.value,
          roles,
          requireAll: false
        } as CheckRolesRequest
      );

      if (!response.data.success) {
        return {
          allowed: false,
          reason: response.data.reason || 'Role check failed'
        };
      }

      return {
        allowed: response.data.allowed,
        reason: response.data.reason
      };

    } catch (error) {
      this.logger.error('Any role check error', {
        userId: userId.value,
        roles,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        allowed: false,
        reason: 'Role check service unavailable'
      };
    }
  }

  async checkAllRoles(userId: UserId, roles: string[]): Promise<PermissionCheckResult> {
    try {
      const response = await this.httpClient.post<PermissionCheckResponse>(
        '/api/v1/auth/check-roles',
        {
          userId: userId.value,
          roles,
          requireAll: true
        } as CheckRolesRequest
      );

      if (!response.data.success) {
        return {
          allowed: false,
          reason: response.data.reason || 'Role check failed'
        };
      }

      return {
        allowed: response.data.allowed,
        reason: response.data.reason
      };

    } catch (error) {
      this.logger.error('All roles check error', {
        userId: userId.value,
        roles,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        allowed: false,
        reason: 'Role check service unavailable'
      };
    }
  }
}

