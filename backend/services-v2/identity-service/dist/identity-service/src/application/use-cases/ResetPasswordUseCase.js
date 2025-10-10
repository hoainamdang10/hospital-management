"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResetPasswordUseCase = void 0;
const error_helper_1 = require("../../utils/error-helper");
class ResetPasswordUseCase {
    constructor(authService, logger, circuitBreaker) {
        this.authService = authService;
        this.logger = logger;
        this.circuitBreaker = circuitBreaker;
    }
    async execute(request) {
        return await this.circuitBreaker.execute(async () => this.executeImpl(request), async () => {
            this.logger.error('Circuit breaker open for ResetPasswordUseCase');
            return {
                success: false,
                message: 'Dịch vụ đặt lại mật khẩu tạm thời không khả dụng. Vui lòng thử lại sau.',
                error: 'SERVICE_UNAVAILABLE'
            };
        });
    }
    async executeImpl(request) {
        try {
            this.logger.info('Processing password reset');
            const validationError = this.validateRequest(request);
            if (validationError) {
                return {
                    success: false,
                    message: validationError,
                    error: 'VALIDATION_ERROR'
                };
            }
            await this.authService.resetPassword(request.accessToken, request.refreshToken, request.newPassword);
            this.logger.info('Password reset successful');
            return {
                success: true,
                message: 'Mật khẩu đã được đặt lại thành công. Bạn có thể đăng nhập với mật khẩu mới.'
            };
        }
        catch (error) {
            this.logger.error('Password reset failed', { error: (0, error_helper_1.getErrorMessage)(error) });
            return {
                success: false,
                message: 'Đặt lại mật khẩu thất bại. Vui lòng kiểm tra lại token và thử lại.',
                error: 'RESET_PASSWORD_FAILED'
            };
        }
    }
    validateRequest(request) {
        if (!request.accessToken || request.accessToken.trim().length === 0) {
            return 'Token không hợp lệ';
        }
        if (!request.newPassword || request.newPassword.length < 8) {
            return 'Mật khẩu mới phải có ít nhất 8 ký tự';
        }
        if (!/[A-Z]/.test(request.newPassword)) {
            return 'Mật khẩu phải chứa ít nhất 1 chữ hoa';
        }
        if (!/[a-z]/.test(request.newPassword)) {
            return 'Mật khẩu phải chứa ít nhất 1 chữ thường';
        }
        if (!/[0-9]/.test(request.newPassword)) {
            return 'Mật khẩu phải chứa ít nhất 1 chữ số';
        }
        if (request.newPassword !== request.confirmPassword) {
            return 'Mật khẩu xác nhận không khớp';
        }
        return null;
    }
}
exports.ResetPasswordUseCase = ResetPasswordUseCase;
//# sourceMappingURL=ResetPasswordUseCase.js.map