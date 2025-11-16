"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DisableMFAUseCase = void 0;
const error_helper_1 = require("../../utils/error-helper");
const UserId_1 = require("../../domain/value-objects/UserId");
/**
 * Disable MFA Use Case - Refactored
 * Requires verification before disabling MFA
 * Uses IMFAService interface for infrastructure independence
 */
class DisableMFAUseCase {
    constructor(userRepository, mfaService, verifyMFAUseCase, logger, circuitBreaker, _eventPublisher // Prefixed with _ to indicate intentionally unused (removed in scope reduction)
    ) {
        this.userRepository = userRepository;
        this.mfaService = mfaService;
        this.verifyMFAUseCase = verifyMFAUseCase;
        this.logger = logger;
        this.circuitBreaker = circuitBreaker;
        this._eventPublisher = _eventPublisher;
    }
    async execute(request) {
        return await this.circuitBreaker.execute(async () => this.executeImpl(request), async () => {
            this.logger.error('Circuit breaker open for DisableMFAUseCase');
            return {
                success: false,
                message: 'Dịch vụ MFA tạm thời không khả dụng. Vui lòng thử lại sau.',
                error: 'SERVICE_UNAVAILABLE'
            };
        });
    }
    async executeImpl(request) {
        try {
            this.logger.info('Starting MFA disable', { userId: request.userId });
            // 1. Validate request
            const validationError = this.validateRequest(request);
            if (validationError) {
                return {
                    success: false,
                    message: validationError,
                    error: 'VALIDATION_ERROR'
                };
            }
            // 2. Check if user exists
            const userId = UserId_1.UserId.fromString(request.userId);
            const user = await this.userRepository.findById(userId);
            if (!user) {
                return {
                    success: false,
                    message: 'Người dùng không tồn tại',
                    error: 'USER_NOT_FOUND'
                };
            }
            // 3. Verify current MFA code before disabling
            const verificationResult = await this.verifyMFAUseCase.execute({
                userId: request.userId,
                code: request.verificationCode,
                attemptType: 'disable',
                ipAddress: request.ipAddress,
                userAgent: request.userAgent
            });
            if (!verificationResult.valid) {
                return {
                    success: false,
                    message: 'Mã xác thực không đúng. Không thể tắt MFA.',
                    error: 'INVALID_VERIFICATION_CODE'
                };
            }
            // 4. Disable MFA via service
            await this.mfaService.disableMFA(request.userId);
            this.logger.info('MFA disabled successfully', { userId: request.userId });
            // Publish MFADisabledEvent - Disabled in scope reduction
            // if (this.eventPublisher) {
            //   try {
            //     const event = new MFADisabledEvent(
            //       userId,
            //       request.userId, // disabledBy (user disables their own MFA)
            //       user.email.value,
            //       user.roleTypes.length > 0 ? user.roleTypes[0] : 'UNKNOWN'
            //     );
            //     await this.eventPublisher.publishDomainEvents([event]);
            //     this.logger.info('MFADisabledEvent published', {
            //       userId: request.userId
            //     });
            //   } catch (error) {
            //     this.logger.error('Failed to publish MFADisabledEvent', {
            //       userId: request.userId,
            //       error: getErrorMessage(error)
            //     });
            //     // Don't fail MFA disable if event publishing fails
            //   }
            // }
            return {
                success: true,
                message: 'MFA đã được tắt thành công'
            };
        }
        catch (error) {
            this.logger.error('MFA disable failed', {
                userId: request.userId,
                error: (0, error_helper_1.getErrorMessage)(error)
            });
            return {
                success: false,
                message: `Tắt MFA thất bại: ${(0, error_helper_1.getErrorMessage)(error)}`,
                error: 'DISABLE_MFA_FAILED'
            };
        }
    }
    /**
     * Validate request
     */
    validateRequest(request) {
        if (!request.userId) {
            return 'User ID là bắt buộc';
        }
        if (!request.verificationCode) {
            return 'Mã xác thực là bắt buộc';
        }
        if (request.verificationCode.length !== 6 && request.verificationCode.length !== 8) {
            return 'Mã xác thực phải có 6 hoặc 8 ký tự';
        }
        return null;
    }
}
exports.DisableMFAUseCase = DisableMFAUseCase;
//# sourceMappingURL=DisableMFAUseCase.js.map