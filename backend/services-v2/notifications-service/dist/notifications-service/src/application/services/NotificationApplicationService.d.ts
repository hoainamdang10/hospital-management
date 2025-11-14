/**
 * NotificationApplicationService - Simplified for Demo
 * Orchestrates core notification operations
 *
 * @author Hospital Management Team
 * @version 2.0.0-simplified
 * @compliance Clean Architecture, Demo Implementation
 */
import { SendNotificationUseCase, SendNotificationCommand, SendNotificationResult } from '../use-cases/SendNotificationUseCase';
import { GetNotificationUseCase } from '../use-cases/GetNotificationUseCase';
import { GetNotificationPreferencesUseCase } from '../use-cases/GetNotificationPreferencesUseCase';
export declare class NotificationApplicationService {
    private readonly sendNotificationUseCase;
    private readonly getNotificationUseCase;
    private readonly getNotificationPreferencesUseCase;
    constructor(sendNotificationUseCase: SendNotificationUseCase, getNotificationUseCase: GetNotificationUseCase, getNotificationPreferencesUseCase: GetNotificationPreferencesUseCase);
    /**
     * Send notification immediately
     */
    sendNotification(command: SendNotificationCommand): Promise<SendNotificationResult>;
    /**
     * Get notification by ID
     */
    getNotification(notificationId: string): Promise<import("../use-cases/GetNotificationUseCase").GetNotificationResult>;
    /**
     * Get user notification preferences
     */
    getNotificationPreferences(userId: string, userType?: 'patient' | 'staff'): Promise<import("../use-cases/GetNotificationPreferencesUseCase").GetPreferencesResult>;
}
//# sourceMappingURL=NotificationApplicationService.d.ts.map