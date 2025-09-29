// SMS Provider Implementation
// Hospital Management System - Shared Notification Library

import { Twilio } from 'twilio';
import logger from '../../../utils/logger';
import { 
  SMSProvider, 
  NotificationResult, 
  BulkNotificationResult,
  NotificationConfig,
  ProviderError 
} from '../types/notification.types';

export class TwilioSMSProvider implements SMSProvider {
  private client: Twilio | null = null;
  private config: NotificationConfig['sms'];
  private isInitialized = false;

  constructor(config: NotificationConfig['sms']) {
    this.config = config;
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      if (!this.config.enabled) {
        logger.info('📱 SMS provider disabled in configuration');
        return;
      }

      if (!this.config.accountSid || !this.config.authToken || !this.config.fromNumber) {
        logger.warn('📱 SMS provider configuration incomplete');
        return;
      }

      this.client = new Twilio(this.config.accountSid, this.config.authToken);
      
      // Test the configuration by fetching account info
      await this.client.api.accounts(this.config.accountSid).fetch();
      
      this.isInitialized = true;
      
      logger.info('📱 SMS provider initialized successfully', {
        accountSid: this.config.accountSid,
        fromNumber: this.config.fromNumber
      });
    } catch (error) {
      logger.error('📱 Failed to initialize SMS provider:', error);
      this.isInitialized = false;
    }
  }

  async sendSMS(
    recipient: string,
    message: string,
    data?: any
  ): Promise<NotificationResult> {
    const startTime = Date.now();
    
    try {
      if (!this.isConfigured()) {
        throw new ProviderError(
          'SMS provider not configured',
          'twilio',
          'sms',
          recipient
        );
      }

      if (!this.client) {
        throw new ProviderError(
          'SMS client not initialized',
          'twilio',
          'sms',
          recipient
        );
      }

      // Validate and format Vietnamese phone number
      const formattedRecipient = this.formatVietnamesePhoneNumber(recipient);
      
      // Truncate message if too long (SMS limit is 160 characters for single SMS)
      const truncatedMessage = this.truncateMessage(message);
      
      const result = await this.client.messages.create({
        body: truncatedMessage,
        from: this.config.fromNumber!,
        to: formattedRecipient,
      });

      const duration = Date.now() - startTime;

      logger.info('📱 SMS sent successfully', {
        recipient: formattedRecipient,
        messageId: result.sid,
        status: result.status,
        duration: `${duration}ms`
      });

      return {
        success: true,
        messageId: result.sid,
        timestamp: new Date().toISOString(),
        type: 'sms',
        recipient: formattedRecipient,
        status: this.mapTwilioStatus(result.status),
        deliveredAt: result.status === 'delivered' ? new Date().toISOString() : undefined
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      logger.error('📱 Failed to send SMS:', {
        recipient,
        error: error.message,
        duration: `${duration}ms`
      });

      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
        type: 'sms',
        recipient,
        status: 'failed'
      };
    }
  }

  async sendBulkSMS(
    recipients: string[],
    message: string,
    data?: any
  ): Promise<BulkNotificationResult> {
    const batchId = `bulk_sms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();
    const results: NotificationResult[] = [];
    let totalSent = 0;
    let totalFailed = 0;

    logger.info('📱 Starting bulk SMS send', {
      batchId,
      recipientCount: recipients.length,
      messageLength: message.length
    });

    // Process SMS in smaller batches to respect rate limits
    const batchSize = 5;
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      
      const batchPromises = batch.map(recipient => 
        this.sendSMS(recipient, message, data)
      );

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Count successes and failures
      batchResults.forEach(result => {
        if (result.success) {
          totalSent++;
        } else {
          totalFailed++;
        }
      });

      // Delay between batches to respect Twilio rate limits
      if (i + batchSize < recipients.length) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
      }
    }

    const duration = Date.now() - startTime;

    logger.info('📱 Bulk SMS send completed', {
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
           !!this.client &&
           !!this.config.accountSid &&
           !!this.config.authToken &&
           !!this.config.fromNumber;
  }

  // Helper method to format Vietnamese phone numbers
  private formatVietnamesePhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // Handle Vietnamese phone number formats
    if (cleaned.startsWith('0')) {
      // Convert 0xxx to +84xxx
      cleaned = '+84' + cleaned.substring(1);
    } else if (cleaned.startsWith('84')) {
      // Add + if missing
      cleaned = '+' + cleaned;
    } else if (!cleaned.startsWith('+84')) {
      // Assume it's a Vietnamese number without country code
      cleaned = '+84' + cleaned;
    }
    
    return cleaned;
  }

  // Helper method to truncate message for SMS limits
  private truncateMessage(message: string): string {
    const maxLength = 160; // Standard SMS length
    
    if (message.length <= maxLength) {
      return message;
    }
    
    // Truncate and add ellipsis
    return message.substring(0, maxLength - 3) + '...';
  }

  // Helper method to map Twilio status to our status
  private mapTwilioStatus(twilioStatus: string): 'pending' | 'sent' | 'delivered' | 'failed' {
    switch (twilioStatus) {
      case 'queued':
      case 'accepted':
        return 'pending';
      case 'sent':
        return 'sent';
      case 'delivered':
        return 'delivered';
      case 'failed':
      case 'undelivered':
        return 'failed';
      default:
        return 'pending';
    }
  }

  // Method to test SMS configuration
  async testConnection(): Promise<boolean> {
    try {
      if (!this.client || !this.config.accountSid) {
        return false;
      }
      
      await this.client.api.accounts(this.config.accountSid).fetch();
      return true;
    } catch (error) {
      logger.error('📱 SMS connection test failed:', error);
      return false;
    }
  }

  // Method to send test SMS
  async sendTestSMS(recipient: string): Promise<NotificationResult> {
    const testMessage = `
Test SMS từ Hệ thống Quản lý Bệnh viện

Thời gian: ${new Date().toLocaleString('vi-VN')}
✅ SMS hoạt động bình thường

Bệnh viện ABC
    `.trim();

    return this.sendSMS(recipient, testMessage, { testSMS: true });
  }

  // Method to get provider statistics
  getStats(): any {
    return {
      provider: 'twilio',
      configured: this.isConfigured(),
      initialized: this.isInitialized,
      accountSid: this.config.accountSid,
      fromNumber: this.config.fromNumber,
      enabled: this.config.enabled
    };
  }

  // Method to get SMS delivery status
  async getDeliveryStatus(messageId: string): Promise<string | null> {
    try {
      if (!this.client) {
        return null;
      }

      const message = await this.client.messages(messageId).fetch();
      return this.mapTwilioStatus(message.status);
    } catch (error) {
      logger.error('📱 Failed to get SMS delivery status:', error);
      return null;
    }
  }

  // Method to validate Vietnamese phone number
  static isValidVietnamesePhoneNumber(phoneNumber: string): boolean {
    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Vietnamese mobile numbers start with specific prefixes
    const vietnameseMobilePrefixes = [
      '032', '033', '034', '035', '036', '037', '038', '039', // Viettel
      '070', '079', '077', '076', '078', // Mobifone
      '083', '084', '085', '081', '082', // Vinaphone
      '056', '058', // Vietnamobile
      '059', // Gmobile
    ];
    
    // Check if it's a valid Vietnamese mobile number
    if (cleaned.startsWith('0') && cleaned.length === 10) {
      const prefix = cleaned.substring(0, 3);
      return vietnameseMobilePrefixes.includes(prefix);
    }
    
    // Check if it's in international format
    if (cleaned.startsWith('84') && cleaned.length === 11) {
      const prefix = '0' + cleaned.substring(2, 4);
      return vietnameseMobilePrefixes.includes(prefix);
    }
    
    return false;
  }
}
