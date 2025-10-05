import { getErrorMessage } from '../../utils/error-helper';
/**
 * Enable MFA Use Case - Refactored
 * Handles MFA setup for users with TOTP generation
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Dependency Inversion Principle
 */

import { IUseCase } from '@shared/application/use-cases/base/use-case.interface';
import { IUserRepository } from '../repositories/IUserRepository';
import { IMFAService } from '../services/IMFAService';
import { CircuitBreakerFactory } from '../../infrastructure/resilience/CircuitBreaker';
import { UserId } from '../../domain/value-objects/UserId';

export interface EnableMFARequest {
  userId: string;
  method: '2fa_app' | 'sms' | 'email';
  phoneNumber?: string;
  email?: string;
}

export interface EnableMFAResponse {
  success: boolean;
  secret?: string;
  qrCodeUrl?: string;
  backupCodes?: string[];
  message: string;
  error?: string;
}

/**
 * Enable MFA Use Case - Refactored
 * Generates TOTP secret, QR code, and backup codes for user
 * Uses IMFAService interface for infrastructure independence
 */
export class EnableMFAUseCase implements IUseCase<EnableMFARequest, EnableMFAResponse> {
  private circuitBreaker = CircuitBreakerFactory.getBreaker('enable-mfa-use-case');

  constructor(
    private userRepository: IUserRepository,
    private mfaService: IMFAService,
    private logger: any
  ) {}

  async execute(request: EnableMFARequest): Promise<EnableMFAResponse> {
    return await this.circuitBreaker.execute(
      async () => this.executeImpl(request),
      async () => {
        this.logger.error('Circuit breaker open for EnableMFAUseCase');
        return {
          success: false,
          message: 'Dịch vụ MFA tạm thời không khả dụng. Vui lòng thử lại sau.',
          error: 'SERVICE_UNAVAILABLE'
        };
      }
    );
  }

  private async executeImpl(request: EnableMFARequest): Promise<EnableMFAResponse> {
    try {
      this.logger.info('Starting MFA setup', { userId: request.userId, method: request.method });

      // 1. Validate request
      const validationError = this.validateRequest(request);
      if (validationError) {
        return {
          success: false,
          message: validationError,
          error: 'VALIDATION_ERROR'
        };
      }

      // 2. Check if user exists
      const userId = UserId.fromString(request.userId);
      const user = await this.userRepository.findById(userId);
      if (!user) {
        return {
          success: false,
          message: 'Người dùng không tồn tại',
          error: 'USER_NOT_FOUND'
        };
      }

      // 3. Check if MFA is already enabled
      const isEnabled = await this.mfaService.isMFAEnabled(request.userId);
      if (isEnabled) {
        return {
          success: false,
          message: 'MFA đã được kích hoạt cho tài khoản này',
          error: 'MFA_ALREADY_ENABLED'
        };
      }

      // 4. Enable MFA via service
      const result = await this.mfaService.enableMFA(
        request.userId,
        request.method,
        request.phoneNumber,
        request.email
      );

      this.logger.info('MFA setup completed successfully', { userId: request.userId });

      return {
        success: true,
        secret: result.secret,
        qrCodeUrl: result.qrCodeUrl,
        backupCodes: result.backupCodes,
        message: 'Thiết lập MFA thành công. Vui lòng quét mã QR và xác thực để kích hoạt.'
      };

    } catch (error) {
      this.logger.error('MFA setup failed', { 
        userId: request.userId, 
        error: getErrorMessage(error) 
      });

      return {
        success: false,
        message: `Thiết lập MFA thất bại: ${getErrorMessage(error)}`,
        error: 'MFA_SETUP_FAILED'
      };
    }
  }

  /**
   * Validate request
   */
  private validateRequest(request: EnableMFARequest): string | null {
    if (!request.userId) {
      return 'User ID là bắt buộc';
    }

    if (!request.method) {
      return 'Phương thức MFA là bắt buộc';
    }

    if (!['2fa_app', 'sms', 'email'].includes(request.method)) {
      return 'Phương thức MFA không hợp lệ';
    }

    if (request.method === 'sms' && !request.phoneNumber) {
      return 'Số điện thoại là bắt buộc cho phương thức SMS';
    }

    if (request.method === 'email' && !request.email) {
      return 'Email là bắt buộc cho phương thức Email';
    }

    return null;
  }

}


