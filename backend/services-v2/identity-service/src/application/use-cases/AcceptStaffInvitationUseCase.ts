/**
 * AcceptStaffInvitationUseCase
 * Handles staff account activation from invitation link
 *
 * Flow:
 * 1. Staff receives invitation email with token
 * 2. Staff clicks link and provides password
 * 3. System verifies token validity
 * 4. System creates auth user + profile
 * 5. System marks invitation as used
 * 6. System publishes UserCreated and UserActivated events
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { IUserRepository } from "../repositories/IUserRepository";
import { Email } from "../../domain/value-objects/Email";
import { PersonalInfo } from "../../domain/value-objects/PersonalInfo";
import { ILogger } from "../services/ILogger";
import { IEventPublisher } from "../services/IEventPublisher";
import { getErrorMessage } from "../../utils/error-helper";

export interface AcceptStaffInvitationRequest {
  invitationToken: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  phoneNumber?: string;
}

export interface AcceptStaffInvitationResponse {
  success: boolean;
  userId?: string;
  email?: string;
  role?: string;
  message?: string;
  error?: string;
  errorCode?: string;
}

export class AcceptStaffInvitationUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly logger: ILogger,
    private readonly eventPublisher?: IEventPublisher,
  ) {}

  async execute(
    request: AcceptStaffInvitationRequest,
  ): Promise<AcceptStaffInvitationResponse> {
    try {
      this.logger.info("Processing staff invitation acceptance", {
        token: request.invitationToken.substring(0, 10) + "...",
      });

      // 1. Validate input
      const validationError = this.validateRequest(request);
      if (validationError) {
        return {
          success: false,
          error: validationError,
          errorCode: "VALIDATION_ERROR",
        };
      }

      // 2. Verify invitation token
      const invitation = await this.userRepository.verifyStaffInvitation(
        request.invitationToken,
      );

      if (!invitation.isValid || !invitation.email || !invitation.role) {
        this.logger.warn("Invalid or expired invitation token", {
          token: request.invitationToken.substring(0, 10) + "...",
        });
        return {
          success: false,
          error: "Liên kết mời không hợp lệ hoặc đã hết hạn",
          errorCode: "INVALID_INVITATION",
        };
      }

      // 3. Check if user already exists
      const email = Email.create(invitation.email);
      const existingUser = await this.userRepository.findByEmail(email);
      if (existingUser) {
        this.logger.warn("User already exists for invitation", {
          email: invitation.email,
        });
        return {
          success: false,
          error:
            "Tài khoản đã được kích hoạt trước đó. Vui lòng đăng nhập hoặc dùng chức năng quên mật khẩu.",
          errorCode: "USER_ALREADY_EXISTS",
        };
      }

      // 4. Create auth user + profile
      const invitationData = (invitation.invitationData || {}) as Record<
        string,
        unknown
      >;

      const parsedDateOfBirth = this.parseDate(
        invitationData.dateOfBirth || invitationData.dob,
      );
      const parsedGender = this.normalizeGender(invitationData.gender);
      const parsedCitizenId = this.pickFirstString(invitationData, [
        "citizenId",
        "nationalId",
        "cccd",
      ]);
      const resolvedAddress = this.buildAddress(invitationData);

      const invitationFullName =
        typeof invitationData.fullName === "string"
          ? invitationData.fullName
          : undefined;
      const invitationPhone =
        typeof invitationData.phoneNumber === "string"
          ? invitationData.phoneNumber
          : undefined;

      const fullName =
        request.fullName?.trim().length && request.fullName.trim().length >= 2
          ? request.fullName.trim()
          : invitationFullName || invitation.email.split("@")[0] || "Staff";

      const phoneNumber =
        request.phoneNumber && request.phoneNumber.trim().length > 0
          ? request.phoneNumber.trim()
          : invitationPhone;

      // Validate before creating auth user (align with patient flow)
      if (!fullName || fullName.trim().length < 2) {
        return {
          success: false,
          error: "Họ tên phải có ít nhất 2 ký tự",
          errorCode: "VALIDATION_ERROR",
        };
      }

      if (phoneNumber && !/^[0-9]{10,11}$/.test(phoneNumber)) {
        return {
          success: false,
          error: "Số điện thoại không hợp lệ (phải có 10-11 chữ số)",
          errorCode: "VALIDATION_ERROR",
        };
      }

      const user = await this.userRepository.createAuthUser({
        email: invitation.email,
        password: request.password,
        fullName,
        roleType: invitation.role,
        phoneNumber,
        emailConfirm: true, // Staff accounts are pre-verified
        metadata: {
          invitationToken: request.invitationToken,
          activatedViaInvitation: true,
          invitationData: invitation.invitationData,
        },
      });

      this.logger.info("Staff account created successfully", {
        userId: user.id,
        email: invitation.email,
        role: invitation.role,
      });

      // 4.5. Record staff activation (emits UserCreatedEvent for downstream services)
      // This is needed for downstream services (Staff Service, Patient Registry) to create profiles
      const personalInfo = PersonalInfo.create({
        fullName,
        phoneNumber,
        dateOfBirth: parsedDateOfBirth || undefined,
        gender: parsedGender || undefined,
        citizenId: parsedCitizenId || undefined,
        address: resolvedAddress || undefined,
      });

      const professionalData = invitation.invitationData as
        | Record<string, unknown>
        | undefined;

      // ✅ FIX: Use public domain method instead of calling protected addDomainEvent
      user.recordStaffActivation(personalInfo, professionalData);

      this.logger.info("Staff activation recorded with UserCreatedEvent", {
        userId: user.id,
        role: invitation.role,
      });

      // 5. Mark invitation as used
      try {
        await this.userRepository.markInvitationAsUsed(
          request.invitationToken,
          user.id,
        );
      } catch (error) {
        this.logger.error("Failed to mark invitation as used", {
          userId: user.id,
          error: getErrorMessage(error),
        });
        // Don't fail the whole process if this fails
      }

      // 6. Publish domain events
      if (this.eventPublisher) {
        try {
          const domainEvents = user.getUncommittedEvents();
          await this.eventPublisher.publishDomainEvents(domainEvents);
          user.markEventsAsCommitted();

          this.logger.info("Domain events published for staff activation", {
            userId: user.id,
            eventCount: domainEvents.length,
          });
        } catch (error) {
          this.logger.error("Failed to publish domain events", {
            userId: user.id,
            error: getErrorMessage(error),
          });
          // Don't fail activation if event publishing fails
        }
      }

      return {
        success: true,
        userId: user.id,
        email: user.email.value,
        role: invitation.role,
        message: "Tài khoản nhân viên đã được kích hoạt thành công",
      };
    } catch (error) {
      this.logger.error("Staff invitation acceptance failed", {
        error: getErrorMessage(error),
      });

      return {
        success: false,
        error: `Kích hoạt tài khoản thất bại: ${getErrorMessage(error)}`,
        errorCode: "ACTIVATION_FAILED",
      };
    }
  }

  private validateRequest(
    request: AcceptStaffInvitationRequest,
  ): string | null {
    if (
      !request.invitationToken ||
      request.invitationToken.trim().length === 0
    ) {
      return "Token mời không hợp lệ";
    }

    if (!request.password || request.password.length < 8) {
      return "Mật khẩu phải có ít nhất 8 ký tự";
    }

    if (request.password !== request.confirmPassword) {
      return "Mật khẩu xác nhận không khớp";
    }

    if (request.phoneNumber && !/^[0-9]{10,11}$/.test(request.phoneNumber)) {
      return "Số điện thoại không hợp lệ (phải có 10-11 chữ số)";
    }

    return null;
  }

  private parseDate(value: unknown): Date | null {
    if (typeof value === "string" || value instanceof Date) {
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? null : date;
    }
    return null;
  }

  private normalizeGender(value: unknown): "male" | "female" | "other" | null {
    if (typeof value !== "string") return null;
    const normalized = value.toLowerCase();
    if (normalized === "male" || normalized === "m") return "male";
    if (normalized === "female" || normalized === "f") return "female";
    if (normalized === "other" || normalized === "o") return "other";
    return null;
  }

  private pickFirstString(
    data: Record<string, unknown>,
    keys: string[],
  ): string | undefined {
    for (const key of keys) {
      const val = data[key];
      if (typeof val === "string" && val.trim().length > 0) {
        return val.trim();
      }
    }
    return undefined;
  }

  private buildAddress(data: Record<string, unknown>): string | null {
    const addressObj =
      (data.address as Record<string, unknown> | undefined) ||
      (data.contact as Record<string, unknown> | undefined);
    const fields: string[] = [];
    const pushIfStr = (v: unknown) => {
      if (typeof v === "string" && v.trim().length > 0) {
        fields.push(v.trim());
      }
    };
    if (addressObj) {
      pushIfStr(addressObj.street || addressObj["street1"]);
      pushIfStr(addressObj.ward);
      pushIfStr(addressObj.district);
      pushIfStr(addressObj.city);
      pushIfStr(addressObj.province || addressObj.state);
      pushIfStr(addressObj.country);
    }
    return fields.length ? fields.join(", ") : null;
  }
}
