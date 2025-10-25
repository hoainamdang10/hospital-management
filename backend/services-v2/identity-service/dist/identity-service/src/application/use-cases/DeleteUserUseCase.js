"use strict";
/**
 * Delete User Use Case
 * Soft deletes user (deactivates) or hard deletes based on policy
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, HIPAA
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteUserUseCase = void 0;
const UserId_1 = require("../../domain/value-objects/UserId");
const error_helper_1 = require("../../utils/error-helper");
const UserDeletedEvent_1 = require("../../domain/events/UserDeletedEvent");
/**
 * Delete User Use Case
 * Handles user deletion with proper authorization and audit logging
 *
 * Default behavior: Soft delete (deactivate user)
 * Hard delete: Only for admin with explicit flag
 */
class DeleteUserUseCase {
    constructor(userRepository, logger, circuitBreaker, eventPublisher // Optional for backward compatibility
    ) {
        this.userRepository = userRepository;
        this.logger = logger;
        this.circuitBreaker = circuitBreaker;
        this.eventPublisher = eventPublisher;
    }
    async execute(request) {
        try {
            return await this.circuitBreaker.execute(async () => {
                return await this.deleteUserInternal(request);
            });
        }
        catch (error) {
            this.logger.error('Delete user use case failed', {
                userId: request.userId,
                requesterId: request.requesterId,
                error: (0, error_helper_1.getErrorMessage)(error)
            });
            return {
                success: false,
                error: 'Failed to delete user',
                message: 'Không thể xóa người dùng'
            };
        }
    }
    async deleteUserInternal(request) {
        const { userId, requesterId, hardDelete = false, reason } = request;
        // Validate input
        if (!userId || !requesterId) {
            return {
                success: false,
                error: 'Missing required fields',
                message: 'Thiếu thông tin bắt buộc'
            };
        }
        // Prevent self-deletion
        if (userId === requesterId) {
            this.logger.warn('User attempted to delete themselves', { userId, requesterId });
            return {
                success: false,
                error: 'Cannot delete yourself',
                message: 'Không thể xóa chính mình'
            };
        }
        try {
            // Get user to delete
            const userIdVO = UserId_1.UserId.fromString(userId);
            const user = await this.userRepository.findById(userIdVO);
            if (!user) {
                this.logger.warn('User not found for deletion', { userId, requesterId });
                return {
                    success: false,
                    error: 'User not found',
                    message: 'Không tìm thấy người dùng'
                };
            }
            // Check if user is already inactive (soft deleted)
            if (!user.isActive && !hardDelete) {
                return {
                    success: false,
                    error: 'User already deactivated',
                    message: 'Người dùng đã bị vô hiệu hóa'
                };
            }
            if (hardDelete) {
                // Hard delete - permanently remove user
                await this.userRepository.delete(userIdVO);
                // Log hard deletion for audit (CRITICAL - HIPAA compliance)
                this.logger.warn('User permanently deleted', {
                    userId,
                    requesterId,
                    reason: reason || 'No reason provided',
                    userEmail: user.email.value,
                    timestamp: new Date().toISOString(),
                    severity: 'CRITICAL'
                });
                // Publish UserDeletedEvent
                await this.publishUserDeletedEvent(userIdVO, requesterId, 'hard', reason || 'No reason provided', user.email.value, user.healthcareRole.type);
                return {
                    success: true,
                    message: 'Người dùng đã được xóa vĩnh viễn',
                    deletionType: 'hard'
                };
            }
            else {
                // Soft delete - deactivate user permanently
                user.deactivate(request.requesterId, request.reason || 'User account deleted');
                await this.userRepository.update(user);
                // Log soft deletion for audit
                this.logger.info('User deactivated', {
                    userId,
                    requesterId,
                    reason: reason || 'No reason provided',
                    userEmail: user.email.value,
                    timestamp: new Date().toISOString()
                });
                // Publish UserDeletedEvent (soft delete)
                await this.publishUserDeletedEvent(userIdVO, requesterId, 'soft', reason || 'No reason provided', user.email.value, user.healthcareRole.type);
                return {
                    success: true,
                    message: 'Người dùng đã được vô hiệu hóa',
                    deletionType: 'soft'
                };
            }
        }
        catch (error) {
            this.logger.error('Failed to delete user', {
                userId,
                requesterId,
                hardDelete,
                error: (0, error_helper_1.getErrorMessage)(error)
            });
            return {
                success: false,
                error: (0, error_helper_1.getErrorMessage)(error),
                message: 'Lỗi khi xóa người dùng'
            };
        }
    }
    /**
     * Publish UserDeletedEvent
     */
    async publishUserDeletedEvent(userIdVO, deletedBy, deletionType, reason, userEmail, userRole) {
        if (!this.eventPublisher) {
            this.logger.debug('Event publisher not configured, skipping event publication');
            return;
        }
        try {
            const event = new UserDeletedEvent_1.UserDeletedEvent(userIdVO, deletedBy, deletionType, reason, userEmail, userRole);
            await this.eventPublisher.publishDomainEvents([event]);
            this.logger.info('UserDeletedEvent published', {
                userId: userIdVO.value,
                deletionType,
                deletedBy
            });
        }
        catch (error) {
            this.logger.error('Failed to publish UserDeletedEvent', {
                userId: userIdVO.value,
                error: (0, error_helper_1.getErrorMessage)(error)
            });
            // Don't fail deletion if event publishing fails
        }
    }
}
exports.DeleteUserUseCase = DeleteUserUseCase;
//# sourceMappingURL=DeleteUserUseCase.js.map