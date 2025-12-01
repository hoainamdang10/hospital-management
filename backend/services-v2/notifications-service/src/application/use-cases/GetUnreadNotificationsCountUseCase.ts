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

export class GetUnreadNotificationsCountUseCase {
  constructor(
    private readonly notificationRepository: INotificationRepository
  ) {}

  async execute(
    query: GetUnreadNotificationsCountQuery
  ): Promise<GetUnreadNotificationsCountResult> {
    if (!query.userId) {
      throw new Error('userId is required');
    }

    try {
      const unreadCount = await this.notificationRepository.countByCriteria({
        recipientId: query.userId,
        isRead: false,
      });

      return {
        userId: query.userId,
        unreadCount,
      };
    } catch (error) {
      throw new Error(
        `Failed to get unread notifications count: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }
}
