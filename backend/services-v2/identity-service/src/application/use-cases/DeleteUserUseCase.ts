/**
 * DeleteUserUseCase (Admin Only)
 * Thực hiện hard delete tài khoản sau khi đã bị deactivate
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { IUseCase } from "@shared/application/use-cases/base/use-case.interface";
import { IUserRepository } from "../repositories/IUserRepository";
import { UserId } from "../../domain/value-objects/UserId";
import { ILogger } from "../services/ILogger";
import { ICircuitBreaker } from "../services/ICircuitBreaker";
import { AccountStatus } from "../../domain/value-objects/AccountStatus";
import { UserDeletedEvent } from "../../domain/events/UserDeletedEvent";
import { IEventPublisher } from "../services/IEventPublisher";
import { OutboxService } from "../../infrastructure/outbox/OutboxService";

export interface DeleteUserRequest {
  userId: string;
  deletedBy: string;
  reason: string;
  force?: boolean;
}

export interface DeleteUserResponse {
  success: boolean;
  message: string;
  error?: string;
}

export class DeleteUserUseCase
  implements IUseCase<DeleteUserRequest, DeleteUserResponse>
{
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly logger: ILogger,
    private readonly circuitBreaker: ICircuitBreaker,
    private readonly eventPublisher?: IEventPublisher,
    private readonly outboxService?: OutboxService,
  ) {}

  async execute(request: DeleteUserRequest): Promise<DeleteUserResponse> {
    return this.circuitBreaker.execute(
      () => this.executeImpl(request),
      async () => {
        this.logger.error("Circuit breaker open for DeleteUserUseCase");
        return {
          success: false,
          message:
            "Dịch vụ xóa tài khoản tạm thời không khả dụng. Vui lòng thử lại sau.",
          error: "SERVICE_UNAVAILABLE",
        };
      },
    );
  }

  private async executeImpl(
    request: DeleteUserRequest,
  ): Promise<DeleteUserResponse> {
    const validationError = this.validateRequest(request);
    if (validationError) {
      return {
        success: false,
        message: validationError,
        error: "VALIDATION_ERROR",
      };
    }

    if (request.userId === request.deletedBy) {
      this.logger.warn("User attempted to hard delete themselves", {
        userId: request.userId,
      });
      return {
        success: false,
        message: "Không thể xóa tài khoản của chính mình",
        error: "CANNOT_DELETE_SELF",
      };
    }

    const userIdVO = UserId.fromString(request.userId);
    const user = await this.userRepository.findById(userIdVO);
    if (!user) {
      this.logger.warn("User not found for hard delete", {
        userId: request.userId,
      });

      // Idempotent cleanup: still publish deletion event so downstream services can remove orphans
      await this.publishDeletionEvent(
        userIdVO,
        request,
        `${request.userId}@deleted.local`,
      );

      return {
        success: true,
        message: "Người dùng không tồn tại (đã được xem như đã xóa)",
      };
    }

    if (!request.force && user.accountStatus !== AccountStatus.DEACTIVATED) {
      return {
        success: false,
        message:
          "Tài khoản phải được vô hiệu hóa trước khi xóa vĩnh viễn. Vui lòng deactivate trước.",
        error: "NOT_DEACTIVATED",
      };
    }

    try {
      await this.userRepository.hardDelete(userIdVO);
      await this.publishDeletionEvent(userIdVO, request, user.email.value);

      this.logger.warn("User permanently deleted", {
        userId: request.userId,
        deletedBy: request.deletedBy,
        reason: request.reason,
        severity: "CRITICAL",
      });

      return {
        success: true,
        message: "Tài khoản đã được xóa vĩnh viễn khỏi hệ thống.",
      };
    } catch (error) {
      this.logger.error("Failed to hard delete user", {
        userId: request.userId,
        deletedBy: request.deletedBy,
        error: error instanceof Error ? error.message : String(error),
      });

      return {
        success: false,
        message: "Xóa tài khoản thất bại. Vui lòng thử lại sau.",
        error: "DELETE_FAILED",
      };
    }
  }

  private validateRequest(request: DeleteUserRequest): string | null {
    if (!request.userId || !request.userId.trim()) {
      return "User ID là bắt buộc";
    }

    if (!request.deletedBy || !request.deletedBy.trim()) {
      return "Admin ID là bắt buộc";
    }

    if (!request.reason || request.reason.trim().length < 5) {
      return "Lý do xóa phải có ít nhất 5 ký tự";
    }

    return null;
  }

  private async publishDeletionEvent(
    userId: UserId,
    request: DeleteUserRequest,
    email: string,
  ): Promise<void> {
    const event = new UserDeletedEvent(
      userId,
      request.deletedBy,
      request.reason,
      email,
    );

    if (this.outboxService) {
      try {
        await this.outboxService.storeEvent(event);
        this.logger.info("UserDeletedEvent stored in outbox", {
          userId: userId.value,
        });
      } catch (error) {
        this.logger.error("Failed to store UserDeletedEvent in outbox", {
          userId: userId.value,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    if (this.eventPublisher) {
      try {
        await this.eventPublisher.publishDomainEvents([event]);
      } catch (error) {
        this.logger.error("Failed to publish UserDeletedEvent", {
          userId: userId.value,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }
}
