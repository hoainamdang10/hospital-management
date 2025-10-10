"use strict";
/**
 * Get Recovery Methods Use Case
 * Retrieves account recovery methods for a user
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS Query Pattern
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetRecoveryMethodsUseCase = void 0;
/**
 * Get Recovery Methods Use Case
 * Query use case to retrieve user's recovery methods
 */
class GetRecoveryMethodsUseCase {
    constructor(recoveryMethodRepository, logger, circuitBreaker) {
        this.recoveryMethodRepository = recoveryMethodRepository;
        this.logger = logger;
        this.circuitBreaker = circuitBreaker;
    }
    async execute(request) {
        return await this.circuitBreaker.execute(async () => this.executeImpl(request), async () => {
            this.logger.error('Circuit breaker open for GetRecoveryMethodsUseCase');
            return {
                success: false,
                message: 'Dịch vụ tạm thời không khả dụng. Vui lòng thử lại sau.',
                error: 'SERVICE_UNAVAILABLE'
            };
        });
    }
    async executeImpl(request) {
        try {
            this.logger.info('Getting recovery methods', { userId: request.userId });
            // Validate request
            if (!request.userId || request.userId.trim().length === 0) {
                return {
                    success: false,
                    message: 'User ID không hợp lệ',
                    error: 'INVALID_USER_ID'
                };
            }
            // Get recovery methods from repository
            const recoveryMethod = await this.recoveryMethodRepository.getByUserId(request.userId);
            // If no recovery methods configured, return default
            if (!recoveryMethod) {
                this.logger.info('No recovery methods configured', { userId: request.userId });
                return {
                    success: true,
                    recoveryMethods: {
                        recoveryEmail: null,
                        recoveryEmailVerified: false,
                        recoveryEmailVerifiedAt: null,
                        lastUpdatedAt: new Date().toISOString()
                    }
                };
            }
            // Convert to response format
            const recoveryMethodObj = recoveryMethod.toObject();
            this.logger.info('Recovery methods retrieved successfully', {
                userId: request.userId,
                hasRecoveryEmail: recoveryMethod.hasRecoveryEmail(),
                isVerified: recoveryMethod.isRecoveryEmailVerified()
            });
            return {
                success: true,
                recoveryMethods: {
                    recoveryEmail: recoveryMethodObj.recoveryEmail,
                    recoveryEmailVerified: recoveryMethodObj.recoveryEmailVerified,
                    recoveryEmailVerifiedAt: recoveryMethodObj.recoveryEmailVerifiedAt,
                    lastUpdatedAt: recoveryMethodObj.lastUpdatedAt
                }
            };
        }
        catch (error) {
            this.logger.error('Failed to get recovery methods', {
                userId: request.userId,
                error: error.message
            });
            return {
                success: false,
                message: `Không thể lấy thông tin phương thức khôi phục: ${error.message}`,
                error: 'GET_RECOVERY_METHODS_FAILED'
            };
        }
    }
}
exports.GetRecoveryMethodsUseCase = GetRecoveryMethodsUseCase;
//# sourceMappingURL=GetRecoveryMethodsUseCase.js.map