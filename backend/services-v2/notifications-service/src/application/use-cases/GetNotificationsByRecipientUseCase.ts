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
  dateRange?: { start: Date; end: Date };
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

export class GetNotificationsByRecipientUseCase {
  constructor(
    private readonly notificationRepository: INotificationRepository
  ) {}

  async execute(query: GetNotificationsByRecipientQuery): Promise<GetNotificationsByRecipientResult> {
    try {
      const limit = query.limit || 20;
      const offset = query.offset || 0;

      // Build search criteria
      const criteria: any = {
        recipientId: query.recipientId,
        limit: limit + 1, // Fetch one extra to check hasMore
        offset
      };

      if (query.status) criteria.status = query.status;
      if (query.priority) criteria.priority = query.priority;
      if (query.dateRange) {
        criteria.createdAfter = query.dateRange.start;
        criteria.createdBefore = query.dateRange.end;
      }

      const notifications = await this.notificationRepository.findByCriteria(criteria);
      const hasMore = notifications.length > limit;
      const results = notifications.slice(0, limit);

      // Get total count
      const total = await this.notificationRepository.countByCriteria({
        recipientId: query.recipientId,
        status: query.status as any,
        priority: query.priority as any
      });

      return {
        notifications: results.map(n => this.mapNotification(n)),
        total,
        hasMore,
        pagination: { limit, offset }
      };
    } catch (error) {
      throw new Error(`Failed to get notifications by recipient: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private mapNotification(notification: any): any {
    return {
      notificationId: notification.id,
      recipientId: notification.recipient.getRecipientId(),
      templateType: notification.templateType,
      subject: notification.content.getSubject(),
      body: notification.content.getBody(),
      channels: notification.channels.map((c: any) => c.getType()),
      status: notification.status,
      priority: notification.priority,
      sentAt: notification.sentAt,
      createdAt: notification.createdAt,
      metadata: notification.metadata
    };
  }
}

