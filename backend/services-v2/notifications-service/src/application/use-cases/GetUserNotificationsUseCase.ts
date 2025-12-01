/**
 * GetUserNotificationsUseCase - Query Use Case
 * Lấy danh sách thông báo cho người dùng với phân trang và filter cơ bản
 */

import { INotificationRepository } from "../../domain/repositories/INotificationRepository";
import { Notification } from "../../domain/aggregates/Notification";

export interface GetUserNotificationsQuery {
  userId: string;
  limit?: number;
  offset?: number;
  status?: "read" | "unread" | "all";
  priority?: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  startDate?: Date;
  endDate?: Date;
}

export interface GetUserNotificationsResult {
  notifications: Array<{
    notificationId: string;
    templateType?: string;
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
    private readonly notificationRepository: INotificationRepository,
  ) {}

  async execute(
    query: GetUserNotificationsQuery,
  ): Promise<GetUserNotificationsResult> {
    const limit = query.limit && query.limit > 0 ? query.limit : 20;
    const offset = query.offset && query.offset >= 0 ? query.offset : 0;

    if (!query.userId) {
      throw new Error("userId is required");
    }

    try {
      const criteria: any = {
        recipientId: query.userId,
        limit: limit + 1,
        offset,
      };

      if (query.status === "read") {
        criteria.isRead = true;
      } else if (query.status === "unread") {
        criteria.isRead = false;
      }

      if (query.priority) {
        criteria.priority = query.priority;
      }

      if (query.startDate) {
        criteria.createdAfter = query.startDate;
      }
      if (query.endDate) {
        criteria.createdBefore = query.endDate;
      }

      const notifications =
        await this.notificationRepository.findByCriteria(criteria);
      const hasMore = notifications.length > limit;
      const results = notifications.slice(0, limit);

      const total = await this.notificationRepository.countByCriteria({
        recipientId: query.userId,
        isRead:
          query.status === "read"
            ? true
            : query.status === "unread"
              ? false
              : undefined,
        priority: query.priority,
      });

      const unreadCount = await this.notificationRepository.countByCriteria({
        recipientId: query.userId,
        isRead: false,
      });

      return {
        notifications: results.map((notification) =>
          this.mapNotification(notification),
        ),
        total,
        unreadCount,
        hasMore,
        pagination: { limit, offset },
      };
    } catch (error) {
      throw new Error(
        `Failed to get user notifications: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  private mapNotification(notification: Notification) {
    return {
      notificationId: notification.getId().value,
      templateType: notification.templateType,
      subject: notification.getContent().getSubject() ?? "",
      body: notification.getContent().getBody(),
      priority: notification.getPriority(),
      status: notification.getStatus(),
      channels: notification.getChannels().map((channel) => channel.getType()),
      readAt: notification.getReadAt() ?? null,
      createdAt: notification.getCreatedAt(),
      sentAt: notification.getSentAt() ?? null,
      deliveredAt: notification.getDeliveredAt() ?? null,
      healthcareContext: notification.getHealthcareContext(),
    };
  }
}
