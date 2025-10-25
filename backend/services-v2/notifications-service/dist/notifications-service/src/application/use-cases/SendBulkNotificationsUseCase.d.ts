/**
 * SendBulkNotificationsUseCase - Command Use Case
 * Send notifications to multiple recipients
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Bulk Operations
 */
import { SendNotificationUseCase } from './SendNotificationUseCase';
export interface SendBulkNotificationsCommand {
    recipientIds: string[];
    recipientType: 'PATIENT' | 'DOCTOR' | 'NURSE' | 'ADMIN';
    templateType: string;
    templateData: Record<string, any>;
    channels: string[];
    priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
    metadata?: any;
}
export interface SendBulkNotificationsResult {
    totalRequested: number;
    successful: number;
    failed: number;
    results: Array<{
        recipientId: string;
        notificationId?: string;
        status: 'SUCCESS' | 'FAILED';
        error?: string;
    }>;
}
export declare class SendBulkNotificationsUseCase {
    private readonly sendNotificationUseCase;
    constructor(sendNotificationUseCase: SendNotificationUseCase);
    execute(command: SendBulkNotificationsCommand): Promise<SendBulkNotificationsResult>;
}
//# sourceMappingURL=SendBulkNotificationsUseCase.d.ts.map