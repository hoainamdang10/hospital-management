import { getErrorMessage } from '../../utils/error-helper';
/**
 * Verify MFA Use Case - Refactored
 * Handles MFA code verification during login or setup
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Dependency Inversion Principle
 */

import { IUseCase } from '@shared/application/use-cases/base/use-case.interface';
import { IMFAService, MFAMethod } from '../services/IMFAService';
import { ICircuitBreaker } from '../services/ICircuitBreaker';
import { ILogger } from '../services/ILogger';

export interface VerifyMFARequest {
  userId: string;
  code: string;
  attemptType: 'login' | 'setup' | 'disable';
  method?: MFAMethod;
  ipAddress?: string;
  userAgent?: string;
}

export interface VerifyMFAResponse {
  success: boolean;
  valid: boolean;
  message: string;
  error?: string;
  requiresNewCode?: boolean;
}

/**
 * Verify MFA Use Case - Refactored
 * Verifies TOTP codes or backup codes
 * Uses IMFAService interface for infrastructure independence
 */
export class VerifyMFAUseCase implements IUseCase<VerifyMFARequest, VerifyMFAResponse> {
  constructor(
    private mfaService: IMFAService,
    private logger: ILogger,
    private circuitBreaker: ICircuitBreaker
  ) {}

  async execute(request: VerifyMFARequest): Promise<VerifyMFAResponse> {
    return await this.circuitBreaker.execute(
      async () => this.executeImpl(request),
      async () => {
        this.logger.error('Circuit breaker open for VerifyMFAUseCase');
        return {
          success: false,
          valid: false,
          message: 'Dịch vụ xác thực MFA tạm thời không khả dụng. Vui lòng thử lại sau.',
          error: 'SERVICE_UNAVAILABLE'
        };
      }
    );
  }

  private async executeImpl(request: VerifyMFARequest): Promise<VerifyMFAResponse> {
    try {
      this.logger.info('Starting MFA verification', { 
        userId: request.userId, 
        attemptType: request.attemptType 
      });

      // 1. Validate request
      const validationError = this.validateRequest(request);
      if (validationError) {
        return {
          success: false,
          valid: false,
          message: validationError,
          error: 'VALIDATION_ERROR'
        };
      }

      // 2. Check rate limiting
      const rateLimitOk = await this.mfaService.checkRateLimit(request.userId, request.attemptType);
      if (!rateLimitOk) {
        return {
          success: false,
          valid: false,
          message: 'Quá nhiều lần thử không thành công. Vui lòng thử lại sau 15 phút.',
          error: 'RATE_LIMIT_EXCEEDED'
        };
      }

      // 3. Get MFA settings
      const mfaSettings = await this.mfaService.getMFASettings(request.userId);
      if (!mfaSettings) {
        return {
          success: false,
          valid: false,
          message: 'Cài đặt MFA không tồn tại',
          error: 'MFA_NOT_FOUND'
        };
      }

      // 4. Verify code based on method
      let isValid = false;
      const usedMethod = request.method || mfaSettings.method;

      if (usedMethod === 'backup') {
        // Verify backup code
        isValid = await this.mfaService.validateBackupCode(request.userId, request.code);
      } else {
        // Verify TOTP code
        isValid = await this.mfaService.verifyCode(request.userId, request.code, usedMethod);
      }

      // 5. Handle result
      if (isValid) {
        // Clear failed attempts
        await this.mfaService.clearFailedAttempts(request.userId, request.attemptType);

        // If this is setup verification, enable MFA
        if (request.attemptType === 'setup') {
          await this.mfaService.updateMFASettings(request.userId, { isEnabled: true });
        }

        this.logger.info('MFA verification successful', { userId: request.userId });

        return {
          success: true,
          valid: true,
          message: 'Xác thực MFA thành công'
        };
      } else {
        // Record failed attempt
        await this.mfaService.recordFailedAttempt(
          request.userId,
          request.attemptType,
          request.ipAddress,
          request.userAgent
        );

        this.logger.warn('MFA verification failed', { userId: request.userId });

        return {
          success: true,
          valid: false,
          message: 'Mã xác thực không đúng',
          error: 'INVALID_CODE'
        };
      }

    } catch (error) {
      this.logger.error('MFA verification error', { 
        userId: request.userId, 
        error: getErrorMessage(error) 
      });

      return {
        success: false,
        valid: false,
        message: `Xác thực MFA thất bại: ${getErrorMessage(error)}`,
        error: 'VERIFICATION_FAILED'
      };
    }
  }

  /**
   * Validate request
   */
  private validateRequest(request: VerifyMFARequest): string | null {
    if (!request.userId) {
      return 'User ID là bắt buộc';
    }

    if (!request.code) {
      return 'Mã xác thực là bắt buộc';
    }

    if (request.code.length !== 6 && request.code.length !== 8) {
      return 'Mã xác thực phải có 6 hoặc 8 ký tự';
    }

    if (!request.attemptType) {
      return 'Loại xác thực là bắt buộc';
    }

    return null;
  }

}


