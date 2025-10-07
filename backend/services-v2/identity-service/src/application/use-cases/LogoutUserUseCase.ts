import { getErrorMessage } from '../../utils/error-helper';
/**
 * Logout User Use Case
 * Handles user logout and session cleanup
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { IUseCase } from '@shared/application/use-cases/base/use-case.interface';
import { IAuthenticationService } from '../services/IAuthenticationService';
import { IUserRepository } from '../repositories/IUserRepository';
import { CircuitBreakerFactory } from '../../infrastructure/resilience/CircuitBreaker';
import { IEventPublisher } from '../../infrastructure/events/RabbitMQEventPublisher';
import { UserLoggedOutEvent } from '../../domain/events/UserLoggedOutEvent';

export interface LogoutUserRequest {
  userId: string;
  accessToken: string;
  sessionId?: string;
}

export interface LogoutUserResponse {
  success: boolean;
  message: string;
  error?: string;
}

export class LogoutUserUseCase implements IUseCase<LogoutUserRequest, LogoutUserResponse> {
  private circuitBreaker = CircuitBreakerFactory.getBreaker('logout-user-use-case');

  constructor(
    private authService: IAuthenticationService,
    private userRepository: IUserRepository,
    private logger: any,
    private eventPublisher?: IEventPublisher // Optional for backward compatibility
  ) {}

  async execute(request: LogoutUserRequest): Promise<LogoutUserResponse> {
    return await this.circuitBreaker.execute(
      async () => this.executeImpl(request),
      async () => {
        this.logger.error('Circuit breaker open for LogoutUserUseCase');
        return {
          success: false,
          message: 'Dịch vụ đăng xuất tạm thời không khả dụng. Vui lòng thử lại sau.',
          error: 'SERVICE_UNAVAILABLE'
        };
      }
    );
  }

  private async executeImpl(request: LogoutUserRequest): Promise<LogoutUserResponse> {
    try {
      this.logger.info('Processing user logout', { userId: request.userId });

      await this.authService.signOut(request.accessToken);

      this.logger.info('User signed out from Supabase Auth', { userId: request.userId });

      if (request.sessionId) {
        await this.userRepository.deactivateSession(request.sessionId);
        this.logger.info('Session deactivated in database', {
          userId: request.userId,
          sessionId: request.sessionId
        });
      }

      // Publish UserLoggedOut event
      if (this.eventPublisher) {
        try {
          const event = new UserLoggedOutEvent(
            request.userId, // Pass string directly
            request.sessionId || 'unknown',
            new Date()
          );

          await this.eventPublisher.publish({
            eventType: event.constructor.name,
            aggregateId: request.userId,
            aggregateType: 'User',
            occurredAt: event.occurredAt,
            payload: {
              userId: request.userId,
              sessionId: request.sessionId,
              loggedOutAt: new Date()
            }
          });

          this.logger.info('UserLoggedOut event published', {
            userId: request.userId
          });
        } catch (error) {
          this.logger.error('Failed to publish UserLoggedOut event', {
            userId: request.userId,
            error: getErrorMessage(error)
          });
          // Don't fail logout if event publishing fails
        }
      }

      return {
        success: true,
        message: 'Đăng xuất thành công'
      };

    } catch (error) {
      this.logger.error('Logout failed', { 
        userId: request.userId, 
        error: getErrorMessage(error) 
      });

      return {
        success: true,
        message: 'Đăng xuất thành công'
      };
    }
  }
}

