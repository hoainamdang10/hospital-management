"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegisterUserUseCase = void 0;
const error_helper_1 = require("../../utils/error-helper");
const Email_1 = require("../../domain/value-objects/Email");
const PendingRegistration_1 = require("../../domain/entities/PendingRegistration");
const EmailVerificationToken_1 = require("../../domain/value-objects/EmailVerificationToken");
const PendingRegistrationCreatedEvent_1 = require("../../domain/events/PendingRegistrationCreatedEvent");
const bcrypt = __importStar(require("bcrypt"));
/**
 * Register User Use Case - Verify-First Approach
 * Flow: Store pending registration → Send verification email → User created after verification
 *
 * This use case stores user data temporarily in pending_registrations table
 * and creates the actual user ONLY after email verification is completed.
 * This prevents database pollution from unverified users.
 */
class RegisterUserUseCase {
    constructor(userRepository, pendingRegistrationRepository, logger, circuitBreaker, emailService, jwtSecret, frontendUrl, eventPublisher // Optional for backward compatibility
    ) {
        this.userRepository = userRepository;
        this.pendingRegistrationRepository = pendingRegistrationRepository;
        this.logger = logger;
        this.circuitBreaker = circuitBreaker;
        this.emailService = emailService;
        this.jwtSecret = jwtSecret;
        this.frontendUrl = frontendUrl;
        this.eventPublisher = eventPublisher;
        this.BCRYPT_ROUNDS = 10; // Bcrypt salt rounds
    }
    async execute(request) {
        return await this.circuitBreaker.execute(async () => this.executeImpl(request), async () => {
            this.logger.error('Circuit breaker open for RegisterUserUseCase');
            return {
                success: false,
                message: 'Dịch vụ đăng ký tạm thời không khả dụng. Vui lòng thử lại sau.',
                requiresEmailVerification: false,
                error: 'SERVICE_UNAVAILABLE'
            };
        });
    }
    async executeImpl(request) {
        try {
            // SECURITY: Hardcode roleType = 'PATIENT' for public registration
            // This prevents privilege escalation attacks where users try to register as ADMIN/DOCTOR
            // Staff accounts (DOCTOR, NURSE, ADMIN) must be created by admins via separate endpoint
            const roleType = 'PATIENT';
            this.logger.info('Starting user registration (Verify-First)', {
                email: request.email,
                roleType: roleType // Always PATIENT for public registration
            });
            // 1. Validate input (no role validation needed - always PATIENT)
            const validationError = this.validateRequest(request);
            if (validationError) {
                return {
                    success: false,
                    message: validationError,
                    requiresEmailVerification: false,
                    error: 'VALIDATION_ERROR'
                };
            }
            // 2. Check if user already exists (verified user)
            const email = Email_1.Email.create(request.email);
            const existingUser = await this.userRepository.findByEmail(email);
            if (existingUser) {
                this.logger.warn('User already exists', { email: request.email });
                return {
                    success: false,
                    message: 'Email đã được đăng ký. Vui lòng sử dụng email khác hoặc đăng nhập.',
                    requiresEmailVerification: false,
                    error: 'USER_ALREADY_EXISTS'
                };
            }
            // 3. Check if email has active pending registration
            const hasPending = await this.pendingRegistrationRepository.hasActivePendingRegistration(email);
            if (hasPending) {
                this.logger.warn('Email has active pending registration', { email: request.email });
                return {
                    success: false,
                    message: 'Email đã có đăng ký đang chờ xác thực. Vui lòng kiểm tra email hoặc đợi hết hạn để đăng ký lại.',
                    requiresEmailVerification: false,
                    error: 'PENDING_REGISTRATION_EXISTS'
                };
            }
            // 4. Hash password (will be used to create user after verification)
            const passwordHash = await bcrypt.hash(request.password, this.BCRYPT_ROUNDS);
            // 5. Generate verification token (24h expiry)
            const verificationToken = EmailVerificationToken_1.EmailVerificationToken.generate('pending', // Temporary ID, will be replaced with actual user ID after verification
            email, this.jwtSecret, 24 // 24 hours
            );
            // 6. Create pending registration entity
            const pendingRegistration = PendingRegistration_1.PendingRegistration.create(email, passwordHash, {
                fullName: request.fullName,
                phoneNumber: request.phoneNumber,
                citizenId: request.citizenId,
                dateOfBirth: request.dateOfBirth ? new Date(request.dateOfBirth) : undefined,
                gender: request.gender,
                address: request.address,
                roleType: roleType.toLowerCase() // Always 'patient'
            }, verificationToken.token, 24 // 24 hours expiry
            );
            // 7. Store pending registration in database
            await this.pendingRegistrationRepository.store(pendingRegistration);
            this.logger.info('Pending registration created successfully', {
                pendingRegistrationId: pendingRegistration.id,
                email: request.email,
                expiresAt: pendingRegistration.expiresAt
            });
            // 8. Send verification email
            try {
                const verificationUrl = `${this.frontendUrl}/auth/verify-email?token=${verificationToken.token}`;
                await this.emailService.sendVerificationEmail({
                    email: email.value,
                    userName: request.fullName,
                    verificationUrl
                });
                // Mark email as sent successfully
                await this.pendingRegistrationRepository.updateStatus(pendingRegistration.id, 'EMAIL_SENT');
                this.logger.info('Verification email sent successfully', {
                    pendingRegistrationId: pendingRegistration.id,
                    email: email.value
                });
            }
            catch (error) {
                this.logger.error('Failed to send verification email', {
                    pendingRegistrationId: pendingRegistration.id,
                    error: (0, error_helper_1.getErrorMessage)(error)
                });
                // Rollback: Delete pending registration if email sending fails
                // ENHANCED: Add retry mechanism and fallback to prevent orphaned records
                try {
                    await this.pendingRegistrationRepository.delete(pendingRegistration.id);
                    this.logger.info('Pending registration deleted after email failure', {
                        pendingRegistrationId: pendingRegistration.id
                    });
                }
                catch (deleteError) {
                    this.logger.error('CRITICAL: Failed to rollback pending registration', {
                        pendingRegistrationId: pendingRegistration.id,
                        email: email.value,
                        error: (0, error_helper_1.getErrorMessage)(deleteError)
                    });
                    // Fallback: Mark as FAILED to prevent blocking re-registration
                    // This allows cleanup job to remove it later
                    try {
                        await this.pendingRegistrationRepository.updateStatus(pendingRegistration.id, 'FAILED');
                        this.logger.warn('Marked pending registration as FAILED (fallback)', {
                            pendingRegistrationId: pendingRegistration.id
                        });
                    }
                    catch (statusError) {
                        this.logger.error('CRITICAL: Failed to mark pending registration as FAILED', {
                            pendingRegistrationId: pendingRegistration.id,
                            error: (0, error_helper_1.getErrorMessage)(statusError)
                        });
                        // At this point, record is orphaned and will need manual cleanup
                        // or cleanup job to remove it
                    }
                }
                return {
                    success: false,
                    message: 'Không thể gửi email xác thực. Vui lòng thử lại sau.',
                    requiresEmailVerification: false,
                    error: 'EMAIL_SENDING_FAILED'
                };
            }
            // 9. Publish domain event
            if (this.eventPublisher) {
                try {
                    const event = new PendingRegistrationCreatedEvent_1.PendingRegistrationCreatedEvent(pendingRegistration.id, email.value, request.fullName, roleType, // Always 'PATIENT'
                    pendingRegistration.expiresAt);
                    await this.eventPublisher.publishDomainEvents([event]);
                    this.logger.info('PendingRegistrationCreated event published', {
                        pendingRegistrationId: pendingRegistration.id
                    });
                }
                catch (error) {
                    this.logger.error('Failed to publish domain event', {
                        pendingRegistrationId: pendingRegistration.id,
                        error: (0, error_helper_1.getErrorMessage)(error)
                    });
                    // Don't fail registration if event publishing fails
                }
            }
            // 10. Return success response
            return {
                success: true,
                pendingRegistrationId: pendingRegistration.id,
                email: email.value,
                message: 'Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản. Link xác thực có hiệu lực trong 24 giờ.',
                requiresEmailVerification: true
            };
        }
        catch (error) {
            this.logger.error('User registration failed', {
                email: request.email,
                error: (0, error_helper_1.getErrorMessage)(error)
            });
            return {
                success: false,
                message: 'Đăng ký thất bại. Vui lòng kiểm tra lại thông tin và thử lại.',
                requiresEmailVerification: false,
                error: 'REGISTRATION_FAILED'
            };
        }
    }
    validateRequest(request) {
        // Email format: basic RFC-compliant check (no spaces, must contain @ and a dot in domain)
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!request.email || !emailRegex.test(request.email)) {
            return 'Email không hợp lệ';
        }
        if (!request.password || request.password.length < 8) {
            return 'Mật khẩu phải có ít nhất 8 ký tự';
        }
        if (!request.fullName || request.fullName.trim().length < 2) {
            return 'Họ tên phải có ít nhất 2 ký tự';
        }
        // NO role validation - always PATIENT for public registration
        // Staff accounts must be created by admins via separate endpoint
        if (request.phoneNumber && !/^[0-9]{10,11}$/.test(request.phoneNumber)) {
            return 'Số điện thoại không hợp lệ (phải có 10-11 chữ số)';
        }
        if (request.citizenId && !/^[0-9]{9,12}$/.test(request.citizenId)) {
            return 'Số CMND/CCCD không hợp lệ (phải có 9-12 chữ số)';
        }
        return null;
    }
}
exports.RegisterUserUseCase = RegisterUserUseCase;
//# sourceMappingURL=RegisterUserUseCase.js.map