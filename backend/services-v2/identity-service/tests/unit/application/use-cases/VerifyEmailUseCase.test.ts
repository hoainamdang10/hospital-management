/**
 * VerifyEmailUseCase - Unit Tests
 * 
 * Tests all scenarios for email verification including:
 * - Happy path
 * - Invalid token
 * - User not found
 * - Error handling
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { VerifyEmailUseCase, VerifyEmailRequest } from '../../../../src/application/use-cases/VerifyEmailUseCase';
import { IAuthenticationService } from '../../../../src/application/services/IAuthenticationService';
import { IUserRepository } from '../../../../src/application/repositories/IUserRepository';
import { createMockUser } from '../../../helpers/user-test-helper';
import { createCircuitBreakerStub } from '../../../helpers/circuit-breaker-test-helper';

describe('VerifyEmailUseCase', () => {
  let useCase: VerifyEmailUseCase;
  let mockAuthService: jest.Mocked<IAuthenticationService>;
  let mockUserRepository: jest.Mocked<IUserRepository>;
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

    circuitBreaker = createCircuitBreakerStub();

    useCase = new VerifyEmailUseCase(
      mockAuthService,
      mockUserRepository,
      mockLogger,
      circuitBreaker
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Happy Path', () => {
    it('should verify email with valid token', async () => {
      // Arrange
      const mockUser = createMockUser({
        email: 'test@hospital.vn',
        fullName: 'Test User',
        roleType: 'PATIENT',
        isEmailVerified: false
      });

      mockAuthService.verifyEmail.mockResolvedValue(undefined);
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockUserRepository.update.mockResolvedValue(undefined);

      const request: VerifyEmailRequest = {
        email: 'test@hospital.vn',
        token: 'valid-token-123'
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(true);
      expect(result.userId).toBe('user-123');
      expect(result.message).toContain('xác thực thành công');
      expect(mockAuthService.verifyEmail).toHaveBeenCalledWith('test@hospital.vn', 'valid-token-123');
      expect(mockUserRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          isEmailVerified: true
        })
      );
    });

    it('should update user verification status', async () => {
      // Arrange
      const mockUser = createMockUser({
        email: 'test@hospital.vn',
        fullName: 'Test User',
        roleType: 'PATIENT',
        isEmailVerified: false
      });

      mockAuthService.verifyEmail.mockResolvedValue(undefined);
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockUserRepository.update.mockResolvedValue(undefined);

      const request: VerifyEmailRequest = {
        email: 'test@hospital.vn',
        token: 'valid-token'
      };

      // Act
      await useCase.execute(request);

      // Assert
      expect(mockUserRepository.update).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(
        'User profile updated with email verification',
        expect.objectContaining({ userId: 'user-123' })
      );
    });
  });

  describe('Validation', () => {
    it('should reject invalid email', async () => {
      // Arrange
      const request: VerifyEmailRequest = {
        email: 'invalid-email',
        token: 'valid-token'
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('INVALID_EMAIL');
      expect(result.message).toContain('Email không hợp lệ');
      expect(mockAuthService.verifyEmail).not.toHaveBeenCalled();
    });

    it('should reject empty token', async () => {
      // Arrange
      const request: VerifyEmailRequest = {
        email: 'test@hospital.vn',
        token: ''
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('INVALID_TOKEN');
      expect(result.message).toContain('Mã xác thực không hợp lệ');
    });

    it('should reject whitespace-only token', async () => {
      // Arrange
      const request: VerifyEmailRequest = {
        email: 'test@hospital.vn',
        token: '   '
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('INVALID_TOKEN');
    });
  });

  describe('User Not Found', () => {
    it('should return error when user does not exist', async () => {
      // Arrange
      mockAuthService.verifyEmail.mockResolvedValue(undefined);
      mockUserRepository.findByEmail.mockResolvedValue(null);

      const request: VerifyEmailRequest = {
        email: 'nonexistent@hospital.vn',
        token: 'valid-token'
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('User not found');
      expect(result.message).toContain('Không tìm thấy');
    });
  });

  describe('Error Handling', () => {
    it('should handle auth service errors gracefully', async () => {
      // Arrange
      mockAuthService.verifyEmail.mockRejectedValue(new Error('Invalid token'));

      const request: VerifyEmailRequest = {
        email: 'test@hospital.vn',
        token: 'invalid-token'
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('VERIFICATION_FAILED');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Email verification failed',
        expect.objectContaining({
          email: 'test@hospital.vn',
          error: 'Invalid token'
        })
      );
    });

    it('should handle repository errors gracefully', async () => {
      // Arrange
      const mockUser = createMockUser({
        email: 'test@hospital.vn',
        fullName: 'Test User',
        roleType: 'PATIENT',
        isEmailVerified: false
      });

      mockAuthService.verifyEmail.mockResolvedValue(undefined);
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockUserRepository.update.mockRejectedValue(new Error('Database error'));

      const request: VerifyEmailRequest = {
        email: 'test@hospital.vn',
        token: 'valid-token'
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(false);
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('Logging', () => {
    it('should log verification process', async () => {
      // Arrange
      const mockUser = createMockUser({
        email: 'test@hospital.vn',
        fullName: 'Test User',
        roleType: 'PATIENT',
        isEmailVerified: false
      });

      mockAuthService.verifyEmail.mockResolvedValue(undefined);
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockUserRepository.update.mockResolvedValue(undefined);

      const request: VerifyEmailRequest = {
        email: 'test@hospital.vn',
        token: 'valid-token'
      };

      // Act
      await useCase.execute(request);

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Processing email verification',
        expect.objectContaining({ email: 'test@hospital.vn' })
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Email verified successfully via Supabase Auth',
        expect.objectContaining({ email: 'test@hospital.vn' })
      );
    });
  });
});
