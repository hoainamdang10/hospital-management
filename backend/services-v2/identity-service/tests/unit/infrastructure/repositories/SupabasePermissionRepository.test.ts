import { SupabasePermissionRepository } from '@infrastructure/repositories/SupabasePermissionRepository';
import { UserId } from '@domain/value-objects/UserId';
import { PermissionCache } from '@infrastructure/cache/PermissionCache';

// Mock Supabase Client with schema() support
const mockSupabaseClient = {
  from: jest.fn(),
  rpc: jest.fn(),
  schema: jest.fn().mockReturnThis(), // Add schema() method that returns self for chaining
};

// Mock Permission Cache
const mockCache = {
  get: jest.fn(),
  set: jest.fn(),
  invalidate: jest.fn(),
  invalidateAll: jest.fn(),
} as unknown as PermissionCache;

// Helper to create chainable query mock
const createQueryMock = (data: any, error: any = null) => ({
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  in: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue({ data, error }),
  insert: jest.fn().mockResolvedValue({ data, error }),
  update: jest.fn().mockResolvedValue({ data, error }),
  delete: jest.fn().mockReturnThis(),
  then: jest.fn((resolve) => resolve({ data, error })),
});

describe('SupabasePermissionRepository', () => {
  let repository: SupabasePermissionRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new SupabasePermissionRepository(
      mockSupabaseClient as any,
      mockCache
    );
  });

  describe('getUserRoles', () => {
    it('should return user roles successfully', async () => {
      // Arrange
      const userId = UserId.generate();
      const mockData = [
        { role_name: 'DOCTOR' },
        { role_name: 'ADMIN' },
      ];

      const queryMock = createQueryMock(mockData);
      mockSupabaseClient.from.mockReturnValue(queryMock);

      // Act
      const result = await repository.getUserRoles(userId);

      // Assert
      expect(result).toEqual(['DOCTOR', 'ADMIN']);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('user_roles');
      expect(queryMock.select).toHaveBeenCalledWith('role_name');
      expect(queryMock.eq).toHaveBeenCalledWith('user_id', userId.value);
    });

    it('should return empty array when user has no roles', async () => {
      // Arrange
      const userId = UserId.generate();
      const queryMock = createQueryMock([]);
      mockSupabaseClient.from.mockReturnValue(queryMock);

      // Act
      const result = await repository.getUserRoles(userId);

      // Assert
      expect(result).toEqual([]);
    });

    it('should throw error when database query fails', async () => {
      // Arrange
      const userId = UserId.generate();
      const queryMock = createQueryMock(null, { message: 'Database error' });
      mockSupabaseClient.from.mockReturnValue(queryMock);

      // Act & Assert
      await expect(repository.getUserRoles(userId)).rejects.toThrow('Failed to get user roles');
    });
  });

  describe('getUserPermissions', () => {
    it('should return cached permissions if available', async () => {
      // Arrange
      const userId = UserId.generate();
      const cachedPermissions = ['users:read', 'users:write'];
      mockCache.get = jest.fn().mockResolvedValue(cachedPermissions);

      // Act
      const result = await repository.getUserPermissions(userId);

      // Assert
      expect(result).toEqual(cachedPermissions);
      expect(mockCache.get).toHaveBeenCalledWith(userId);
      expect(mockSupabaseClient.from).not.toHaveBeenCalled();
    });

    it('should query database and cache result when cache miss', async () => {
      // Arrange
      const userId = UserId.generate();
      mockCache.get = jest.fn().mockResolvedValue(null);
      mockCache.set = jest.fn().mockResolvedValue(undefined);

      // Mock user_permissions query (empty)
      const userPermsQueryMock = createQueryMock([]);

      // Mock user_roles query
      const userRolesQueryMock = createQueryMock([
        { role_id: 'role-123' },
      ]);

      // Mock role_permissions query
      const rolePermsQueryMock = createQueryMock([
        { permission_name: 'patients:read' },
        { permission_name: 'patients:write' },
      ]);

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'user_permissions') return userPermsQueryMock;
        if (table === 'user_roles') return userRolesQueryMock;
        if (table === 'role_permissions') return rolePermsQueryMock;
        return createQueryMock([]);
      });

      // Mock rpc for expand_permissions
      mockSupabaseClient.rpc.mockResolvedValue({
        data: ['patients:read', 'patients:write'],
        error: null,
      });

      // Act
      const result = await repository.getUserPermissions(userId);

      // Assert
      expect(result).toContain('patients:read');
      expect(result).toContain('patients:write');
      expect(mockCache.set).toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      // Arrange
      const userId = UserId.generate();
      mockCache.get = jest.fn().mockResolvedValue(null);

      // Mock user_permissions query with error
      const errorQueryMock = createQueryMock(null, { message: 'Database error' });
      mockSupabaseClient.from.mockReturnValue(errorQueryMock);

      // Mock rpc to return empty array (fallback behavior)
      mockSupabaseClient.rpc.mockResolvedValue({
        data: [],
        error: null,
      });

      // Act
      const result = await repository.getUserPermissions(userId);

      // Assert - should return empty array on error (graceful degradation)
      expect(result).toEqual([]);
    });
  });

  describe('getAllRoles', () => {
    it('should return all healthcare roles', async () => {
      // Arrange
      const mockData = [
        { role_name: 'ADMIN' },
        { role_name: 'DOCTOR' },
        { role_name: 'NURSE' },
        { role_name: 'PATIENT' },
      ];

      const queryMock = {
        ...createQueryMock(mockData),
        order: jest.fn().mockResolvedValue({ data: mockData, error: null }),
      };
      mockSupabaseClient.from.mockReturnValue(queryMock);

      // Act
      const result = await repository.getAllRoles();

      // Assert
      expect(result).toEqual(['ADMIN', 'DOCTOR', 'NURSE', 'PATIENT']);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('healthcare_roles');
    });

    it('should handle empty roles table', async () => {
      // Arrange
      const queryMock = {
        ...createQueryMock([]),
        order: jest.fn().mockResolvedValue({ data: [], error: null }),
      };
      mockSupabaseClient.from.mockReturnValue(queryMock);

      // Act
      const result = await repository.getAllRoles();

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('assignRole', () => {
    it('should assign role to user successfully', async () => {
      // Arrange
      const userId = UserId.generate();
      const roleType = 'DOCTOR';
      const assignedBy = 'admin-123';

      // Mock healthcare_roles query to get role_id
      const roleQueryMock = createQueryMock({ id: 'role-123' });

      // Mock user_roles insert
      const insertMock = createQueryMock({ id: 'role-assignment-123' });

      // Mock audit_logs insert
      const auditMock = createQueryMock({ id: 'audit-123' });

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'healthcare_roles') return roleQueryMock;
        if (table === 'user_roles') return insertMock;
        if (table === 'audit_logs') return auditMock;
        return createQueryMock(null);
      });

      mockCache.invalidate = jest.fn().mockResolvedValue(undefined);

      // Act
      await repository.assignRole(userId, roleType, assignedBy);

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('healthcare_roles');
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('user_roles');
      expect(insertMock.insert).toHaveBeenCalled();
      expect(mockCache.invalidate).toHaveBeenCalledWith(userId);
    });

    it('should invalidate cache after role assignment', async () => {
      // Arrange
      const userId = UserId.generate();
      const roleType = 'NURSE';
      const assignedBy = 'admin-456';

      // Mock healthcare_roles query
      const roleQueryMock = createQueryMock({ id: 'role-456' });

      // Mock user_roles insert
      const insertMock = createQueryMock({ id: 'role-assignment-456' });

      // Mock audit_logs insert
      const auditMock = createQueryMock({ id: 'audit-456' });

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'healthcare_roles') return roleQueryMock;
        if (table === 'user_roles') return insertMock;
        if (table === 'audit_logs') return auditMock;
        return createQueryMock(null);
      });

      mockCache.invalidate = jest.fn().mockResolvedValue(undefined);

      // Act
      await repository.assignRole(userId, roleType, assignedBy);

      // Assert
      expect(mockCache.invalidate).toHaveBeenCalledWith(userId);
    });

    it('should throw error when role assignment fails', async () => {
      // Arrange
      const userId = UserId.generate();
      const roleType = 'DOCTOR';
      const assignedBy = 'admin-123';

      // Mock healthcare_roles query
      const roleQueryMock = createQueryMock({ id: 'role-123' });

      // Mock user_roles insert with error
      const errorMock = createQueryMock(null, { message: 'Insert failed' });

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'healthcare_roles') return roleQueryMock;
        if (table === 'user_roles') return errorMock;
        return createQueryMock(null);
      });

      // Act & Assert
      await expect(
        repository.assignRole(userId, roleType, assignedBy)
      ).rejects.toThrow();
    });
  });

  describe('removeRole', () => {
    it('should remove role from user successfully', async () => {
      // Arrange
      const userId = UserId.generate();
      const roleType = 'DOCTOR';
      const removedBy = 'admin-123';

      // Mock getUserRoles to return multiple roles
      const rolesQueryMock = createQueryMock([
        { role_name: 'DOCTOR' },
        { role_name: 'NURSE' },
      ]);

      // Mock delete operation with proper chaining
      const deleteMock = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };
      // The second .eq() call should resolve the promise
      deleteMock.eq.mockImplementation(function(this: any) {
        // Check if this is the second call (after user_id)
        if (deleteMock.eq.mock.calls.length >= 2) {
          return Promise.resolve({ data: { count: 1 }, error: null });
        }
        return this; // Return this for chaining
      });

      // Mock audit_logs insert
      const auditMock = createQueryMock({ id: 'audit-123' });

      let callCount = 0;
      mockSupabaseClient.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return rolesQueryMock; // getUserRoles
        if (callCount === 2) return deleteMock; // delete user_role
        return auditMock; // audit log
      });

      mockCache.invalidate = jest.fn().mockResolvedValue(undefined);

      // Act
      await repository.removeRole(userId, roleType, removedBy);

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('user_roles');
      expect(deleteMock.delete).toHaveBeenCalled();
      expect(mockCache.invalidate).toHaveBeenCalledWith(userId);
    });

    it('should invalidate cache after role removal', async () => {
      // Arrange
      const userId = UserId.generate();
      const roleType = 'NURSE';
      const removedBy = 'admin-456';

      // Mock getUserRoles to return multiple roles
      const rolesQueryMock = createQueryMock([
        { role_name: 'DOCTOR' },
        { role_name: 'NURSE' },
      ]);

      // Mock delete operation with proper chaining
      const deleteMock = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };
      // The second .eq() call should resolve the promise
      deleteMock.eq.mockImplementation(function(this: any) {
        if (deleteMock.eq.mock.calls.length >= 2) {
          return Promise.resolve({ data: { count: 1 }, error: null });
        }
        return this;
      });

      // Mock audit_logs insert
      const auditMock = createQueryMock({ id: 'audit-456' });

      let callCount = 0;
      mockSupabaseClient.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return rolesQueryMock; // getUserRoles
        if (callCount === 2) return deleteMock; // delete user_role
        return auditMock; // audit log
      });

      mockCache.invalidate = jest.fn().mockResolvedValue(undefined);

      // Act
      await repository.removeRole(userId, roleType, removedBy);

      // Assert
      expect(mockCache.invalidate).toHaveBeenCalledWith(userId);
    });
  });

  describe('hasPermission', () => {
    it('should return true when user has permission', async () => {
      // Arrange
      const userId = UserId.generate();
      const resource = 'users';
      const action = 'read';

      mockCache.get = jest.fn().mockResolvedValue(['users:read', 'users:write']);

      // Act
      const result = await repository.hasPermission(userId, resource, action);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when user does not have permission', async () => {
      // Arrange
      const userId = UserId.generate();
      const resource = 'users';
      const action = 'delete';

      mockCache.get = jest.fn().mockResolvedValue(['users:read', 'users:write']);

      // Act
      const result = await repository.hasPermission(userId, resource, action);

      // Assert
      expect(result).toBe(false);
    });

    it('should handle wildcard permissions', async () => {
      // Arrange
      const userId = UserId.generate();
      const resource = 'users';
      const action = 'read';

      mockCache.get = jest.fn().mockResolvedValue(['*']); // Admin wildcard

      // Act
      const result = await repository.hasPermission(userId, resource, action);

      // Assert
      expect(result).toBe(true);
    });
  });
});

