/**
 * SearchNotificationsUseCase - Query Use Case
 * Search notifications with multiple filters
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS Query
 */
import { INotificationRepository } from '../../domain/repositories/INotificationRepository';
export interface SearchNotificationsCommand {
    recipientId?: string;
    recipientType?: string;
    templateType?: string;
    status?: string;
    priority?: string;
    channels?: string[];
    scheduledAfter?: Date;
    scheduledBefore?: Date;
    createdAfter?: Date;
    createdBefore?: Date;
    healthcareContext?: {
        patientId?: string;
        doctorId?: string;
        appointmentId?: string;
        medicalRecordId?: string;
    };
    tags?: string[];
    limit?: number;
    offset?: number;
    sortBy?: 'createdAt' | 'scheduledAt' | 'priority' | 'status';
    sortOrder?: 'ASC' | 'DESC';
}
export interface SearchNotificationsResult {
    notifications: any[];
    total: number;
    hasMore: boolean;
}
export declare class SearchNotificationsUseCase {
    private readonly notificationRepository;
    constructor(notificationRepository: INotificationRepository);
    execute(command: SearchNotificationsCommand): Promise<SearchNotificationsResult>;
}
//# sourceMappingURL=SearchNotificationsUseCase.d.ts.map