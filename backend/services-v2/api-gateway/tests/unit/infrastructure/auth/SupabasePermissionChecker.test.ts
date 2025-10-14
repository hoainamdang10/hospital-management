import { SupabasePermissionChecker } from '@infrastructure/auth/SupabasePermissionChecker';
import { UserId } from '@domain/value-objects/UserId';
import { ILogger } from '@application/services/ILogger';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

jest.mock('@supabase/supabase-js');

describe('SupabasePermissionChecker', () => {
  let checker: SupabasePermissionChecker;
  let mockLogger: jest.Mocked<ILogger>;
  let mockSupabase: jest.Mocked<SupabaseClient>;

  const config = {
    supabaseUrl: 'https://test.supabase.co',
    supabaseServiceRoleKey: 'test-service-role-key'
  };

  const testUserId = UserId.create('550e8400-e29b-41d4-a716-446655440000');

  beforeEach(() => {
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    };

    mockSupabase = {
      rpc: jest.fn(),
      from: jest.fn()
    } as any;

    (createClient as jest.Mock).mockReturnValue(mockSupabase);

    checker = new SupabasePermissionChecker(config, mockLogger);
    jest.clearAllMocks();
  });

  describe('checkPermission', () => {
    it('should return true if user has permission', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: true, error: null } as any);

      const result = await checker.checkPermission(testUserId, 'patient:read');

      expect(result.allowed).toBe(true);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('check_user_permission', {
        p_user_id: testUserId.value,
        p_permission: 'patient:read'
      });
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Permission check result',
        expect.objectContaining({
          userId: testUserId.value,
          permission: 'patient:read',
          allowed: true
        })
      );
    });

    it('should return false if user does not have permission', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: false, error: null } as any);

      const result = await checker.checkPermission(testUserId, 'patient:write');

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Missing permission: patient:write');
    });

    it('should handle RPC error', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'Function not found' }
      } as any);

      const result = await checker.checkPermission(testUserId, 'patient:read');

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Permission check failed');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Permission check failed',
        expect.objectContaining({
          error: 'Function not found'
        })
      );
    });

    it('should handle unexpected errors', async () => {
      mockSupabase.rpc.mockRejectedValue(new Error('Network error'));

      const result = await checker.checkPermission(testUserId, 'patient:read');

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Permission check error');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Permission check error',
        expect.objectContaining({
          error: 'Network error'
        })
      );
    });
  });

  describe('checkAnyPermission', () => {
    it('should return true if user has any of the permissions', async () => {
      mockSupabase.rpc
        .mockResolvedValueOnce({ data: false, error: null } as any)
        .mockResolvedValueOnce({ data: true, error: null } as any);

      const result = await checker.checkAnyPermission(testUserId, ['patient:write', 'patient:read']);

      expect(result.allowed).toBe(true);
      expect(mockSupabase.rpc).toHaveBeenCalledTimes(2);
    });

    it('should return false if user has none of the permissions', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: false, error: null } as any);

      const result = await checker.checkAnyPermission(testUserId, ['patient:write', 'patient:delete']);

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Missing any of permissions: patient:write, patient:delete');
    });
  });

  describe('checkAllPermissions', () => {
    it('should return true if user has all permissions', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: true, error: null } as any);

      const result = await checker.checkAllPermissions(testUserId, ['patient:read', 'patient:write']);

      expect(result.allowed).toBe(true);
      expect(mockSupabase.rpc).toHaveBeenCalledTimes(2);
    });

    it('should return false if user is missing any permission', async () => {
      mockSupabase.rpc
        .mockResolvedValueOnce({ data: true, error: null } as any)
        .mockResolvedValueOnce({ data: false, error: null } as any);

      const result = await checker.checkAllPermissions(testUserId, ['patient:read', 'patient:write']);

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Missing permissions: patient:write');
    });
  });

  describe('checkRole', () => {
    it('should return true if user has the role', async () => {
      const mockFrom = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { role_name: 'doctor' },
          error: null
        })
      };
      mockSupabase.from.mockReturnValue(mockFrom as any);

      const result = await checker.checkRole(testUserId, 'doctor');

      expect(result.allowed).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith('auth_schema.user_roles');
    });

    it('should return false if user does not have the role', async () => {
      const mockFrom = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' }
        })
      };
      mockSupabase.from.mockReturnValue(mockFrom as any);

      const result = await checker.checkRole(testUserId, 'admin');

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Missing role: admin');
    });
  });

  describe('checkAnyRole', () => {
    it('should return true if user has any of the roles', async () => {
      const mockFrom = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({
          data: [{ role_name: 'doctor' }],
          error: null
        })
      };
      mockSupabase.from.mockReturnValue(mockFrom as any);

      const result = await checker.checkAnyRole(testUserId, ['doctor', 'nurse']);

      expect(result.allowed).toBe(true);
    });

    it('should return false if user has none of the roles', async () => {
      const mockFrom = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({
          data: [],
          error: null
        })
      };
      mockSupabase.from.mockReturnValue(mockFrom as any);

      const result = await checker.checkAnyRole(testUserId, ['admin', 'nurse']);

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Missing any of roles: admin, nurse');
    });
  });

  describe('checkAllRoles', () => {
    it('should return true if user has all roles', async () => {
      const mockFrom = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({
          data: [{ role_name: 'doctor' }, { role_name: 'admin' }],
          error: null
        })
      };
      mockSupabase.from.mockReturnValue(mockFrom as any);

      const result = await checker.checkAllRoles(testUserId, ['doctor', 'admin']);

      expect(result.allowed).toBe(true);
    });

    it('should return false if user is missing any role', async () => {
      const mockFrom = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({
          data: [{ role_name: 'doctor' }],
          error: null
        })
      };
      mockSupabase.from.mockReturnValue(mockFrom as any);

      const result = await checker.checkAllRoles(testUserId, ['doctor', 'admin']);

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Missing roles: admin');
    });
  });
});

