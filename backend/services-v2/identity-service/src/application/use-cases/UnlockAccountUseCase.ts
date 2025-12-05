/**
 * Unlock Account Use Case (Admin Only)
 * Allows administrators to manually unlock user accounts
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS Command Pattern
 */

import { IUseCase } from "@shared/application/use-cases/base/use-case.interface";
import { IUserRepository } from "../repositories/IUserRepository";
import { ICircuitBreaker } from "../services/ICircuitBreaker";
import { UserId } from "../../domain/value-objects/UserId";
import { ILogger } from "../services/ILogger";
import { IEventPublisher } from "../services/IEventPublisher";
// import { UserAccountUnlockedEvent } from '../../domain/events/UserAccountUnlockedEvent'; // Event removed in scope reduction

export interface UnlockAccountRequest {
  userId: string; // User to unlock
  unlockedBy: string; // Admin who is unlocking
  reason: string; // Reason for unlocking
}

export interface UnlockAccountResponse {
  success: boolean;
  message: string;
  error?: string;
}

/**
 * Unlock Account Use Case
 * Allows administrators to manually unlock user accounts
 * Records audit trail
 */
export class UnlockAccountUseCase
  implements IUseCase<UnlockAccountRequest, UnlockAccountResponse>
{
  constructor(
    private userRepository: IUserRepository,
    private logger: ILogger,
    private circuitBreaker: ICircuitBreaker,
    private _eventPublisher?: IEventPublisher, // Prefixed with _ to indicate intentionally unused (removed in scope reduction)
  ) {}

  async execute(request: UnlockAccountRequest): Promise<UnlockAccountResponse> {
    return await this.circuitBreaker.execute(
      async () => this.executeImpl(request),
      async () => {
        this.logger.error("Circuit breaker open for UnlockAccountUseCase");
        return {
          success: false,
          message:
            "Dịch vụ mở khóa tài khoản tạm thời không khả dụng. Vui lòng thử lại sau.",
          error: "SERVICE_UNAVAILABLE",
        };
      },
    );
  }

  private async executeImpl(
    request: UnlockAccountRequest,
  ): Promise<UnlockAccountResponse> {
    try {
      this.logger.info("Processing account unlock request", {
        userId: request.userId,
        unlockedBy: request.unlockedBy,
        reason: request.reason,
      });

      // 1. Validate input
      const validationError = this.validateRequest(request);
      if (validationError) {
        return {
          success: false,
          message: validationError,
          error: "VALIDATION_ERROR",
        };
      }

      // 2. Convert string ID to Value Object
      const userIdVO = UserId.fromString(request.userId);

      // 3. Get user
      const user = await this.userRepository.findById(userIdVO);
      if (!user) {
        return {
          success: false,
          message: "Người dùng không tồn tại",
          error: "USER_NOT_FOUND",
        };
      }

      // 3. Check if user is permanently deactivated
      if (user.accountStatus === "deactivated") {
        return {
          success: false,
          message: "Không thể mở khóa tài khoản đã bị vô hiệu hóa vĩnh viễn",
          error: "PERMANENTLY_DEACTIVATED",
        };
      }

      // 4. Check if user is already active
      if (user.accountStatus === "active") {
        return {
          success: false,
          message: "Tài khoản đã được mở khóa trước đó",
          error: "ALREADY_UNLOCKED",
        };
      }

      // 4. Unlock account (activate from LOCKED status)
      user.activate(request.unlockedBy, request.reason);
      await this.userRepository.save(user);

      // 5. Log audit trail
      this.logger.info("Account unlocked successfully", {
        userId: request.userId,
        unlockedBy: request.unlockedBy,
        reason: request.reason,
      });

      // 6. Publish UserAccountUnlockedEvent - Disabled in scope reduction
      // if (this.eventPublisher) {
      //   try {
      //     const event = new UserAccountUnlockedEvent(
      //       userIdVO,
      //       request.unlockedBy,
      //       request.reason,
      //       user.email.value,
      //       user.roleTypes.length > 0 ? user.roleTypes[0] : 'UNKNOWN'
      //     );

      //     await this.eventPublisher.publishDomainEvents([event]);

      //     this.logger.info('UserAccountUnlockedEvent published', {
      //       userId: request.userId
      //     });
      //   } catch (error) {
      //     this.logger.error('Failed to publish UserAccountUnlockedEvent', {
      //       userId: request.userId,
      //       error: error instanceof Error ? error.message : String(error)
      //     });
      //     // Don't fail unlock operation if event publishing fails
      //   }
      // }

      return {
        success: true,
        message: `Tài khoản đã được mở khóa. Lý do: ${request.reason}`,
      };
    } catch (error: any) {
      this.logger.error("Failed to unlock account", {
        userId: request.userId,
        unlockedBy: request.unlockedBy,
        error: error.message,
      });

      return {
        success: false,
        message: "Không thể mở khóa tài khoản. Vui lòng thử lại sau.",
        error: "UNLOCK_ACCOUNT_FAILED",
      };
    }
  }

  private validateRequest(request: UnlockAccountRequest): string | null {
    if (!request.userId || request.userId.trim().length === 0) {
      return "User ID là bắt buộc";
    }

    if (!request.unlockedBy || request.unlockedBy.trim().length === 0) {
      return "Unlocked By (Admin ID) là bắt buộc";
    }

    if (!request.reason || request.reason.trim().length === 0) {
      return "Lý do mở khóa tài khoản là bắt buộc";
    }

    if (request.reason.trim().length < 5) {
      return "Lý do mở khóa tài khoản phải có ít nhất 5 ký tự";
    }

    return null;
  }
}
