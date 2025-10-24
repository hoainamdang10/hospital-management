"use strict";
/**
 * NotificationApplicationService - Simplified Application Service
 * Orchestrates notification sending operations
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Scheduler Integration
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationApplicationService = void 0;
class NotificationApplicationService {
    constructor(sendNotificationUseCase) {
        this.sendNotificationUseCase = sendNotificationUseCase;
    }
    /**
     * Send notification immediately
     * Called by Scheduler Service or other services
     */
    async sendNotification(command) {
        return await this.sendNotificationUseCase.execute(command);
    }
}
exports.NotificationApplicationService = NotificationApplicationService;
//# sourceMappingURL=NotificationApplicationService.js.map