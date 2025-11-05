/**
 * Lock Account Use Case (Admin Only)
 * Allows administrators to manually lock user accounts
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS Command Pattern
 */

import { IUseCase } from "@shared/application/use-cases/base/use-case.interface";
import { IUserRepository } from "../repositories/IUserRepository";
import { ISessionRepository } from "../../domain/repositories/ISessionRepository";
import { ICircuitBreaker } from "../services/ICircuitBreaker";
import { UserId } from "../../domain/value-objects/UserId";
import { ILogger } from "../services/ILogger";

export interface LockAccountRequest {
  userId: string; // User to lock
  lockedBy: string; // Admin who is locking
  reason: string; // Reason for locking
  terminateSessions?: boolean; // Default: true
}

export interface LockAccountResponse {
  success: boolean;
  message: string;
  error?: string;
}

/**
 * Lock Account Use Case
 * Allows administrators to manually lock user accounts
 * Optionally terminates all active sessions
 * Records audit trail
 */
export class LockAccountUseCase
  implements IUseCase<LockAccountRequest, LockAccountResponse>
{
  constructor(
    private userRepository: IUserRepository,
    private sessionRepository: ISessionRepository,
    private logger: ILogger,
    private circuitBreaker: ICircuitBreaker,
  ) {}

  async execute(request: LockAccountRequest): Promise<LockAccountResponse> {
    return await this.circuitBreaker.execute(
      async () => this.executeImpl(request),
      async () => {
        this.logger.error("Circuit breaker open for LockAccountUseCase");
        return {
          success: false,
          message:
            "Dịch vụ khóa tài khoản tạm thời không khả dụng. Vui lòng thử lại sau.",
          error: "SERVICE_UNAVAILABLE",
        };
      },
    );
  }

  private async executeImpl(
    request: LockAccountRequest,
  ): Promise<LockAccountResponse> {
    try {
      this.logger.info("Processing account lock request", {
        userId: request.userId,
        lockedBy: request.lockedBy,
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

      // 4. Check if user is permanently deactivated
      if (user.accountStatus === "deactivated") {
        return {
          success: false,
          message: "Không thể khóa tài khoản đã bị vô hiệu hóa vĩnh viễn",
          error: "PERMANENTLY_DEACTIVATED",
        };
      }

      // 5. Check if user is already locked
      if (user.accountStatus === "locked") {
        return {
          success: false,
          message: "Tài khoản đã bị khóa trước đó",
          error: "ALREADY_LOCKED",
        };
      }

      // 5. Prevent locking self
      if (request.userId === request.lockedBy) {
        return {
          success: false,
          message: "Không thể khóa tài khoản của chính mình",
          error: "CANNOT_LOCK_SELF",
        };
      }

      // 6. Determine session termination strategy and lock account
      const terminateSessions = request.terminateSessions !== false;
      user.lock(request.lockedBy, request.reason, terminateSessions);
      await this.userRepository.save(user);

      // 7. Terminate all sessions if requested (default: true)
      if (terminateSessions) {
        await this.sessionRepository.deleteAllByUserId(request.userId);
        this.logger.info("All sessions terminated after account lock", {
          userId: request.userId,
        });
      }

      // 7. Log audit trail
      this.logger.info("Account locked successfully", {
        userId: request.userId,
        lockedBy: request.lockedBy,
        reason: request.reason,
        terminatedSessions: terminateSessions,
      });

      return {
        success: true,
        message: `Tài khoản đã bị khóa. Lý do: ${request.reason}`,
      };
    } catch (error: any) {
      this.logger.error("Failed to lock account", {
        userId: request.userId,
        lockedBy: request.lockedBy,
        error: error.message,
      });

      return {
        success: false,
        message: "Không thể khóa tài khoản. Vui lòng thử lại sau.",
        error: "LOCK_ACCOUNT_FAILED",
      };
    }
  }

  private validateRequest(request: LockAccountRequest): string | null {
    if (!request.userId || request.userId.trim().length === 0) {
      return "User ID là bắt buộc";
    }

    if (!request.lockedBy || request.lockedBy.trim().length === 0) {
      return "Locked By (Admin ID) là bắt buộc";
    }

    if (!request.reason || request.reason.trim().length === 0) {
      return "Lý do khóa tài khoản là bắt buộc";
    }

    if (request.reason.length < 10) {
      return "Lý do khóa tài khoản phải có ít nhất 10 ký tự";
    }

    return null;
  }
}
