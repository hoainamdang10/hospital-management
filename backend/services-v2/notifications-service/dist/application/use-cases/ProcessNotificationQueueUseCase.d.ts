/**
 * ProcessNotificationQueueUseCase - Command Use Case
 * Process pending notifications in queue
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Queue Processing
 */
import { INotificationRepository } from '../../domain/repositories/INotificationRepository';
import { IDeliveryService } from '../../domain/services/IDeliveryService';
export interface ProcessQueueCommand {
    batchSize?: number;
    priorityFilter?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
    maxProcessingTime?: number;
    onlyExpiredNotifications?: boolean;
}
export interface ProcessQueueResult {
    totalProcessed: number;
    successful: number;
    failed: number;
    expired: number;
    remaining: number;
    processingTime: number;
    statistics: {
        byPriority: Record<string, number>;
        byChannel: Record<string, number>;
    };
    details: Array<{
        notificationId: string;
        status: 'SENT' | 'FAILED' | 'EXPIRED';
        message: string;
    }>;
}
export declare class ProcessNotificationQueueUseCase {
    private readonly notificationRepository;
    private readonly deliveryService;
    constructor(notificationRepository: INotificationRepository, deliveryService: IDeliveryService);
    execute(command: ProcessQueueCommand): Promise<ProcessQueueResult>;
}
//# sourceMappingURL=ProcessNotificationQueueUseCase.d.ts.map