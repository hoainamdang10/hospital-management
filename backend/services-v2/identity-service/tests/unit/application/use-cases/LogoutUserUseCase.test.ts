/**
 * LogoutUserUseCase - Unit Tests
 * 
 * Tests all scenarios for user logout including:
 * - Happy path
 * - Session cleanup
 * - Error handling (graceful degradation)
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { LogoutUserUseCase, LogoutUserRequest } from '../../../../src/application/use-cases/LogoutUserUseCase';
import { IAuthenticationService } from '../../../../src/application/services/IAuthenticationService';
import { IUserRepository } from '../../../../src/application/repositories/IUserRepository';

describe('LogoutUserUseCase', () => {
  let useCase: LogoutUserUseCase;
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
      findAll: jest.fn(),
      deactivateSession: jest.fn()
    } as any;

    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    };

    useCase = new LogoutUserUseCase(mockAuthService, mockUserRepository, mockLogger);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Happy Path', () => {
    it('should logout user successfully', async () => {
      // Arrange
      mockAuthService.signOut.mockResolvedValue(undefined);

      const request: LogoutUserRequest = {
        userId: 'user-123',
        accessToken: 'valid-access-token'
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toBe('Đăng xuất thành công');
      expect(mockAuthService.signOut).toHaveBeenCalledWith('valid-access-token');
      expect(mockLogger.info).toHaveBeenCalledWith(
        'User signed out from Supabase Auth',
        expect.objectContaining({ userId: 'user-123' })
      );
    });

    it('should deactivate session when sessionId is provided', async () => {
      // Arrange
      mockAuthService.signOut.mockResolvedValue(undefined);
      mockUserRepository.deactivateSession.mockResolvedValue(undefined);

      const request: LogoutUserRequest = {
        userId: 'user-123',
        accessToken: 'valid-access-token',
        sessionId: 'session-456'
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(true);
      expect(mockUserRepository.deactivateSession).toHaveBeenCalledWith('session-456');
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Session deactivated in database',
        expect.objectContaining({
          userId: 'user-123',
          sessionId: 'session-456'
        })
      );
    });

    it('should not deactivate session when sessionId is not provided', async () => {
      // Arrange
      mockAuthService.signOut.mockResolvedValue(undefined);

      const request: LogoutUserRequest = {
        userId: 'user-123',
        accessToken: 'valid-access-token'
      };

      // Act
      await useCase.execute(request);

      // Assert
      expect(mockUserRepository.deactivateSession).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling - Graceful Degradation', () => {
    it('should return success even when auth service fails', async () => {
      // Arrange
      mockAuthService.signOut.mockRejectedValue(new Error('Auth service unavailable'));

      const request: LogoutUserRequest = {
        userId: 'user-123',
        accessToken: 'valid-access-token'
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toBe('Đăng xuất thành công');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Logout failed',
        expect.objectContaining({
          userId: 'user-123',
          error: 'Auth service unavailable'
        })
      );
    });

    it('should return success even when session deactivation fails', async () => {
      // Arrange
      mockAuthService.signOut.mockResolvedValue(undefined);
      mockUserRepository.deactivateSession.mockRejectedValue(new Error('Database error'));

      const request: LogoutUserRequest = {
        userId: 'user-123',
        accessToken: 'valid-access-token',
        sessionId: 'session-456'
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toBe('Đăng xuất thành công');
    });

    it('should handle complete service failure gracefully', async () => {
      // Arrange
      mockAuthService.signOut.mockRejectedValue(new Error('Complete failure'));
      mockUserRepository.deactivateSession.mockRejectedValue(new Error('Database down'));

      const request: LogoutUserRequest = {
        userId: 'user-123',
        accessToken: 'valid-access-token',
        sessionId: 'session-456'
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toBe('Đăng xuất thành công');
    });
  });

  describe('Logging', () => {
    it('should log logout process', async () => {
      // Arrange
      mockAuthService.signOut.mockResolvedValue(undefined);

      const request: LogoutUserRequest = {
        userId: 'user-123',
        accessToken: 'valid-access-token'
      };

      // Act
      await useCase.execute(request);

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Processing user logout',
        expect.objectContaining({ userId: 'user-123' })
      );
    });

    it('should log errors but still return success', async () => {
      // Arrange
      mockAuthService.signOut.mockRejectedValue(new Error('Service error'));

      const request: LogoutUserRequest = {
        userId: 'user-123',
        accessToken: 'valid-access-token'
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(true);
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('Session Management', () => {
    it('should handle multiple logout attempts gracefully', async () => {
      // Arrange
      mockAuthService.signOut.mockResolvedValue(undefined);
      mockUserRepository.deactivateSession.mockResolvedValue(undefined);

      const request: LogoutUserRequest = {
        userId: 'user-123',
        accessToken: 'valid-access-token',
        sessionId: 'session-456'
      };

      // Act - Multiple logout attempts
      const result1 = await useCase.execute(request);
      const result2 = await useCase.execute(request);

      // Assert
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(mockAuthService.signOut).toHaveBeenCalledTimes(2);
    });
  });
});

