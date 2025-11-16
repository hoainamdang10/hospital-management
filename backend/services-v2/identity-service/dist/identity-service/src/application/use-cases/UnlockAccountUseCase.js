"use strict";
/**
 * Unlock Account Use Case (Admin Only)
 * Allows administrators to manually unlock user accounts
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS Command Pattern
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnlockAccountUseCase = void 0;
const UserId_1 = require("../../domain/value-objects/UserId");
/**
 * Unlock Account Use Case
 * Allows administrators to manually unlock user accounts
 * Records audit trail
 */
class UnlockAccountUseCase {
    constructor(userRepository, logger, circuitBreaker, _eventPublisher // Prefixed with _ to indicate intentionally unused (removed in scope reduction)
    ) {
        this.userRepository = userRepository;
        this.logger = logger;
        this.circuitBreaker = circuitBreaker;
        this._eventPublisher = _eventPublisher;
    }
    async execute(request) {
        return await this.circuitBreaker.execute(async () => this.executeImpl(request), async () => {
            this.logger.error('Circuit breaker open for UnlockAccountUseCase');
            return {
                success: false,
                message: 'Dịch vụ mở khóa tài khoản tạm thời không khả dụng. Vui lòng thử lại sau.',
                error: 'SERVICE_UNAVAILABLE'
            };
        });
    }
    async executeImpl(request) {
        try {
            this.logger.info('Processing account unlock request', {
                userId: request.userId,
                unlockedBy: request.unlockedBy,
                reason: request.reason
            });
            // 1. Validate input
            const validationError = this.validateRequest(request);
            if (validationError) {
                return {
                    success: false,
                    message: validationError,
                    error: 'VALIDATION_ERROR'
                };
            }
            // 2. Convert string ID to Value Object
            const userIdVO = UserId_1.UserId.fromString(request.userId);
            // 3. Get user
            const user = await this.userRepository.findById(userIdVO);
            if (!user) {
                return {
                    success: false,
                    message: 'Người dùng không tồn tại',
                    error: 'USER_NOT_FOUND'
                };
            }
            // 3. Check if user is permanently deactivated
            if (user.accountStatus === 'deactivated') {
                return {
                    success: false,
                    message: 'Không thể mở khóa tài khoản đã bị vô hiệu hóa vĩnh viễn',
                    error: 'PERMANENTLY_DEACTIVATED'
                };
            }
            // 4. Check if user is already active
            if (user.accountStatus === 'active') {
                return {
                    success: false,
                    message: 'Tài khoản đã được mở khóa trước đó',
                    error: 'ALREADY_UNLOCKED'
                };
            }
            // 4. Unlock account (activate from LOCKED status)
            user.activate(request.unlockedBy, request.reason);
            await this.userRepository.save(user);
            // 5. Log audit trail
            this.logger.info('Account unlocked successfully', {
                userId: request.userId,
                unlockedBy: request.unlockedBy,
                reason: request.reason
            });
            // 6. Publish UserAccountUnlockedEvent - Disabled in scope reduction
            // if (this.eventPublisher) {
            //   try {
            //     const event = new UserAccountUnlockedEvent(
            //       userIdVO,
            //       request.unlockedBy,
            //       request.reason,
            //       user.email.value,
            //       user.roleTypes.length > 0 ? user.roleTypes[0] : 'UNKNOWN'
            //     );
            //     await this.eventPublisher.publishDomainEvents([event]);
            //     this.logger.info('UserAccountUnlockedEvent published', {
            //       userId: request.userId
            //     });
            //   } catch (error) {
            //     this.logger.error('Failed to publish UserAccountUnlockedEvent', {
            //       userId: request.userId,
            //       error: error instanceof Error ? error.message : String(error)
            //     });
            //     // Don't fail unlock operation if event publishing fails
            //   }
            // }
            return {
                success: true,
                message: `Tài khoản đã được mở khóa. Lý do: ${request.reason}`
            };
        }
        catch (error) {
            this.logger.error('Failed to unlock account', {
                userId: request.userId,
                unlockedBy: request.unlockedBy,
                error: error.message
            });
            return {
                success: false,
                message: 'Không thể mở khóa tài khoản. Vui lòng thử lại sau.',
                error: 'UNLOCK_ACCOUNT_FAILED'
            };
        }
    }
    validateRequest(request) {
        if (!request.userId || request.userId.trim().length === 0) {
            return 'User ID là bắt buộc';
        }
        if (!request.unlockedBy || request.unlockedBy.trim().length === 0) {
            return 'Unlocked By (Admin ID) là bắt buộc';
        }
        if (!request.reason || request.reason.trim().length === 0) {
            return 'Lý do mở khóa tài khoản là bắt buộc';
        }
        if (request.reason.length < 10) {
            return 'Lý do mở khóa tài khoản phải có ít nhất 10 ký tự';
        }
        return null;
    }
}
exports.UnlockAccountUseCase = UnlockAccountUseCase;
//# sourceMappingURL=UnlockAccountUseCase.js.map