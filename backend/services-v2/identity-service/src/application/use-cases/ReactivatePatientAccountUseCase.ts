/**
 * Reactivate Patient Account Use Case
 * Cho phép admin khôi phục tài khoản bệnh nhân đã bị deactivate vĩnh viễn.
 */

import { IUseCase } from "@shared/application/use-cases/base/use-case.interface";
import { IUserRepository } from "../repositories/IUserRepository";
import { ICircuitBreaker } from "../services/ICircuitBreaker";
import { ILogger } from "../services/ILogger";
import { UserId } from "../../domain/value-objects/UserId";

export interface ReactivatePatientRequest {
  userId: string;
  reactivatedBy: string;
  reason?: string;
}

export interface ReactivatePatientResponse {
  success: boolean;
  message: string;
  error?: string;
}

export class ReactivatePatientAccountUseCase
  implements IUseCase<ReactivatePatientRequest, ReactivatePatientResponse>
{
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly logger: ILogger,
    private readonly circuitBreaker: ICircuitBreaker,
  ) {}

  async execute(
    request: ReactivatePatientRequest,
  ): Promise<ReactivatePatientResponse> {
    return this.circuitBreaker.execute(
      () => this.executeImpl(request),
      async () => {
        this.logger.error(
          "Circuit breaker open for ReactivatePatientAccountUseCase",
        );
        return {
          success: false,
          message: "Dịch vụ kích hoạt lại tài khoản tạm thời không khả dụng.",
          error: "SERVICE_UNAVAILABLE",
        };
      },
    );
  }

  private async executeImpl(
    request: ReactivatePatientRequest,
  ): Promise<ReactivatePatientResponse> {
    try {
      this.logger.info("Processing patient reactivation request", {
        userId: request.userId,
        reactivatedBy: request.reactivatedBy,
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

      if (user.accountStatus !== "deactivated") {
        return {
          success: false,
          message: "Tài khoản chưa bị vô hiệu hóa",
          error: "NOT_DEACTIVATED",
        };
      }

      if (!user.hasRole("PATIENT")) {
        return {
          success: false,
          message: "Chỉ hỗ trợ kích hoạt lại tài khoản bệnh nhân",
          error: "NOT_PATIENT_ROLE",
        };
      }

      user.reactivatePatient(request.reactivatedBy, request.reason);
      await this.userRepository.save(user);

      this.logger.info("Patient account reactivated", {
        userId: request.userId,
        reactivatedBy: request.reactivatedBy,
      });

      return {
        success: true,
        message: "Tài khoản bệnh nhân đã được kích hoạt trở lại.",
      };
    } catch (error) {
      this.logger.error("Failed to reactivate patient account", {
        userId: request.userId,
        error: error instanceof Error ? error.message : String(error),
      });

      return {
        success: false,
        message: "Không thể kích hoạt lại tài khoản. Vui lòng thử lại sau.",
        error: "REACTIVATE_FAILED",
      };
    }
  }

  private validateRequest(request: ReactivatePatientRequest): string | null {
    if (!request.userId || request.userId.trim().length === 0) {
      return "User ID là bắt buộc";
    }

    if (!request.reactivatedBy || request.reactivatedBy.trim().length === 0) {
      return "Admin ID là bắt buộc";
    }

    if (
      request.reason &&
      request.reason.trim().length > 0 &&
      request.reason.trim().length < 3
    ) {
      return "Lý do (nếu có) phải tối thiểu 3 ký tự";
    }

    return null;
  }
}
