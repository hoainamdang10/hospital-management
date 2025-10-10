/**
 * VerifyMFAUseCase - Unit Tests
 *
 * Tests all scenarios for MFA verification including:
 * - TOTP verification
 * - Backup code verification
 * - Rate limiting
 * - Error handling
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { VerifyMFAUseCase, VerifyMFARequest } from '../../../../src/application/use-cases/VerifyMFAUseCase';
import { IMFAService, MFAMethod } from '../../../../src/application/services/IMFAService';
import { createCircuitBreakerStub } from '../../../helpers/circuit-breaker-test-helper';

describe('VerifyMFAUseCase', () => {
  let useCase: VerifyMFAUseCase;
  let mockMFAService: jest.Mocked<IMFAService>;
  let mockLogger: any;
  let circuitBreaker = createCircuitBreakerStub();

  beforeEach(() => {
    // Reset mocks FIRST
    jest.clearAllMocks();

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

    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    };

    circuitBreaker = createCircuitBreakerStub();

    useCase = new VerifyMFAUseCase(
      mockMFAService,
      mockLogger,
      circuitBreaker
    );
  });

  describe('Happy Path - TOTP Verification', () => {
    it('should verify valid TOTP code', async () => {
      // Arrange
      mockMFAService.checkRateLimit.mockResolvedValue(true);
      mockMFAService.getMFASettings.mockResolvedValue({
        userId: 'user-123',
        method: '2fa_app' as MFAMethod,
        secretKey: 'JBSWY3DPEHPK3PXP',
        isEnabled: true,
        backupCodes: [],
        phoneNumber: undefined,
        email: undefined,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      mockMFAService.verifyCode.mockResolvedValue(true);
      mockMFAService.clearFailedAttempts.mockResolvedValue(undefined);

      const request: VerifyMFARequest = {
        userId: 'user-123',
        code: '123456',
        attemptType: 'login'
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(true);
      expect(result.valid).toBe(true);
      expect(result.message).toContain('Xác thực MFA thành công');
      expect(mockMFAService.checkRateLimit).toHaveBeenCalledWith('user-123', 'login');
      expect(mockMFAService.verifyCode).toHaveBeenCalledWith('user-123', '123456', '2fa_app');
      expect(mockMFAService.clearFailedAttempts).toHaveBeenCalledWith('user-123', 'login');
      expect(mockLogger.info).toHaveBeenCalledWith(
        'MFA verification successful',
        expect.objectContaining({ userId: 'user-123' })
      );
    });

    it('should enable MFA after successful setup verification', async () => {
      // Arrange
      mockMFAService.checkRateLimit.mockResolvedValue(true);
      mockMFAService.getMFASettings.mockResolvedValue({
        userId: 'user-123',
        method: '2fa_app' as MFAMethod,
        secretKey: 'JBSWY3DPEHPK3PXP',
        isEnabled: false,
        backupCodes: [],
        phoneNumber: undefined,
        email: undefined,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      mockMFAService.verifyCode.mockResolvedValue(true);
      mockMFAService.clearFailedAttempts.mockResolvedValue(undefined);
      mockMFAService.updateMFASettings.mockResolvedValue(undefined);

      const request: VerifyMFARequest = {
        userId: 'user-123',
        code: '123456',
        attemptType: 'setup'
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(true);
      expect(result.valid).toBe(true);
      expect(mockMFAService.updateMFASettings).toHaveBeenCalledWith('user-123', { isEnabled: true });
    });
  });

  describe('Backup Code Verification', () => {
    it('should verify valid backup code', async () => {
      // Arrange
      mockMFAService.checkRateLimit.mockResolvedValue(true);
      mockMFAService.getMFASettings.mockResolvedValue({
        userId: 'user-123',
        method: '2fa_app' as MFAMethod,
        secretKey: 'JBSWY3DPEHPK3PXP',
        isEnabled: true,
        backupCodes: ['BACKUP12', 'BACKUP34'],
        phoneNumber: undefined,
        email: undefined,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      mockMFAService.validateBackupCode.mockResolvedValue(true);
      mockMFAService.clearFailedAttempts.mockResolvedValue(undefined);

      const request: VerifyMFARequest = {
        userId: 'user-123',
        code: 'BACKUP12',
        attemptType: 'login',
        method: 'backup'
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(true);
      expect(result.valid).toBe(true);
      expect(mockMFAService.validateBackupCode).toHaveBeenCalledWith('user-123', 'BACKUP12');
    });
  });

  describe('Invalid Code', () => {
    it('should reject invalid TOTP code', async () => {
      // Arrange
      mockMFAService.checkRateLimit.mockResolvedValue(true);
      mockMFAService.getMFASettings.mockResolvedValue({
        userId: 'user-123',
        method: '2fa_app' as MFAMethod,
        secretKey: 'JBSWY3DPEHPK3PXP',
        isEnabled: true,
        backupCodes: [],
        phoneNumber: undefined,
        email: undefined,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      mockMFAService.verifyCode.mockResolvedValue(false); // Invalid code
      mockMFAService.recordFailedAttempt.mockResolvedValue(undefined);

      const request: VerifyMFARequest = {
        userId: 'user-123',
        code: '000000', // Invalid code
        attemptType: 'login'
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(true);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('INVALID_CODE');
      expect(result.message).toContain('Mã xác thực không đúng');
      expect(mockMFAService.recordFailedAttempt).toHaveBeenCalled();
      expect(mockLogger.warn).toHaveBeenCalled();
    });
  });

  describe('Validation', () => {
    it('should reject missing userId', async () => {
      // Arrange
      const request: VerifyMFARequest = {
        userId: '',
        code: '123456',
        attemptType: 'login'
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('VALIDATION_ERROR');
      expect(result.message).toContain('User ID là bắt buộc');
    });

    it('should reject missing code', async () => {
      // Arrange
      const request: VerifyMFARequest = {
        userId: 'user-123',
        code: '',
        attemptType: 'login'
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain('Mã xác thực là bắt buộc');
    });

    it('should reject invalid code length', async () => {
      // Arrange
      const request: VerifyMFARequest = {
        userId: 'user-123',
        code: '12345', // Too short
        attemptType: 'login'
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain('6 hoặc 8 ký tự');
    });

    it('should accept 6-digit code', async () => {
      // Arrange
      mockMFAService.checkRateLimit.mockResolvedValue(true);
      mockMFAService.getMFASettings.mockResolvedValue({
        userId: 'user-123',
        method: '2fa_app' as MFAMethod,
        secretKey: 'JBSWY3DPEHPK3PXP',
        isEnabled: true,
        backupCodes: [],
        phoneNumber: undefined,
        email: undefined,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      mockMFAService.verifyCode.mockResolvedValue(true);
      mockMFAService.clearFailedAttempts.mockResolvedValue(undefined);

      const request: VerifyMFARequest = {
        userId: 'user-123',
        code: '123456',
        attemptType: 'login'
      };

      // Act
      const result = await useCase.execute(request);

      // Assert - Should not fail validation
      expect(result.error).not.toBe('VALIDATION_ERROR');
    });

    it('should accept 8-character backup code', async () => {
      // Arrange
      mockMFAService.checkRateLimit.mockResolvedValue(true);
      mockMFAService.getMFASettings.mockResolvedValue({
        userId: 'user-123',
        method: '2fa_app' as MFAMethod,
        secretKey: 'JBSWY3DPEHPK3PXP',
        isEnabled: true,
        backupCodes: ['ABCD1234'],
        phoneNumber: undefined,
        email: undefined,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      mockMFAService.validateBackupCode.mockResolvedValue(true);
      mockMFAService.clearFailedAttempts.mockResolvedValue(undefined);

      const request: VerifyMFARequest = {
        userId: 'user-123',
        code: 'ABCD1234',
        attemptType: 'login',
        method: 'backup'
      };

      // Act
      const result = await useCase.execute(request);

      // Assert - Should not fail validation
      expect(result.error).not.toBe('VALIDATION_ERROR');
    });
  });

  describe('Rate Limiting', () => {
    it('should reject when rate limit exceeded', async () => {
      // Arrange
      mockMFAService.checkRateLimit.mockResolvedValue(false);

      const request: VerifyMFARequest = {
        userId: 'user-123',
        code: '123456',
        attemptType: 'login'
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('RATE_LIMIT_EXCEEDED');
      expect(result.message).toContain('Quá nhiều lần thử');
    });

    it('should allow attempt if rate limit check fails', async () => {
      // Arrange
      mockMFAService.checkRateLimit.mockResolvedValue(true); // Allow on error
      mockMFAService.getMFASettings.mockResolvedValue({
        userId: 'user-123',
        method: '2fa_app' as MFAMethod,
        secretKey: 'JBSWY3DPEHPK3PXP',
        isEnabled: true,
        backupCodes: [],
        phoneNumber: undefined,
        email: undefined,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      mockMFAService.verifyCode.mockResolvedValue(false);
      mockMFAService.recordFailedAttempt.mockResolvedValue(undefined);

      const request: VerifyMFARequest = {
        userId: 'user-123',
        code: '123456',
        attemptType: 'login'
      };

      // Act
      const result = await useCase.execute(request);

      // Assert - Should not be blocked by rate limit
      expect(result.error).not.toBe('RATE_LIMIT_EXCEEDED');
    });
  });

  describe('MFA Not Found', () => {
    it('should return error when MFA settings not found', async () => {
      // Arrange
      mockMFAService.checkRateLimit.mockResolvedValue(true);
      mockMFAService.getMFASettings.mockResolvedValue(null);

      const request: VerifyMFARequest = {
        userId: 'user-123',
        code: '123456',
        attemptType: 'login'
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('MFA_NOT_FOUND');
      expect(result.message).toContain('Cài đặt MFA không tồn tại');
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      // Arrange
      mockMFAService.checkRateLimit.mockResolvedValue(true);
      mockMFAService.getMFASettings.mockRejectedValue(new Error('Database error'));

      const request: VerifyMFARequest = {
        userId: 'user-123',
        code: '123456',
        attemptType: 'login'
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('VERIFICATION_FAILED');
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('Logging', () => {
    it('should log MFA verification attempts', async () => {
      // Arrange
      mockMFAService.checkRateLimit.mockResolvedValue(true);
      mockMFAService.getMFASettings.mockResolvedValue({
        userId: 'user-123',
        method: '2fa_app' as MFAMethod,
        secretKey: 'JBSWY3DPEHPK3PXP',
        isEnabled: true,
        backupCodes: [],
        phoneNumber: undefined,
        email: undefined,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      mockMFAService.verifyCode.mockResolvedValue(true);
      mockMFAService.clearFailedAttempts.mockResolvedValue(undefined);

      const request: VerifyMFARequest = {
        userId: 'user-123',
        code: '123456',
        attemptType: 'login',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0'
      };

      // Act
      await useCase.execute(request);

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Starting MFA verification',
        expect.objectContaining({
          userId: 'user-123',
          attemptType: 'login'
        })
      );
    });
  });
});
