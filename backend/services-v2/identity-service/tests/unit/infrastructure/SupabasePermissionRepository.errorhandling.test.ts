/**
 * Error Handling Tests for SupabasePermissionRepository
 * Tests proper error handling in nested queries
 * 
 * @author Hospital Management Team
 * @version 1.0.0
 */

import { SupabasePermissionRepository } from '../../../src/infrastructure/repositories/SupabasePermissionRepository';

describe('SupabasePermissionRepository - Error Handling Tests', () => {
  let repository: SupabasePermissionRepository;
  let mockSupabaseClient: any;

  beforeEach(() => {
    // Create mock Supabase client
    mockSupabaseClient = {
      from: jest.fn()
    };

    // Create repository instance
    repository = new SupabasePermissionRepository(
      mockSupabaseClient,
      {} as any // cacheService
    );
  });

  describe('getRolePermissions() - Nested Query Error Handling', () => {
    it('should handle role not found gracefully', async () => {
      // Arrange
      const mockRoleQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'No rows found' }
        })
      };

      mockSupabaseClient.from.mockReturnValue(mockRoleQuery);

      // Act
      const result = await repository.getRolePermissions('NON_EXISTENT_ROLE');

      // Assert
      expect(result).toEqual([]);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('healthcare_roles');
    });

    it('should handle database error in role query', async () => {
      // Arrange
      const mockRoleQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST000', message: 'Database error' }
        })
      };

      mockSupabaseClient.from.mockReturnValue(mockRoleQuery);

      // Act
      const result = await repository.getRolePermissions('ADMIN');

      // Assert
      expect(result).toEqual([]);
    });

    it('should successfully get permissions when role exists', async () => {
      // Arrange
      const mockRoleId = 'role-123';
      const mockPermissions = [
        { permission_name: 'user:read' },
        { permission_name: 'user:write' }
      ];

      let callCount = 0;
      mockSupabaseClient.from.mockImplementation((table: string) => {
        callCount++;

        if (table === 'healthcare_roles') {
          // First call: get role ID
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { id: mockRoleId },
              error: null
            })
          };
        } else if (table === 'role_permissions') {
          // Second call: get permissions
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            then: jest.fn().mockResolvedValue({
              data: mockPermissions,
              error: null
            })
          };
        }

        // Default return for other tables
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          then: jest.fn().mockResolvedValue({ data: null, error: null })
        };
      });

      // Act
      const result = await repository.getRolePermissions('ADMIN');

      // Assert
      expect(result).toEqual(['user:read', 'user:write']);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('healthcare_roles');
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('role_permissions');
    });

    it('should handle error in permissions query', async () => {
      // Arrange
      const mockRoleId = 'role-123';

      let callCount = 0;
      mockSupabaseClient.from.mockImplementation((table: string) => {
        callCount++;

        if (table === 'healthcare_roles') {
          // First call: get role ID (success)
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { id: mockRoleId },
              error: null
            })
          };
        } else if (table === 'role_permissions') {
          // Second call: get permissions (error)
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            then: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST000', message: 'Database error' }
            })
          };
        }

        // Default return for other tables
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          then: jest.fn().mockResolvedValue({ data: null, error: null })
        };
      });

      // Act & Assert
      await expect(repository.getRolePermissions('ADMIN')).rejects.toThrow('Failed to get role permissions');
    });

    it('should handle empty permissions array', async () => {
      // Arrange
      const mockRoleId = 'role-123';

      let callCount = 0;
      mockSupabaseClient.from.mockImplementation((table: string) => {
        callCount++;

        if (table === 'healthcare_roles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { id: mockRoleId },
              error: null
            })
          };
        } else if (table === 'role_permissions') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            then: jest.fn().mockResolvedValue({
              data: [],
              error: null
            })
          };
        }

        // Default return for other tables
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          then: jest.fn().mockResolvedValue({ data: null, error: null })
        };
      });

      // Act
      const result = await repository.getRolePermissions('ADMIN');

      // Assert
      expect(result).toEqual([]);
    });

    it('should handle null permissions data', async () => {
      // Arrange
      const mockRoleId = 'role-123';

      let callCount = 0;
      mockSupabaseClient.from.mockImplementation((table: string) => {
        callCount++;

        if (table === 'healthcare_roles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { id: mockRoleId },
              error: null
            })
          };
        } else if (table === 'role_permissions') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            then: jest.fn().mockResolvedValue({
              data: null,
              error: null
            })
          };
        }

        // Default return for other tables
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          then: jest.fn().mockResolvedValue({ data: null, error: null })
        };
      });

      // Act
      const result = await repository.getRolePermissions('ADMIN');

      // Assert
      expect(result).toEqual([]);
    });

    it('should normalize role type to lowercase', async () => {
      // Arrange
      const mockRoleId = 'role-123';
      const mockEq = jest.fn().mockReturnThis();

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: mockEq,
        single: jest.fn().mockResolvedValue({
          data: { id: mockRoleId },
          error: null
        })
      });

      // Act
      await repository.getRolePermissions('ADMIN');

      // Assert
      expect(mockEq).toHaveBeenCalledWith('role_name', 'admin');
    });

    it('should handle exception thrown in query', async () => {
      // Arrange
      mockSupabaseClient.from.mockImplementation(() => {
        throw new Error('Network error');
      });

      // Act
      const result = await repository.getRolePermissions('ADMIN');

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty role type', async () => {
      // Arrange
      const mockRoleQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'No rows found' }
        })
      };

      mockSupabaseClient.from.mockReturnValue(mockRoleQuery);

      // Act
      const result = await repository.getRolePermissions('');

      // Assert
      expect(result).toEqual([]);
    });

    it('should handle special characters in role type', async () => {
      // Arrange
      const mockRoleQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'No rows found' }
        })
      };

      mockSupabaseClient.from.mockReturnValue(mockRoleQuery);

      // Act
      const result = await repository.getRolePermissions("ADMIN'; DROP TABLE users; --");

      // Assert
      expect(result).toEqual([]);
    });
  });
});

