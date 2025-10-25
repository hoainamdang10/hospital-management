/**
 * GetNotificationUseCase - Query Use Case
 * Get single notification by ID
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS Query
 */

import { INotificationRepository } from '../../domain/repositories/INotificationRepository';
import { NotificationId } from '../../domain/value-objects/NotificationId';
import { Notification } from '../../domain/aggregates/Notification';

export interface GetNotificationQuery {
  notificationId: string;
  userId?: string; // For authorization check
}

export interface GetNotificationResult {
  notification: {
    notificationId: string;
    recipientId: string;
    recipientType: string;
    recipientName: string;
    templateType: string;
    subject: string;
    body: string;
    channels: string[];
    status: string;
    priority: string;
    scheduledAt?: Date;
    sentAt?: Date;
    deliveredAt?: Date;
    deliveryResults?: any[];
    successfulChannels: string[];
    failedChannels: string[];
    retryCount: number;
    healthcareContext?: any;
    metadata: any;
    createdAt: Date;
    updatedAt: Date;
  } | null;
}

export class GetNotificationUseCase {
  constructor(
    private readonly notificationRepository: INotificationRepository
  ) {}

  async execute(query: GetNotificationQuery): Promise<GetNotificationResult> {
    try {
      const notificationId = new NotificationId(query.notificationId);
      const notification = await this.notificationRepository.findById(notificationId);

      if (!notification) {
        return { notification: null };
      }

      return {
        notification: this.mapToResult(notification)
      };
    } catch (error) {
      throw new Error(`Failed to get notification: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private mapToResult(notification: Notification): any {
    const contactInfo = notification.recipient.getContactInfo();
    
    return {
      notificationId: notification.id,
      recipientId: notification.recipient.getRecipientId(),
      recipientType: notification.recipient.getRecipientType(),
      recipientName: notification.recipient.getFullName(),
      templateType: notification.templateType,
      subject: notification.content.getSubject() || '',
      body: notification.content.getBody(),
      channels: notification.channels.map(c => c.getType()),
      status: notification.status,
      priority: notification.priority,
      sentAt: notification.sentAt,
      deliveryResults: notification.deliveryResults,
      successfulChannels: notification.deliveryResults?.filter((r: any) => r.success).map((r: any) => r.channel) || [],
      failedChannels: notification.deliveryResults?.filter((r: any) => !r.success).map((r: any) => r.channel) || [],
      retryCount: 0,
      healthcareContext: notification.metadata.healthcareContext,
      metadata: notification.metadata,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt
    };
  }
}

