/**
 * GetNotificationsByRecipientUseCase - Query Use Case
 * Get notifications for a specific recipient with pagination
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS Query
 */
import { INotificationRepository } from '../../domain/repositories/INotificationRepository';
export interface GetNotificationsByRecipientQuery {
    recipientId: string;
    limit?: number;
    offset?: number;
    status?: string;
    priority?: string;
    dateRange?: {
        start: Date;
        end: Date;
    };
}
export interface GetNotificationsByRecipientResult {
    notifications: any[];
    total: number;
    hasMore: boolean;
    pagination: {
        limit: number;
        offset: number;
    };
}
export declare class GetNotificationsByRecipientUseCase {
    private readonly notificationRepository;
    constructor(notificationRepository: INotificationRepository);
    execute(query: GetNotificationsByRecipientQuery): Promise<GetNotificationsByRecipientResult>;
    private mapNotification;
}
//# sourceMappingURL=GetNotificationsByRecipientUseCase.d.ts.map