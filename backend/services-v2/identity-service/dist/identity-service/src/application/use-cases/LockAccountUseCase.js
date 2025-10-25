"use strict";
/**
 * Lock Account Use Case (Admin Only)
 * Allows administrators to manually lock user accounts
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS Command Pattern
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LockAccountUseCase = void 0;
const UserId_1 = require("../../domain/value-objects/UserId");
const UserAccountLockedEvent_1 = require("../../domain/events/UserAccountLockedEvent");
/**
 * Lock Account Use Case
 * Allows administrators to manually lock user accounts
 * Optionally terminates all active sessions
 * Records audit trail
 */
class LockAccountUseCase {
    constructor(userRepository, sessionRepository, logger, circuitBreaker, eventPublisher // Optional for backward compatibility
    ) {
        this.userRepository = userRepository;
        this.sessionRepository = sessionRepository;
        this.logger = logger;
        this.circuitBreaker = circuitBreaker;
        this.eventPublisher = eventPublisher;
    }
    async execute(request) {
        return await this.circuitBreaker.execute(async () => this.executeImpl(request), async () => {
            this.logger.error('Circuit breaker open for LockAccountUseCase');
            return {
                success: false,
                message: 'Dịch vụ khóa tài khoản tạm thời không khả dụng. Vui lòng thử lại sau.',
                error: 'SERVICE_UNAVAILABLE'
            };
        });
    }
    async executeImpl(request) {
        try {
            this.logger.info('Processing account lock request', {
                userId: request.userId,
                lockedBy: request.lockedBy,
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
            // 4. Check if user is permanently deactivated
            if (user.accountStatus === 'deactivated') {
                return {
                    success: false,
                    message: 'Không thể khóa tài khoản đã bị vô hiệu hóa vĩnh viễn',
                    error: 'PERMANENTLY_DEACTIVATED'
                };
            }
            // 5. Check if user is already locked
            if (user.accountStatus === 'locked') {
                return {
                    success: false,
                    message: 'Tài khoản đã bị khóa trước đó',
                    error: 'ALREADY_LOCKED'
                };
            }
            // 5. Prevent locking self
            if (request.userId === request.lockedBy) {
                return {
                    success: false,
                    message: 'Không thể khóa tài khoản của chính mình',
                    error: 'CANNOT_LOCK_SELF'
                };
            }
            // 6. Lock account temporarily
            user.lock(request.lockedBy, request.reason);
            await this.userRepository.save(user);
            // 7. Terminate all sessions if requested (default: true)
            const terminateSessions = request.terminateSessions !== false;
            if (terminateSessions) {
                await this.sessionRepository.deleteAllByUserId(request.userId);
                this.logger.info('All sessions terminated after account lock', {
                    userId: request.userId
                });
            }
            // 7. Log audit trail
            this.logger.info('Account locked successfully', {
                userId: request.userId,
                lockedBy: request.lockedBy,
                reason: request.reason,
                terminatedSessions: terminateSessions
            });
            // 8. Publish UserAccountLockedEvent
            if (this.eventPublisher) {
                try {
                    const event = new UserAccountLockedEvent_1.UserAccountLockedEvent(userIdVO, request.lockedBy, request.reason, terminateSessions, user.email.value, user.roleTypes.length > 0 ? user.roleTypes[0] : 'UNKNOWN');
                    await this.eventPublisher.publishDomainEvents([event]);
                    this.logger.info('UserAccountLockedEvent published', {
                        userId: request.userId
                    });
                }
                catch (error) {
                    this.logger.error('Failed to publish UserAccountLockedEvent', {
                        userId: request.userId,
                        error: error instanceof Error ? error.message : String(error)
                    });
                    // Don't fail lock operation if event publishing fails
                }
            }
            return {
                success: true,
                message: `Tài khoản đã bị khóa. Lý do: ${request.reason}`
            };
        }
        catch (error) {
            this.logger.error('Failed to lock account', {
                userId: request.userId,
                lockedBy: request.lockedBy,
                error: error.message
            });
            return {
                success: false,
                message: 'Không thể khóa tài khoản. Vui lòng thử lại sau.',
                error: 'LOCK_ACCOUNT_FAILED'
            };
        }
    }
    validateRequest(request) {
        if (!request.userId || request.userId.trim().length === 0) {
            return 'User ID là bắt buộc';
        }
        if (!request.lockedBy || request.lockedBy.trim().length === 0) {
            return 'Locked By (Admin ID) là bắt buộc';
        }
        if (!request.reason || request.reason.trim().length === 0) {
            return 'Lý do khóa tài khoản là bắt buộc';
        }
        if (request.reason.length < 10) {
            return 'Lý do khóa tài khoản phải có ít nhất 10 ký tự';
        }
        return null;
    }
}
exports.LockAccountUseCase = LockAccountUseCase;
//# sourceMappingURL=LockAccountUseCase.js.map