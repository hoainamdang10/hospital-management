/**
 * GetUserNotificationsUseCase - Query Use Case
 * Get user notifications with pagination and filters
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS
 */

import { INotificationRepository } from '../../domain/repositories/INotificationRepository';
import { Notification } from '../../domain/aggregates/Notification';

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

export class GetUserNotificationsUseCase {
  constructor(
    private readonly notificationRepository: INotificationRepository
  ) {}

  async execute(query: GetUserNotificationsQuery): Promise<GetUserNotificationsResult> {
    try {
      const limit = query.limit || 20;
      const offset = query.offset || 0;

      // Build search criteria
      const criteria: any = {
        recipientId: query.userId,
        limit: limit + 1, // Fetch one extra to check hasMore
        offset
      };

      // Filter by read status
      if (query.status === 'read') {
        criteria.isRead = true;
      } else if (query.status === 'unread') {
        criteria.isRead = false;
      }

      // Filter by priority
      if (query.priority) {
        criteria.priority = query.priority;
      }

      // Filter by date range
      if (query.startDate) {
        criteria.createdAfter = query.startDate;
      }
      if (query.endDate) {
        criteria.createdBefore = query.endDate;
      }

      // Fetch notifications
      const notifications = await this.notificationRepository.findByCriteria(criteria);
      
      // Check if there are more results
      const hasMore = notifications.length > limit;
      const results = notifications.slice(0, limit);

      // Get total count
      const total = await this.notificationRepository.countByCriteria({
        recipientId: query.userId,
        isRead: query.status === 'read' ? true : query.status === 'unread' ? false : undefined,
        priority: query.priority
      });

      // Get unread count
      const unreadCount = await this.notificationRepository.countByCriteria({
        recipientId: query.userId,
        isRead: false
      });

      return {
        notifications: results.map(n => this.mapNotification(n)),
        total,
        unreadCount,
        hasMore,
        pagination: { limit, offset }
      };
    } catch (error) {
      throw new Error(
        `Failed to get user notifications: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  private mapNotification(notification: Notification): any {
    return {
      notificationId: notification.getId().value,
      subject: notification.getContent().getSubject(),
      body: notification.getContent().getBody(),
      priority: notification.getPriority(),
      status: notification.getStatus(),
      channels: notification.getChannels().map(c => c.getChannelType()),
      readAt: notification.getReadAt ? notification.getReadAt() : null,
      createdAt: notification.getCreatedAt(),
      sentAt: notification.getSentAt ? notification.getSentAt() : null,
      deliveredAt: notification.getDeliveredAt ? notification.getDeliveredAt() : null,
      healthcareContext: notification.getHealthcareContext()
    };
  }
}
