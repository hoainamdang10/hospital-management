"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ForgotPasswordUseCase = void 0;
const error_helper_1 = require("../../utils/error-helper");
const CircuitBreaker_1 = require("../../infrastructure/resilience/CircuitBreaker");
const Email_1 = require("../../domain/value-objects/Email");
class ForgotPasswordUseCase {
    constructor(authService, userRepository, logger) {
        this.authService = authService;
        this.userRepository = userRepository;
        this.logger = logger;
        this.circuitBreaker = CircuitBreaker_1.CircuitBreakerFactory.getBreaker('forgot-password-use-case');
    }
    async execute(request) {
        return await this.circuitBreaker.execute(async () => this.executeImpl(request), async () => {
            this.logger.error('Circuit breaker open for ForgotPasswordUseCase');
            return {
                success: false,
                message: 'Dịch vụ đặt lại mật khẩu tạm thời không khả dụng. Vui lòng thử lại sau.',
                error: 'SERVICE_UNAVAILABLE'
            };
        });
    }
    async executeImpl(request) {
        try {
            this.logger.info('Processing forgot password request', { email: request.email });
            if (!request.email || !request.email.includes('@')) {
                return {
                    success: false,
                    message: 'Email không hợp lệ',
                    error: 'INVALID_EMAIL'
                };
            }
            const email = Email_1.Email.create(request.email);
            const user = await this.userRepository.findByEmail(email);
            if (!user) {
                this.logger.warn('Password reset requested for non-existent email', { email: request.email });
                return {
                    success: true,
                    message: 'Nếu email tồn tại trong hệ thống, bạn sẽ nhận được email hướng dẫn đặt lại mật khẩu.'
                };
            }
            if (!user.isActive) {
                this.logger.warn('Password reset requested for inactive user', { email: request.email });
                return {
                    success: false,
                    message: 'Tài khoản đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.',
                    error: 'USER_INACTIVE'
                };
            }
            await this.authService.sendPasswordResetEmail(request.email);
            this.logger.info('Password reset email sent successfully', { email: request.email });
            return {
                success: true,
                message: 'Email hướng dẫn đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư của bạn.'
            };
        }
        catch (error) {
            this.logger.error('Forgot password failed', {
                email: request.email,
                error: (0, error_helper_1.getErrorMessage)(error)
            });
            return {
                success: false,
                message: `Không thể gửi email đặt lại mật khẩu: ${(0, error_helper_1.getErrorMessage)(error)}`,
                error: 'FORGOT_PASSWORD_FAILED'
            };
        }
    }
}
exports.ForgotPasswordUseCase = ForgotPasswordUseCase;
//# sourceMappingURL=ForgotPasswordUseCase.js.map