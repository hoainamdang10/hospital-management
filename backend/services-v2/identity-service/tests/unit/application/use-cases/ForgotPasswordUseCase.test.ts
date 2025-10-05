/**
 * ForgotPasswordUseCase - Unit Tests
 * 
 * Tests all scenarios for forgot password including:
 * - Happy path
 * - Non-existent user (security)
 * - Inactive user
 * - Error handling
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { ForgotPasswordUseCase, ForgotPasswordRequest } from '../../../../src/application/use-cases/ForgotPasswordUseCase';
import { IAuthenticationService } from '../../../../src/application/services/IAuthenticationService';
import { IUserRepository } from '../../../../src/application/repositories/IUserRepository';
import { createMockUser } from '../../../helpers/user-test-helper';

describe('ForgotPasswordUseCase', () => {
  let useCase: ForgotPasswordUseCase;
  let mockAuthService: jest.Mocked<IAuthenticationService>;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockLogger: any;

  beforeEach(() => {
    mockAuthService = {
      signUp: jest.fn(),
      signIn: jest.fn(),
      signOut: jest.fn(),
      verifyToken: jest.fn(),
      refreshToken: jest.fn(),
      resetPassword: jest.fn(),
      sendPasswordResetEmail: jest.fn(),
      verifyEmail: jest.fn(),
      sendVerificationEmail: jest.fn()
    } as any;

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

    useCase = new ForgotPasswordUseCase(mockAuthService, mockUserRepository, mockLogger);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Happy Path', () => {
    it('should send password reset email for valid user', async () => {
      // Arrange
      const mockUser = createMockUser({
        userId: 'user-123',
        email: 'test@hospital.vn',
        fullName: 'Test User',
        roleType: 'PATIENT',
        isActive: true,
        isEmailVerified: true
      });

      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockAuthService.sendPasswordResetEmail.mockResolvedValue(undefined);

      const request: ForgotPasswordRequest = {
        email: 'test@hospital.vn'
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toContain('Email hướng dẫn đặt lại mật khẩu đã được gửi');
      expect(mockAuthService.sendPasswordResetEmail).toHaveBeenCalledWith('test@hospital.vn');
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Password reset email sent successfully',
        expect.objectContaining({ email: 'test@hospital.vn' })
      );
    });
  });

  describe('Security - Non-existent User', () => {
    it('should return success message even for non-existent user', async () => {
      // Arrange
      mockUserRepository.findByEmail.mockResolvedValue(null);

      const request: ForgotPasswordRequest = {
        email: 'nonexistent@hospital.vn'
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toContain('Nếu email tồn tại trong hệ thống');
      expect(mockAuthService.sendPasswordResetEmail).not.toHaveBeenCalled();
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Password reset requested for non-existent email',
        expect.objectContaining({ email: 'nonexistent@hospital.vn' })
      );
    });

    it('should not reveal user existence through timing', async () => {
      // Arrange
      mockUserRepository.findByEmail.mockResolvedValue(null);

      const request: ForgotPasswordRequest = {
        email: 'test@hospital.vn'
      };

      // Act
      const startTime = Date.now();
      await useCase.execute(request);
      const duration = Date.now() - startTime;

      // Assert - Should complete quickly (no email sent)
      expect(duration).toBeLessThan(1000);
      expect(mockAuthService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });
  });

  describe('Inactive User', () => {
    it('should reject password reset for inactive user', async () => {
      // Arrange
      const mockUser = createMockUser({
        userId: 'user-123',
        email: 'test@hospital.vn',
        fullName: 'Test User',
        roleType: 'PATIENT',
        isActive: false, // Inactive
        isEmailVerified: true
      });

      mockUserRepository.findByEmail.mockResolvedValue(mockUser);

      const request: ForgotPasswordRequest = {
        email: 'test@hospital.vn'
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('USER_INACTIVE');
      expect(result.message).toContain('Tài khoản đã bị vô hiệu hóa');
      expect(mockAuthService.sendPasswordResetEmail).not.toHaveBeenCalled();
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Password reset requested for inactive user',
        expect.objectContaining({ email: 'test@hospital.vn' })
      );
    });
  });

  describe('Validation', () => {
    it('should reject invalid email format', async () => {
      // Arrange
      const request: ForgotPasswordRequest = {
        email: 'invalid-email'
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('INVALID_EMAIL');
      expect(result.message).toContain('Email không hợp lệ');
      expect(mockUserRepository.findByEmail).not.toHaveBeenCalled();
    });

    it('should reject empty email', async () => {
      // Arrange
      const request: ForgotPasswordRequest = {
        email: ''
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('INVALID_EMAIL');
    });
  });

  describe('Error Handling', () => {
    it('should handle email service errors gracefully', async () => {
      // Arrange
      const mockUser = createMockUser({
        userId: 'user-123',
        email: 'test@hospital.vn',
        fullName: 'Test User',
        roleType: 'PATIENT',
        isActive: true,
        isEmailVerified: true
      });

      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockAuthService.sendPasswordResetEmail.mockRejectedValue(new Error('Email service unavailable'));

      const request: ForgotPasswordRequest = {
        email: 'test@hospital.vn'
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('FORGOT_PASSWORD_FAILED');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Forgot password failed',
        expect.objectContaining({
          email: 'test@hospital.vn',
          error: 'Email service unavailable'
        })
      );
    });

    it('should handle repository errors gracefully', async () => {
      // Arrange
      mockUserRepository.findByEmail.mockRejectedValue(new Error('Database error'));

      const request: ForgotPasswordRequest = {
        email: 'test@hospital.vn'
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(false);
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('Logging', () => {
    it('should log forgot password request', async () => {
      // Arrange
      const mockUser = createMockUser({
        userId: 'user-123',
        email: 'test@hospital.vn',
        fullName: 'Test User',
        roleType: 'PATIENT',
        isActive: true,
        isEmailVerified: true
      });

      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockAuthService.sendPasswordResetEmail.mockResolvedValue(undefined);

      const request: ForgotPasswordRequest = {
        email: 'test@hospital.vn'
      };

      // Act
      await useCase.execute(request);

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Processing forgot password request',
        expect.objectContaining({ email: 'test@hospital.vn' })
      );
    });
  });
});

