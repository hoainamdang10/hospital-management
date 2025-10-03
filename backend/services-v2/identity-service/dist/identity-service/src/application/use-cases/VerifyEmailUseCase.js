"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerifyEmailUseCase = void 0;
const error_helper_1 = require("../../utils/error-helper");
const CircuitBreaker_1 = require("../../infrastructure/resilience/CircuitBreaker");
const Email_1 = require("../../domain/value-objects/Email");
class VerifyEmailUseCase {
    constructor(authService, userRepository, logger) {
        this.authService = authService;
        this.userRepository = userRepository;
        this.logger = logger;
        this.circuitBreaker = CircuitBreaker_1.CircuitBreakerFactory.getBreaker('verify-email-use-case');
    }
    async execute(request) {
        return await this.circuitBreaker.execute(async () => this.executeImpl(request), async () => {
            this.logger.error('Circuit breaker open for VerifyEmailUseCase');
            return {
                success: false,
                message: 'Dịch vụ xác thực email tạm thời không khả dụng. Vui lòng thử lại sau.',
                error: 'SERVICE_UNAVAILABLE'
            };
        });
    }
    async executeImpl(request) {
        try {
            this.logger.info('Processing email verification', { email: request.email });
            if (!request.email || !request.email.includes('@')) {
                return {
                    success: false,
                    message: 'Email không hợp lệ',
                    error: 'INVALID_EMAIL'
                };
            }
            if (!request.token || request.token.trim().length === 0) {
                return {
                    success: false,
                    message: 'Mã xác thực không hợp lệ',
                    error: 'INVALID_TOKEN'
                };
            }
            // Use new interface method
            await this.authService.verifyEmail(request.email, request.token);
            this.logger.info('Email verified successfully via Supabase Auth', {
                email: request.email
            });
            // Find user by email and update verification status
            const email = Email_1.Email.create(request.email);
            const user = await this.userRepository.findByEmail(email);
            if (!user) {
                return {
                    success: false,
                    error: 'User not found',
                    message: 'Không tìm thấy người dùng'
                };
            }
            // Update user aggregate
            user.verifyEmail();
            // Persist using new repository signature
            await this.userRepository.update(user);
            this.logger.info('User profile updated with email verification', { userId: user.id });
            return {
                success: true,
                userId: user.id,
                message: 'Email đã được xác thực thành công. Bạn có thể đăng nhập ngay bây giờ.'
            };
        }
        catch (error) {
            this.logger.error('Email verification failed', {
                email: request.email,
                error: (0, error_helper_1.getErrorMessage)(error)
            });
            return {
                success: false,
                message: `Xác thực email thất bại: ${(0, error_helper_1.getErrorMessage)(error)}`,
                error: 'VERIFICATION_FAILED'
            };
        }
    }
}
exports.VerifyEmailUseCase = VerifyEmailUseCase;
//# sourceMappingURL=VerifyEmailUseCase.js.map