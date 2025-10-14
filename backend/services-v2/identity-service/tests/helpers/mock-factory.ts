import { IUserRepository } from '../../src/application/repositories/IUserRepository';
import { IPermissionRepository } from '../../src/domain/repositories/IPermissionRepository';
import { ICircuitBreaker, CircuitBreakerState } from '../../src/application/services/ICircuitBreaker';

export function createThenableQueryMock(resolveValue: any) {
  return function(resolve: any) {
    return Promise.resolve(resolveValue).then(resolve);
  };
}

export class MockFactory {
  private static userRepositoryCache: jest.Mocked<IUserRepository> | null = null;
  private static permissionRepositoryCache: jest.Mocked<IPermissionRepository> | null = null;
  private static loggerCache: any | null = null;
  private static circuitBreakerCache: jest.Mocked<ICircuitBreaker> | null = null;

  static createUserRepository(): jest.Mocked<IUserRepository> {
    if (!this.userRepositoryCache) {
      this.userRepositoryCache = {
        findByEmail: jest.fn(),
        findById: jest.fn(),
        save: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        list: jest.fn(),
        count: jest.fn(),
        createAuthUser: jest.fn()
      } as unknown as jest.Mocked<IUserRepository>;
    }
    return this.userRepositoryCache;
  }

  static createPermissionRepository(): jest.Mocked<IPermissionRepository> {
    if (!this.permissionRepositoryCache) {
      this.permissionRepositoryCache = {
        getAllRoles: jest.fn().mockResolvedValue(['admin', 'doctor', 'nurse', 'receptionist', 'patient']),
        getRolePermissions: jest.fn(),
        hasPermission: jest.fn(),
        assignRole: jest.fn(),
        removeRole: jest.fn()
      } as unknown as jest.Mocked<IPermissionRepository>;
    }
    return this.permissionRepositoryCache;
  }

  static createLogger(): any {
    if (!this.loggerCache) {
      this.loggerCache = {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
        fatal: jest.fn()
      };
    }
    return this.loggerCache;
  }

  static createCircuitBreaker(): jest.Mocked<ICircuitBreaker> {
    if (!this.circuitBreakerCache) {
      const executeMock = jest.fn(
        async <T>(operation: () => Promise<T>, fallback?: () => Promise<T>) => {
          try {
            return await operation();
          } catch (error) {
            if (fallback) {
              return await fallback();
            }
            throw error;
          }
        }
      );

      this.circuitBreakerCache = {
        execute: executeMock,
        getState: jest.fn().mockReturnValue(CircuitBreakerState.CLOSED),
        reset: jest.fn()
      } as unknown as jest.Mocked<ICircuitBreaker>;
    }
    return this.circuitBreakerCache;
  }

  static resetAllMocks(): void {
    if (this.userRepositoryCache) {
      jest.clearAllMocks();
    }
    if (this.permissionRepositoryCache) {
      jest.clearAllMocks();
    }
    if (this.loggerCache) {
      jest.clearAllMocks();
    }
    if (this.circuitBreakerCache) {
      jest.clearAllMocks();
      this.circuitBreakerCache.getState.mockReturnValue(CircuitBreakerState.CLOSED);
    }
  }

  static clearCache(): void {
    this.userRepositoryCache = null;
    this.permissionRepositoryCache = null;
    this.loggerCache = null;
    this.circuitBreakerCache = null;
  }
}

