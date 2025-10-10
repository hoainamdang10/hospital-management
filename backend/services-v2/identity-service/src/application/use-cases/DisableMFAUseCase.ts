import { getErrorMessage } from '../../utils/error-helper';
/**
 * Disable MFA Use Case - Refactored
 * Handles disabling MFA for users with verification
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Dependency Inversion Principle
 */

import { IUseCase } from '@shared/application/use-cases/base/use-case.interface';
import { IUserRepository } from '../repositories/IUserRepository';
import { IMFAService } from '../services/IMFAService';
import { ICircuitBreaker } from '../services/ICircuitBreaker';
import { VerifyMFAUseCase } from './VerifyMFAUseCase';
import { UserId } from '../../domain/value-objects/UserId';
import { ILogger } from '../services/ILogger';

export interface DisableMFARequest {
  userId: string;
  verificationCode: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface DisableMFAResponse {
  success: boolean;
  message: string;
  error?: string;
}

/**
 * Disable MFA Use Case - Refactored
 * Requires verification before disabling MFA
 * Uses IMFAService interface for infrastructure independence
 */
export class DisableMFAUseCase implements IUseCase<DisableMFARequest, DisableMFAResponse> {
  constructor(
    private userRepository: IUserRepository,
    private mfaService: IMFAService,
    private verifyMFAUseCase: VerifyMFAUseCase,
    private logger: ILogger,
    private circuitBreaker: ICircuitBreaker
  ) {}

  async execute(request: DisableMFARequest): Promise<DisableMFAResponse> {
    return await this.circuitBreaker.execute(
      async () => this.executeImpl(request),
      async () => {
        this.logger.error('Circuit breaker open for DisableMFAUseCase');
        return {
          success: false,
          message: 'Dịch vụ MFA tạm thời không khả dụng. Vui lòng thử lại sau.',
          error: 'SERVICE_UNAVAILABLE'
        };
      }
    );
  }

  private async executeImpl(request: DisableMFARequest): Promise<DisableMFAResponse> {
    try {
      this.logger.info('Starting MFA disable', { userId: request.userId });

      // 1. Validate request
      const validationError = this.validateRequest(request);
      if (validationError) {
        return {
          success: false,
          message: validationError,
          error: 'VALIDATION_ERROR'
        };
      }

      // 2. Check if user exists
      const userId = UserId.fromString(request.userId);
      const user = await this.userRepository.findById(userId);
      if (!user) {
        return {
          success: false,
          message: 'Người dùng không tồn tại',
          error: 'USER_NOT_FOUND'
        };
      }

      // 3. Verify current MFA code before disabling
      const verificationResult = await this.verifyMFAUseCase.execute({
        userId: request.userId,
        code: request.verificationCode,
        attemptType: 'disable',
        ipAddress: request.ipAddress,
        userAgent: request.userAgent
      });

      if (!verificationResult.valid) {
        return {
          success: false,
          message: 'Mã xác thực không đúng. Không thể tắt MFA.',
          error: 'INVALID_VERIFICATION_CODE'
        };
      }

      // 4. Disable MFA via service
      await this.mfaService.disableMFA(request.userId);

      this.logger.info('MFA disabled successfully', { userId: request.userId });

      return {
        success: true,
        message: 'MFA đã được tắt thành công'
      };

    } catch (error) {
      this.logger.error('MFA disable failed', { 
        userId: request.userId, 
        error: getErrorMessage(error) 
      });

      return {
        success: false,
        message: `Tắt MFA thất bại: ${getErrorMessage(error)}`,
        error: 'DISABLE_MFA_FAILED'
      };
    }
  }

  /**
   * Validate request
   */
  private validateRequest(request: DisableMFARequest): string | null {
    if (!request.userId) {
      return 'User ID là bắt buộc';
    }

    if (!request.verificationCode) {
      return 'Mã xác thực là bắt buộc';
    }

    if (request.verificationCode.length !== 6 && request.verificationCode.length !== 8) {
      return 'Mã xác thực phải có 6 hoặc 8 ký tự';
    }

    return null;
  }
}


