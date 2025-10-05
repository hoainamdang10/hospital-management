/**
 * DisableMFAUseCase - Unit Tests
 * 
 * Tests all scenarios for disabling MFA including:
 * - Happy path with verification
 * - Invalid verification code
 * - User not found
 * - Error handling
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { DisableMFAUseCase, DisableMFARequest } from '../../../../src/application/use-cases/DisableMFAUseCase';
import { VerifyMFAUseCase } from '../../../../src/application/use-cases/VerifyMFAUseCase';
import { IUserRepository } from '../../../../src/application/repositories/IUserRepository';
import { IMFAService } from '../../../../src/application/services/IMFAService';
import { createMockUser } from '../../../helpers/user-test-helper';

describe('DisableMFAUseCase', () => {
  let useCase: DisableMFAUseCase;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockMFAService: jest.Mocked<IMFAService>;
  let mockVerifyMFAUseCase: jest.Mocked<VerifyMFAUseCase>;
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

    mockMFAService = {
      enableMFA: jest.fn(),
      disableMFA: jest.fn(),
      verifyCode: jest.fn(),
      generateBackupCodes: jest.fn(),
      validateBackupCode: jest.fn(),
      isMFAEnabled: jest.fn(),
      getMFASettings: jest.fn(),
      updateMFASettings: jest.fn(),
      checkRateLimit: jest.fn(),
      recordFailedAttempt: jest.fn(),
      clearFailedAttempts: jest.fn()
    } as any;

    mockVerifyMFAUseCase = {
      execute: jest.fn()
    } as any;

    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    };

    useCase = new DisableMFAUseCase(
      mockUserRepository,
      mockMFAService,
      mockVerifyMFAUseCase,
      mockLogger
    );

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('Happy Path', () => {
    it('should disable MFA with valid verification code', async () => {
      // Arrange
      const mockUser = createMockUser({
        userId: 'user-123',
        email: 'test@hospital.vn',
        fullName: 'Test User',
        roleType: 'DOCTOR',
        isActive: true,
        isEmailVerified: true
      });

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockVerifyMFAUseCase.execute.mockResolvedValue({
        success: true,
        valid: true,
        message: 'Verification successful'
      });
      mockMFAService.disableMFA.mockResolvedValue(undefined);

      const request: DisableMFARequest = {
        userId: 'user-123',
        verificationCode: '123456',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0'
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toContain('MFA đã được tắt thành công');
      expect(mockVerifyMFAUseCase.execute).toHaveBeenCalledWith({
        userId: 'user-123',
        code: '123456',
        attemptType: 'disable',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0'
      });
      expect(mockMFAService.disableMFA).toHaveBeenCalledWith('user-123');
      expect(mockLogger.info).toHaveBeenCalledWith(
        'MFA disabled successfully',
        expect.objectContaining({ userId: 'user-123' })
      );
    });

    it('should log MFA disable process', async () => {
      // Arrange
      const mockUser = createMockUser({
        userId: 'user-123',
        email: 'test@hospital.vn',
        fullName: 'Test User',
        roleType: 'DOCTOR',
        isActive: true,
        isEmailVerified: true
      });

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockVerifyMFAUseCase.execute.mockResolvedValue({
        success: true,
        valid: true,
        message: 'Verification successful'
      });
      mockMFAService.disableMFA.mockResolvedValue(undefined);

      const request: DisableMFARequest = {
        userId: 'user-123',
        verificationCode: '123456'
      };

      // Act
      await useCase.execute(request);

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Starting MFA disable',
        expect.objectContaining({ userId: 'user-123' })
      );
    });
  });

  describe('Invalid Verification Code', () => {
    it('should reject disable request with invalid code', async () => {
      // Arrange
      const mockUser = createMockUser({
        userId: 'user-123',
        email: 'test@hospital.vn',
        fullName: 'Test User',
        roleType: 'DOCTOR',
        isActive: true,
        isEmailVerified: true
      });

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockVerifyMFAUseCase.execute.mockResolvedValue({
        success: true,
        valid: false,
        message: 'Invalid code',
        error: 'INVALID_CODE'
      });

      const request: DisableMFARequest = {
        userId: 'user-123',
        verificationCode: '000000'
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('INVALID_VERIFICATION_CODE');
      expect(result.message).toContain('Mã xác thực không đúng');
      expect(mockMFAService.disableMFA).not.toHaveBeenCalled();
    });

    it('should not disable MFA if verification fails', async () => {
      // Arrange
      const mockUser = createMockUser({
        userId: 'user-123',
        email: 'test@hospital.vn',
        fullName: 'Test User',
        roleType: 'DOCTOR',
        isActive: true,
        isEmailVerified: true
      });

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockVerifyMFAUseCase.execute.mockResolvedValue({
        success: false,
        valid: false,
        message: 'Verification failed',
        error: 'VERIFICATION_FAILED'
      });

      const request: DisableMFARequest = {
        userId: 'user-123',
        verificationCode: '123456'
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(false);
      expect(mockMFAService.disableMFA).not.toHaveBeenCalled();
    });
  });

  describe('Validation', () => {
    it('should reject missing userId', async () => {
      // Arrange
      const request: DisableMFARequest = {
        userId: '',
        verificationCode: '123456'
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('VALIDATION_ERROR');
      expect(result.message).toContain('User ID là bắt buộc');
    });

    it('should reject missing verification code', async () => {
      // Arrange
      const request: DisableMFARequest = {
        userId: 'user-123',
        verificationCode: ''
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain('Mã xác thực là bắt buộc');
    });

    it('should reject invalid code length', async () => {
      // Arrange
      const request: DisableMFARequest = {
        userId: 'user-123',
        verificationCode: '12345' // Too short
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain('6 hoặc 8 ký tự');
    });

    it('should accept 6-digit code', async () => {
      // Arrange
      const mockUser = createMockUser({
        userId: 'user-123',
        email: 'test@hospital.vn',
        fullName: 'Test User',
        roleType: 'DOCTOR',
        isActive: true,
        isEmailVerified: true
      });

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockVerifyMFAUseCase.execute.mockResolvedValue({
        success: true,
        valid: true,
        message: 'Success'
      });
      mockMFAService.disableMFA.mockResolvedValue(undefined);

      const request: DisableMFARequest = {
        userId: 'user-123',
        verificationCode: '123456'
      };

      // Act
      const result = await useCase.execute(request);

      // Assert - Should not fail validation
      expect(result.error).not.toBe('VALIDATION_ERROR');
    });

    it('should accept 8-character backup code', async () => {
      // Arrange
      const mockUser = createMockUser({
        userId: 'user-123',
        email: 'test@hospital.vn',
        fullName: 'Test User',
        roleType: 'DOCTOR',
        isActive: true,
        isEmailVerified: true
      });

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockVerifyMFAUseCase.execute.mockResolvedValue({
        success: true,
        valid: true,
        message: 'Success'
      });
      mockMFAService.disableMFA.mockResolvedValue(undefined);

      const request: DisableMFARequest = {
        userId: 'user-123',
        verificationCode: 'ABCD1234'
      };

      // Act
      const result = await useCase.execute(request);

      // Assert - Should not fail validation
      expect(result.error).not.toBe('VALIDATION_ERROR');
    });
  });

  describe('User Not Found', () => {
    it('should return error when user does not exist', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(null);

      const request: DisableMFARequest = {
        userId: 'non-existent-user',
        verificationCode: '123456'
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('USER_NOT_FOUND');
      expect(result.message).toContain('Người dùng không tồn tại');
      expect(mockVerifyMFAUseCase.execute).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle repository errors gracefully', async () => {
      // Arrange
      const mockUser = createMockUser({
        userId: 'user-123',
        email: 'test@hospital.vn',
        fullName: 'Test User',
        roleType: 'DOCTOR',
        isActive: true,
        isEmailVerified: true
      });

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockVerifyMFAUseCase.execute.mockResolvedValue({
        success: true,
        valid: true,
        message: 'Success'
      });
      mockMFAService.disableMFA.mockRejectedValue(new Error('Database error'));

      const request: DisableMFARequest = {
        userId: 'user-123',
        verificationCode: '123456'
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('DISABLE_MFA_FAILED');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'MFA disable failed',
        expect.objectContaining({
          userId: 'user-123',
          error: 'Database error'
        })
      );
    });

    it('should handle verification service errors', async () => {
      // Arrange
      const mockUser = createMockUser({
        userId: 'user-123',
        email: 'test@hospital.vn',
        fullName: 'Test User',
        roleType: 'DOCTOR',
        isActive: true,
        isEmailVerified: true
      });

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockVerifyMFAUseCase.execute.mockRejectedValue(new Error('Verification service error'));

      const request: DisableMFARequest = {
        userId: 'user-123',
        verificationCode: '123456'
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(false);
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
});

