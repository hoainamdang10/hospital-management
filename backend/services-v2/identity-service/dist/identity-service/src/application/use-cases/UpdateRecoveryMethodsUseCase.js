"use strict";
/**
 * Update Recovery Methods Use Case
 * Updates account recovery methods for a user
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS Command Pattern
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateRecoveryMethodsUseCase = void 0;
const RecoveryMethod_1 = require("../../domain/value-objects/RecoveryMethod");
const Email_1 = require("../../domain/value-objects/Email");
const UserId_1 = require("../../domain/value-objects/UserId");
/**
 * Update Recovery Methods Use Case
 * Command use case to update user's recovery methods
 */
class UpdateRecoveryMethodsUseCase {
    constructor(recoveryMethodRepository, userRepository, logger, circuitBreaker) {
        this.recoveryMethodRepository = recoveryMethodRepository;
        this.userRepository = userRepository;
        this.logger = logger;
        this.circuitBreaker = circuitBreaker;
    }
    async execute(request) {
        return await this.circuitBreaker.execute(async () => this.executeImpl(request), async () => {
            this.logger.error('Circuit breaker open for UpdateRecoveryMethodsUseCase');
            return {
                success: false,
                message: 'Dịch vụ tạm thời không khả dụng. Vui lòng thử lại sau.',
                error: 'SERVICE_UNAVAILABLE'
            };
        });
    }
    async executeImpl(request) {
        try {
            this.logger.info('Updating recovery methods', {
                userId: request.userId,
                hasRecoveryEmail: !!request.recoveryEmail
            });
            // Validate request
            const validationError = await this.validateRequest(request);
            if (validationError) {
                return {
                    success: false,
                    message: validationError,
                    error: 'VALIDATION_ERROR'
                };
            }
            // Get existing recovery methods or create default
            let recoveryMethod = await this.recoveryMethodRepository.getByUserId(request.userId);
            if (!recoveryMethod) {
                recoveryMethod = RecoveryMethod_1.RecoveryMethod.createDefault(request.userId);
            }
            // Update recovery method
            let updatedRecoveryMethod;
            if (request.recoveryEmail === null) {
                // Remove recovery email
                updatedRecoveryMethod = recoveryMethod.removeRecoveryEmail(request.userId);
                this.logger.info('Recovery email removed', { userId: request.userId });
            }
            else {
                // Update recovery email
                updatedRecoveryMethod = recoveryMethod.updateRecoveryEmail(request.recoveryEmail, request.userId);
                this.logger.info('Recovery email updated', {
                    userId: request.userId,
                    recoveryEmail: request.recoveryEmail
                });
            }
            // Save to repository
            const savedRecoveryMethod = await this.recoveryMethodRepository.save(updatedRecoveryMethod);
            // Convert to response format
            const recoveryMethodObj = savedRecoveryMethod.toObject();
            // TODO: Send verification email if recovery email was added/updated
            // This should be done via event publishing to Notifications Service
            // For now, we'll use Supabase's built-in email verification
            return {
                success: true,
                recoveryMethods: {
                    recoveryEmail: recoveryMethodObj.recoveryEmail,
                    recoveryEmailVerified: recoveryMethodObj.recoveryEmailVerified,
                    recoveryEmailVerifiedAt: recoveryMethodObj.recoveryEmailVerifiedAt,
                    lastUpdatedAt: recoveryMethodObj.lastUpdatedAt
                },
                message: request.recoveryEmail
                    ? 'Email khôi phục đã được cập nhật. Vui lòng kiểm tra email để xác thực.'
                    : 'Email khôi phục đã được xóa.'
            };
        }
        catch (error) {
            this.logger.error('Failed to update recovery methods', {
                userId: request.userId,
                error: error.message
            });
            return {
                success: false,
                message: `Không thể cập nhật phương thức khôi phục: ${error.message}`,
                error: 'UPDATE_RECOVERY_METHODS_FAILED'
            };
        }
    }
    async validateRequest(request) {
        // Validate userId
        if (!request.userId || request.userId.trim().length === 0) {
            return 'User ID không hợp lệ';
        }
        // If removing recovery email, no further validation needed
        if (request.recoveryEmail === null) {
            return null;
        }
        // Validate recovery email format
        try {
            Email_1.Email.create(request.recoveryEmail);
        }
        catch (error) {
            return `Email khôi phục không hợp lệ: ${error.message}`;
        }
        // Check if user exists
        const userIdVO = UserId_1.UserId.fromString(request.userId);
        const user = await this.userRepository.findById(userIdVO);
        if (!user) {
            return 'Người dùng không tồn tại';
        }
        // Check if recovery email is different from primary email
        if (user.email.value.toLowerCase() === request.recoveryEmail.toLowerCase()) {
            return 'Email khôi phục phải khác với email chính';
        }
        // Check if recovery email is already used by another user
        const isUsed = await this.recoveryMethodRepository.isRecoveryEmailUsed(request.recoveryEmail, request.userId);
        if (isUsed) {
            return 'Email khôi phục này đã được sử dụng bởi người dùng khác';
        }
        return null;
    }
}
exports.UpdateRecoveryMethodsUseCase = UpdateRecoveryMethodsUseCase;
//# sourceMappingURL=UpdateRecoveryMethodsUseCase.js.map