// Push Notification Provider Implementation
// Hospital Management System - Shared Notification Library

import axios from 'axios';
import logger from '../../../utils/logger';
import { 
  PushProvider, 
  NotificationResult, 
  BulkNotificationResult,
  NotificationConfig,
  ProviderError 
} from '../types/notification.types';

export class FirebasePushProvider implements PushProvider {
  private config: NotificationConfig['push'];
  private isInitialized = false;
  private fcmEndpoint = 'https://fcm.googleapis.com/fcm/send';

  constructor(config: NotificationConfig['push']) {
    this.config = config;
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      if (!this.config.enabled) {
        logger.info('🔔 Push notification provider disabled in configuration');
        return;
      }

      if (!this.config.serverKey) {
        logger.warn('🔔 Push notification provider configuration incomplete');
        return;
      }

      // Test the configuration by making a test request
      await this.testConnection();
      
      this.isInitialized = true;
      
      logger.info('🔔 Push notification provider initialized successfully', {
        appId: this.config.appId
      });
    } catch (error) {
      logger.error('🔔 Failed to initialize push notification provider:', error);
      this.isInitialized = false;
    }
  }

  async sendPush(
    recipient: string,
    title: string,
    message: string,
    data?: any
  ): Promise<NotificationResult> {
    const startTime = Date.now();
    
    try {
      if (!this.isConfigured()) {
        throw new ProviderError(
          'Push notification provider not configured',
          'firebase',
          'push',
          recipient
        );
      }

      const payload = {
        to: recipient, // FCM token
        notification: {
          title: title,
          body: message,
          icon: '/icons/hospital-icon-192x192.png',
          badge: '/icons/hospital-badge-72x72.png',
          sound: 'default',
          click_action: 'FLUTTER_NOTIFICATION_CLICK',
        },
        data: {
          ...data,
          timestamp: new Date().toISOString(),
          type: 'hospital_notification',
        },
        android: {
          notification: {
            channel_id: 'hospital_notifications',
            priority: 'high',
            default_sound: true,
            default_vibrate_timings: true,
          },
        },
        apns: {
          payload: {
            aps: {
              alert: {
                title: title,
                body: message,
              },
              badge: 1,
              sound: 'default',
            },
          },
        },
      };

      const response = await axios.post(this.fcmEndpoint, payload, {
        headers: {
          'Authorization': `key=${this.config.serverKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000, // 10 second timeout
      });

      const duration = Date.now() - startTime;

      if (response.data.success === 1) {
        logger.info('🔔 Push notification sent successfully', {
          recipient,
          title,
          messageId: response.data.multicast_id,
          duration: `${duration}ms`
        });

        return {
          success: true,
          messageId: response.data.multicast_id?.toString(),
          timestamp: new Date().toISOString(),
          type: 'push',
          recipient,
          status: 'sent',
          deliveredAt: new Date().toISOString()
        };
      } else {
        const error = response.data.results?.[0]?.error || 'Unknown error';
        throw new Error(error);
      }
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      logger.error('🔔 Failed to send push notification:', {
        recipient,
        title,
        error: error.message,
        duration: `${duration}ms`
      });

      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
        type: 'push',
        recipient,
        status: 'failed'
      };
    }
  }

  async sendBulkPush(
    recipients: string[],
    title: string,
    message: string,
    data?: any
  ): Promise<BulkNotificationResult> {
    const batchId = `bulk_push_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();
    const results: NotificationResult[] = [];
    let totalSent = 0;
    let totalFailed = 0;

    logger.info('🔔 Starting bulk push notification send', {
      batchId,
      recipientCount: recipients.length,
      title
    });

    try {
      if (!this.isConfigured()) {
        throw new ProviderError(
          'Push notification provider not configured',
          'firebase',
          'push'
        );
      }

      // FCM supports sending to multiple tokens in a single request
      const payload = {
        registration_ids: recipients,
        notification: {
          title: title,
          body: message,
          icon: '/icons/hospital-icon-192x192.png',
          badge: '/icons/hospital-badge-72x72.png',
          sound: 'default',
          click_action: 'FLUTTER_NOTIFICATION_CLICK',
        },
        data: {
          ...data,
          timestamp: new Date().toISOString(),
          type: 'hospital_notification',
          batchId: batchId,
        },
        android: {
          notification: {
            channel_id: 'hospital_notifications',
            priority: 'high',
            default_sound: true,
            default_vibrate_timings: true,
          },
        },
        apns: {
          payload: {
            aps: {
              alert: {
                title: title,
                body: message,
              },
              badge: 1,
              sound: 'default',
            },
          },
        },
      };

      const response = await axios.post(this.fcmEndpoint, payload, {
        headers: {
          'Authorization': `key=${this.config.serverKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30 second timeout for bulk
      });

      // Process individual results
      if (response.data.results) {
        response.data.results.forEach((result: any, index: number) => {
          const recipient = recipients[index];
          
          if (result.message_id) {
            totalSent++;
            results.push({
              success: true,
              messageId: result.message_id,
              timestamp: new Date().toISOString(),
              type: 'push',
              recipient,
              status: 'sent',
              deliveredAt: new Date().toISOString()
            });
          } else {
            totalFailed++;
            results.push({
              success: false,
              error: result.error || 'Unknown error',
              timestamp: new Date().toISOString(),
              type: 'push',
              recipient,
              status: 'failed'
            });
          }
        });
      }
    } catch (error: any) {
      logger.error('🔔 Bulk push notification failed:', error);
      
      // Mark all as failed
      recipients.forEach(recipient => {
        totalFailed++;
        results.push({
          success: false,
          error: error.message,
          timestamp: new Date().toISOString(),
          type: 'push',
          recipient,
          status: 'failed'
        });
      });
    }

    const duration = Date.now() - startTime;

    logger.info('🔔 Bulk push notification send completed', {
      batchId,
      totalSent,
      totalFailed,
      duration: `${duration}ms`
    });

    return {
      totalSent,
      totalFailed,
      results,
      batchId,
      timestamp: new Date().toISOString()
    };
  }

  isConfigured(): boolean {
    return this.isInitialized && 
           this.config.enabled && 
           !!this.config.serverKey;
  }

  // Method to test push notification configuration
  async testConnection(): Promise<boolean> {
    try {
      if (!this.config.serverKey) {
        return false;
      }

      // Test with a dummy token to validate server key
      const testPayload = {
        to: 'test_token',
        notification: {
          title: 'Test',
          body: 'Test message',
        },
      };

      const response = await axios.post(this.fcmEndpoint, testPayload, {
        headers: {
          'Authorization': `key=${this.config.serverKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 5000,
      });

      // Even with invalid token, if server key is valid, we get a proper error response
      return response.status === 200;
    } catch (error: any) {
      // Check if it's an authentication error (invalid server key)
      if (error.response?.status === 401) {
        logger.error('🔔 Invalid Firebase server key');
        return false;
      }
      
      // Other errors might be due to invalid token, which is expected for test
      return error.response?.status === 200;
    }
  }

  // Method to send test push notification
  async sendTestPush(recipient: string): Promise<NotificationResult> {
    return this.sendPush(
      recipient,
      'Test Push - Bệnh viện ABC',
      `
Đây là thông báo test từ hệ thống.

🕐 Thời gian: ${new Date().toLocaleString('vi-VN')}
✅ Push notification hoạt động bình thường

Bệnh viện ABC
      `.trim(),
      { 
        testPush: true,
        timestamp: new Date().toISOString()
      }
    );
  }

  // Method to get provider statistics
  getStats(): any {
    return {
      provider: 'firebase',
      configured: this.isConfigured(),
      initialized: this.isInitialized,
      appId: this.config.appId,
      enabled: this.config.enabled,
      endpoint: this.fcmEndpoint
    };
  }

  // Method to validate FCM token format
  static isValidFCMToken(token: string): boolean {
    // FCM tokens are typically 152+ characters long and contain alphanumeric characters, hyphens, and underscores
    const fcmTokenPattern = /^[a-zA-Z0-9_-]{140,}$/;
    return fcmTokenPattern.test(token);
  }

  // Method to create notification payload for specific platforms
  createPlatformSpecificPayload(
    title: string,
    message: string,
    data?: any,
    platform?: 'android' | 'ios' | 'web'
  ): any {
    const basePayload = {
      notification: {
        title: title,
        body: message,
        icon: '/icons/hospital-icon-192x192.png',
        sound: 'default',
      },
      data: {
        ...data,
        timestamp: new Date().toISOString(),
        type: 'hospital_notification',
      },
    };

    switch (platform) {
      case 'android':
        return {
          ...basePayload,
          android: {
            notification: {
              channel_id: 'hospital_notifications',
              priority: 'high',
              default_sound: true,
              default_vibrate_timings: true,
              color: '#2c5aa0',
            },
          },
        };
      
      case 'ios':
        return {
          ...basePayload,
          apns: {
            payload: {
              aps: {
                alert: {
                  title: title,
                  body: message,
                },
                badge: 1,
                sound: 'default',
                'content-available': 1,
              },
            },
          },
        };
      
      case 'web':
        return {
          ...basePayload,
          webpush: {
            notification: {
              title: title,
              body: message,
              icon: '/icons/hospital-icon-192x192.png',
              badge: '/icons/hospital-badge-72x72.png',
              requireInteraction: true,
            },
          },
        };
      
      default:
        return basePayload;
    }
  }
}
