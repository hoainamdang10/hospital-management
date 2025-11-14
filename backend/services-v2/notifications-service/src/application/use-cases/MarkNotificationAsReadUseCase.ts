/**
 * MarkNotificationAsReadUseCase - Command Use Case
 * Mark notification as read/unread
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS
 */

import { INotificationRepository } from '../../domain/repositories/INotificationRepository';
import { NotificationId } from '../../domain/value-objects/NotificationId';

export interface MarkAsReadCommand {
  notificationId: string;
  userId: string; // For authorization check
  isRead: boolean; // true = mark as read, false = mark as unread
}

export interface MarkAsReadResult {
  success: boolean;
  notificationId: string;
  readAt: Date | null;
  message: string;
}

export class MarkNotificationAsReadUseCase {
  constructor(
    private readonly notificationRepository: INotificationRepository
  ) {}

  async execute(command: MarkAsReadCommand): Promise<MarkAsReadResult> {
    try {
      const notificationId = NotificationId.fromString(command.notificationId);
      
      // Find notification
      const notification = await this.notificationRepository.findById(notificationId);
      
      if (!notification) {
        throw new Error('Notification not found');
      }

      // Authorization check - user can only mark their own notifications
      if (notification.getRecipient().getRecipientId() !== command.userId) {
        throw new Error('Unauthorized: You can only mark your own notifications');
      }

      // Update read_at timestamp
      const readAt = command.isRead ? new Date() : null;
      await this.notificationRepository.markAsRead(notificationId, readAt);

      return {
        success: true,
        notificationId: command.notificationId,
        readAt,
        message: command.isRead 
          ? 'Notification marked as read' 
          : 'Notification marked as unread'
      };
    } catch (error) {
      throw new Error(
        `Failed to mark notification as ${command.isRead ? 'read' : 'unread'}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }
}
