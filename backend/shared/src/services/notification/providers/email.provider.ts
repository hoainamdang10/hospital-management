// Email Provider Implementation
// Hospital Management System - Shared Notification Library

import nodemailer from 'nodemailer';
import logger from '../../../utils/logger';
import { 
  EmailProvider, 
  NotificationResult, 
  BulkNotificationResult,
  NotificationConfig,
  ProviderError 
} from '../types/notification.types';

export class NodemailerEmailProvider implements EmailProvider {
  private transporter: nodemailer.Transporter | null = null;
  private config: NotificationConfig['email'];
  private isInitialized = false;

  constructor(config: NotificationConfig['email']) {
    this.config = config;
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      if (!this.config.enabled) {
        logger.info('📧 Email provider disabled in configuration');
        return;
      }

      if (!this.config.host || !this.config.user || !this.config.pass) {
        logger.warn('📧 Email provider configuration incomplete');
        return;
      }

      this.transporter = nodemailer.createTransporter({
        host: this.config.host,
        port: this.config.port || 587,
        secure: this.config.secure || false,
        auth: {
          user: this.config.user,
          pass: this.config.pass,
        },
        tls: {
          rejectUnauthorized: false, // For development
        },
      });

      // Verify connection
      await this.transporter.verify();
      this.isInitialized = true;
      
      logger.info('📧 Email provider initialized successfully', {
        host: this.config.host,
        port: this.config.port,
        user: this.config.user
      });
    } catch (error) {
      logger.error('📧 Failed to initialize email provider:', error);
      this.isInitialized = false;
    }
  }

  async sendEmail(
    recipient: string,
    subject: string,
    message: string,
    data?: any
  ): Promise<NotificationResult> {
    const startTime = Date.now();
    
    try {
      if (!this.isConfigured()) {
        throw new ProviderError(
          'Email provider not configured',
          'nodemailer',
          'email',
          recipient
        );
      }

      if (!this.transporter) {
        throw new ProviderError(
          'Email transporter not initialized',
          'nodemailer',
          'email',
          recipient
        );
      }

      const mailOptions = {
        from: {
          name: this.config.fromName || 'Hệ thống Quản lý Bệnh viện',
          address: this.config.from || this.config.user!,
        },
        to: recipient,
        subject: subject,
        html: this.formatEmailContent(message, data),
        text: this.stripHtml(message),
      };

      const result = await this.transporter.sendMail(mailOptions);
      const duration = Date.now() - startTime;

      logger.info('📧 Email sent successfully', {
        recipient,
        subject,
        messageId: result.messageId,
        duration: `${duration}ms`
      });

      return {
        success: true,
        messageId: result.messageId,
        timestamp: new Date().toISOString(),
        type: 'email',
        recipient,
        status: 'sent',
        deliveredAt: new Date().toISOString()
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      logger.error('📧 Failed to send email:', {
        recipient,
        subject,
        error: error.message,
        duration: `${duration}ms`
      });

      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
        type: 'email',
        recipient,
        status: 'failed'
      };
    }
  }

  async sendBulkEmail(
    recipients: string[],
    subject: string,
    message: string,
    data?: any
  ): Promise<BulkNotificationResult> {
    const batchId = `bulk_email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();
    const results: NotificationResult[] = [];
    let totalSent = 0;
    let totalFailed = 0;

    logger.info('📧 Starting bulk email send', {
      batchId,
      recipientCount: recipients.length,
      subject
    });

    // Process emails in batches to avoid overwhelming the SMTP server
    const batchSize = 10;
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      
      const batchPromises = batch.map(recipient => 
        this.sendEmail(recipient, subject, message, data)
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

      // Small delay between batches to be respectful to SMTP server
      if (i + batchSize < recipients.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    const duration = Date.now() - startTime;

    logger.info('📧 Bulk email send completed', {
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
           !!this.transporter &&
           !!this.config.host &&
           !!this.config.user &&
           !!this.config.pass;
  }

  // Helper method to format email content with basic HTML structure
  private formatEmailContent(message: string, data?: any): string {
    // Convert line breaks to HTML
    const htmlMessage = message.replace(/\n/g, '<br>');
    
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Thông báo từ Bệnh viện</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background-color: #2c5aa0;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
        }
        .content {
            background-color: #f9f9f9;
            padding: 30px;
            border-radius: 0 0 8px 8px;
            border: 1px solid #ddd;
        }
        .footer {
            text-align: center;
            margin-top: 20px;
            font-size: 12px;
            color: #666;
        }
        .emoji {
            font-size: 1.2em;
        }
    </style>
</head>
<body>
    <div class="header">
        <h2>🏥 Bệnh viện ABC</h2>
        <p>Hệ thống Quản lý Bệnh viện</p>
    </div>
    <div class="content">
        ${htmlMessage}
    </div>
    <div class="footer">
        <p>Email này được gửi tự động từ hệ thống. Vui lòng không trả lời email này.</p>
        <p>© 2025 Bệnh viện ABC. Tất cả quyền được bảo lưu.</p>
    </div>
</body>
</html>
    `.trim();
  }

  // Helper method to strip HTML tags for plain text version
  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ');
  }

  // Method to test email configuration
  async testConnection(): Promise<boolean> {
    try {
      if (!this.transporter) {
        return false;
      }
      
      await this.transporter.verify();
      return true;
    } catch (error) {
      logger.error('📧 Email connection test failed:', error);
      return false;
    }
  }

  // Method to send test email
  async sendTestEmail(recipient: string): Promise<NotificationResult> {
    return this.sendEmail(
      recipient,
      'Test Email - Hệ thống Quản lý Bệnh viện',
      `
Đây là email test từ hệ thống thông báo.

🕐 Thời gian: ${new Date().toLocaleString('vi-VN')}
✅ Hệ thống email hoạt động bình thường

Nếu bạn nhận được email này, có nghĩa là cấu hình email đã được thiết lập thành công.

Trân trọng,
Hệ thống Quản lý Bệnh viện
      `.trim(),
      { testEmail: true }
    );
  }

  // Method to get provider statistics
  getStats(): any {
    return {
      provider: 'nodemailer',
      configured: this.isConfigured(),
      initialized: this.isInitialized,
      host: this.config.host,
      port: this.config.port,
      secure: this.config.secure,
      enabled: this.config.enabled
    };
  }
}
