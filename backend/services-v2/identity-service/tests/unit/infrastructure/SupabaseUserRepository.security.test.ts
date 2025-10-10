/**
 * Security Tests for SupabaseUserRepository
 * Tests SQL injection prevention and input validation
 * 
 * @author Hospital Management Team
 * @version 1.0.0
 */

import { SupabaseUserRepository } from '../../../src/infrastructure/repositories/SupabaseUserRepository';
import { createClient } from '@supabase/supabase-js';

// Mock Supabase client
jest.mock('@supabase/supabase-js');

describe('SupabaseUserRepository - Security Tests', () => {
  let repository: SupabaseUserRepository;
  let mockSupabaseClient: any;
  let mockQuery: any;

  beforeEach(() => {
    // Create mock query chain
    mockQuery = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      then: jest.fn().mockResolvedValue({ data: [], error: null })
    };

    // Create mock Supabase client
    mockSupabaseClient = {
      from: jest.fn().mockReturnValue(mockQuery),
      auth: {
        admin: {
          listUsers: jest.fn(),
          deleteUser: jest.fn()
        }
      }
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabaseClient);

    // Create repository instance
    repository = new SupabaseUserRepository(
      mockSupabaseClient,
      {} as any, // permissionRepository
      {} as any, // cacheService
      {} as any, // circuitBreaker
      { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() } as any // logger
    );
  });

  describe('SQL Injection Prevention - list()', () => {
    it('should escape % wildcard in search_term', async () => {
      // Arrange
      const options = {
        filters: {
          search_term: '%'
        }
      };

      // Act
      await repository.list(options);

      // Assert
      expect(mockQuery.or).toHaveBeenCalledWith(
        expect.stringContaining('\\%')
      );
      expect(mockQuery.or).not.toHaveBeenCalledWith(
        expect.stringMatching(/[^\\]%/)
      );
    });

    it('should escape _ wildcard in search_term', async () => {
      // Arrange
      const options = {
        filters: {
          search_term: '_'
        }
      };

      // Act
      await repository.list(options);

      // Assert
      expect(mockQuery.or).toHaveBeenCalledWith(
        expect.stringContaining('\\_')
      );
    });

    it('should escape backslash in search_term', async () => {
      // Arrange
      const options = {
        filters: {
          search_term: '\\'
        }
      };

      // Act
      await repository.list(options);

      // Assert
      expect(mockQuery.or).toHaveBeenCalledWith(
        expect.stringContaining('\\\\')
      );
    });

    it('should escape multiple special characters', async () => {
      // Arrange
      const options = {
        filters: {
          search_term: '%_\\'
        }
      };

      // Act
      await repository.list(options);

      // Assert
      const orCall = mockQuery.or.mock.calls[0][0];
      expect(orCall).toContain('\\%');
      expect(orCall).toContain('\\_');
      expect(orCall).toContain('\\\\');
    });

    it('should handle SQL injection attempt with OR clause', async () => {
      // Arrange
      const options = {
        filters: {
          search_term: "' OR '1'='1"
        }
      };

      // Act
      await repository.list(options);

      // Assert
      // Should escape the single quote and not execute as SQL
      expect(mockQuery.or).toHaveBeenCalled();
      // The query should be safe (no actual SQL injection)
    });

    it('should handle normal search terms without escaping', async () => {
      // Arrange
      const options = {
        filters: {
          search_term: 'John Doe'
        }
      };

      // Act
      await repository.list(options);

      // Assert
      expect(mockQuery.or).toHaveBeenCalledWith(
        expect.stringContaining('John Doe')
      );
    });

    it('should handle Vietnamese characters', async () => {
      // Arrange
      const options = {
        filters: {
          search_term: 'Nguyễn Văn A'
        }
      };

      // Act
      await repository.list(options);

      // Assert
      expect(mockQuery.or).toHaveBeenCalledWith(
        expect.stringContaining('Nguyễn Văn A')
      );
    });

    it('should handle empty search_term', async () => {
      // Arrange
      const options = {
        filters: {
          search_term: ''
        }
      };

      // Act
      await repository.list(options);

      // Assert
      expect(mockQuery.or).not.toHaveBeenCalled();
    });

    it('should handle undefined search_term', async () => {
      // Arrange
      const options = {
        filters: {
          role_type: 'admin'
        }
      };

      // Act
      await repository.list(options);

      // Assert
      expect(mockQuery.or).not.toHaveBeenCalled();
      expect(mockQuery.eq).toHaveBeenCalledWith('role_type', 'admin');
    });
  });

  describe('SQL Injection Prevention - count()', () => {
    beforeEach(() => {
      mockQuery.then = jest.fn().mockResolvedValue({ count: 0, error: null });
    });

    it('should escape % wildcard in search_term', async () => {
      // Arrange
      const filters = {
        search_term: '%'
      };

      // Act
      await repository.count(filters);

      // Assert
      expect(mockQuery.or).toHaveBeenCalledWith(
        expect.stringContaining('\\%')
      );
    });

    it('should escape _ wildcard in search_term', async () => {
      // Arrange
      const filters = {
        search_term: '_'
      };

      // Act
      await repository.count(filters);

      // Assert
      expect(mockQuery.or).toHaveBeenCalledWith(
        expect.stringContaining('\\_')
      );
    });

    it('should escape backslash in search_term', async () => {
      // Arrange
      const filters = {
        search_term: '\\'
      };

      // Act
      await repository.count(filters);

      // Assert
      expect(mockQuery.or).toHaveBeenCalledWith(
        expect.stringContaining('\\\\')
      );
    });

    it('should handle multiple special characters', async () => {
      // Arrange
      const filters = {
        search_term: '%_\\'
      };

      // Act
      await repository.count(filters);

      // Assert
      const orCall = mockQuery.or.mock.calls[0][0];
      expect(orCall).toContain('\\%');
      expect(orCall).toContain('\\_');
      expect(orCall).toContain('\\\\');
    });
  });

  describe('Edge Cases', () => {
    it('should handle null search_term', async () => {
      // Arrange
      const options = {
        filters: {
          search_term: null
        }
      };

      // Act
      await repository.list(options);

      // Assert
      expect(mockQuery.or).not.toHaveBeenCalled();
    });

    it('should handle numeric search_term', async () => {
      // Arrange
      const options = {
        filters: {
          search_term: 123
        }
      };

      // Act
      await repository.list(options);

      // Assert
      expect(mockQuery.or).toHaveBeenCalled();
    });

    it('should handle object search_term', async () => {
      // Arrange
      const options = {
        filters: {
          search_term: { malicious: 'payload' }
        }
      };

      // Act
      await repository.list(options);

      // Assert
      // Should convert to string and escape
      expect(mockQuery.or).toHaveBeenCalled();
    });
  });

  describe('Filter Key Validation - list()', () => {
    it('should allow valid filter keys', async () => {
      // Arrange
      const options = {
        filters: {
          role_type: 'admin',
          is_active: true,
          is_verified: true,
          gender: 'male'
        }
      };

      // Act
      await repository.list(options);

      // Assert
      expect(mockQuery.eq).toHaveBeenCalledWith('role_type', 'admin');
      expect(mockQuery.eq).toHaveBeenCalledWith('is_active', true);
      expect(mockQuery.eq).toHaveBeenCalledWith('is_verified', true);
      expect(mockQuery.eq).toHaveBeenCalledWith('gender', 'male');
    });

    it('should reject invalid filter key', async () => {
      // Arrange
      const options = {
        filters: {
          password: 'malicious'
        }
      };

      // Act & Assert
      await expect(repository.list(options)).rejects.toThrow(
        'Invalid filter key: password'
      );
    });

    it('should reject SQL injection attempt via filter key', async () => {
      // Arrange
      const options = {
        filters: {
          "'; DROP TABLE users; --": 'malicious'
        }
      };

      // Act & Assert
      await expect(repository.list(options)).rejects.toThrow(
        'Invalid filter key'
      );
    });

    it('should reject unauthorized column access', async () => {
      // Arrange
      const options = {
        filters: {
          created_at: '2024-01-01'
        }
      };

      // Act & Assert
      await expect(repository.list(options)).rejects.toThrow(
        'Invalid filter key: created_at'
      );
    });
  });

  describe('Filter Key Validation - count()', () => {
    beforeEach(() => {
      mockQuery.then = jest.fn().mockResolvedValue({ count: 0, error: null });
    });

    it('should allow valid filter keys', async () => {
      // Arrange
      const filters = {
        role_type: 'admin',
        is_active: true
      };

      // Act
      await repository.count(filters);

      // Assert
      expect(mockQuery.eq).toHaveBeenCalledWith('role_type', 'admin');
      expect(mockQuery.eq).toHaveBeenCalledWith('is_active', true);
    });

    it('should reject invalid filter key', async () => {
      // Arrange
      const filters = {
        password_hash: 'malicious'
      };

      // Act & Assert
      await expect(repository.count(filters)).rejects.toThrow(
        'Invalid filter key: password_hash'
      );
    });

    it('should reject multiple invalid keys', async () => {
      // Arrange
      const filters = {
        role_type: 'admin',
        unauthorized_column: 'value'
      };

      // Act & Assert
      await expect(repository.count(filters)).rejects.toThrow(
        'Invalid filter key: unauthorized_column'
      );
    });
  });
});

