"use strict";
/**
 * Change Password Use Case (Authenticated)
 * Allows authenticated users to change their password
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS Command Pattern
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChangePasswordUseCase = void 0;
const UserId_1 = require("../../domain/value-objects/UserId");
const PasswordChangedEvent_1 = require("../../domain/events/PasswordChangedEvent");
/**
 * Change Password Use Case
 * Allows authenticated users to change their password
 * Validates current password, validates new password against policy
 * Optionally invalidates all other sessions
 */
class ChangePasswordUseCase {
    constructor(authService, userRepository, passwordPolicyRepository, sessionRepository, logger, circuitBreaker, eventPublisher // Optional for backward compatibility
    ) {
        this.authService = authService;
        this.userRepository = userRepository;
        this.passwordPolicyRepository = passwordPolicyRepository;
        this.sessionRepository = sessionRepository;
        this.logger = logger;
        this.circuitBreaker = circuitBreaker;
        this.eventPublisher = eventPublisher;
    }
    async execute(request) {
        return await this.circuitBreaker.execute(async () => this.executeImpl(request), async () => {
            this.logger.error('Circuit breaker open for ChangePasswordUseCase');
            return {
                success: false,
                message: 'Dịch vụ đổi mật khẩu tạm thời không khả dụng. Vui lòng thử lại sau.',
                error: 'SERVICE_UNAVAILABLE'
            };
        });
    }
    async executeImpl(request) {
        try {
            this.logger.info('Processing password change request', {
                userId: request.userId
            });
            // 1. Validate input
            const validationError = this.validateRequest(request);
            if (validationError) {
                return {
                    success: false,
                    message: validationError,
                    error: 'VALIDATION_ERROR'
                };
            }
            // 2. Get user
            const userIdVO = UserId_1.UserId.fromString(request.userId);
            const user = await this.userRepository.findById(userIdVO);
            if (!user) {
                return {
                    success: false,
                    message: 'Người dùng không tồn tại',
                    error: 'USER_NOT_FOUND'
                };
            }
            // 3. Verify current password
            const authResult = await this.authService.signIn({
                email: user.email.value,
                password: request.currentPassword
            });
            if (!authResult.success) {
                this.logger.warn('Current password verification failed', {
                    userId: request.userId
                });
                return {
                    success: false,
                    message: 'Mật khẩu hiện tại không đúng',
                    error: 'INVALID_CURRENT_PASSWORD'
                };
            }
            // 4. Validate new password against password policy
            const passwordPolicy = await this.passwordPolicyRepository.getCurrent();
            const validationResult = passwordPolicy.validate(request.newPassword);
            if (!validationResult.isValid) {
                return {
                    success: false,
                    message: `Mật khẩu mới không đáp ứng yêu cầu:\n${validationResult.errors.join('\n')}`,
                    error: 'PASSWORD_POLICY_VIOLATION'
                };
            }
            // 5. Check if new password is same as current password
            if (request.currentPassword === request.newPassword) {
                return {
                    success: false,
                    message: 'Mật khẩu mới phải khác mật khẩu hiện tại',
                    error: 'SAME_PASSWORD'
                };
            }
            // 6. Update password via Supabase Auth
            await this.authService.updatePassword(request.userId, request.newPassword);
            // 7. Invalidate other sessions if requested (default: true)
            const invalidateOtherSessions = request.invalidateOtherSessions !== false;
            if (invalidateOtherSessions) {
                await this.sessionRepository.deleteAllByUserId(request.userId);
                this.logger.info('All sessions invalidated after password change', {
                    userId: request.userId
                });
            }
            this.logger.info('Password changed successfully', {
                userId: request.userId,
                invalidatedSessions: invalidateOtherSessions
            });
            // Publish PasswordChangedEvent
            if (this.eventPublisher) {
                try {
                    const userIdVO = UserId_1.UserId.fromString(request.userId);
                    const event = new PasswordChangedEvent_1.PasswordChangedEvent(userIdVO, request.userId, // changedBy (user changes their own password)
                    invalidateOtherSessions, user.email.value, user.roleTypes.length > 0 ? user.roleTypes[0] : 'UNKNOWN');
                    await this.eventPublisher.publishDomainEvents([event]);
                    this.logger.info('PasswordChangedEvent published', {
                        userId: request.userId
                    });
                }
                catch (error) {
                    this.logger.error('Failed to publish PasswordChangedEvent', {
                        userId: request.userId,
                        error: error instanceof Error ? error.message : String(error)
                    });
                    // Don't fail password change if event publishing fails
                }
            }
            return {
                success: true,
                message: invalidateOtherSessions
                    ? 'Mật khẩu đã được thay đổi thành công. Tất cả các phiên đăng nhập khác đã bị hủy.'
                    : 'Mật khẩu đã được thay đổi thành công.'
            };
        }
        catch (error) {
            this.logger.error('Failed to change password', {
                userId: request.userId,
                error: error.message
            });
            return {
                success: false,
                message: 'Không thể thay đổi mật khẩu. Vui lòng thử lại sau.',
                error: 'CHANGE_PASSWORD_FAILED'
            };
        }
    }
    validateRequest(request) {
        if (!request.userId || request.userId.trim().length === 0) {
            return 'User ID là bắt buộc';
        }
        if (!request.currentPassword || request.currentPassword.trim().length === 0) {
            return 'Mật khẩu hiện tại là bắt buộc';
        }
        if (!request.newPassword || request.newPassword.trim().length === 0) {
            return 'Mật khẩu mới là bắt buộc';
        }
        if (!request.confirmPassword || request.confirmPassword.trim().length === 0) {
            return 'Xác nhận mật khẩu là bắt buộc';
        }
        if (request.newPassword !== request.confirmPassword) {
            return 'Mật khẩu mới và xác nhận mật khẩu không khớp';
        }
        if (request.newPassword.length < 8) {
            return 'Mật khẩu mới phải có ít nhất 8 ký tự';
        }
        return null;
    }
}
exports.ChangePasswordUseCase = ChangePasswordUseCase;
//# sourceMappingURL=ChangePasswordUseCase.js.map