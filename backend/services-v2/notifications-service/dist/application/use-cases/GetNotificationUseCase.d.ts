/**
 * GetNotificationUseCase - Query Use Case
 * Get single notification by ID
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS Query
 */
import { INotificationRepository } from '../../domain/repositories/INotificationRepository';
export interface GetNotificationQuery {
    notificationId: string;
    userId?: string;
}
export interface GetNotificationResult {
    notification: {
        notificationId: string;
        recipientId: string;
        recipientType: string;
        recipientName: string;
        templateType: string;
        subject: string;
        body: string;
        channels: string[];
        status: string;
        priority: string;
        scheduledAt?: Date;
        sentAt?: Date;
        deliveredAt?: Date;
        deliveryResults?: any[];
        successfulChannels: string[];
        failedChannels: string[];
        retryCount: number;
        healthcareContext?: any;
        metadata: any;
        createdAt: Date;
        updatedAt: Date;
    } | null;
}
export declare class GetNotificationUseCase {
    private readonly notificationRepository;
    constructor(notificationRepository: INotificationRepository);
    execute(query: GetNotificationQuery): Promise<GetNotificationResult>;
    private mapToResult;
}
//# sourceMappingURL=GetNotificationUseCase.d.ts.map