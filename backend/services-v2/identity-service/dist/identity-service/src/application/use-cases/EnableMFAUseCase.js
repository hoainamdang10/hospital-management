"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnableMFAUseCase = void 0;
const error_helper_1 = require("../../utils/error-helper");
const UserId_1 = require("../../domain/value-objects/UserId");
const MFAEnabledEvent_1 = require("../../domain/events/MFAEnabledEvent");
/**
 * Enable MFA Use Case - Refactored
 * Generates TOTP secret, QR code, and backup codes for user
 * Uses IMFAService interface for infrastructure independence
 */
class EnableMFAUseCase {
    constructor(userRepository, mfaService, logger, circuitBreaker, eventPublisher // Optional for backward compatibility
    ) {
        this.userRepository = userRepository;
        this.mfaService = mfaService;
        this.logger = logger;
        this.circuitBreaker = circuitBreaker;
        this.eventPublisher = eventPublisher;
    }
    async execute(request) {
        return await this.circuitBreaker.execute(async () => this.executeImpl(request), async () => {
            this.logger.error('Circuit breaker open for EnableMFAUseCase');
            return {
                success: false,
                message: 'Dịch vụ MFA tạm thời không khả dụng. Vui lòng thử lại sau.',
                error: 'SERVICE_UNAVAILABLE'
            };
        });
    }
    async executeImpl(request) {
        try {
            this.logger.info('Starting MFA setup', { userId: request.userId, method: request.method });
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
            // 3. Check if MFA is already enabled
            const isEnabled = await this.mfaService.isMFAEnabled(request.userId);
            if (isEnabled) {
                return {
                    success: false,
                    message: 'MFA đã được kích hoạt cho tài khoản này',
                    error: 'MFA_ALREADY_ENABLED'
                };
            }
            // 4. Enable MFA via service
            const result = await this.mfaService.enableMFA(request.userId, request.method, request.phoneNumber, request.email);
            this.logger.info('MFA setup completed successfully', { userId: request.userId });
            // Publish MFAEnabledEvent
            if (this.eventPublisher) {
                try {
                    const event = new MFAEnabledEvent_1.MFAEnabledEvent(userId, request.method, request.userId, // enabledBy (user enables their own MFA)
                    user.email.value, user.roleTypes.length > 0 ? user.roleTypes[0] : 'UNKNOWN');
                    await this.eventPublisher.publishDomainEvents([event]);
                    this.logger.info('MFAEnabledEvent published', {
                        userId: request.userId
                    });
                }
                catch (error) {
                    this.logger.error('Failed to publish MFAEnabledEvent', {
                        userId: request.userId,
                        error: (0, error_helper_1.getErrorMessage)(error)
                    });
                    // Don't fail MFA setup if event publishing fails
                }
            }
            return {
                success: true,
                secret: result.secret,
                qrCodeUrl: result.qrCodeUrl,
                backupCodes: result.backupCodes,
                message: 'Thiết lập MFA thành công. Vui lòng quét mã QR và xác thực để kích hoạt.'
            };
        }
        catch (error) {
            this.logger.error('MFA setup failed', {
                userId: request.userId,
                error: (0, error_helper_1.getErrorMessage)(error)
            });
            return {
                success: false,
                message: `Thiết lập MFA thất bại: ${(0, error_helper_1.getErrorMessage)(error)}`,
                error: 'MFA_SETUP_FAILED'
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
        if (!request.method) {
            return 'Phương thức MFA là bắt buộc';
        }
        if (!['2fa_app', 'sms', 'email'].includes(request.method)) {
            return 'Phương thức MFA không hợp lệ';
        }
        if (request.method === 'sms' && !request.phoneNumber) {
            return 'Số điện thoại là bắt buộc cho phương thức SMS';
        }
        if (request.method === 'email' && !request.email) {
            return 'Email là bắt buộc cho phương thức Email';
        }
        return null;
    }
}
exports.EnableMFAUseCase = EnableMFAUseCase;
//# sourceMappingURL=EnableMFAUseCase.js.map