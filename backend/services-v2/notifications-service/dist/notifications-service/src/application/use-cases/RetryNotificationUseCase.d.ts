/**
 * RetryNotificationUseCase - Command Use Case
 * Retry failed notification delivery
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS Command
 */
import { INotificationRepository } from '../../domain/repositories/INotificationRepository';
import { IDeliveryService } from '../../domain/services/IDeliveryService';
export interface RetryNotificationCommand {
    notificationId: string;
    channels?: string[];
    userId?: string;
}
export interface RetryNotificationResult {
    notificationId: string;
    status: string;
    retryAttempt: number;
    deliveryResults: any[];
    message: string;
}
export declare class RetryNotificationUseCase {
    private readonly notificationRepository;
    private readonly deliveryService;
    constructor(notificationRepository: INotificationRepository, deliveryService: IDeliveryService);
    execute(command: RetryNotificationCommand): Promise<RetryNotificationResult>;
}
//# sourceMappingURL=RetryNotificationUseCase.d.ts.map