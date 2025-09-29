// Main Notification Service - Singleton Pattern
// Hospital Management System - Shared Notification Library

import logger from '../../utils/logger';
import { 
  NotificationService as INotificationService,
  NotificationRequest,
  NotificationResult,
  BulkNotificationRequest,
  BulkNotificationResult,
  NotificationConfig,
  AppointmentReminderData,
  AppointmentNotificationData,
  TemplateData,
  NotificationError,
  ConfigurationError
} from './types/notification.types';

import { NodemailerEmailProvider } from './providers/email.provider';
import { TwilioSMSProvider } from './providers/sms.provider';
import { FirebasePushProvider } from './providers/push.provider';
import { AppointmentTemplateRenderer } from './templates/appointment.templates';

export class NotificationService implements INotificationService {
  private static instance: NotificationService;
  private config: NotificationConfig;
  private emailProvider: NodemailerEmailProvider | null = null;
  private smsProvider: TwilioSMSProvider | null = null;
  private pushProvider: FirebasePushProvider | null = null;
  private isInitialized = false;

  private constructor() {
    // Private constructor for singleton pattern
    this.config = this.getDefaultConfig();
    this.initialize();
  }

  // Singleton getInstance method
  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private async initialize(): Promise<void> {
    try {
      logger.info('🔔 Initializing Notification Service...');

      // Load configuration from environment variables
      this.loadConfigFromEnvironment();

      // Initialize providers
      if (this.config.email.enabled) {
        this.emailProvider = new NodemailerEmailProvider(this.config.email);
      }

      if (this.config.sms.enabled) {
        this.smsProvider = new TwilioSMSProvider(this.config.sms);
      }

      if (this.config.push.enabled) {
        this.pushProvider = new FirebasePushProvider(this.config.push);
      }

      this.isInitialized = true;
      
      logger.info('🔔 Notification Service initialized successfully', {
        emailEnabled: this.config.email.enabled,
        smsEnabled: this.config.sms.enabled,
        pushEnabled: this.config.push.enabled
      });
    } catch (error) {
      logger.error('🔔 Failed to initialize Notification Service:', error);
      this.isInitialized = false;
    }
  }

  // Main send method - unified interface
  async send(request: NotificationRequest): Promise<NotificationResult> {
    try {
      if (!this.isInitialized) {
        throw new NotificationError(
          'Notification service not initialized',
          'NOT_INITIALIZED',
          request.type
        );
      }

      const recipient = typeof request.recipient === 'string' 
        ? request.recipient 
        : this.extractRecipientByType(request.recipient, request.type);

      switch (request.type) {
        case 'email':
          return await this.sendEmail(recipient, request.subject || '', request.message, request.data);
        
        case 'sms':
          return await this.sendSMS(recipient, request.message, request.data);
        
        case 'push':
          return await this.sendPush(recipient, request.subject || 'Thông báo', request.message, request.data);
        
        case 'appointment_reminder':
          if (!request.data) {
            throw new NotificationError('Appointment reminder data is required', 'MISSING_DATA', request.type);
          }
          return await this.sendAppointmentReminder(request.data);
        
        case 'appointment_created':
          if (!request.data) {
            throw new NotificationError('Appointment data is required', 'MISSING_DATA', request.type);
          }
          return await this.sendAppointmentCreated(request.data);
        
        case 'appointment_updated':
          if (!request.data) {
            throw new NotificationError('Appointment data is required', 'MISSING_DATA', request.type);
          }
          return await this.sendAppointmentUpdated(request.data);
        
        case 'appointment_cancelled':
          if (!request.data) {
            throw new NotificationError('Appointment data is required', 'MISSING_DATA', request.type);
          }
          return await this.sendAppointmentCancelled(request.data);
        
        default:
          throw new NotificationError(
            `Unsupported notification type: ${request.type}`,
            'UNSUPPORTED_TYPE',
            request.type
          );
      }
    } catch (error: any) {
      logger.error('🔔 Failed to send notification:', error);
      
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
        type: request.type,
        recipient: typeof request.recipient === 'string' ? request.recipient : 'unknown',
        status: 'failed'
      };
    }
  }

  // Email notifications
  async sendEmail(recipient: string, subject: string, message: string, data?: any): Promise<NotificationResult> {
    if (!this.emailProvider || !this.emailProvider.isConfigured()) {
      throw new NotificationError('Email provider not configured', 'PROVIDER_NOT_CONFIGURED', 'email', recipient);
    }

    return await this.emailProvider.sendEmail(recipient, subject, message, data);
  }

  // SMS notifications
  async sendSMS(recipient: string, message: string, data?: any): Promise<NotificationResult> {
    if (!this.smsProvider || !this.smsProvider.isConfigured()) {
      throw new NotificationError('SMS provider not configured', 'PROVIDER_NOT_CONFIGURED', 'sms', recipient);
    }

    return await this.smsProvider.sendSMS(recipient, message, data);
  }

  // Push notifications
  async sendPush(recipient: string, title: string, message: string, data?: any): Promise<NotificationResult> {
    if (!this.pushProvider || !this.pushProvider.isConfigured()) {
      throw new NotificationError('Push provider not configured', 'PROVIDER_NOT_CONFIGURED', 'push', recipient);
    }

    return await this.pushProvider.sendPush(recipient, title, message, data);
  }

  // Bulk notifications
  async sendBulk(request: BulkNotificationRequest): Promise<BulkNotificationResult> {
    const batchId = `bulk_${request.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const results: NotificationResult[] = [];
    let totalSent = 0;
    let totalFailed = 0;

    logger.info('🔔 Starting bulk notification send', {
      batchId,
      type: request.type,
      recipientCount: request.recipients.length
    });

    const batchSize = request.batchSize || 10;
    
    for (let i = 0; i < request.recipients.length; i += batchSize) {
      const batch = request.recipients.slice(i, i + batchSize);
      
      const batchPromises = batch.map(recipient => {
        const individualRequest: NotificationRequest = {
          type: request.type,
          recipient,
          subject: request.subject,
          message: request.message,
          data: request.data,
          template: request.template,
          priority: request.priority
        };
        
        return this.send(individualRequest);
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      batchResults.forEach(result => {
        if (result.success) {
          totalSent++;
        } else {
          totalFailed++;
        }
      });

      // Small delay between batches
      if (i + batchSize < request.recipients.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    logger.info('🔔 Bulk notification send completed', {
      batchId,
      totalSent,
      totalFailed
    });

    return {
      totalSent,
      totalFailed,
      results,
      batchId,
      timestamp: new Date().toISOString()
    };
  }

  // Appointment-specific notifications
  async sendAppointmentReminder(data: AppointmentReminderData): Promise<NotificationResult> {
    const template = AppointmentTemplateRenderer.renderReminderTemplate(data, 'vi');
    
    return await this.sendEmail(
      data.patientEmail,
      template.subject,
      template.content,
      { ...data, type: 'appointment_reminder' }
    );
  }

  async sendAppointmentCreated(data: AppointmentNotificationData): Promise<NotificationResult> {
    const template = AppointmentTemplateRenderer.renderAppointmentTemplate('created', data, 'vi');
    
    // Try to get patient email from data or fetch from database
    const patientEmail = await this.getPatientEmail(data.patientId);
    
    return await this.sendEmail(
      patientEmail,
      template.subject,
      template.content,
      { ...data, type: 'appointment_created' }
    );
  }

  async sendAppointmentUpdated(data: AppointmentNotificationData): Promise<NotificationResult> {
    const template = AppointmentTemplateRenderer.renderAppointmentTemplate('updated', data, 'vi');
    
    const patientEmail = await this.getPatientEmail(data.patientId);
    
    return await this.sendEmail(
      patientEmail,
      template.subject,
      template.content,
      { ...data, type: 'appointment_updated' }
    );
  }

  async sendAppointmentCancelled(data: AppointmentNotificationData): Promise<NotificationResult> {
    const template = AppointmentTemplateRenderer.renderAppointmentTemplate('cancelled', data, 'vi');
    
    const patientEmail = await this.getPatientEmail(data.patientId);
    
    return await this.sendEmail(
      patientEmail,
      template.subject,
      template.content,
      { ...data, type: 'appointment_cancelled' }
    );
  }

  // Template rendering
  async renderTemplate(templateId: string, data: TemplateData, language: 'vi' | 'en' = 'vi'): Promise<string> {
    // This would typically load templates from database or file system
    // For now, using the appointment templates
    throw new NotificationError('Template rendering not implemented', 'NOT_IMPLEMENTED', 'system_alert');
  }

  // Configuration methods
  isConfigured(): boolean {
    return this.isInitialized && (
      (this.emailProvider?.isConfigured() ?? false) ||
      (this.smsProvider?.isConfigured() ?? false) ||
      (this.pushProvider?.isConfigured() ?? false)
    );
  }

  getConfig(): NotificationConfig {
    return { ...this.config };
  }

  updateConfig(config: Partial<NotificationConfig>): void {
    this.config = { ...this.config, ...config };
    // Re-initialize providers with new config
    this.initialize();
  }

  // Helper methods
  private extractRecipientByType(recipient: any, type: string): string {
    switch (type) {
      case 'email':
        return recipient.email || '';
      case 'sms':
        return recipient.phone || '';
      case 'push':
        return recipient.deviceToken || '';
      default:
        return recipient.email || recipient.phone || recipient.deviceToken || '';
    }
  }

  private async getPatientEmail(patientId: string): Promise<string> {
    // This would typically fetch from database
    // For now, return a placeholder
    return `patient-${patientId}@example.com`;
  }

  private getDefaultConfig(): NotificationConfig {
    return {
      email: {
        enabled: false,
        provider: 'nodemailer',
        host: '',
        port: 587,
        secure: false,
        user: '',
        pass: '',
        from: '',
        fromName: 'Hệ thống Quản lý Bệnh viện'
      },
      sms: {
        enabled: false,
        provider: 'twilio',
        accountSid: '',
        authToken: '',
        fromNumber: ''
      },
      push: {
        enabled: false,
        provider: 'firebase',
        serverKey: '',
        appId: ''
      },
      templates: {
        defaultLanguage: 'vi',
        fallbackToDefault: true
      },
      retry: {
        maxAttempts: 3,
        backoffMultiplier: 2,
        initialDelay: 1000
      },
      rateLimit: {
        enabled: true,
        windowMs: 60000,
        maxRequests: 100
      }
    };
  }

  private loadConfigFromEnvironment(): void {
    // Load email configuration
    this.config.email = {
      enabled: process.env.EMAIL_ENABLED === 'true',
      provider: 'nodemailer',
      host: process.env.SMTP_HOST || '',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
      from: process.env.SMTP_FROM || process.env.SMTP_USER || '',
      fromName: process.env.SMTP_FROM_NAME || 'Hệ thống Quản lý Bệnh viện'
    };

    // Load SMS configuration
    this.config.sms = {
      enabled: process.env.SMS_ENABLED === 'true',
      provider: 'twilio',
      accountSid: process.env.TWILIO_ACCOUNT_SID || '',
      authToken: process.env.TWILIO_AUTH_TOKEN || '',
      fromNumber: process.env.TWILIO_FROM_NUMBER || ''
    };

    // Load push configuration
    this.config.push = {
      enabled: process.env.PUSH_ENABLED === 'true',
      provider: 'firebase',
      serverKey: process.env.FIREBASE_SERVER_KEY || '',
      appId: process.env.FIREBASE_APP_ID || ''
    };
  }

  // Service statistics and health check
  getServiceStats(): any {
    return {
      initialized: this.isInitialized,
      configured: this.isConfigured(),
      providers: {
        email: this.emailProvider?.getStats() || null,
        sms: this.smsProvider?.getStats() || null,
        push: this.pushProvider?.getStats() || null
      },
      config: {
        emailEnabled: this.config.email.enabled,
        smsEnabled: this.config.sms.enabled,
        pushEnabled: this.config.push.enabled
      }
    };
  }
}
