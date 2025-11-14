/**
 * CancelNotificationUseCase - Command Use Case
 * Cancel scheduled or pending notification
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS Command
 */
import { INotificationRepository } from '../../domain/repositories/INotificationRepository';
export interface CancelNotificationCommand {
    notificationId: string;
    reason?: string;
    userId?: string;
}
export interface CancelNotificationResult {
    notificationId: string;
    status: string;
    message: string;
}
export declare class CancelNotificationUseCase {
    private readonly notificationRepository;
    constructor(notificationRepository: INotificationRepository);
    execute(command: CancelNotificationCommand): Promise<CancelNotificationResult>;
}
//# sourceMappingURL=CancelNotificationUseCase.d.ts.map