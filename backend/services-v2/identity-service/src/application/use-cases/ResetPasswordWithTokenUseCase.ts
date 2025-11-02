/**
 * Reset Password With Token Use Case (Enhanced)
 * Resets password using reset token with enhanced security
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS Command Pattern
 */

import { IUseCase } from '@shared/application/use-cases/base/use-case.interface';
import { IAuthenticationService } from '../services/IAuthenticationService';
import { IPasswordPolicyRepository } from '../../domain/repositories/IPasswordPolicyRepository';
import { IRecoveryHistoryRepository } from '../../domain/repositories/IRecoveryHistoryRepository';
import { ISessionRepository } from '../../domain/repositories/ISessionRepository';
import { RecoveryAttempt } from '../../domain/value-objects/RecoveryAttempt';
import { ICircuitBreaker } from '../services/ICircuitBreaker';
import { ILogger } from '../services/ILogger';
import { IEventPublisher } from '../services/IEventPublisher';
import { PasswordResetEvent } from '../../domain/events/PasswordResetEvent';
import { UserId } from '../../domain/value-objects/UserId';
import { IUserRepository } from '../repositories/IUserRepository';

export interface ResetPasswordWithTokenRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface ResetPasswordWithTokenResponse {
  success: boolean;
  message: string;
  error?: string;
}

/**
 * Reset Password With Token Use Case (Enhanced)
 * Validates token, checks password policy, resets password, invalidates sessions
 */
export class ResetPasswordWithTokenUseCase
  implements IUseCase<ResetPasswordWithTokenRequest, ResetPasswordWithTokenResponse>
{
  constructor(
    private authService: IAuthenticationService,
    private passwordPolicyRepository: IPasswordPolicyRepository,
    private recoveryHistoryRepository: IRecoveryHistoryRepository,
    private sessionRepository: ISessionRepository,
    private userRepository: IUserRepository,
    private logger: ILogger,
    private circuitBreaker: ICircuitBreaker,
    private eventPublisher?: IEventPublisher
  ) {}

  async execute(
    request: ResetPasswordWithTokenRequest
  ): Promise<ResetPasswordWithTokenResponse> {
    return await this.circuitBreaker.execute(
      async () => this.executeImpl(request),
      async () => {
        this.logger.error('Circuit breaker open for ResetPasswordWithTokenUseCase');
        return {
          success: false,
          message: 'Dịch vụ đặt lại mật khẩu tạm thời không khả dụng. Vui lòng thử lại sau.',
          error: 'SERVICE_UNAVAILABLE'
        };
      }
    );
  }

  private async executeImpl(
    request: ResetPasswordWithTokenRequest
  ): Promise<ResetPasswordWithTokenResponse> {
    let userId: string | undefined;

    try {
      this.logger.info('Processing password reset with token');

      // Validate request
      const validationError = await this.validateRequest(request);
      if (validationError) {
        return {
          success: false,
          message: validationError,
          error: 'VALIDATION_ERROR'
        };
      }

      // Verify token
      const tokenPayload = await this.authService.verifyToken(request.token);
      if (!tokenPayload || !tokenPayload.userId) {
        this.logger.warn('Invalid reset token provided');
        return {
          success: false,
          message: 'Token không hợp lệ hoặc đã hết hạn',
          error: 'INVALID_TOKEN'
        };
      }

      userId = tokenPayload.userId;

      // Validate password against policy
      const passwordPolicy = await this.passwordPolicyRepository.getCurrent();
      const validationResult = passwordPolicy.validate(request.newPassword);

      if (!validationResult.isValid) {
        // Log failed attempt
        await this.logAttempt(
          userId,
          false,
          `Password policy violation: ${validationResult.errors.join(', ')}`,
          request.ipAddress,
          request.userAgent
        );

        return {
          success: false,
          message: `Mật khẩu không đáp ứng yêu cầu:\n${validationResult.errors.join('\n')}`,
          error: 'PASSWORD_POLICY_VIOLATION'
        };
      }

      // Update password via Supabase (using userId from verified token)
      await this.authService.updatePassword(userId, request.newPassword);

      // Invalidate all existing sessions
      await this.sessionRepository.deleteAllByUserId(userId);

      // Log successful attempt
      await this.logAttempt(userId, true, null, request.ipAddress, request.userAgent);

      this.logger.info('Password reset successful', { userId });

      // Publish PasswordResetEvent for notification service
      if (this.eventPublisher) {
        try {
          // Get user details for event
          const userIdVO = UserId.fromString(userId);
          const user = await this.userRepository.findById(userIdVO);
          if (user) {
            const event = new PasswordResetEvent(
              userIdVO,
              user.email.value,
              user.roleTypes.length > 0 ? user.roleTypes[0] : 'UNKNOWN',
              'token',
              true // All sessions were invalidated
            );

            await this.eventPublisher.publishDomainEvents([event]);

            this.logger.info('PasswordResetEvent published', {
              userId,
              email: user.email.value
            });
          }
        } catch (error) {
          this.logger.error('Failed to publish PasswordResetEvent', {
            userId,
            error: error instanceof Error ? error.message : String(error)
          });
          // Don't fail password reset if event publishing fails
        }
      }

      return {
        success: true,
        message:
          'Mật khẩu đã được đặt lại thành công. Tất cả phiên đăng nhập hiện tại đã bị hủy. Bạn có thể đăng nhập với mật khẩu mới.'
      };
    } catch (error: any) {
      this.logger.error('Password reset failed', {
        userId,
        error: error.message
      });

      // Log failed attempt if we have userId
      if (userId) {
        await this.logAttempt(
          userId,
          false,
          error.message,
          request.ipAddress,
          request.userAgent
        );
      }

      return {
        success: false,
        message: `Đặt lại mật khẩu thất bại: ${error.message}`,
        error: 'RESET_PASSWORD_FAILED'
      };
    }
  }

  /**
   * Validate request
   */
  private async validateRequest(
    request: ResetPasswordWithTokenRequest
  ): Promise<string | null> {
    // Validate token
    if (!request.token || request.token.trim().length === 0) {
      return 'Token không hợp lệ';
    }

    // Validate new password
    if (!request.newPassword || request.newPassword.length === 0) {
      return 'Mật khẩu mới không được để trống';
    }

    // Validate password confirmation
    if (request.newPassword !== request.confirmPassword) {
      return 'Mật khẩu xác nhận không khớp';
    }

    return null;
  }

  /**
   * Log reset attempt
   */
  private async logAttempt(
    userId: string,
    success: boolean,
    failureReason: string | null,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      // Note: We don't know which recovery method was used (primary or recovery email)
      // Default to primary_email for logging purposes
      const attempt = success
        ? RecoveryAttempt.createSuccess(
            userId,
            'primary_email',
            'reset_password',
            ipAddress,
            userAgent
          )
        : RecoveryAttempt.createFailure(
            userId,
            'primary_email',
            'reset_password',
            failureReason!,
            ipAddress,
            userAgent
          );

      await this.recoveryHistoryRepository.log(attempt);
    } catch (error: any) {
      // Don't fail the request if logging fails
      this.logger.error('Failed to log reset attempt', {
        userId,
        error: error.message
      });
    }
  }
}
