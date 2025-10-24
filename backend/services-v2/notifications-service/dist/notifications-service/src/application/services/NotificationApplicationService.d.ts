/**
 * NotificationApplicationService - Simplified Application Service
 * Orchestrates notification sending operations
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Scheduler Integration
 */
import { SendNotificationUseCase, SendNotificationCommand, SendNotificationResult } from '../use-cases/SendNotificationUseCase';
export declare class NotificationApplicationService {
    private readonly sendNotificationUseCase;
    constructor(sendNotificationUseCase: SendNotificationUseCase);
    /**
     * Send notification immediately
     * Called by Scheduler Service or other services
     */
    sendNotification(command: SendNotificationCommand): Promise<SendNotificationResult>;
}
//# sourceMappingURL=NotificationApplicationService.d.ts.map