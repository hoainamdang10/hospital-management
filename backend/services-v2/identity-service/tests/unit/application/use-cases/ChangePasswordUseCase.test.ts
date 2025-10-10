/**
 * ChangePasswordUseCase - Unit Tests
 * 
 * Tests all scenarios for changing user password including:
 * - Happy path (authenticated user changes own password)
 * - Invalid current password
 * - Password policy violations
 * - Session termination
 * - Error handling
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { ChangePasswordUseCase, ChangePasswordRequest } from '../../../../src/application/use-cases/ChangePasswordUseCase';
import { IAuthenticationService } from '../../../../src/application/services/IAuthenticationService';
import { IUserRepository } from '../../../../src/application/repositories/IUserRepository';
import { IPasswordPolicyRepository } from '../../../../src/domain/repositories/IPasswordPolicyRepository';
import { ISessionRepository } from '../../../../src/domain/repositories/ISessionRepository';
import { createMockUser } from '../../../helpers/user-test-helper';
import { createCircuitBreakerStub } from '../../../helpers/circuit-breaker-test-helper';
import { PasswordPolicy } from '../../../../src/domain/value-objects/PasswordPolicy';

describe('ChangePasswordUseCase', () => {
  let useCase: ChangePasswordUseCase;
  let mockAuthService: jest.Mocked<IAuthenticationService>;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockPasswordPolicyRepository: jest.Mocked<IPasswordPolicyRepository>;
  let mockSessionRepository: jest.Mocked<ISessionRepository>;
  let mockLogger: any;
  let circuitBreaker = createCircuitBreakerStub();

  beforeEach(() => {
    mockAuthService = {
      signIn: jest.fn(),
      updatePassword: jest.fn()
    } as any;

    mockUserRepository = {
      findById: jest.fn()
    } as any;

    mockPasswordPolicyRepository = {
      getCurrent: jest.fn()
    } as any;

    mockSessionRepository = {
      deleteAllByUserId: jest.fn()
    } as any;

    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    };

    circuitBreaker = createCircuitBreakerStub();

    useCase = new ChangePasswordUseCase(
      mockAuthService,
      mockUserRepository,
      mockPasswordPolicyRepository,
      mockSessionRepository,
      mockLogger,
      circuitBreaker
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Happy Path', () => {
    it('should change password successfully', async () => {
      // Arrange
      const mockUser = createMockUser({
        userId: 'user-123',
        email: 'test@hospital.vn',
        fullName: 'Nguyễn Văn Test',
        roleType: 'PATIENT'
      });

      const mockPolicy = PasswordPolicy.create({
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: false,
        preventReuse: 3,
        expirationDays: 90
      });

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockPasswordPolicyRepository.getCurrent.mockResolvedValue(mockPolicy);
      mockAuthService.signIn.mockResolvedValue({
        success: true,
        accessToken: 'token',
        refreshToken: 'refresh',
        user: { id: 'user-123', email: 'test@hospital.vn', role: 'PATIENT' }
      } as any);
      mockAuthService.updatePassword.mockResolvedValue(undefined);
      mockSessionRepository.deleteAllByUserId.mockResolvedValue(5);

      const request: ChangePasswordRequest = {
        userId: 'user-123',
        currentPassword: 'OldPassword123',
        newPassword: 'NewPassword123',
        confirmPassword: 'NewPassword123',
        invalidateOtherSessions: true
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toContain('thành công');
      expect(mockAuthService.signIn).toHaveBeenCalledWith({
        email: 'test@hospital.vn',
        password: 'OldPassword123'
      });
      expect(mockAuthService.updatePassword).toHaveBeenCalledWith('user-123', 'NewPassword123');
      expect(mockSessionRepository.deleteAllByUserId).toHaveBeenCalledWith('user-123');
    });

    it('should not terminate sessions if invalidateOtherSessions is false', async () => {
      // Arrange
      const mockUser = createMockUser({
        userId: 'user-123',
        email: 'test@hospital.vn'
      });

      const mockPolicy = PasswordPolicy.create({
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: false,
        preventReuse: 3,
        expirationDays: 90
      });

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockPasswordPolicyRepository.getCurrent.mockResolvedValue(mockPolicy);
      mockAuthService.signIn.mockResolvedValue({
        success: true,
        accessToken: 'token',
        refreshToken: 'refresh',
        user: { id: 'user-123', email: 'test@hospital.vn', role: 'PATIENT' }
      } as any);
      mockAuthService.updatePassword.mockResolvedValue(undefined);

      const request: ChangePasswordRequest = {
        userId: 'user-123',
        currentPassword: 'OldPassword123',
        newPassword: 'NewPassword123',
        confirmPassword: 'NewPassword123',
        invalidateOtherSessions: false
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(true);
      expect(mockSessionRepository.deleteAllByUserId).not.toHaveBeenCalled();
    });
  });

  describe('Validation Errors', () => {
    it('should reject if user not found', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(null);

      const request: ChangePasswordRequest = {
        userId: 'user-123',
        currentPassword: 'OldPassword123',
        newPassword: 'NewPassword123',
        confirmPassword: 'NewPassword123'
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('USER_NOT_FOUND');
      expect(result.message).toContain('không tồn tại');
    });

    it('should reject if current password is incorrect', async () => {
      // Arrange
      const mockUser = createMockUser({
        userId: 'user-123',
        email: 'test@hospital.vn'
      });

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockAuthService.signIn.mockResolvedValue({
        success: false,
        error: 'INVALID_CREDENTIALS'
      } as any);

      const request: ChangePasswordRequest = {
        userId: 'user-123',
        currentPassword: 'WrongPassword',
        newPassword: 'NewPassword123',
        confirmPassword: 'NewPassword123'
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('INVALID_CURRENT_PASSWORD');
      expect(result.message).toContain('Mật khẩu hiện tại không đúng');
    });

    it('should reject if new password violates policy', async () => {
      // Arrange
      const mockUser = createMockUser({
        userId: 'user-123',
        email: 'test@hospital.vn'
      });

      const mockPolicy = PasswordPolicy.create({
        minLength: 12,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        preventReuse: 3,
        expirationDays: 90
      });

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockPasswordPolicyRepository.getCurrent.mockResolvedValue(mockPolicy);
      mockAuthService.signIn.mockResolvedValue({
        success: true,
        accessToken: 'token',
        refreshToken: 'refresh',
        user: { id: 'user-123', email: 'test@hospital.vn', role: 'PATIENT' }
      } as any);

      const request: ChangePasswordRequest = {
        userId: 'user-123',
        currentPassword: 'OldPassword123',
        newPassword: 'weakpassword', // No uppercase, no numbers, no special chars
        confirmPassword: 'weakpassword'
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('PASSWORD_POLICY_VIOLATION');
      expect(result.message).toContain('không đáp ứng');
    });

    it('should reject if new password same as current', async () => {
      // Arrange
      const mockUser = createMockUser({
        userId: 'user-123',
        email: 'test@hospital.vn'
      });

      const mockPolicy = PasswordPolicy.create({
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: false,
        preventReuse: 3,
        expirationDays: 90
      });

      const request: ChangePasswordRequest = {
        userId: 'user-123',
        currentPassword: 'SamePassword123',
        newPassword: 'SamePassword123',
        confirmPassword: 'SamePassword123'
      };

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockPasswordPolicyRepository.getCurrent.mockResolvedValue(mockPolicy);
      mockAuthService.signIn.mockResolvedValue({
        success: true,
        accessToken: 'token',
        refreshToken: 'refresh',
        user: { id: 'user-123', email: 'test@hospital.vn', role: 'PATIENT' }
      } as any);

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('SAME_PASSWORD');
      expect(result.message).toContain('phải khác');
    });
  });

  describe('Error Handling', () => {
    it('should handle auth service errors gracefully', async () => {
      // Arrange
      const mockUser = createMockUser({
        userId: 'user-123',
        email: 'test@hospital.vn'
      });

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockAuthService.signIn.mockRejectedValue(new Error('Auth service unavailable'));

      const request: ChangePasswordRequest = {
        userId: 'user-123',
        currentPassword: 'OldPassword123',
        newPassword: 'NewPassword123',
        confirmPassword: 'NewPassword123'
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('CHANGE_PASSWORD_FAILED');
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
});
