/**
 * Update Recovery Methods Use Case
 * Updates account recovery methods for a user
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS Command Pattern
 */

import { IUseCase } from '@shared/application/use-cases/base/use-case.interface';
import { IRecoveryMethodRepository } from '../../domain/repositories/IRecoveryMethodRepository';
import { IUserRepository } from '../repositories/IUserRepository';
import { RecoveryMethod } from '../../domain/value-objects/RecoveryMethod';
import { Email } from '../../domain/value-objects/Email';
import { CircuitBreakerFactory } from '../../infrastructure/resilience/CircuitBreaker';

export interface UpdateRecoveryMethodsRequest {
  userId: string;
  recoveryEmail: string | null; // null to remove recovery email
}

export interface UpdateRecoveryMethodsResponse {
  success: boolean;
  recoveryMethods?: {
    recoveryEmail: string | null;
    recoveryEmailVerified: boolean;
    recoveryEmailVerifiedAt: string | null;
    lastUpdatedAt: string;
  };
  message: string;
  error?: string;
}

/**
 * Update Recovery Methods Use Case
 * Command use case to update user's recovery methods
 */
export class UpdateRecoveryMethodsUseCase
  implements IUseCase<UpdateRecoveryMethodsRequest, UpdateRecoveryMethodsResponse>
{
  private circuitBreaker = CircuitBreakerFactory.getBreaker('update-recovery-methods-use-case');

  constructor(
    private recoveryMethodRepository: IRecoveryMethodRepository,
    private userRepository: IUserRepository,
    private logger: any
  ) {}

  async execute(request: UpdateRecoveryMethodsRequest): Promise<UpdateRecoveryMethodsResponse> {
    return await this.circuitBreaker.execute(
      async () => this.executeImpl(request),
      async () => {
        this.logger.error('Circuit breaker open for UpdateRecoveryMethodsUseCase');
        return {
          success: false,
          message: 'Dịch vụ tạm thời không khả dụng. Vui lòng thử lại sau.',
          error: 'SERVICE_UNAVAILABLE'
        };
      }
    );
  }

  private async executeImpl(
    request: UpdateRecoveryMethodsRequest
  ): Promise<UpdateRecoveryMethodsResponse> {
    try {
      this.logger.info('Updating recovery methods', {
        userId: request.userId,
        hasRecoveryEmail: !!request.recoveryEmail
      });

      // Validate request
      const validationError = await this.validateRequest(request);
      if (validationError) {
        return {
          success: false,
          message: validationError,
          error: 'VALIDATION_ERROR'
        };
      }

      // Get existing recovery methods or create default
      let recoveryMethod = await this.recoveryMethodRepository.getByUserId(request.userId);
      if (!recoveryMethod) {
        recoveryMethod = RecoveryMethod.createDefault(request.userId);
      }

      // Update recovery method
      let updatedRecoveryMethod: RecoveryMethod;

      if (request.recoveryEmail === null) {
        // Remove recovery email
        updatedRecoveryMethod = recoveryMethod.removeRecoveryEmail(request.userId);
        this.logger.info('Recovery email removed', { userId: request.userId });
      } else {
        // Update recovery email
        updatedRecoveryMethod = recoveryMethod.updateRecoveryEmail(
          request.recoveryEmail,
          request.userId
        );
        this.logger.info('Recovery email updated', {
          userId: request.userId,
          recoveryEmail: request.recoveryEmail
        });
      }

      // Save to repository
      const savedRecoveryMethod = await this.recoveryMethodRepository.save(updatedRecoveryMethod);

      // Convert to response format
      const recoveryMethodObj = savedRecoveryMethod.toObject();

      // TODO: Send verification email if recovery email was added/updated
      // This should be done via event publishing to Notifications Service
      // For now, we'll use Supabase's built-in email verification

      return {
        success: true,
        recoveryMethods: {
          recoveryEmail: recoveryMethodObj.recoveryEmail,
          recoveryEmailVerified: recoveryMethodObj.recoveryEmailVerified,
          recoveryEmailVerifiedAt: recoveryMethodObj.recoveryEmailVerifiedAt,
          lastUpdatedAt: recoveryMethodObj.lastUpdatedAt
        },
        message: request.recoveryEmail
          ? 'Email khôi phục đã được cập nhật. Vui lòng kiểm tra email để xác thực.'
          : 'Email khôi phục đã được xóa.'
      };
    } catch (error: any) {
      this.logger.error('Failed to update recovery methods', {
        userId: request.userId,
        error: error.message
      });

      return {
        success: false,
        message: `Không thể cập nhật phương thức khôi phục: ${error.message}`,
        error: 'UPDATE_RECOVERY_METHODS_FAILED'
      };
    }
  }

  private async validateRequest(request: UpdateRecoveryMethodsRequest): Promise<string | null> {
    // Validate userId
    if (!request.userId || request.userId.trim().length === 0) {
      return 'User ID không hợp lệ';
    }

    // If removing recovery email, no further validation needed
    if (request.recoveryEmail === null) {
      return null;
    }

    // Validate recovery email format
    try {
      Email.create(request.recoveryEmail);
    } catch (error: any) {
      return `Email khôi phục không hợp lệ: ${error.message}`;
    }

    // Check if user exists
    const user = await this.userRepository.findById(request.userId);
    if (!user) {
      return 'Người dùng không tồn tại';
    }

    // Check if recovery email is different from primary email
    if (user.email.value.toLowerCase() === request.recoveryEmail.toLowerCase()) {
      return 'Email khôi phục phải khác với email chính';
    }

    // Check if recovery email is already used by another user
    const isUsed = await this.recoveryMethodRepository.isRecoveryEmailUsed(
      request.recoveryEmail,
      request.userId
    );
    if (isUsed) {
      return 'Email khôi phục này đã được sử dụng bởi người dùng khác';
    }

    return null;
  }
}

