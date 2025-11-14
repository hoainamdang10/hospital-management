"use strict";
/**
 * SearchNotificationsUseCase - Query Use Case
 * Search notifications with multiple filters
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS Query
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchNotificationsUseCase = void 0;
class SearchNotificationsUseCase {
    constructor(notificationRepository) {
        this.notificationRepository = notificationRepository;
    }
    async execute(command) {
        const criteria = {
            ...command,
            status: command.status,
            priority: command.priority,
            limit: (command.limit || 20) + 1
        };
        const notifications = await this.notificationRepository.findByCriteria(criteria);
        const limit = command.limit || 20;
        const hasMore = notifications.length > limit;
        const results = notifications.slice(0, limit);
        const total = await this.notificationRepository.countByCriteria(criteria);
        return {
            notifications: results.map(n => ({
                notificationId: n.id,
                recipientId: n.recipient.getRecipientId(),
                templateType: n.templateType,
                status: n.status,
                priority: n.priority,
                createdAt: n.createdAt
            })),
            total,
            hasMore
        };
    }
}
exports.SearchNotificationsUseCase = SearchNotificationsUseCase;
//# sourceMappingURL=SearchNotificationsUseCase.js.map