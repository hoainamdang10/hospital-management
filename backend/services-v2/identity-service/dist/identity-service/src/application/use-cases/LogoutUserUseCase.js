"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogoutUserUseCase = void 0;
const error_helper_1 = require("../../utils/error-helper");
const CircuitBreaker_1 = require("../../infrastructure/resilience/CircuitBreaker");
class LogoutUserUseCase {
    constructor(authService, userRepository, logger) {
        this.authService = authService;
        this.userRepository = userRepository;
        this.logger = logger;
        this.circuitBreaker = CircuitBreaker_1.CircuitBreakerFactory.getBreaker('logout-user-use-case');
    }
    async execute(request) {
        return await this.circuitBreaker.execute(async () => this.executeImpl(request), async () => {
            this.logger.error('Circuit breaker open for LogoutUserUseCase');
            return {
                success: false,
                message: 'Dịch vụ đăng xuất tạm thời không khả dụng. Vui lòng thử lại sau.',
                error: 'SERVICE_UNAVAILABLE'
            };
        });
    }
    async executeImpl(request) {
        try {
            this.logger.info('Processing user logout', { userId: request.userId });
            await this.authService.signOut(request.accessToken);
            this.logger.info('User signed out from Supabase Auth', { userId: request.userId });
            if (request.sessionId) {
                await this.userRepository.deactivateSession(request.sessionId);
                this.logger.info('Session deactivated in database', {
                    userId: request.userId,
                    sessionId: request.sessionId
                });
            }
            return {
                success: true,
                message: 'Đăng xuất thành công'
            };
        }
        catch (error) {
            this.logger.error('Logout failed', {
                userId: request.userId,
                error: (0, error_helper_1.getErrorMessage)(error)
            });
            return {
                success: true,
                message: 'Đăng xuất thành công'
            };
        }
    }
}
exports.LogoutUserUseCase = LogoutUserUseCase;
//# sourceMappingURL=LogoutUserUseCase.js.map