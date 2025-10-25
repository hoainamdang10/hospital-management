/**
 * SearchNotificationsUseCase - Query Use Case
 * Search notifications with multiple filters
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS Query
 */

import { INotificationRepository, NotificationSearchCriteria } from '../../domain/repositories/INotificationRepository';

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

export class SearchNotificationsUseCase {
  constructor(private readonly notificationRepository: INotificationRepository) {}

  async execute(command: SearchNotificationsCommand): Promise<SearchNotificationsResult> {
    const criteria: NotificationSearchCriteria = {
      ...command,
      status: command.status as any,
      priority: command.priority as any,
      limit: (command.limit || 20) + 1
    };

    const notifications = await this.notificationRepository.findByCriteria(criteria);
    const limit = command.limit || 20;
    const hasMore = notifications.length > limit;
    const results = notifications.slice(0, limit);

    const total = await this.notificationRepository.countByCriteria(criteria);

    return {
      notifications: results.map(n => ({
        notificationId: n.id,
        recipientId: n.recipient.getRecipientId(),
        templateType: n.templateType,
        status: n.status,
        priority: n.priority,
        createdAt: n.createdAt
      })),
      total,
      hasMore
    };
  }
}

