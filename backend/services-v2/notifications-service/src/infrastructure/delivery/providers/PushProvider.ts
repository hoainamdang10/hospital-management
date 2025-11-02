/**
 * PushProvider - Firebase Cloud Messaging Provider
 * Sends push notifications via FCM
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, FCM Integration
 */

import { ChannelProvider } from '../MultiChannelDeliveryService';
import { RecipientInfo } from '../../../domain/value-objects/RecipientInfo';
import { NotificationContent } from '../../../domain/value-objects/NotificationContent';
import { NotificationChannel } from '../../../domain/value-objects/NotificationChannel';

interface FirebaseConfig {
  projectId: string;
  privateKey: string;
  clientEmail: string;
  enabled: boolean;
}

export class PushProvider implements ChannelProvider {
  private isConfigured: boolean = false;
  private readonly projectId: string;

  constructor(config: FirebaseConfig) {
    this.projectId = config.projectId;
    this.isConfigured = !!config.projectId && config.enabled;
    
    if (!this.isConfigured) {
      console.warn('[PushProvider] ⚠️ Firebase not configured - push notifications disabled');
    } else {
      console.log(`[PushProvider] ✅ Firebase configured for project ${this.projectId} (mock mode)`);
    }
  }

  getType(): string {
    return 'PUSH';
  }

  async isAvailable(): Promise<boolean> {
    return this.isConfigured;
  }

  async deliver(request: {
    recipient: RecipientInfo;
    content: NotificationContent;
    channel: NotificationChannel;
    metadata?: any;
  }): Promise<{
    status: 'SENT' | 'DELIVERED' | 'FAILED' | 'PENDING';
    messageId?: string;
    deliveredAt?: Date;
    failureReason?: string;
    providerResponse?: any;
  }> {
    try {
      // Get push token from recipient (would come from preferences)
      const pushToken = 'mock-fcm-token'; // In production: get from recipient preferences

      if (!pushToken) {
        return {
          status: 'FAILED',
          failureReason: 'Recipient has no push token registered'
        };
      }

      const title = request.content.getSubject() || 'Thông báo';
      const body = request.content.getBody();

      // Truncate body for push notification (max ~200 chars)
      const truncatedBody = body.length > 200 ? body.substring(0, 197) + '...' : body;

      const messageId = `fcm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      console.log(`[PushProvider] Sending push to token ${pushToken.substring(0, 20)}...`);

      // Mock FCM API call
      const fcmResponse = await this.sendViaFCM({
        token: pushToken,
        notification: {
          title,
          body: truncatedBody
        },
        data: {
          notificationId: request.metadata?.notificationId || '',
          recipientId: request.recipient.getRecipientId(),
          type: 'healthcare_notification'
        },
        android: {
          priority: 'high',
          notification: {
            icon: 'notification_icon',
            color: '#0066cc',
            sound: 'default'
          }
        },
        apns: {
          payload: {
            aps: {
              alert: {
                title,
                body: truncatedBody
              },
              sound: 'default',
              badge: 1
            }
          }
        }
      });

      return {
        status: 'SENT',
        messageId,
        deliveredAt: new Date(),
        providerResponse: fcmResponse
      };

    } catch (error) {
      return {
        status: 'FAILED',
        failureReason: error instanceof Error ? error.message : 'Push notification failed',
        providerResponse: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  async getDeliveryStatus(messageId: string): Promise<{
    status: 'SENT' | 'DELIVERED' | 'FAILED' | 'PENDING';
    deliveredAt?: Date;
    failureReason?: string;
  }> {
    console.log(`[PushProvider] Checking status for message ${messageId}`);
    
    return {
      status: 'DELIVERED',
      deliveredAt: new Date()
    };
  }

  /**
   * Send via Firebase Cloud Messaging (mock)
   */
  private async sendViaFCM(message: any): Promise<any> {
    // In production:
    // const admin = require('firebase-admin');
    // const response = await admin.messaging().send(message);
    // return response;

    // Mock implementation
    await new Promise(resolve => setTimeout(resolve, 150));
    
    return {
      messageId: message.data?.notificationId || 'mock-fcm-message-id',
      success: true
    };
  }
}

