"use strict";
/**
 * GetUnreadNotificationsCountUseCase
 * Đếm số thông báo chưa đọc theo user
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetUnreadNotificationsCountUseCase = void 0;
class GetUnreadNotificationsCountUseCase {
    constructor(notificationRepository) {
        this.notificationRepository = notificationRepository;
    }
    async execute(query) {
        if (!query.userId) {
            throw new Error('userId is required');
        }
        try {
            const unreadCount = await this.notificationRepository.countByCriteria({
                recipientId: query.userId,
                isRead: false,
            });
            return {
                userId: query.userId,
                unreadCount,
            };
        }
        catch (error) {
            throw new Error(`Failed to get unread notifications count: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}
exports.GetUnreadNotificationsCountUseCase = GetUnreadNotificationsCountUseCase;
//# sourceMappingURL=GetUnreadNotificationsCountUseCase.js.map