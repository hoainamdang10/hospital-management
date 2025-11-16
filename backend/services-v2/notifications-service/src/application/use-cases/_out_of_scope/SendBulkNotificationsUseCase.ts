/**
 * SendBulkNotificationsUseCase - Command Use Case
 * Send notifications to multiple recipients
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Bulk Operations
 */

import { SendNotificationUseCase } from './SendNotificationUseCase';

export interface SendBulkNotificationsCommand {
  recipientIds: string[];
  recipientType: 'PATIENT' | 'DOCTOR' | 'NURSE' | 'ADMIN';
  templateType: string;
  templateData: Record<string, any>;
  channels: string[];
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  metadata?: any;
}

export interface SendBulkNotificationsResult {
  totalRequested: number;
  successful: number;
  failed: number;
  results: Array<{
    recipientId: string;
    notificationId?: string;
    status: 'SUCCESS' | 'FAILED';
    error?: string;
  }>;
}

export class SendBulkNotificationsUseCase {
  constructor(
    private readonly sendNotificationUseCase: SendNotificationUseCase
  ) {}

  async execute(command: SendBulkNotificationsCommand): Promise<SendBulkNotificationsResult> {
    const results: Array<{ recipientId: string; notificationId?: string; status: 'SUCCESS' | 'FAILED'; error?: string }> = [];
    let successful = 0;
    let failed = 0;

    for (const recipientId of command.recipientIds) {
      try {
        const result = await this.sendNotificationUseCase.execute({
          recipientId,
          recipientType: command.recipientType,
          templateType: command.templateType,
          templateData: command.templateData,
          channels: command.channels,
          priority: command.priority,
          metadata: {
            ...command.metadata,
            bulkOperation: true
          }
        });

        results.push({
          recipientId,
          notificationId: result.notificationId,
          status: 'SUCCESS'
        });
        successful++;
      } catch (error) {
        results.push({
          recipientId,
          status: 'FAILED',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        failed++;
      }
    }

    return {
      totalRequested: command.recipientIds.length,
      successful,
      failed,
      results
    };
  }
}

