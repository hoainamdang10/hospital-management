/**
 * ResetPasswordUseCase - Unit Tests
 * 
 * Tests all scenarios for password reset including:
 * - Happy path
 * - Password validation
 * - Token validation
 * - Error handling
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { ResetPasswordUseCase, ResetPasswordRequest } from '../../../../src/application/use-cases/ResetPasswordUseCase';
import { IAuthenticationService } from '../../../../src/application/services/IAuthenticationService';
import { createCircuitBreakerStub } from '../../../helpers/circuit-breaker-test-helper';

describe('ResetPasswordUseCase', () => {
  let useCase: ResetPasswordUseCase;
  let mockAuthService: jest.Mocked<IAuthenticationService>;
  let mockLogger: any;
  let circuitBreaker = createCircuitBreakerStub();

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

    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    };

    circuitBreaker = createCircuitBreakerStub();

    useCase = new ResetPasswordUseCase(mockAuthService, mockLogger, circuitBreaker);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Happy Path', () => {
    it('should reset password with valid token and password', async () => {
      // Arrange
      mockAuthService.resetPassword.mockResolvedValue(undefined);

      const request: ResetPasswordRequest = {
        accessToken: 'valid-reset-token',
        refreshToken: 'valid-refresh-token',
        newPassword: 'NewSecure123!',
        confirmPassword: 'NewSecure123!'
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toContain('Mật khẩu đã được đặt lại thành công');
      expect(mockAuthService.resetPassword).toHaveBeenCalledWith('valid-reset-token', 'valid-refresh-token', 'NewSecure123!');
      expect(mockLogger.info).toHaveBeenCalledWith('Password reset successful');
    });
  });

  describe('Password Validation', () => {
    it('should reject password shorter than 8 characters', async () => {
      // Arrange
      const request: ResetPasswordRequest = {
        accessToken: 'valid-token',
        refreshToken: 'valid-refresh-token',
        newPassword: 'Short1!',
        confirmPassword: 'Short1!'
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('VALIDATION_ERROR');
      expect(result.message).toContain('ít nhất 8 ký tự');
      expect(mockAuthService.resetPassword).not.toHaveBeenCalled();
    });

    it('should reject password without uppercase letter', async () => {
      // Arrange
      const request: ResetPasswordRequest = {
        accessToken: 'valid-token',
        refreshToken: 'valid-refresh-token',
        newPassword: 'lowercase123!',
        confirmPassword: 'lowercase123!'
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain('chữ hoa');
    });

    it('should reject password without lowercase letter', async () => {
      // Arrange
      const request: ResetPasswordRequest = {
        accessToken: 'valid-token',
        refreshToken: 'valid-refresh-token',
        newPassword: 'UPPERCASE123!',
        confirmPassword: 'UPPERCASE123!'
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain('chữ thường');
    });

    it('should reject password without number', async () => {
      // Arrange
      const request: ResetPasswordRequest = {
        accessToken: 'valid-token',
        refreshToken: 'valid-refresh-token',
        newPassword: 'NoNumberPass!',
        confirmPassword: 'NoNumberPass!'
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain('chữ số');
    });

    it('should reject mismatched passwords', async () => {
      // Arrange
      const request: ResetPasswordRequest = {
        accessToken: 'valid-token',
        refreshToken: 'valid-refresh-token',
        newPassword: 'SecurePass123!',
        confirmPassword: 'DifferentPass123!'
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain('không khớp');
    });

    it('should accept valid password meeting all requirements', async () => {
      // Arrange
      mockAuthService.resetPassword.mockResolvedValue(undefined);

      const validPasswords = [
        'SecurePass123!',
        'MyP@ssw0rd',
        'Test1234Pass',
        'Abcd1234efgh'
      ];

      for (const password of validPasswords) {
        const request: ResetPasswordRequest = {
          accessToken: 'valid-token',
        refreshToken: 'valid-refresh-token',
        newPassword: password,
          confirmPassword: password
        };

        // Act
        const result = await useCase.execute(request);

        // Assert
        expect(result.success).toBe(true);
      }
    });
  });

  describe('Token Validation', () => {
    it('should reject empty token', async () => {
      // Arrange
      const request: ResetPasswordRequest = {
        accessToken: '',
        refreshToken: 'valid-refresh-token',
        newPassword: 'SecurePass123!',
        confirmPassword: 'SecurePass123!'
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain('Token không hợp lệ');
    });

    it('should reject whitespace-only token', async () => {
      // Arrange
      const request: ResetPasswordRequest = {
        accessToken: '   ',
        refreshToken: 'valid-refresh-token',
        newPassword: 'SecurePass123!',
        confirmPassword: 'SecurePass123!'
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain('Token không hợp lệ');
    });
  });

  describe('Error Handling', () => {
    it('should handle auth service errors gracefully', async () => {
      // Arrange
      mockAuthService.resetPassword.mockRejectedValue(new Error('Invalid or expired token'));

      const request: ResetPasswordRequest = {
        accessToken: 'expired-token',
        refreshToken: 'valid-refresh-token',
        newPassword: 'SecurePass123!',
        confirmPassword: 'SecurePass123!'
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('RESET_PASSWORD_FAILED');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Password reset failed',
        expect.objectContaining({
          error: 'Invalid or expired token'
        })
      );
    });

    it('should handle network errors gracefully', async () => {
      // Arrange
      mockAuthService.resetPassword.mockRejectedValue(new Error('Network error'));

      const request: ResetPasswordRequest = {
        accessToken: 'valid-token',
        refreshToken: 'valid-refresh-token',
        newPassword: 'SecurePass123!',
        confirmPassword: 'SecurePass123!'
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(false);
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('Logging', () => {
    it('should log password reset process', async () => {
      // Arrange
      mockAuthService.resetPassword.mockResolvedValue(undefined);

      const request: ResetPasswordRequest = {
        accessToken: 'valid-token',
        refreshToken: 'valid-refresh-token',
        newPassword: 'SecurePass123!',
        confirmPassword: 'SecurePass123!'
      };

      // Act
      await useCase.execute(request);

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith('Processing password reset');
      expect(mockLogger.info).toHaveBeenCalledWith('Password reset successful');
    });
  });
});
