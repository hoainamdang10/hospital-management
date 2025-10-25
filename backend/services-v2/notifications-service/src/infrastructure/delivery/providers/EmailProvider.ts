/**
 * EmailProvider - SendGrid Email Delivery Provider
 * Sends emails via SendGrid with Vietnamese healthcare templates
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, SendGrid Integration
 */

import { ChannelProvider } from '../MultiChannelDeliveryService';
import { RecipientInfo } from '../../../domain/value-objects/RecipientInfo';
import { NotificationContent } from '../../../domain/value-objects/NotificationContent';
import { NotificationChannel } from '../../../domain/value-objects/NotificationChannel';

// SendGrid types (mock for now - install @sendgrid/mail for production)
interface SendGridConfig {
  apiKey: string;
  fromEmail: string;
  fromName: string;
}

export class EmailProvider implements ChannelProvider {
  private isConfigured: boolean = false;

  constructor(private readonly config: SendGridConfig) {
    this.isConfigured = !!config.apiKey;
  }

  getType(): string {
    return 'EMAIL';
  }

  async isAvailable(): Promise<boolean> {
    // Check if SendGrid is configured and accessible
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
      const contactInfo = request.recipient.getContactInfo();
      const recipientEmail = contactInfo.email;

      if (!recipientEmail) {
        return {
          status: 'FAILED',
          failureReason: 'Recipient has no email address'
        };
      }

      // Validate email format
      if (!this.isValidEmail(recipientEmail)) {
        return {
          status: 'FAILED',
          failureReason: 'Invalid email address format'
        };
      }

      // Prepare email content
      const subject = request.content.getSubject() || 'Thông báo từ Bệnh viện';
      const body = request.content.getBody();

      // Mock SendGrid API call
      // In production: use @sendgrid/mail
      const messageId = `sendgrid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      console.log(`[EmailProvider] Sending email to ${recipientEmail}:`, {
        subject,
        bodyLength: body.length,
        messageId
      });

      // Simulate SendGrid API call
      const sendGridResponse = await this.sendViaSendGrid({
        to: recipientEmail,
        from: {
          email: this.config.fromEmail,
          name: this.config.fromName
        },
        subject,
        html: this.formatHtmlBody(body, request.recipient),
        text: body,
        customArgs: {
          notificationId: request.metadata?.notificationId,
          recipientId: request.recipient.getRecipientId()
        }
      });

      return {
        status: 'SENT',
        messageId,
        deliveredAt: new Date(),
        providerResponse: sendGridResponse
      };

    } catch (error) {
      return {
        status: 'FAILED',
        failureReason: error instanceof Error ? error.message : 'Email delivery failed',
        providerResponse: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  async getDeliveryStatus(messageId: string): Promise<{
    status: 'SENT' | 'DELIVERED' | 'FAILED' | 'PENDING';
    deliveredAt?: Date;
    failureReason?: string;
  }> {
    // Mock status check
    // In production: query SendGrid activity API
    console.log(`[EmailProvider] Checking status for message ${messageId}`);
    
    return {
      status: 'DELIVERED',
      deliveredAt: new Date()
    };
  }

  /**
   * Send via SendGrid (mock implementation)
   */
  private async sendViaSendGrid(emailData: any): Promise<any> {
    // In production, use SendGrid SDK:
    // const sgMail = require('@sendgrid/mail');
    // sgMail.setApiKey(this.config.apiKey);
    // const response = await sgMail.send(emailData);
    // return response;

    // Mock implementation
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate network delay
    
    return {
      statusCode: 202,
      headers: {
        'x-message-id': emailData.customArgs?.notificationId || 'mock-id'
      },
      body: {
        message: 'Email queued for delivery'
      }
    };
  }

  /**
   * Format HTML body with Vietnamese healthcare template
   */
  private formatHtmlBody(textBody: string, recipient: RecipientInfo): string {
    const recipientName = recipient.getFullName();

    return `
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Thông báo từ Bệnh viện</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
          .header { border-bottom: 3px solid #0066cc; padding-bottom: 15px; margin-bottom: 20px; }
          .header h2 { color: #0066cc; margin: 0; }
          .content { margin: 20px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #666; }
          .greeting { font-weight: bold; color: #0066cc; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>🏥 Bệnh viện Đa khoa</h2>
          </div>
          <div class="content">
            <p class="greeting">Kính gửi ${recipientName},</p>
            <div>${textBody.replace(/\n/g, '<br>')}</div>
          </div>
          <div class="footer">
            <p><strong>Bệnh viện Đa khoa</strong></p>
            <p>Hotline: 1900-xxxx | Email: contact@hospital.vn</p>
            <p><em>Đây là email tự động, vui lòng không trả lời trực tiếp.</em></p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

