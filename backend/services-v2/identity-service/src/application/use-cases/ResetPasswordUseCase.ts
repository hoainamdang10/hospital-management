import { getErrorMessage } from '../../utils/error-helper';
/**
 * Reset Password Use Case
 * Handles password reset with token
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { IUseCase } from '@shared/application/use-cases/base/use-case.interface';
import { IAuthenticationService } from '../services/IAuthenticationService';
import { CircuitBreakerFactory } from '../../infrastructure/resilience/CircuitBreaker';

export interface ResetPasswordRequest {
  accessToken: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
  error?: string;
}

export class ResetPasswordUseCase implements IUseCase<ResetPasswordRequest, ResetPasswordResponse> {
  private circuitBreaker = CircuitBreakerFactory.getBreaker('reset-password-use-case');

  constructor(
    private authService: IAuthenticationService,
    private logger: any
  ) {}

  async execute(request: ResetPasswordRequest): Promise<ResetPasswordResponse> {
    return await this.circuitBreaker.execute(
      async () => this.executeImpl(request),
      async () => {
        this.logger.error('Circuit breaker open for ResetPasswordUseCase');
        return {
          success: false,
          message: 'Dịch vụ đặt lại mật khẩu tạm thời không khả dụng. Vui lòng thử lại sau.',
          error: 'SERVICE_UNAVAILABLE'
        };
      }
    );
  }

  private async executeImpl(request: ResetPasswordRequest): Promise<ResetPasswordResponse> {
    try {
      this.logger.info('Processing password reset');

      const validationError = this.validateRequest(request);
      if (validationError) {
        return {
          success: false,
          message: validationError,
          error: 'VALIDATION_ERROR'
        };
      }

      await this.authService.resetPassword(request.accessToken, request.newPassword);

      this.logger.info('Password reset successful');

      return {
        success: true,
        message: 'Mật khẩu đã được đặt lại thành công. Bạn có thể đăng nhập với mật khẩu mới.'
      };

    } catch (error) {
      this.logger.error('Password reset failed', { error: getErrorMessage(error) });

      return {
        success: false,
        message: `Đặt lại mật khẩu thất bại: ${getErrorMessage(error)}`,
        error: 'RESET_PASSWORD_FAILED'
      };
    }
  }

  private validateRequest(request: ResetPasswordRequest): string | null {
    if (!request.accessToken || request.accessToken.trim().length === 0) {
      return 'Token không hợp lệ';
    }

    if (!request.newPassword || request.newPassword.length < 8) {
      return 'Mật khẩu mới phải có ít nhất 8 ký tự';
    }

    if (!/[A-Z]/.test(request.newPassword)) {
      return 'Mật khẩu phải chứa ít nhất 1 chữ hoa';
    }

    if (!/[a-z]/.test(request.newPassword)) {
      return 'Mật khẩu phải chứa ít nhất 1 chữ thường';
    }

    if (!/[0-9]/.test(request.newPassword)) {
      return 'Mật khẩu phải chứa ít nhất 1 chữ số';
    }

    if (request.newPassword !== request.confirmPassword) {
      return 'Mật khẩu xác nhận không khớp';
    }

    return null;
  }
}

