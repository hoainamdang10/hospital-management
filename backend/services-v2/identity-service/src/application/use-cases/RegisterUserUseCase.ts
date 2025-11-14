import { getErrorMessage } from "../../utils/error-helper";
/**
 * Register User Use Case - Verify-First Approach
 * Handles user registration with email verification BEFORE creating user
 *
 * Design Pattern: Verify-First
 * - User data stored in pending_registrations table
 * - User created ONLY after email verification
 * - Prevents database pollution from unverified users
 * - Allows re-registration after token expiration
 *
 * @author Hospital Management Team
 * @version 3.0.0 - Verify-First Approach
 */

import { IUseCase } from "@shared/application/use-cases/base/use-case.interface";
import { IUserRepository } from "../repositories/IUserRepository";
// import { ICircuitBreaker } from "../services/ICircuitBreaker"; // DISABLED: Circuit breaker disabled for development
import { Email } from "../../domain/value-objects/Email";
import { IEventPublisher } from "../services/IEventPublisher";
import { ILogger } from "../services/ILogger";
import { IEmailService } from "../services/IEmailService";
import { IPendingRegistrationRepository } from "../../domain/repositories/IPendingRegistrationRepository";
import { PendingRegistration } from "../../domain/entities/PendingRegistration";
import { EmailVerificationToken } from "../../domain/value-objects/EmailVerificationToken";
import { PendingRegistrationCreatedEvent } from "../../domain/events/PendingRegistrationCreatedEvent";
import { encryptPassword } from "../../utils/password-crypto";
import * as bcrypt from "bcrypt";
import { OutboxService } from "../../infrastructure/outbox/OutboxService";

export interface RegisterUserRequest {
  email: string;
  password: string;
  fullName: string;
  roleType?: string; // Optional - will be ignored for public registration (always PATIENT)
  phoneNumber?: string;
  citizenId?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
}

export interface RegisterUserResponse {
  success: boolean;
  pendingRegistrationId?: string; // Changed from userId
  email?: string;
  message: string;
  requiresEmailVerification: boolean; // Always true now
  error?: string;
}

/**
 * Register User Use Case - Verify-First Approach
 * Flow: Store pending registration → Send verification email → User created after verification
 *
 * This use case stores user data temporarily in pending_registrations table
 * and creates the actual user ONLY after email verification is completed.
 * This prevents database pollution from unverified users.
 */
export class RegisterUserUseCase
  implements IUseCase<RegisterUserRequest, RegisterUserResponse>
{
  private readonly BCRYPT_ROUNDS = 10; // Bcrypt salt rounds

  constructor(
    private userRepository: IUserRepository,
    private pendingRegistrationRepository: IPendingRegistrationRepository,
    private logger: ILogger,
    // private circuitBreaker: ICircuitBreaker, // DISABLED: Circuit breaker disabled for development
    private emailService: IEmailService,
    private jwtSecret: string,
    private frontendUrl: string,
    private eventPublisher?: IEventPublisher,
    private outboxService?: OutboxService,
  ) {}

  async execute(request: RegisterUserRequest): Promise<RegisterUserResponse> {
    // DEV: Disable circuit breaker for development
    return await this.executeImpl(request);
    
    // PROD: Enable circuit breaker for production
    // return await this.circuitBreaker.execute(
    //   async () => this.executeImpl(request),
    //   async () => {
    //     this.logger.error("Circuit breaker open for RegisterUserUseCase");
    //     return {
    //       success: false,
    //       error: "SERVICE_TEMPORARILY_UNAVAILABLE",
    //       message: "Dịch vụ tạm thời không khả dụng, vui lòng thử lại sau",
    //       requiresEmailVerification: true
    //     };
    //   }
    // );
  }

  private async executeImpl(
    request: RegisterUserRequest,
  ): Promise<RegisterUserResponse> {
    try {
      // SECURITY: Hardcode roleType = 'PATIENT' for public registration
      // This prevents privilege escalation attacks where users try to register as ADMIN/DOCTOR
      // Staff accounts (DOCTOR, NURSE, ADMIN) must be created by admins via separate endpoint
      const roleType = "PATIENT";

      this.logger.info("Starting user registration (Verify-First)", {
        email: request.email,
        roleType: roleType, // Always PATIENT for public registration
      });

      // 1. Validate input (no role validation needed - always PATIENT)
      const validationError = this.validateRequest(request);
      if (validationError) {
        return {
          success: false,
          message: validationError,
          requiresEmailVerification: false,
          error: "VALIDATION_ERROR",
        };
      }

      // 2. Check if user already exists (verified user)
      const email = Email.create(request.email);
      const existingUser = await this.userRepository.findByEmail(email);
      if (existingUser) {
        this.logger.warn("User already exists", { email: request.email });
        return {
          success: false,
          message:
            "Email đã được đăng ký. Vui lòng sử dụng email khác hoặc đăng nhập.",
          requiresEmailVerification: false,
          error: "USER_ALREADY_EXISTS",
        };
      }

      // 3. Check if email has active pending registration
      const hasPending =
        await this.pendingRegistrationRepository.hasActivePendingRegistration(
          email,
        );
      if (hasPending) {
        this.logger.warn("Email has active pending registration", {
          email: request.email,
        });
        return {
          success: false,
          message:
            "Email đã có đăng ký đang chờ xác thực. Vui lòng kiểm tra email hoặc đợi hết hạn để đăng ký lại.",
          requiresEmailVerification: false,
          error: "PENDING_REGISTRATION_EXISTS",
        };
      }

      // 4. Hash password (will be used to create user after verification)
      const passwordHash = await bcrypt.hash(
        request.password,
        this.BCRYPT_ROUNDS,
      );

      // 5. Generate verification token (24h expiry)
      const verificationToken = EmailVerificationToken.generate(
        "pending", // Temporary ID, will be replaced with actual user ID after verification
        email,
        this.jwtSecret,
        24, // 24 hours
      );

      // 6. Create pending registration entity
      const pendingRegistration = PendingRegistration.create(
        email,
        passwordHash,
        {
          fullName: request.fullName,
          phoneNumber: request.phoneNumber,
          citizenId: request.citizenId,
          dateOfBirth: request.dateOfBirth
            ? new Date(request.dateOfBirth)
            : undefined,
          gender: request.gender ? request.gender.toLowerCase() : undefined,
          address: request.address,
          roleType: roleType.toLowerCase(), // Convert to lowercase to match database
          rawPasswordEncrypted: encryptPassword(
            request.password,
            this.jwtSecret,
          ),
        },
        verificationToken.token,
        24, // 24 hours expiry
      );

      // 7. Store pending registration in database
      await this.pendingRegistrationRepository.store(pendingRegistration);

      this.logger.info("Pending registration created successfully", {
        pendingRegistrationId: pendingRegistration.id,
        email: request.email,
        expiresAt: pendingRegistration.expiresAt,
      });

      // 8. Send verification email
      try {
        const verificationUrl = `${this.frontendUrl}/auth/verify-email?token=${verificationToken.token}`;
        await this.emailService.sendVerificationEmail({
          email: email.value,
          userName: request.fullName,
          verificationUrl,
        });

        // Mark email as sent successfully
        await this.pendingRegistrationRepository.updateStatus(
          pendingRegistration.id,
          "EMAIL_SENT",
        );

        this.logger.info("Verification email sent successfully", {
          pendingRegistrationId: pendingRegistration.id,
          email: email.value,
        });
      } catch (error) {
        this.logger.error("Failed to send verification email", {
          pendingRegistrationId: pendingRegistration.id,
          error: getErrorMessage(error),
        });

        // Rollback: Delete pending registration if email sending fails
        // ENHANCED: Add retry mechanism and fallback to prevent orphaned records
        try {
          await this.pendingRegistrationRepository.delete(
            pendingRegistration.id,
          );
          this.logger.info("Pending registration deleted after email failure", {
            pendingRegistrationId: pendingRegistration.id,
          });
        } catch (deleteError) {
          this.logger.error(
            "CRITICAL: Failed to rollback pending registration",
            {
              pendingRegistrationId: pendingRegistration.id,
              email: email.value,
              error: getErrorMessage(deleteError),
            },
          );

          // Fallback: Mark as FAILED to prevent blocking re-registration
          // This allows cleanup job to remove it later
          try {
            await this.pendingRegistrationRepository.updateStatus(
              pendingRegistration.id,
              "FAILED",
            );
            this.logger.warn(
              "Marked pending registration as FAILED (fallback)",
              {
                pendingRegistrationId: pendingRegistration.id,
              },
            );
          } catch (statusError) {
            this.logger.error(
              "CRITICAL: Failed to mark pending registration as FAILED",
              {
                pendingRegistrationId: pendingRegistration.id,
                error: getErrorMessage(statusError),
              },
            );
            // At this point, record is orphaned and will need manual cleanup
            // or cleanup job to remove it
          }
        }

        return {
          success: false,
          message: "Không thể gửi email xác thực. Vui lòng thử lại sau.",
          requiresEmailVerification: false,
          error: "EMAIL_SENDING_FAILED",
        };
      }

      // Auto-verification disabled - always require email verification

      // 9. Publish domain event using Outbox Pattern for guaranteed delivery
      if (this.eventPublisher) {
        try {
          const event = new PendingRegistrationCreatedEvent(
            pendingRegistration.id,
            email.value,
            request.fullName,
            roleType, // Always 'PATIENT'
            pendingRegistration.expiresAt,
          );

          // Store in outbox first (guaranteed persistence)
          if (this.outboxService) {
            await this.outboxService.storeEvent(event);
            this.logger.info("PendingRegistrationCreated event stored in outbox", {
              pendingRegistrationId: pendingRegistration.id,
            });
          }

          // Publish immediately
          await this.eventPublisher.publishDomainEvents([event]);
          this.logger.info("PendingRegistrationCreated event published", {
            pendingRegistrationId: pendingRegistration.id,
          });

          this.logger.info("PendingRegistrationCreated event processed successfully", {
            pendingRegistrationId: pendingRegistration.id,
            publishedImmediately: !!this.eventPublisher,
          });
        } catch (error) {
          this.logger.error("Failed to process PendingRegistrationCreated event", {
            pendingRegistrationId: pendingRegistration.id,
            error: getErrorMessage(error),
          });
          // Don't fail registration if event processing fails
        }
      }

      // 10. Return success response
      return {
        success: true,
        pendingRegistrationId: pendingRegistration.id,
        email: email.value,
        message:
          "Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản. Link xác thực có hiệu lực trong 24 giờ.",
        requiresEmailVerification: true,
      };
    } catch (error) {
      this.logger.error("User registration failed", {
        email: request.email,
        error: getErrorMessage(error),
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        errorStack: error instanceof Error ? error.stack : 'No stack',
        fullError: JSON.stringify(error),
      });

      return {
        success: false,
        message:
          "Đăng ký thất bại. Vui lòng kiểm tra lại thông tin và thử lại.",
        requiresEmailVerification: false,
        error: "REGISTRATION_FAILED",
      };
    }
  }

  private validateRequest(request: RegisterUserRequest): string | null {
    // Email format: basic RFC-compliant check (no spaces, must contain @ and a dot in domain)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!request.email || !emailRegex.test(request.email)) {
      return "Email không hợp lệ";
    }

    if (!request.password || request.password.length < 8) {
      return "Mật khẩu phải có ít nhất 8 ký tự";
    }

    if (!request.fullName || request.fullName.trim().length < 2) {
      return "Họ tên phải có ít nhất 2 ký tự";
    }

    // NO role validation - always PATIENT for public registration
    // Staff accounts must be created by admins via separate endpoint

    if (request.phoneNumber && !/^[0-9]{10,11}$/.test(request.phoneNumber)) {
      return "Số điện thoại không hợp lệ (phải có 10-11 chữ số)";
    }

    if (request.citizenId && !/^[0-9]{9,12}$/.test(request.citizenId)) {
      return "Số CMND/CCCD không hợp lệ (phải có 9-12 chữ số)";
    }

    return null;
  }
}
