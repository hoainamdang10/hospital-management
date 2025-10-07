/**
 * Verify Reset Token Use Case
 * Verifies password reset token validity
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS Query Pattern
 */

import { IUseCase } from '@shared/application/use-cases/base/use-case.interface';
import { IAuthenticationService } from '../services/IAuthenticationService';
import { IRecoveryHistoryRepository } from '../../domain/repositories/IRecoveryHistoryRepository';
import { RecoveryAttempt } from '../../domain/value-objects/RecoveryAttempt';
import { CircuitBreakerFactory } from '../../infrastructure/resilience/CircuitBreaker';

export interface VerifyResetTokenRequest {
  token: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface VerifyResetTokenResponse {
  success: boolean;
  valid: boolean;
  userId?: string;
  email?: string;
  message: string;
  error?: string;
}

/**
 * Verify Reset Token Use Case
 * Validates password reset token without consuming it
 */
export class VerifyResetTokenUseCase
  implements IUseCase<VerifyResetTokenRequest, VerifyResetTokenResponse>
{
  private circuitBreaker = CircuitBreakerFactory.getBreaker('verify-reset-token-use-case');

  constructor(
    private authService: IAuthenticationService,
    private recoveryHistoryRepository: IRecoveryHistoryRepository,
    private logger: any
  ) {}

  async execute(request: VerifyResetTokenRequest): Promise<VerifyResetTokenResponse> {
    return await this.circuitBreaker.execute(
      async () => this.executeImpl(request),
      async () => {
        this.logger.error('Circuit breaker open for VerifyResetTokenUseCase');
        return {
          success: false,
          valid: false,
          message: 'Dịch vụ tạm thời không khả dụng. Vui lòng thử lại sau.',
          error: 'SERVICE_UNAVAILABLE'
        };
      }
    );
  }

  private async executeImpl(request: VerifyResetTokenRequest): Promise<VerifyResetTokenResponse> {
    try {
      this.logger.info('Verifying reset token');

      // Validate token format
      if (!request.token || request.token.trim().length === 0) {
        return {
          success: false,
          valid: false,
          message: 'Token không hợp lệ',
          error: 'INVALID_TOKEN'
        };
      }

      // Verify token with Supabase
      const tokenPayload = await this.authService.verifyToken(request.token);

      if (!tokenPayload || !tokenPayload.userId) {
        // Log failed verification attempt
        // Note: We don't have userId here, so we can't log to recovery history
        this.logger.warn('Invalid reset token provided');

        return {
          success: true,
          valid: false,
          message: 'Token không hợp lệ hoặc đã hết hạn'
        };
      }

      // Log successful verification attempt
      await this.logAttempt(
        tokenPayload.userId,
        true,
        null,
        request.ipAddress,
        request.userAgent
      );

      this.logger.info('Reset token verified successfully', {
        userId: tokenPayload.userId
      });

      return {
        success: true,
        valid: true,
        userId: tokenPayload.userId,
        email: tokenPayload.email,
        message: 'Token hợp lệ'
      };
    } catch (error: any) {
      this.logger.error('Token verification failed', {
        error: error.message
      });

      return {
        success: true, // Request succeeded, but token is invalid
        valid: false,
        message: 'Token không hợp lệ hoặc đã hết hạn'
      };
    }
  }

  /**
   * Log verification attempt
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
            'verify_token',
            ipAddress,
            userAgent
          )
        : RecoveryAttempt.createFailure(
            userId,
            'primary_email',
            'verify_token',
            failureReason!,
            ipAddress,
            userAgent
          );

      await this.recoveryHistoryRepository.log(attempt);
    } catch (error: any) {
      // Don't fail the request if logging fails
      this.logger.error('Failed to log verification attempt', {
        userId,
        error: error.message
      });
    }
  }
}

