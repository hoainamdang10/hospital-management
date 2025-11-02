"use strict";
/**
 * Reset Password With Token Use Case (Enhanced)
 * Resets password using reset token with enhanced security
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS Command Pattern
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResetPasswordWithTokenUseCase = void 0;
const RecoveryAttempt_1 = require("../../domain/value-objects/RecoveryAttempt");
const PasswordResetEvent_1 = require("../../domain/events/PasswordResetEvent");
const UserId_1 = require("../../domain/value-objects/UserId");
/**
 * Reset Password With Token Use Case (Enhanced)
 * Validates token, checks password policy, resets password, invalidates sessions
 */
class ResetPasswordWithTokenUseCase {
    constructor(authService, passwordPolicyRepository, recoveryHistoryRepository, sessionRepository, userRepository, logger, circuitBreaker, eventPublisher) {
        this.authService = authService;
        this.passwordPolicyRepository = passwordPolicyRepository;
        this.recoveryHistoryRepository = recoveryHistoryRepository;
        this.sessionRepository = sessionRepository;
        this.userRepository = userRepository;
        this.logger = logger;
        this.circuitBreaker = circuitBreaker;
        this.eventPublisher = eventPublisher;
    }
    async execute(request) {
        return await this.circuitBreaker.execute(async () => this.executeImpl(request), async () => {
            this.logger.error('Circuit breaker open for ResetPasswordWithTokenUseCase');
            return {
                success: false,
                message: 'Dịch vụ đặt lại mật khẩu tạm thời không khả dụng. Vui lòng thử lại sau.',
                error: 'SERVICE_UNAVAILABLE'
            };
        });
    }
    async executeImpl(request) {
        let userId;
        try {
            this.logger.info('Processing password reset with token');
            // Validate request
            const validationError = await this.validateRequest(request);
            if (validationError) {
                return {
                    success: false,
                    message: validationError,
                    error: 'VALIDATION_ERROR'
                };
            }
            // Verify token
            const tokenPayload = await this.authService.verifyToken(request.token);
            if (!tokenPayload || !tokenPayload.userId) {
                this.logger.warn('Invalid reset token provided');
                return {
                    success: false,
                    message: 'Token không hợp lệ hoặc đã hết hạn',
                    error: 'INVALID_TOKEN'
                };
            }
            userId = tokenPayload.userId;
            // Validate password against policy
            const passwordPolicy = await this.passwordPolicyRepository.getCurrent();
            const validationResult = passwordPolicy.validate(request.newPassword);
            if (!validationResult.isValid) {
                // Log failed attempt
                await this.logAttempt(userId, false, `Password policy violation: ${validationResult.errors.join(', ')}`, request.ipAddress, request.userAgent);
                return {
                    success: false,
                    message: `Mật khẩu không đáp ứng yêu cầu:\n${validationResult.errors.join('\n')}`,
                    error: 'PASSWORD_POLICY_VIOLATION'
                };
            }
            // Update password via Supabase (using userId from verified token)
            await this.authService.updatePassword(userId, request.newPassword);
            // Invalidate all existing sessions
            await this.sessionRepository.deleteAllByUserId(userId);
            // Log successful attempt
            await this.logAttempt(userId, true, null, request.ipAddress, request.userAgent);
            this.logger.info('Password reset successful', { userId });
            // Publish PasswordResetEvent for notification service
            if (this.eventPublisher) {
                try {
                    // Get user details for event
                    const userIdVO = UserId_1.UserId.fromString(userId);
                    const user = await this.userRepository.findById(userIdVO);
                    if (user) {
                        const event = new PasswordResetEvent_1.PasswordResetEvent(userIdVO, user.email.value, user.roleTypes.length > 0 ? user.roleTypes[0] : 'UNKNOWN', 'token', true // All sessions were invalidated
                        );
                        await this.eventPublisher.publishDomainEvents([event]);
                        this.logger.info('PasswordResetEvent published', {
                            userId,
                            email: user.email.value
                        });
                    }
                }
                catch (error) {
                    this.logger.error('Failed to publish PasswordResetEvent', {
                        userId,
                        error: error instanceof Error ? error.message : String(error)
                    });
                    // Don't fail password reset if event publishing fails
                }
            }
            return {
                success: true,
                message: 'Mật khẩu đã được đặt lại thành công. Tất cả phiên đăng nhập hiện tại đã bị hủy. Bạn có thể đăng nhập với mật khẩu mới.'
            };
        }
        catch (error) {
            this.logger.error('Password reset failed', {
                userId,
                error: error.message
            });
            // Log failed attempt if we have userId
            if (userId) {
                await this.logAttempt(userId, false, error.message, request.ipAddress, request.userAgent);
            }
            return {
                success: false,
                message: `Đặt lại mật khẩu thất bại: ${error.message}`,
                error: 'RESET_PASSWORD_FAILED'
            };
        }
    }
    /**
     * Validate request
     */
    async validateRequest(request) {
        // Validate token
        if (!request.token || request.token.trim().length === 0) {
            return 'Token không hợp lệ';
        }
        // Validate new password
        if (!request.newPassword || request.newPassword.length === 0) {
            return 'Mật khẩu mới không được để trống';
        }
        // Validate password confirmation
        if (request.newPassword !== request.confirmPassword) {
            return 'Mật khẩu xác nhận không khớp';
        }
        return null;
    }
    /**
     * Log reset attempt
     */
    async logAttempt(userId, success, failureReason, ipAddress, userAgent) {
        try {
            // Note: We don't know which recovery method was used (primary or recovery email)
            // Default to primary_email for logging purposes
            const attempt = success
                ? RecoveryAttempt_1.RecoveryAttempt.createSuccess(userId, 'primary_email', 'reset_password', ipAddress, userAgent)
                : RecoveryAttempt_1.RecoveryAttempt.createFailure(userId, 'primary_email', 'reset_password', failureReason, ipAddress, userAgent);
            await this.recoveryHistoryRepository.log(attempt);
        }
        catch (error) {
            // Don't fail the request if logging fails
            this.logger.error('Failed to log reset attempt', {
                userId,
                error: error.message
            });
        }
    }
}
exports.ResetPasswordWithTokenUseCase = ResetPasswordWithTokenUseCase;
//# sourceMappingURL=ResetPasswordWithTokenUseCase.js.map