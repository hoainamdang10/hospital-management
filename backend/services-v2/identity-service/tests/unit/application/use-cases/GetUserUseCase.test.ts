/**
 * GetUserUseCase - Unit Tests
 * 
 * Tests all scenarios for retrieving user information including:
 * - Happy path
 * - User not found
 * - Authorization checks
 * - Error handling
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { GetUserUseCase, GetUserRequest } from '../../../../src/application/use-cases/GetUserUseCase';
import { IUserRepository } from '../../../../src/application/repositories/IUserRepository';
import { createMockUser } from '../../../helpers/user-test-helper';

describe('GetUserUseCase', () => {
  let useCase: GetUserUseCase;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockLogger: any;

  beforeEach(() => {
    mockUserRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findAll: jest.fn()
    } as any;

    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    };

    useCase = new GetUserUseCase(mockUserRepository, mockLogger);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Happy Path', () => {
    it('should retrieve user with valid ID', async () => {
      // Arrange
      const mockUser = createMockUser({
        userId: 'user-123',
        email: 'test@hospital.vn',
        fullName: 'Nguyễn Văn Test',
        roleType: 'PATIENT',
        isActive: true,
        isEmailVerified: true
      });

      mockUserRepository.findById.mockResolvedValue(mockUser);

      const request: GetUserRequest = {
        userId: 'user-123',
        requesterId: 'admin-123'
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user?.id).toBe('user-123');
      expect(result.user?.email).toBe('test@hospital.vn');
      expect(result.user?.fullName).toBe('Nguyễn Văn Test');
      expect(result.user?.roleType).toBe('PATIENT');
      expect(result.user?.isActive).toBe(true);
      expect(mockUserRepository.findById).toHaveBeenCalledWith(
        expect.objectContaining({ value: 'user-123' })
      );
    });

    it('should return all user fields', async () => {
      // Arrange
      const mockUser = createMockUser({
        userId: 'user-123',
        email: 'test@hospital.vn',
        fullName: 'Nguyễn Văn Test',
        phoneNumber: '0912345678',
        address: '123 Test Street',
        roleType: 'PATIENT',
        isActive: true,
        isEmailVerified: true
      });

      mockUserRepository.findById.mockResolvedValue(mockUser);

      const request: GetUserRequest = {
        userId: 'user-123',
        requesterId: 'admin-123'
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(true);
      expect(result.user?.phoneNumber).toBe('0912345678');
      expect(result.user?.citizenId).toBe('001234567890');
      expect(result.user?.gender).toBe('male');
      expect(result.user?.address).toBe('123 Test Street');
      expect(result.user?.createdAt).toBeDefined();
      expect(result.user?.updatedAt).toBeDefined();
    });

    it('should log access for audit', async () => {
      // Arrange
      const mockUser = createMockUser({
        userId: 'user-123',
        email: 'test@hospital.vn',
        fullName: 'Test User',
        roleType: 'PATIENT',
        isActive: true,
        isEmailVerified: true
      });

      mockUserRepository.findById.mockResolvedValue(mockUser);

      const request: GetUserRequest = {
        userId: 'user-123',
        requesterId: 'admin-123'
      };

      // Act
      await useCase.execute(request);

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith(
        'User information accessed',
        expect.objectContaining({
          userId: 'user-123',
          requesterId: 'admin-123',
          timestamp: expect.any(String)
        })
      );
    });
  });

  describe('User Not Found', () => {
    it('should return error when user does not exist', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(null);

      const request: GetUserRequest = {
        userId: 'non-existent-user',
        requesterId: 'admin-123'
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('User not found');
      expect(result.message).toContain('Không tìm thấy');
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'User not found',
        expect.objectContaining({
          userId: 'non-existent-user',
          requesterId: 'admin-123'
        })
      );
    });
  });

  describe('Validation', () => {
    it('should reject missing userId', async () => {
      // Arrange
      const request: GetUserRequest = {
        userId: '',
        requesterId: 'admin-123'
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Missing required fields');
      expect(result.message).toContain('Thiếu thông tin');
    });

    it('should reject missing requesterId', async () => {
      // Arrange
      const request: GetUserRequest = {
        userId: 'user-123',
        requesterId: ''
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Missing required fields');
    });
  });

  describe('Error Handling', () => {
    it('should handle repository errors gracefully', async () => {
      // Arrange
      mockUserRepository.findById.mockRejectedValue(new Error('Database connection failed'));

      const request: GetUserRequest = {
        userId: 'user-123',
        requesterId: 'admin-123'
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should log errors properly', async () => {
      // Arrange
      const error = new Error('Unexpected error');
      mockUserRepository.findById.mockRejectedValue(error);

      const request: GetUserRequest = {
        userId: 'user-123',
        requesterId: 'admin-123'
      };

      // Act
      await useCase.execute(request);

      // Assert
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to get user'),
        expect.objectContaining({
          userId: 'user-123',
          requesterId: 'admin-123',
          error: 'Unexpected error'
        })
      );
    });
  });
});

