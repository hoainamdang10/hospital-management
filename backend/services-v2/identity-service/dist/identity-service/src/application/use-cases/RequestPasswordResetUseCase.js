"use strict";
/**
 * Request Password Reset Use Case (Enhanced)
 * Handles password reset requests via primary or recovery email
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS Command Pattern
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestPasswordResetUseCase = void 0;
const RecoveryAttempt_1 = require("../../domain/value-objects/RecoveryAttempt");
const Email_1 = require("../../domain/value-objects/Email");
const UserId_1 = require("../../domain/value-objects/UserId");
/**
 * Request Password Reset Use Case (Enhanced)
 * Supports password reset via primary email or recovery email
 * Includes rate limiting and audit logging
 */
class RequestPasswordResetUseCase {
    constructor(authService, userRepository, recoveryMethodRepository, recoveryHistoryRepository, logger, circuitBreaker) {
        this.authService = authService;
        this.userRepository = userRepository;
        this.recoveryMethodRepository = recoveryMethodRepository;
        this.recoveryHistoryRepository = recoveryHistoryRepository;
        this.logger = logger;
        this.circuitBreaker = circuitBreaker;
        this.RATE_LIMIT_WINDOW_HOURS = 1;
        this.MAX_ATTEMPTS_PER_WINDOW = 3;
    }
    async execute(request) {
        return await this.circuitBreaker.execute(async () => this.executeImpl(request), async () => {
            this.logger.error('Circuit breaker open for RequestPasswordResetUseCase');
            return {
                success: false,
                message: 'Dịch vụ đặt lại mật khẩu tạm thời không khả dụng. Vui lòng thử lại sau.',
                error: 'SERVICE_UNAVAILABLE'
            };
        });
    }
    async executeImpl(request) {
        try {
            this.logger.info('Processing password reset request', {
                email: request.email,
                method: request.method || 'auto'
            });
            // Validate email format
            if (!request.email || !request.email.includes('@')) {
                return {
                    success: false,
                    message: 'Email không hợp lệ',
                    error: 'INVALID_EMAIL'
                };
            }
            const email = Email_1.Email.create(request.email);
            // Find user by email (primary or recovery)
            const { userId, recoveryMethod } = await this.findUserByEmail(email.value, request.method);
            if (!userId) {
                // For security, return success message even if user not found
                this.logger.warn('Password reset requested for non-existent email', {
                    email: request.email
                });
                return {
                    success: true,
                    message: 'Nếu email tồn tại trong hệ thống, bạn sẽ nhận được email hướng dẫn đặt lại mật khẩu.'
                };
            }
            // Check rate limiting
            const rateLimitError = await this.checkRateLimit(userId);
            if (rateLimitError) {
                // Log failed attempt
                await this.logAttempt(userId, recoveryMethod, false, rateLimitError, request.ipAddress, request.userAgent);
                return {
                    success: false,
                    message: rateLimitError,
                    error: 'RATE_LIMIT_EXCEEDED'
                };
            }
            // Check if user is active
            const userIdVO = UserId_1.UserId.fromString(userId);
            const user = await this.userRepository.findById(userIdVO);
            if (!user || !user.isActive) {
                // Log failed attempt
                await this.logAttempt(userId, recoveryMethod, false, 'User inactive', request.ipAddress, request.userAgent);
                this.logger.warn('Password reset requested for inactive user', { userId });
                return {
                    success: false,
                    message: 'Tài khoản đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.',
                    error: 'USER_INACTIVE'
                };
            }
            // Send password reset email via Supabase
            await this.authService.sendPasswordResetEmail(request.email);
            // Log successful attempt
            await this.logAttempt(userId, recoveryMethod, true, null, request.ipAddress, request.userAgent);
            this.logger.info('Password reset email sent successfully', {
                userId,
                email: request.email,
                method: recoveryMethod
            });
            return {
                success: true,
                message: 'Email hướng dẫn đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư của bạn.'
            };
        }
        catch (error) {
            this.logger.error('Password reset request failed', {
                email: request.email,
                error: error.message
            });
            return {
                success: false,
                message: `Không thể gửi email đặt lại mật khẩu: ${error.message}`,
                error: 'REQUEST_PASSWORD_RESET_FAILED'
            };
        }
    }
    /**
     * Find user by email (primary or recovery)
     * Returns userId and recovery method used
     */
    async findUserByEmail(email, preferredMethod) {
        // Try primary email first (unless recovery is explicitly requested)
        if (preferredMethod !== 'recovery') {
            const emailObj = Email_1.Email.create(email);
            const user = await this.userRepository.findByEmail(emailObj);
            if (user) {
                return { userId: user.id, recoveryMethod: 'primary_email' };
            }
        }
        // Try recovery email
        const userId = await this.recoveryMethodRepository.findUserIdByRecoveryEmail(email);
        if (userId) {
            return { userId, recoveryMethod: 'recovery_email' };
        }
        // If primary was explicitly requested but not found, try recovery anyway
        if (preferredMethod === 'primary') {
            const recoveryUserId = await this.recoveryMethodRepository.findUserIdByRecoveryEmail(email);
            if (recoveryUserId) {
                return { userId: recoveryUserId, recoveryMethod: 'recovery_email' };
            }
        }
        return { userId: null, recoveryMethod: 'primary_email' };
    }
    /**
     * Check rate limiting
     * Returns error message if rate limit exceeded, null otherwise
     */
    async checkRateLimit(userId) {
        const sinceDate = new Date();
        sinceDate.setHours(sinceDate.getHours() - this.RATE_LIMIT_WINDOW_HOURS);
        const attemptCount = await this.recoveryHistoryRepository.countRecentAttempts(userId, 'request_reset', sinceDate);
        if (attemptCount >= this.MAX_ATTEMPTS_PER_WINDOW) {
            return `Bạn đã vượt quá số lần yêu cầu đặt lại mật khẩu (${this.MAX_ATTEMPTS_PER_WINDOW} lần/${this.RATE_LIMIT_WINDOW_HOURS} giờ). Vui lòng thử lại sau.`;
        }
        return null;
    }
    /**
     * Log recovery attempt
     */
    async logAttempt(userId, recoveryMethod, success, failureReason, ipAddress, userAgent) {
        try {
            const attempt = success
                ? RecoveryAttempt_1.RecoveryAttempt.createSuccess(userId, recoveryMethod, 'request_reset', ipAddress, userAgent)
                : RecoveryAttempt_1.RecoveryAttempt.createFailure(userId, recoveryMethod, 'request_reset', failureReason, ipAddress, userAgent);
            await this.recoveryHistoryRepository.log(attempt);
        }
        catch (error) {
            // Don't fail the request if logging fails
            this.logger.error('Failed to log recovery attempt', {
                userId,
                error: error.message
            });
        }
    }
}
exports.RequestPasswordResetUseCase = RequestPasswordResetUseCase;
//# sourceMappingURL=RequestPasswordResetUseCase.js.map