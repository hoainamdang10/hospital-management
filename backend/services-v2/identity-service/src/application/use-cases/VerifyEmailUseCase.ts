import { getErrorMessage } from '../../utils/error-helper';
/**
 * Verify Email Use Case
 * Handles email verification with OTP
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { IUseCase } from '@shared/application/use-cases/base/use-case.interface';
import { IAuthenticationService } from '../services/IAuthenticationService';
import { IUserRepository } from '../repositories/IUserRepository';
import { CircuitBreakerFactory } from '../../infrastructure/resilience/CircuitBreaker';
import { Email } from '../../domain/value-objects/Email';
import { IEventPublisher } from '../../infrastructure/events/RabbitMQEventPublisher';
import { UserActivatedEvent } from '../../domain/events/UserActivatedEvent';

export interface VerifyEmailRequest {
  email: string;
  token: string;
}

export interface VerifyEmailResponse {
  success: boolean;
  userId?: string;
  message: string;
  error?: string;
}

export class VerifyEmailUseCase implements IUseCase<VerifyEmailRequest, VerifyEmailResponse> {
  private circuitBreaker = CircuitBreakerFactory.getBreaker('verify-email-use-case');

  constructor(
    private authService: IAuthenticationService,
    private userRepository: IUserRepository,
    private logger: any,
    private eventPublisher?: IEventPublisher // Optional for backward compatibility
  ) {}

  async execute(request: VerifyEmailRequest): Promise<VerifyEmailResponse> {
    return await this.circuitBreaker.execute(
      async () => this.executeImpl(request),
      async () => {
        this.logger.error('Circuit breaker open for VerifyEmailUseCase');
        return {
          success: false,
          message: 'Dịch vụ xác thực email tạm thời không khả dụng. Vui lòng thử lại sau.',
          error: 'SERVICE_UNAVAILABLE'
        };
      }
    );
  }

  private async executeImpl(request: VerifyEmailRequest): Promise<VerifyEmailResponse> {
    try {
      this.logger.info('Processing email verification', { email: request.email });

      if (!request.email || !request.email.includes('@')) {
        return {
          success: false,
          message: 'Email không hợp lệ',
          error: 'INVALID_EMAIL'
        };
      }

      if (!request.token || request.token.trim().length === 0) {
        return {
          success: false,
          message: 'Mã xác thực không hợp lệ',
          error: 'INVALID_TOKEN'
        };
      }

      // Use new interface method
      await this.authService.verifyEmail(request.email, request.token);

      this.logger.info('Email verified successfully via Supabase Auth', {
        email: request.email
      });

      // Find user by email and update verification status
      const email = Email.create(request.email);
      const user = await this.userRepository.findByEmail(email);

      if (!user) {
        return {
          success: false,
          error: 'User not found',
          message: 'Không tìm thấy người dùng'
        };
      }

      // Update user aggregate
      user.verifyEmail();

      // Persist using new repository signature
      await this.userRepository.update(user);

      this.logger.info('User profile updated with email verification', { userId: user.id });

      // Publish UserActivated event
      if (this.eventPublisher) {
        try {
          const event = new UserActivatedEvent(
            user.id, // Pass string directly
            email.value, // Pass string directly
            new Date()
          );

          await this.eventPublisher.publish({
            eventType: event.constructor.name,
            aggregateId: user.id,
            aggregateType: 'User',
            occurredAt: event.occurredAt,
            payload: {
              userId: user.id,
              email: email.value,
              activatedAt: new Date()
            }
          });

          this.logger.info('UserActivated event published', {
            userId: user.id
          });
        } catch (error) {
          this.logger.error('Failed to publish UserActivated event', {
            userId: user.id,
            error: getErrorMessage(error)
          });
          // Don't fail verification if event publishing fails
        }
      }

      return {
        success: true,
        userId: user.id,
        message: 'Email đã được xác thực thành công. Bạn có thể đăng nhập ngay bây giờ.'
      };

    } catch (error) {
      this.logger.error('Email verification failed', { 
        email: request.email, 
        error: getErrorMessage(error) 
      });

      return {
        success: false,
        message: `Xác thực email thất bại: ${getErrorMessage(error)}`,
        error: 'VERIFICATION_FAILED'
      };
    }
  }
}

