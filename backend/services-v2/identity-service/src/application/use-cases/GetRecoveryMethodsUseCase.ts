/**
 * Get Recovery Methods Use Case
 * Retrieves account recovery methods for a user
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS Query Pattern
 */

import { IUseCase } from '@shared/application/use-cases/base/use-case.interface';
import { IRecoveryMethodRepository } from '../../domain/repositories/IRecoveryMethodRepository';
import { ICircuitBreaker } from '../services/ICircuitBreaker';
import { ILogger } from '../services/ILogger';

export interface GetRecoveryMethodsRequest {
  userId: string;
}

export interface GetRecoveryMethodsResponse {
  success: boolean;
  recoveryMethods?: {
    recoveryEmail: string | null;
    recoveryEmailVerified: boolean;
    recoveryEmailVerifiedAt: string | null;
    lastUpdatedAt: string;
  };
  message?: string;
  error?: string;
}

/**
 * Get Recovery Methods Use Case
 * Query use case to retrieve user's recovery methods
 */
export class GetRecoveryMethodsUseCase
  implements IUseCase<GetRecoveryMethodsRequest, GetRecoveryMethodsResponse>
{
  constructor(
    private recoveryMethodRepository: IRecoveryMethodRepository,
    private logger: ILogger,
    private circuitBreaker: ICircuitBreaker
  ) {}

  async execute(request: GetRecoveryMethodsRequest): Promise<GetRecoveryMethodsResponse> {
    return await this.circuitBreaker.execute(
      async () => this.executeImpl(request),
      async () => {
        this.logger.error('Circuit breaker open for GetRecoveryMethodsUseCase');
        return {
          success: false,
          message: 'Dịch vụ tạm thời không khả dụng. Vui lòng thử lại sau.',
          error: 'SERVICE_UNAVAILABLE'
        };
      }
    );
  }

  private async executeImpl(
    request: GetRecoveryMethodsRequest
  ): Promise<GetRecoveryMethodsResponse> {
    try {
      this.logger.info('Getting recovery methods', { userId: request.userId });

      // Validate request
      if (!request.userId || request.userId.trim().length === 0) {
        return {
          success: false,
          message: 'User ID không hợp lệ',
          error: 'INVALID_USER_ID'
        };
      }

      // Get recovery methods from repository
      const recoveryMethod = await this.recoveryMethodRepository.getByUserId(request.userId);

      // If no recovery methods configured, return default
      if (!recoveryMethod) {
        this.logger.info('No recovery methods configured', { userId: request.userId });
        return {
          success: true,
          recoveryMethods: {
            recoveryEmail: null,
            recoveryEmailVerified: false,
            recoveryEmailVerifiedAt: null,
            lastUpdatedAt: new Date().toISOString()
          }
        };
      }

      // Convert to response format
      const recoveryMethodObj = recoveryMethod.toObject();

      this.logger.info('Recovery methods retrieved successfully', {
        userId: request.userId,
        hasRecoveryEmail: recoveryMethod.hasRecoveryEmail(),
        isVerified: recoveryMethod.isRecoveryEmailVerified()
      });

      return {
        success: true,
        recoveryMethods: {
          recoveryEmail: recoveryMethodObj.recoveryEmail,
          recoveryEmailVerified: recoveryMethodObj.recoveryEmailVerified,
          recoveryEmailVerifiedAt: recoveryMethodObj.recoveryEmailVerifiedAt,
          lastUpdatedAt: recoveryMethodObj.lastUpdatedAt
        }
      };
    } catch (error: any) {
      this.logger.error('Failed to get recovery methods', {
        userId: request.userId,
        error: error.message
      });

      return {
        success: false,
        message: `Không thể lấy thông tin phương thức khôi phục: ${error.message}`,
        error: 'GET_RECOVERY_METHODS_FAILED'
      };
    }
  }
}
