/**
 * GetUnreadNotificationsCountUseCase
 * Đếm số thông báo chưa đọc theo user
 */
import { INotificationRepository } from '../../domain/repositories/INotificationRepository';
export interface GetUnreadNotificationsCountQuery {
    userId: string;
}
export interface GetUnreadNotificationsCountResult {
    userId: string;
    unreadCount: number;
}
export declare class GetUnreadNotificationsCountUseCase {
    private readonly notificationRepository;
    constructor(notificationRepository: INotificationRepository);
    execute(query: GetUnreadNotificationsCountQuery): Promise<GetUnreadNotificationsCountResult>;
}
//# sourceMappingURL=GetUnreadNotificationsCountUseCase.d.ts.map