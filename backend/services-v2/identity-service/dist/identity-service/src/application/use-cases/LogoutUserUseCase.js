"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogoutUserUseCase = void 0;
const error_helper_1 = require("../../utils/error-helper");
const UserId_1 = require("../../domain/value-objects/UserId");
class LogoutUserUseCase {
    constructor(authService, userRepository, logger, circuitBreaker, _eventPublisher // Prefixed with _ to indicate intentionally unused (removed in scope reduction)
    ) {
        this.authService = authService;
        this.userRepository = userRepository;
        this.logger = logger;
        this.circuitBreaker = circuitBreaker;
        this._eventPublisher = _eventPublisher;
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
        this.logger.info('Processing user logout', { userId: request.userId });
        // Graceful degradation: Try each operation independently
        // Always return success even if some operations fail
        // Try to sign out from auth service
        try {
            await this.authService.signOut(request.accessToken);
            this.logger.info('User signed out from Supabase Auth', { userId: request.userId });
        }
        catch (authError) {
            // Log error but continue - graceful degradation
            this.logger.error('Auth service signOut failed, continuing logout', {
                userId: request.userId,
                error: (0, error_helper_1.getErrorMessage)(authError)
            });
        }
        // Try to deactivate session in database
        if (request.sessionId) {
            try {
                const sessionOwnerId = UserId_1.UserId.fromString(request.userId);
                await this.userRepository.deactivateSession(request.sessionId, sessionOwnerId);
                this.logger.info('Session deactivated in database', {
                    userId: request.userId,
                    sessionId: request.sessionId
                });
            }
            catch (sessionError) {
                // Log error but continue - graceful degradation
                this.logger.error('Session deactivation failed, continuing logout', {
                    userId: request.userId,
                    sessionId: request.sessionId,
                    error: (0, error_helper_1.getErrorMessage)(sessionError)
                });
            }
        }
        // Try to publish UserLoggedOut event - Disabled in scope reduction
        // if (this.eventPublisher) {
        //   try {
        //     const event = new UserLoggedOutEvent(
        //       request.userId,
        //       request.sessionId || 'unknown',
        //       new Date()
        //     );
        //     await this.eventPublisher.publishDomainEvents([event]);
        //     this.logger.info('UserLoggedOut event published', {
        //       userId: request.userId
        //     });
        //   } catch (eventError) {
        //     // Log error but continue - graceful degradation
        //     this.logger.error('Failed to publish UserLoggedOut event', {
        //       userId: request.userId,
        //       error: getErrorMessage(eventError)
        //     });
        //   }
        // }
        // Always return success - graceful degradation
        // Logout is a critical operation that should always succeed from user's perspective
        return {
            success: true,
            message: 'Đăng xuất thành công'
        };
    }
}
exports.LogoutUserUseCase = LogoutUserUseCase;
//# sourceMappingURL=LogoutUserUseCase.js.map