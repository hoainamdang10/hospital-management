/**
 * Deactivate User Use Case (Admin Only)
 * Cho phép quản trị viên vô hiệu hóa vĩnh viễn tài khoản người dùng
 * (khác với khoá tạm thời - không thể kích hoạt lại).
 */

import { IUseCase } from "@shared/application/use-cases/base/use-case.interface";
import { IUserRepository } from "../repositories/IUserRepository";
import { ISessionRepository } from "../../domain/repositories/ISessionRepository";
import { ICircuitBreaker } from "../services/ICircuitBreaker";
import { ILogger } from "../services/ILogger";
import { UserId } from "../../domain/value-objects/UserId";

export interface DeactivateUserRequest {
  userId: string;
  deactivatedBy: string;
  reason: string;
  terminateSessions?: boolean;
}

export interface DeactivateUserResponse {
  success: boolean;
  message: string;
  error?: string;
}

export class DeactivateUserUseCase
  implements IUseCase<DeactivateUserRequest, DeactivateUserResponse>
{
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly sessionRepository: ISessionRepository,
    private readonly logger: ILogger,
    private readonly circuitBreaker: ICircuitBreaker,
  ) {}

  async execute(
    request: DeactivateUserRequest,
  ): Promise<DeactivateUserResponse> {
    return this.circuitBreaker.execute(
      () => this.executeImpl(request),
      async () => {
        this.logger.error("Circuit breaker open for DeactivateUserUseCase");
        return {
          success: false,
          message:
            "Dịch vụ vô hiệu hóa tài khoản tạm thời không khả dụng. Vui lòng thử lại sau.",
          error: "SERVICE_UNAVAILABLE",
        };
      },
    );
  }

  private async executeImpl(
    request: DeactivateUserRequest,
  ): Promise<DeactivateUserResponse> {
    try {
      this.logger.info("Processing account deactivation request", {
        userId: request.userId,
        deactivatedBy: request.deactivatedBy,
        reason: request.reason,
      });

      const validationError = this.validateRequest(request);
      if (validationError) {
        return {
          success: false,
          message: validationError,
          error: "VALIDATION_ERROR",
        };
      }

      const userIdVO = UserId.fromString(request.userId);
      const user = await this.userRepository.findById(userIdVO);
      if (!user) {
        return {
          success: false,
          message: "Người dùng không tồn tại",
          error: "USER_NOT_FOUND",
        };
      }

      if (user.accountStatus === "deactivated") {
        return {
          success: false,
          message: "Tài khoản đã bị vô hiệu hóa trước đó",
          error: "ALREADY_DEACTIVATED",
        };
      }

      if (request.userId === request.deactivatedBy) {
        return {
          success: false,
          message: "Không thể tự vô hiệu hóa tài khoản của chính mình",
          error: "CANNOT_DEACTIVATE_SELF",
        };
      }

      user.deactivate(request.deactivatedBy, request.reason);
      await this.userRepository.save(user);

      const terminateSessions = request.terminateSessions !== false;
      if (terminateSessions) {
        await this.sessionRepository.deleteAllByUserId(request.userId);
      }

      this.logger.info("Account deactivated successfully", {
        userId: request.userId,
        deactivatedBy: request.deactivatedBy,
        terminateSessions,
      });

      return {
        success: true,
        message:
          "Tài khoản đã được vô hiệu hóa vĩnh viễn. Hành động này không thể hoàn tác.",
      };
    } catch (error) {
      this.logger.error("Failed to deactivate account", {
        userId: request.userId,
        deactivatedBy: request.deactivatedBy,
        error: error instanceof Error ? error.message : String(error),
      });

      return {
        success: false,
        message: "Không thể vô hiệu hóa tài khoản. Vui lòng thử lại sau.",
        error: "DEACTIVATE_ACCOUNT_FAILED",
      };
    }
  }

  private validateRequest(request: DeactivateUserRequest): string | null {
    if (!request.userId || request.userId.trim().length === 0) {
      return "User ID là bắt buộc";
    }

    if (!request.deactivatedBy || request.deactivatedBy.trim().length === 0) {
      return "Admin ID là bắt buộc";
    }

    if (!request.reason || request.reason.trim().length === 0) {
      return "Lý do vô hiệu hóa là bắt buộc";
    }

    if (request.reason.trim().length < 5) {
      return "Lý do vô hiệu hóa phải có ít nhất 5 ký tự";
    }

    return null;
  }
}
