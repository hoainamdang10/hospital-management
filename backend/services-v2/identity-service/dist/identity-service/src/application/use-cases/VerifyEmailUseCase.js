"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerifyEmailUseCase = void 0;
const error_helper_1 = require("../../utils/error-helper");
const EmailVerificationToken_1 = require("../../domain/value-objects/EmailVerificationToken");
const Email_1 = require("../../domain/value-objects/Email");
const UserActivatedEvent_1 = require("../../domain/events/UserActivatedEvent");
const domain_events_1 = require("../../../../shared/domain/events/domain-events");
const password_crypto_1 = require("../../utils/password-crypto");
/**
 * Convert HealthcareRoleType to shared role type
 */
function convertToSharedRoleType(roleType) {
    const roleMapping = {
        'ADMIN': 'admin',
        'DOCTOR': 'doctor',
        'NURSE': 'nurse',
        'RECEPTIONIST': 'receptionist',
        'PATIENT': 'patient'
    };
    const converted = roleMapping[roleType.toUpperCase()];
    if (!converted) {
        throw new Error(`Unsupported role type: ${roleType}`);
    }
    return converted;
}
class VerifyEmailUseCase {
    constructor(userRepository, pendingRegistrationRepository, emailService, logger, circuitBreaker, jwtSecret, eventPublisher, // Optional for backward compatibility
    outboxService) {
        this.userRepository = userRepository;
        this.pendingRegistrationRepository = pendingRegistrationRepository;
        this.emailService = emailService;
        this.logger = logger;
        this.circuitBreaker = circuitBreaker;
        this.jwtSecret = jwtSecret;
        this.eventPublisher = eventPublisher;
        this.outboxService = outboxService;
    }
    async execute(request) {
        return await this.circuitBreaker.execute(async () => this.executeImpl(request), async () => {
            this.logger.error("Circuit breaker open for VerifyEmailUseCase");
            return {
                success: false,
                message: "Dịch vụ xác thực email tạm thời không khả dụng. Vui lòng thử lại sau.",
                error: "SERVICE_UNAVAILABLE",
            };
        });
    }
    async executeImpl(request) {
        try {
            this.logger.info("Processing email verification (Verify-First)");
            // 1. Validate token format
            if (!request.token || request.token.trim().length === 0) {
                return {
                    success: false,
                    message: "Token xác thực không hợp lệ",
                    error: "INVALID_TOKEN",
                };
            }
            // 2. Verify JWT token and extract payload
            let tokenPayload;
            try {
                tokenPayload = EmailVerificationToken_1.EmailVerificationToken.verify(request.token, this.jwtSecret);
            }
            catch (error) {
                this.logger.warn("Invalid JWT token", {
                    error: (0, error_helper_1.getErrorMessage)(error),
                });
                return {
                    success: false,
                    message: "Token xác thực không hợp lệ hoặc đã hết hạn",
                    error: "INVALID_TOKEN",
                };
            }
            // 3. Find pending registration by token
            const pendingRegistration = await this.pendingRegistrationRepository.findByToken(request.token);
            if (!pendingRegistration) {
                this.logger.warn("Pending registration not found", {
                    tokenEmail: tokenPayload.email,
                });
                return {
                    success: false,
                    message: "Token xác thực không tồn tại hoặc đã hết hạn",
                    error: "TOKEN_NOT_FOUND",
                };
            }
            // 4. Check if pending registration can be verified
            if (!pendingRegistration.canBeVerified()) {
                if (pendingRegistration.isExpired()) {
                    this.logger.warn("Pending registration expired", {
                        pendingRegistrationId: pendingRegistration.id,
                        expiresAt: pendingRegistration.expiresAt,
                    });
                    return {
                        success: false,
                        message: "Token xác thực đã hết hạn. Vui lòng đăng ký lại.",
                        error: "TOKEN_EXPIRED",
                    };
                }
                if (pendingRegistration.isUsed) {
                    this.logger.warn("Pending registration already used", {
                        pendingRegistrationId: pendingRegistration.id,
                    });
                    return {
                        success: false,
                        message: "Token xác thực đã được sử dụng",
                        error: "TOKEN_ALREADY_USED",
                    };
                }
            }
            // 5. Check if user already exists (edge case: user created manually)
            const email = Email_1.Email.create(tokenPayload.email);
            const existingUser = await this.userRepository.findByEmail(email);
            if (existingUser) {
                this.logger.warn("User already exists during verification", {
                    email: tokenPayload.email,
                });
                // Cleanup pending registration
                await this.pendingRegistrationRepository.delete(pendingRegistration.id);
                return {
                    success: false,
                    message: "Email đã được đăng ký. Vui lòng đăng nhập.",
                    error: "USER_ALREADY_EXISTS",
                };
            }
            // 6. Create user from pending registration data
            const userData = pendingRegistration.userData;
            let plainPassword;
            try {
                plainPassword = this.decryptPendingPassword(userData.rawPasswordEncrypted, pendingRegistration.id, pendingRegistration.email.value);
            }
            catch (error) {
                this.logger.error("Failed to decrypt registration password", {
                    pendingRegistrationId: pendingRegistration.id,
                    email: pendingRegistration.email.value,
                    error: (0, error_helper_1.getErrorMessage)(error),
                });
                return {
                    success: false,
                    message: "Không thể xác thực đăng ký do lỗi mật khẩu. Vui lòng đăng ký lại.",
                    error: "PASSWORD_DECRYPT_FAILED",
                };
            }
            const user = await this.userRepository.createAuthUser({
                email: pendingRegistration.email.value,
                password: plainPassword,
                fullName: userData.fullName,
                roleType: userData.roleType,
                phoneNumber: userData.phoneNumber,
                citizenId: userData.citizenId,
                dateOfBirth: userData.dateOfBirth,
                gender: userData.gender,
                address: userData.address,
                emailConfirm: true, // Email already verified
            });
            this.logger.info("User created successfully from pending registration", {
                userId: user.id,
                email: user.email.value,
                pendingRegistrationId: pendingRegistration.id,
            });
            // 7. Mark pending registration as verified
            try {
                await this.pendingRegistrationRepository.updateStatus(pendingRegistration.id, "VERIFIED");
            }
            catch (error) {
                this.logger.error("Failed to mark pending registration as verified", {
                    pendingRegistrationId: pendingRegistration.id,
                    error: (0, error_helper_1.getErrorMessage)(error),
                });
                // Continue - user already created
            }
            // 8. Delete pending registration (cleanup)
            try {
                await this.pendingRegistrationRepository.delete(pendingRegistration.id);
                this.logger.info("Pending registration deleted after successful verification", {
                    pendingRegistrationId: pendingRegistration.id,
                });
            }
            catch (error) {
                this.logger.error("Failed to delete pending registration", {
                    pendingRegistrationId: pendingRegistration.id,
                    error: (0, error_helper_1.getErrorMessage)(error),
                });
                // Continue - user already created, cleanup can happen later
            }
            // 9. Send welcome email
            try {
                await this.emailService.sendVerificationSuccessEmail({
                    email: user.email.value,
                    userName: user.personalInfo.fullName,
                });
            }
            catch (error) {
                this.logger.error("Failed to send welcome email", {
                    userId: user.id,
                    error: (0, error_helper_1.getErrorMessage)(error),
                });
                // Don't fail verification if email sending fails
            }
            // 10. Publish domain events using Outbox Pattern
            if (this.outboxService || this.eventPublisher) {
                try {
                    // Create UserCreatedEvent manually since user was reconstituted from database
                    // and doesn't have uncommitted events
                    const userCreatedEvent = new domain_events_1.UserCreatedEvent(user.id, user.email.value, user.personalInfo?.fullName || '', convertToSharedRoleType(user.healthcareRoles[0]?.type || 'PATIENT'), user.personalInfo?.citizenId, user.personalInfo?.phoneNumber);
                    // Create UserActivated event
                    const activatedEvent = new UserActivatedEvent_1.UserActivatedEvent(user.id, user.email.value, user.personalInfo.fullName, // Add full name from personal info
                    new Date());
                    const events = [userCreatedEvent, activatedEvent];
                    // Store events in outbox (guaranteed persistence)
                    if (this.outboxService) {
                        for (const event of events) {
                            await this.outboxService.storeEvent(event);
                        }
                        this.logger.info("Domain events stored in outbox", {
                            userId: user.id,
                            eventCount: events.length,
                            eventTypes: events.map((event) => event.eventType),
                        });
                    }
                    // Also publish immediately if eventPublisher available (best effort)
                    if (this.eventPublisher) {
                        try {
                            await this.eventPublisher.publishDomainEvents(events);
                            this.logger.info("Domain events published immediately", {
                                userId: user.id,
                                eventCount: events.length,
                            });
                        }
                        catch (publishError) {
                            this.logger.warn("Failed to publish events immediately, outbox will retry", {
                                userId: user.id,
                                error: publishError instanceof Error ? publishError.message : String(publishError),
                            });
                            // Don't throw - outbox will handle retry
                        }
                    }
                }
                catch (error) {
                    this.logger.error("Failed to handle domain events", {
                        userId: user.id,
                        error: (0, error_helper_1.getErrorMessage)(error),
                    });
                    // Don't fail verification if event publishing fails
                }
            }
            return {
                success: true,
                userId: user.id,
                email: user.email.value,
                message: "Email đã được xác thực thành công! Tài khoản của bạn đã được tạo. Bạn có thể đăng nhập ngay bây giờ.",
            };
        }
        catch (error) {
            this.logger.error("Email verification failed", {
                error: (0, error_helper_1.getErrorMessage)(error),
            });
            return {
                success: false,
                message: "Xác thực email thất bại. Vui lòng thử lại sau.",
                error: "VERIFICATION_FAILED",
            };
        }
    }
    decryptPendingPassword(encryptedPassword, pendingRegistrationId, email) {
        if (!encryptedPassword) {
            this.logger.error("Missing encrypted password for pending registration", {
                pendingRegistrationId,
                email,
            });
            throw new Error("PASSWORD_DECRYPT_FAILED");
        }
        return (0, password_crypto_1.decryptPassword)(encryptedPassword, this.jwtSecret);
    }
}
exports.VerifyEmailUseCase = VerifyEmailUseCase;
//# sourceMappingURL=VerifyEmailUseCase.js.map