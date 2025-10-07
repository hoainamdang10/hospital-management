/**
 * RefreshTokenUseCase - Unit Tests
 *
 * Cover tất cả kịch bản refresh token:
 * - Happy path: Refresh token hợp lệ
 * - Validation: Token missing, empty
 * - Business rules: Token không hợp lệ, hết hạn
 * - Error handling: Service failures
 */

import { RefreshTokenUseCase, RefreshTokenRequest } from '../../../../src/application/use-cases/RefreshTokenUseCase';
import { IAuthenticationService } from '../../../../src/application/services/IAuthenticationService';

describe('RefreshTokenUseCase', () => {
  let useCase: RefreshTokenUseCase;
  let mockAuthService: jest.Mocked<IAuthenticationService>;
  let mockLogger: any;

  const validRequest: RefreshTokenRequest = {
    refreshToken: 'valid-refresh-token-123',
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0'
  };

  const mockAuthResult = {
    success: true,
    accessToken: 'new-access-token-456',
    refreshToken: 'new-refresh-token-789',
    expiresIn: 3600,
    user: {
      id: 'user-123',
      email: 'doctor@hospital.com',
      role: 'DOCTOR'
    }
  };

  beforeEach(() => {
    mockAuthService = {
      refreshSession: jest.fn()
    } as unknown as jest.Mocked<IAuthenticationService>;

    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    };

    useCase = new RefreshTokenUseCase(mockAuthService, mockLogger);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Happy Path', () => {
    it('should refresh token successfully', async () => {
      mockAuthService.refreshSession.mockResolvedValue(mockAuthResult);

      const result = await useCase.execute(validRequest);

      expect(result.success).toBe(true);
      expect(result.accessToken).toBe('new-access-token-456');
      expect(result.refreshToken).toBe('new-refresh-token-789');
      expect(result.expiresIn).toBe(3600);
      expect(result.user).toEqual({
        userId: 'user-123',
        email: 'doctor@hospital.com',
        role: 'DOCTOR'
      });
      expect(result.error).toBeUndefined();

      expect(mockAuthService.refreshSession).toHaveBeenCalledWith(validRequest.refreshToken);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Refreshing access token',
        expect.objectContaining({
          ipAddress: validRequest.ipAddress,
          userAgent: validRequest.userAgent
        })
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Token refreshed successfully',
        expect.objectContaining({
          userId: 'user-123',
          email: 'doctor@hospital.com'
        })
      );
    });

    it('should use old refresh token if new one not provided', async () => {
      const resultWithoutNewToken = {
        ...mockAuthResult,
        refreshToken: undefined
      };
      mockAuthService.refreshSession.mockResolvedValue(resultWithoutNewToken);

      const result = await useCase.execute(validRequest);

      expect(result.success).toBe(true);
      expect(result.refreshToken).toBe(validRequest.refreshToken);
    });

    it('should default to PATIENT role if role not provided', async () => {
      const resultWithoutRole = {
        ...mockAuthResult,
        user: {
          id: 'user-123',
          email: 'patient@hospital.com',
          role: undefined
        }
      };
      mockAuthService.refreshSession.mockResolvedValue(resultWithoutRole as any);

      const result = await useCase.execute(validRequest);

      expect(result.success).toBe(true);
      expect(result.user?.role).toBe('PATIENT');
    });

    it('should work without optional request fields', async () => {
      const minimalRequest: RefreshTokenRequest = {
        refreshToken: 'valid-token'
      };
      mockAuthService.refreshSession.mockResolvedValue(mockAuthResult);

      const result = await useCase.execute(minimalRequest);

      expect(result.success).toBe(true);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Refreshing access token',
        expect.objectContaining({
          ipAddress: undefined,
          userAgent: undefined
        })
      );
    });
  });

  describe('Validation', () => {
    it('should reject missing refresh token', async () => {
      const invalidRequest = { ...validRequest, refreshToken: '' };

      const result = await useCase.execute(invalidRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Refresh token is required');
      expect(result.errorCode).toBe('REFRESH_TOKEN_REQUIRED');
      expect(mockAuthService.refreshSession).not.toHaveBeenCalled();
      expect(mockLogger.warn).toHaveBeenCalledWith('Refresh token missing');
    });

    it('should reject whitespace-only refresh token', async () => {
      const invalidRequest = { ...validRequest, refreshToken: '   ' };

      const result = await useCase.execute(invalidRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Refresh token is required');
      expect(result.errorCode).toBe('REFRESH_TOKEN_REQUIRED');
    });
  });

  describe('Business Rules', () => {
    it('should reject invalid refresh token', async () => {
      mockAuthService.refreshSession.mockResolvedValue({
        success: false,
        error: 'Invalid refresh token'
      });

      const result = await useCase.execute(validRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid refresh token');
      expect(result.errorCode).toBe('REFRESH_TOKEN_INVALID');
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Token refresh failed',
        expect.objectContaining({
          error: 'Invalid refresh token'
        })
      );
    });

    it('should reject expired refresh token', async () => {
      mockAuthService.refreshSession.mockResolvedValue({
        success: false,
        error: 'Refresh token expired'
      });

      const result = await useCase.execute(validRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Refresh token expired');
      expect(result.errorCode).toBe('REFRESH_TOKEN_INVALID');
    });

    it('should handle missing access token in response', async () => {
      mockAuthService.refreshSession.mockResolvedValue({
        success: true,
        accessToken: undefined
      });

      const result = await useCase.execute(validRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to refresh token');
      expect(result.errorCode).toBe('REFRESH_TOKEN_INVALID');
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors gracefully', async () => {
      mockAuthService.refreshSession.mockRejectedValue(new Error('Supabase connection failed'));

      const result = await useCase.execute(validRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBe('An unexpected error occurred while refreshing token');
      expect(result.errorCode).toBe('REFRESH_TOKEN_ERROR');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Refresh token use case error',
        expect.objectContaining({
          error: 'Supabase connection failed'
        })
      );
    });

    it('should handle network errors', async () => {
      mockAuthService.refreshSession.mockRejectedValue(new Error('Network timeout'));

      const result = await useCase.execute(validRequest);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('REFRESH_TOKEN_ERROR');
    });

    it('should handle non-Error exceptions', async () => {
      mockAuthService.refreshSession.mockRejectedValue('String error');

      const result = await useCase.execute(validRequest);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('REFRESH_TOKEN_ERROR');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Refresh token use case error',
        expect.objectContaining({
          error: 'String error'
        })
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined user in response', async () => {
      const resultWithoutUser = {
        success: true,
        accessToken: 'new-token',
        refreshToken: 'new-refresh',
        expiresIn: 3600,
        user: undefined
      };
      mockAuthService.refreshSession.mockResolvedValue(resultWithoutUser);

      const result = await useCase.execute(validRequest);

      expect(result.success).toBe(true);
      expect(result.user).toBeUndefined();
    });

    it('should handle very long refresh tokens', async () => {
      const longToken = 'a'.repeat(10000);
      const requestWithLongToken = { ...validRequest, refreshToken: longToken };
      mockAuthService.refreshSession.mockResolvedValue(mockAuthResult);

      const result = await useCase.execute(requestWithLongToken);

      expect(result.success).toBe(true);
      expect(mockAuthService.refreshSession).toHaveBeenCalledWith(longToken);
    });

    it('should handle special characters in tokens', async () => {
      const specialToken = 'token-with-special-chars!@#$%^&*()';
      const requestWithSpecialToken = { ...validRequest, refreshToken: specialToken };
      mockAuthService.refreshSession.mockResolvedValue(mockAuthResult);

      const result = await useCase.execute(requestWithSpecialToken);

      expect(result.success).toBe(true);
      expect(mockAuthService.refreshSession).toHaveBeenCalledWith(specialToken);
    });
  });
});

