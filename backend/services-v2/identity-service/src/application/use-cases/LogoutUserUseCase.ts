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
import { ICircuitBreaker } from '../services/ICircuitBreaker';
import { IEventPublisher } from '../services/IEventPublisher';
import { UserLoggedOutEvent } from '../../domain/events/UserLoggedOutEvent';
import { ILogger } from '../services/ILogger';
import { UserId } from '../../domain/value-objects/UserId';

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
  constructor(
    private authService: IAuthenticationService,
    private userRepository: IUserRepository,
    private logger: ILogger,
    private circuitBreaker: ICircuitBreaker,
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
    this.logger.info('Processing user logout', { userId: request.userId });

    // Graceful degradation: Try each operation independently
    // Always return success even if some operations fail

    // Try to sign out from auth service
    try {
      await this.authService.signOut(request.accessToken);
      this.logger.info('User signed out from Supabase Auth', { userId: request.userId });
    } catch (authError) {
      // Log error but continue - graceful degradation
      this.logger.error('Auth service signOut failed, continuing logout', {
        userId: request.userId,
        error: getErrorMessage(authError)
      });
    }

    // Try to deactivate session in database
    if (request.sessionId) {
      try {
        const sessionOwnerId = UserId.fromString(request.userId);
        await this.userRepository.deactivateSession(request.sessionId, sessionOwnerId);
        this.logger.info('Session deactivated in database', {
          userId: request.userId,
          sessionId: request.sessionId
        });
      } catch (sessionError) {
        // Log error but continue - graceful degradation
        this.logger.error('Session deactivation failed, continuing logout', {
          userId: request.userId,
          sessionId: request.sessionId,
          error: getErrorMessage(sessionError)
        });
      }
    }

    // Try to publish UserLoggedOut event
    if (this.eventPublisher) {
      try {
        const event = new UserLoggedOutEvent(
          request.userId,
          request.sessionId || 'unknown',
          new Date()
        );

        await this.eventPublisher.publishDomainEvents([event]);

        this.logger.info('UserLoggedOut event published', {
          userId: request.userId
        });
      } catch (eventError) {
        // Log error but continue - graceful degradation
        this.logger.error('Failed to publish UserLoggedOut event', {
          userId: request.userId,
          error: getErrorMessage(eventError)
        });
      }
    }

    // Always return success - graceful degradation
    // Logout is a critical operation that should always succeed from user's perspective
    return {
      success: true,
      message: 'Đăng xuất thành công'
    };
  }
}

