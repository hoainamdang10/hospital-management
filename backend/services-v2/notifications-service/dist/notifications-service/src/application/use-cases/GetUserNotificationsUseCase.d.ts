/**
 * GetUserNotificationsUseCase - Query Use Case
 * Get user notifications with pagination and filters
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS
 */
import { INotificationRepository } from '../../domain/repositories/INotificationRepository';
export interface GetUserNotificationsQuery {
    userId: string;
    limit?: number;
    offset?: number;
    status?: 'read' | 'unread' | 'all';
    priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
    startDate?: Date;
    endDate?: Date;
}
export interface GetUserNotificationsResult {
    notifications: Array<{
        notificationId: string;
        subject: string;
        body: string;
        priority: string;
        status: string;
        channels: string[];
        readAt: Date | null;
        createdAt: Date;
        sentAt: Date | null;
        deliveredAt: Date | null;
        healthcareContext?: {
            patientId?: string;
            doctorId?: string;
            appointmentId?: string;
            medicalRecordId?: string;
            invoiceId?: string;
        };
    }>;
    total: number;
    unreadCount: number;
    hasMore: boolean;
    pagination: {
        limit: number;
        offset: number;
    };
}
export declare class GetUserNotificationsUseCase {
    private readonly notificationRepository;
    constructor(notificationRepository: INotificationRepository);
    execute(query: GetUserNotificationsQuery): Promise<GetUserNotificationsResult>;
    private mapNotification;
}
//# sourceMappingURL=GetUserNotificationsUseCase.d.ts.map