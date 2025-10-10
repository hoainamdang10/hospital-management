/**
 * ListUsersUseCase - Unit Tests
 * 
 * Tests all scenarios for listing users including:
 * - Pagination
 * - Filtering by role and status
 * - Search functionality
 * - Error handling
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { ListUsersUseCase, ListUsersRequest } from '../../../../src/application/use-cases/ListUsersUseCase';
import { IUserRepository } from '../../../../src/application/repositories/IUserRepository';
import { createMockUser } from '../../../helpers/user-test-helper';
import { createCircuitBreakerStub } from '../../../helpers/circuit-breaker-test-helper';

describe('ListUsersUseCase', () => {
  let useCase: ListUsersUseCase;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockLogger: any;
  let circuitBreaker = createCircuitBreakerStub();

  beforeEach(() => {
    mockUserRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findAll: jest.fn(),
      list: jest.fn(),
      count: jest.fn()
    } as any;

    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    };

    circuitBreaker = createCircuitBreakerStub();

    useCase = new ListUsersUseCase(mockUserRepository, circuitBreaker, mockLogger);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Happy Path', () => {
    it('should list users with default pagination', async () => {
      // Arrange
      const mockUsers = [
        createMockUser({
          userId: 'user-1',
          email: 'user1@hospital.vn',
          fullName: 'User One',
          roleType: 'PATIENT',
          isActive: true,
          isEmailVerified: true
        }),
        createMockUser({
          userId: 'user-2',
          email: 'user2@hospital.vn',
          fullName: 'User Two',
          roleType: 'DOCTOR',
          isActive: true,
          isEmailVerified: true
        })
      ];

      mockUserRepository.list.mockResolvedValue(mockUsers);
      mockUserRepository.count.mockResolvedValue(50);

      const request: ListUsersRequest = {
        requesterId: 'admin-123'
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(true);
      expect(result.users).toHaveLength(2);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 50,
        totalPages: 3
      });
      expect(mockUserRepository.list).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 20,
          offset: 0
        })
      );
    });

    it('should list users with custom pagination', async () => {
      // Arrange
      const mockUsers = [
        createMockUser({
          userId: 'user-1',
          email: 'user1@hospital.vn',
          fullName: 'User One',
          roleType: 'PATIENT',
          isActive: true,
          isEmailVerified: true
        })
      ];

      mockUserRepository.list.mockResolvedValue(mockUsers);
      mockUserRepository.count.mockResolvedValue(100);

      const request: ListUsersRequest = {
        requesterId: 'admin-123',
        page: 2,
        limit: 10
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(true);
      expect(result.pagination).toEqual({
        page: 2,
        limit: 10,
        total: 100,
        totalPages: 10
      });
      expect(mockUserRepository.list).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 10,
          offset: 10 // (page 2 - 1) * 10
        })
      );
    });

    it('should return all user fields', async () => {
      // Arrange
      const mockUser = createMockUser({
        userId: 'user-1',
        email: 'user1@hospital.vn',
        fullName: 'User One',
        phoneNumber: '0912345678',
        roleType: 'PATIENT',
        isActive: true,
        isEmailVerified: true
      });

      mockUserRepository.list.mockResolvedValue([mockUser]);
      mockUserRepository.count.mockResolvedValue(1);

      const request: ListUsersRequest = {
        requesterId: 'admin-123'
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.users?.[0]).toEqual({
        id: 'user-1',
        email: 'user1@hospital.vn',
        fullName: 'User One',
        phoneNumber: '0912345678',
        roleType: 'patient',
        roles: ['patient'], // Pure RBAC: User now has roles array
        isActive: true,
        isEmailVerified: true,
        lastLoginAt: undefined,
        createdAt: expect.any(String)
      });
    });
  });

  describe('Filtering', () => {
    it('should filter by role type (lowercase input)', async () => {
      // Arrange
      const mockUsers = [
        createMockUser({
          userId: 'doctor-1',
          email: 'doctor1@hospital.vn',
          fullName: 'Doctor One',
          roleType: 'DOCTOR',
          isActive: true,
          isEmailVerified: true
        })
      ];

      mockUserRepository.list.mockResolvedValue(mockUsers);
      mockUserRepository.count.mockResolvedValue(1);

      const request: ListUsersRequest = {
        requesterId: 'admin-123',
        roleType: 'doctor'
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(true);
      expect(mockUserRepository.list).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: expect.objectContaining({
            role_type: 'doctor' // Normalized to lowercase
          })
        })
      );
    });

    it('should filter by role type (uppercase input - case insensitive)', async () => {
      // Arrange
      const mockUsers = [
        createMockUser({
          userId: 'doctor-1',
          email: 'doctor1@hospital.vn',
          fullName: 'Doctor One',
          roleType: 'DOCTOR',
          isActive: true,
          isEmailVerified: true
        })
      ];

      mockUserRepository.list.mockResolvedValue(mockUsers);
      mockUserRepository.count.mockResolvedValue(1);

      const request: ListUsersRequest = {
        requesterId: 'admin-123',
        roleType: 'DOCTOR' // Uppercase input
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(true);
      expect(mockUserRepository.list).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: expect.objectContaining({
            role_type: 'doctor' // Should be normalized to lowercase
          })
        })
      );
    });

    it('should filter by active status', async () => {
      // Arrange
      mockUserRepository.list.mockResolvedValue([]);
      mockUserRepository.count.mockResolvedValue(0);

      const request: ListUsersRequest = {
        requesterId: 'admin-123',
        isActive: false
      };

      // Act
      await useCase.execute(request);

      // Assert
      expect(mockUserRepository.list).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: expect.objectContaining({
            is_active: false
          })
        })
      );
    });

    it('should search by term', async () => {
      // Arrange
      mockUserRepository.list.mockResolvedValue([]);
      mockUserRepository.count.mockResolvedValue(0);

      const request: ListUsersRequest = {
        requesterId: 'admin-123',
        searchTerm: 'john'
      };

      // Act
      await useCase.execute(request);

      // Assert
      expect(mockUserRepository.list).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: expect.objectContaining({
            search_term: 'john'
          })
        })
      );
    });

    it('should combine multiple filters', async () => {
      // Arrange
      mockUserRepository.list.mockResolvedValue([]);
      mockUserRepository.count.mockResolvedValue(0);

      const request: ListUsersRequest = {
        requesterId: 'admin-123',
        roleType: 'doctor',
        isActive: true,
        searchTerm: 'nguyen'
      };

      // Act
      await useCase.execute(request);

      // Assert
      expect(mockUserRepository.list).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: expect.objectContaining({
            role_type: 'doctor',
            is_active: true,
            search_term: 'nguyen'
          })
        })
      );
    });
  });

  describe('Pagination Validation', () => {
    it('should enforce maximum limit of 100', async () => {
      // Arrange
      mockUserRepository.list.mockResolvedValue([]);
      mockUserRepository.count.mockResolvedValue(0);

      const request: ListUsersRequest = {
        requesterId: 'admin-123',
        limit: 200 // Exceeds max
      };

      // Act
      await useCase.execute(request);

      // Assert
      expect(mockUserRepository.list).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 100 // Capped at max
        })
      );
    });

    it('should enforce minimum page of 1', async () => {
      // Arrange
      mockUserRepository.list.mockResolvedValue([]);
      mockUserRepository.count.mockResolvedValue(0);

      const request: ListUsersRequest = {
        requesterId: 'admin-123',
        page: -5 // Invalid
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.pagination?.page).toBe(1);
    });
  });

  describe('Audit Logging', () => {
    it('should log list access for audit', async () => {
      // Arrange
      mockUserRepository.list.mockResolvedValue([]);
      mockUserRepository.count.mockResolvedValue(0);

      const request: ListUsersRequest = {
        requesterId: 'admin-123',
        page: 1,
        limit: 20,
        roleType: 'doctor'
      };

      // Act
      await useCase.execute(request);

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Users list accessed',
        expect.objectContaining({
          requesterId: 'admin-123',
          page: 1,
          limit: 20,
          filters: expect.objectContaining({
            roleType: 'doctor'
          }),
          resultCount: 0,
          timestamp: expect.any(String)
        })
      );
    });
  });

  describe('Validation', () => {
    it('should reject missing requesterId', async () => {
      // Arrange
      const request: ListUsersRequest = {
        requesterId: ''
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Missing requester ID');
    });
  });

  describe('Error Handling', () => {
    it('should handle repository errors gracefully', async () => {
      // Arrange
      mockUserRepository.list.mockRejectedValue(new Error('Database error'));

      const request: ListUsersRequest = {
        requesterId: 'admin-123'
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(false);
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
});
