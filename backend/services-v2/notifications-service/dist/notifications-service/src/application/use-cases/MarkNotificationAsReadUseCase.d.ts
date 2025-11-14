/**
 * MarkNotificationAsReadUseCase - Command Use Case
 * Mark notification as read/unread
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS
 */
import { INotificationRepository } from '../../domain/repositories/INotificationRepository';
export interface MarkAsReadCommand {
    notificationId: string;
    userId: string;
    isRead: boolean;
}
export interface MarkAsReadResult {
    success: boolean;
    notificationId: string;
    readAt: Date | null;
    message: string;
}
export declare class MarkNotificationAsReadUseCase {
    private readonly notificationRepository;
    constructor(notificationRepository: INotificationRepository);
    execute(command: MarkAsReadCommand): Promise<MarkAsReadResult>;
}
//# sourceMappingURL=MarkNotificationAsReadUseCase.d.ts.map