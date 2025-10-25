/**
 * Deactivate User Use Case
 * Permanently deactivates user account (e.g., for deceased patients)
 * Different from lock - this is permanent and cannot be reversed
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS Command Pattern, HIPAA
 */

import { IUseCase } from '@shared/application/use-cases/base/use-case.interface';
import { IUserRepository } from '../repositories/IUserRepository';
import { ISessionRepository } from '../../domain/repositories/ISessionRepository';
import { ICircuitBreaker } from '../services/ICircuitBreaker';
import { UserId } from '../../domain/value-objects/UserId';
import { ILogger } from '../services/ILogger';

export interface DeactivateUserRequest {
  userId: string;
  deactivatedBy: string; // System or admin who is deactivating
  reason: string; // Reason for deactivation (e.g., "Patient deceased")
  terminateSessions?: boolean; // Default: true
}

export interface DeactivateUserResponse {
  success: boolean;
  message: string;
  error?: string;
}

/**
 * Deactivate User Use Case
 * Permanently deactivates user account
 * - Sets isActive = false
 * - Terminates all sessions
 * - Records audit trail
 * - Cannot be reversed (unlike lock/unlock)
 */
export class DeactivateUserUseCase
  implements IUseCase<DeactivateUserRequest, DeactivateUserResponse>
{
  constructor(
    private userRepository: IUserRepository,
    private sessionRepository: ISessionRepository,
    private logger: ILogger,
    private circuitBreaker: ICircuitBreaker
  ) {}

  async execute(request: DeactivateUserRequest): Promise<DeactivateUserResponse> {
    return await this.circuitBreaker.execute(
      async () => this.executeImpl(request),
      async () => {
        this.logger.error('Circuit breaker open for DeactivateUserUseCase');
        return {
          success: false,
          message: 'Dịch vụ vô hiệu hóa tài khoản tạm thời không khả dụng. Vui lòng thử lại sau.',
          error: 'SERVICE_UNAVAILABLE'
        };
      }
    );
  }

  private async executeImpl(request: DeactivateUserRequest): Promise<DeactivateUserResponse> {
    try {
      this.logger.info('Processing account deactivation request', {
        userId: request.userId,
        deactivatedBy: request.deactivatedBy,
        reason: request.reason
      });

      // 1. Validate input
      const validationError = this.validateRequest(request);
      if (validationError) {
        return {
          success: false,
          message: validationError,
          error: 'VALIDATION_ERROR'
        };
      }

      // 2. Find user
      const userId = UserId.fromString(request.userId);
      const user = await this.userRepository.findById(userId);

      if (!user) {
        this.logger.warn('User not found for deactivation', { userId: request.userId });
        return {
          success: false,
          message: 'Không tìm thấy người dùng',
          error: 'USER_NOT_FOUND'
        };
      }

      // 3. Check if already deactivated
      if (user.accountStatus === 'deactivated') {
        this.logger.info('User already deactivated', { userId: request.userId });
        return {
          success: true,
          message: 'Tài khoản đã được vô hiệu hóa vĩnh viễn trước đó'
        };
      }

      // 4. Deactivate user permanently
      user.deactivate(request.deactivatedBy, request.reason);

      // 5. Save user
      await this.userRepository.save(user);

      // 6. Terminate all sessions if requested
      const shouldTerminateSessions = request.terminateSessions !== false;
      if (shouldTerminateSessions) {
        const deletedCount = await this.sessionRepository.deleteAllByUserId(request.userId);
        this.logger.info('All sessions terminated for deactivated user', {
          userId: request.userId,
          sessionsDeleted: deletedCount
        });
      }

      this.logger.info('User account deactivated successfully', {
        userId: request.userId,
        deactivatedBy: request.deactivatedBy,
        reason: request.reason,
        sessionsTerminated: shouldTerminateSessions
      });

      return {
        success: true,
        message: 'Tài khoản đã được vô hiệu hóa thành công'
      };

    } catch (error) {
      this.logger.error('Error deactivating user account', {
        userId: request.userId,
        error: error instanceof Error ? error.message : String(error)
      });

      return {
        success: false,
        message: 'Lỗi khi vô hiệu hóa tài khoản',
        error: error instanceof Error ? error.message : 'UNKNOWN_ERROR'
      };
    }
  }

  private validateRequest(request: DeactivateUserRequest): string | null {
    if (!request.userId || request.userId.trim() === '') {
      return 'User ID không được để trống';
    }

    if (!request.deactivatedBy || request.deactivatedBy.trim() === '') {
      return 'Deactivated by không được để trống';
    }

    if (!request.reason || request.reason.trim() === '') {
      return 'Lý do vô hiệu hóa không được để trống';
    }

    return null;
  }
}
