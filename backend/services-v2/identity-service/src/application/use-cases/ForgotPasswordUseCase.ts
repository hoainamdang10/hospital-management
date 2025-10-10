import { getErrorMessage } from '../../utils/error-helper';
/**
 * Forgot Password Use Case
 * Handles password reset request
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { IUseCase } from '@shared/application/use-cases/base/use-case.interface';
import { IAuthenticationService } from '../services/IAuthenticationService';
import { IUserRepository } from '../repositories/IUserRepository';
import { ICircuitBreaker } from '../services/ICircuitBreaker';
import { Email } from '../../domain/value-objects/Email';
import { ILogger } from '../services/ILogger';

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
  error?: string;
}

export class ForgotPasswordUseCase implements IUseCase<ForgotPasswordRequest, ForgotPasswordResponse> {
  constructor(
    private authService: IAuthenticationService,
    private userRepository: IUserRepository,
    private logger: ILogger,
    private circuitBreaker: ICircuitBreaker
  ) {}

  async execute(request: ForgotPasswordRequest): Promise<ForgotPasswordResponse> {
    return await this.circuitBreaker.execute(
      async () => this.executeImpl(request),
      async () => {
        this.logger.error('Circuit breaker open for ForgotPasswordUseCase');
        return {
          success: false,
          message: 'Dịch vụ đặt lại mật khẩu tạm thời không khả dụng. Vui lòng thử lại sau.',
          error: 'SERVICE_UNAVAILABLE'
        };
      }
    );
  }

  private async executeImpl(request: ForgotPasswordRequest): Promise<ForgotPasswordResponse> {
    try {
      this.logger.info('Processing forgot password request', { email: request.email });

      if (!request.email || !request.email.includes('@')) {
        return {
          success: false,
          message: 'Email không hợp lệ',
          error: 'INVALID_EMAIL'
        };
      }

      const email = Email.create(request.email);
      const user = await this.userRepository.findByEmail(email);
      if (!user) {
        this.logger.warn('Password reset requested for non-existent email', { email: request.email });
        return {
          success: true,
          message: 'Nếu email tồn tại trong hệ thống, bạn sẽ nhận được email hướng dẫn đặt lại mật khẩu.'
        };
      }

      if (!user.isActive) {
        this.logger.warn('Password reset requested for inactive user', { email: request.email });
        return {
          success: false,
          message: 'Tài khoản đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.',
          error: 'USER_INACTIVE'
        };
      }

      await this.authService.sendPasswordResetEmail(request.email);

      this.logger.info('Password reset email sent successfully', { email: request.email });

      return {
        success: true,
        message: 'Email hướng dẫn đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư của bạn.'
      };

    } catch (error) {
      this.logger.error('Forgot password failed', { 
        email: request.email, 
        error: getErrorMessage(error) 
      });

      return {
        success: false,
        message: `Không thể gửi email đặt lại mật khẩu: ${getErrorMessage(error)}`,
        error: 'FORGOT_PASSWORD_FAILED'
      };
    }
  }
}

