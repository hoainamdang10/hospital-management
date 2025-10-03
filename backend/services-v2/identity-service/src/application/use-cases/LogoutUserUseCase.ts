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
    private logger: any
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

