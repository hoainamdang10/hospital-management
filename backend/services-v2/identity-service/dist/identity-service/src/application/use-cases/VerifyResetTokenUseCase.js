"use strict";
/**
 * Verify Reset Token Use Case
 * Verifies password reset token validity
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS Query Pattern
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerifyResetTokenUseCase = void 0;
const RecoveryAttempt_1 = require("../../domain/value-objects/RecoveryAttempt");
/**
 * Verify Reset Token Use Case
 * Validates password reset token without consuming it
 */
class VerifyResetTokenUseCase {
    constructor(authService, recoveryHistoryRepository, logger, circuitBreaker) {
        this.authService = authService;
        this.recoveryHistoryRepository = recoveryHistoryRepository;
        this.logger = logger;
        this.circuitBreaker = circuitBreaker;
    }
    async execute(request) {
        return await this.circuitBreaker.execute(async () => this.executeImpl(request), async () => {
            this.logger.error('Circuit breaker open for VerifyResetTokenUseCase');
            return {
                success: false,
                valid: false,
                message: 'Dịch vụ tạm thời không khả dụng. Vui lòng thử lại sau.',
                error: 'SERVICE_UNAVAILABLE'
            };
        });
    }
    async executeImpl(request) {
        try {
            this.logger.info('Verifying reset token');
            // Validate token format
            if (!request.token || request.token.trim().length === 0) {
                return {
                    success: false,
                    valid: false,
                    message: 'Token không hợp lệ',
                    error: 'INVALID_TOKEN'
                };
            }
            // Verify token with Supabase
            const tokenPayload = await this.authService.verifyToken(request.token);
            if (!tokenPayload || !tokenPayload.userId) {
                // Log failed verification attempt
                // Note: We don't have userId here, so we can't log to recovery history
                this.logger.warn('Invalid reset token provided');
                return {
                    success: true,
                    valid: false,
                    message: 'Token không hợp lệ hoặc đã hết hạn'
                };
            }
            // Log successful verification attempt
            await this.logAttempt(tokenPayload.userId, true, null, request.ipAddress, request.userAgent);
            this.logger.info('Reset token verified successfully', {
                userId: tokenPayload.userId
            });
            return {
                success: true,
                valid: true,
                userId: tokenPayload.userId,
                email: tokenPayload.email,
                message: 'Token hợp lệ'
            };
        }
        catch (error) {
            this.logger.error('Token verification failed', {
                error: error.message
            });
            return {
                success: true, // Request succeeded, but token is invalid
                valid: false,
                message: 'Token không hợp lệ hoặc đã hết hạn'
            };
        }
    }
    /**
     * Log verification attempt
     */
    async logAttempt(userId, success, failureReason, ipAddress, userAgent) {
        try {
            // Note: We don't know which recovery method was used (primary or recovery email)
            // Default to primary_email for logging purposes
            const attempt = success
                ? RecoveryAttempt_1.RecoveryAttempt.createSuccess(userId, 'primary_email', 'verify_token', ipAddress, userAgent)
                : RecoveryAttempt_1.RecoveryAttempt.createFailure(userId, 'primary_email', 'verify_token', failureReason, ipAddress, userAgent);
            await this.recoveryHistoryRepository.log(attempt);
        }
        catch (error) {
            // Don't fail the request if logging fails
            this.logger.error('Failed to log verification attempt', {
                userId,
                error: error.message
            });
        }
    }
}
exports.VerifyResetTokenUseCase = VerifyResetTokenUseCase;
//# sourceMappingURL=VerifyResetTokenUseCase.js.map