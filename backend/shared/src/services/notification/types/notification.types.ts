// Shared Notification Library Types
// Hospital Management System - Phase 2A Implementation

// =====================================================
// CORE NOTIFICATION TYPES
// =====================================================

export type NotificationType = 
  | 'email' 
  | 'sms' 
  | 'push' 
  | 'appointment_reminder'
  | 'appointment_created'
  | 'appointment_updated'
  | 'appointment_cancelled'
  | 'medical_record_created'
  | 'medical_record_updated'
  | 'critical_result'
  | 'system_alert';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'critical';

export type NotificationStatus = 'pending' | 'sent' | 'delivered' | 'failed' | 'retry';

// =====================================================
// NOTIFICATION REQUEST INTERFACES
// =====================================================

export interface NotificationRecipient {
  id: string;
  type: 'patient' | 'doctor' | 'receptionist' | 'admin';
  email?: string;
  phone?: string;
  deviceToken?: string;
  preferredLanguage?: 'vi' | 'en';
}

export interface NotificationRequest {
  type: NotificationType;
  recipient: string | NotificationRecipient;
  subject?: string;
  message: string;
  data?: Record<string, any>;
  template?: string;
  priority?: NotificationPriority;
  scheduledAt?: Date;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

export interface BulkNotificationRequest {
  type: NotificationType;
  recipients: (string | NotificationRecipient)[];
  subject?: string;
  message: string;
  data?: Record<string, any>;
  template?: string;
  priority?: NotificationPriority;
  scheduledAt?: Date;
  batchSize?: number;
}

// =====================================================
// NOTIFICATION RESPONSE INTERFACES
// =====================================================

export interface NotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
  timestamp: string;
  type: NotificationType;
  recipient: string;
  status: NotificationStatus;
  retryCount?: number;
  deliveredAt?: string;
}

export interface BulkNotificationResult {
  totalSent: number;
  totalFailed: number;
  results: NotificationResult[];
  batchId: string;
  timestamp: string;
}

// =====================================================
// PROVIDER INTERFACES
// =====================================================

export interface EmailProvider {
  sendEmail(
    recipient: string,
    subject: string,
    message: string,
    data?: any
  ): Promise<NotificationResult>;
  
  sendBulkEmail(
    recipients: string[],
    subject: string,
    message: string,
    data?: any
  ): Promise<BulkNotificationResult>;
  
  isConfigured(): boolean;
}

export interface SMSProvider {
  sendSMS(
    recipient: string,
    message: string,
    data?: any
  ): Promise<NotificationResult>;
  
  sendBulkSMS(
    recipients: string[],
    message: string,
    data?: any
  ): Promise<BulkNotificationResult>;
  
  isConfigured(): boolean;
}

export interface PushProvider {
  sendPush(
    recipient: string,
    title: string,
    message: string,
    data?: any
  ): Promise<NotificationResult>;
  
  sendBulkPush(
    recipients: string[],
    title: string,
    message: string,
    data?: any
  ): Promise<BulkNotificationResult>;
  
  isConfigured(): boolean;
}

// =====================================================
// TEMPLATE INTERFACES
// =====================================================

export interface NotificationTemplate {
  id: string;
  name: string;
  type: NotificationType;
  language: 'vi' | 'en';
  subject?: string;
  content: string;
  variables: string[];
  isActive: boolean;
}

export interface TemplateData {
  [key: string]: any;
}

export interface AppointmentReminderData {
  appointmentId: string;
  patientName: string;
  patientEmail: string;
  doctorName: string;
  appointmentDate: string;
  appointmentTime: string;
  department?: string;
  location?: string;
  reminderType: '24h' | '2h' | '30m';
}

export interface AppointmentNotificationData {
  appointmentId: string;
  patientId: string;
  doctorId: string;
  patientName: string;
  doctorName: string;
  appointmentDate: string;
  appointmentTime: string;
  department?: string;
  location?: string;
  status: string;
  changes?: string[];
  reason?: string;
}

// =====================================================
// CONFIGURATION INTERFACES
// =====================================================

export interface NotificationConfig {
  email: {
    enabled: boolean;
    provider: 'nodemailer' | 'sendgrid' | 'ses';
    host?: string;
    port?: number;
    secure?: boolean;
    user?: string;
    pass?: string;
    from?: string;
    fromName?: string;
  };
  sms: {
    enabled: boolean;
    provider: 'twilio' | 'aws-sns';
    accountSid?: string;
    authToken?: string;
    fromNumber?: string;
  };
  push: {
    enabled: boolean;
    provider: 'firebase' | 'onesignal';
    serverKey?: string;
    appId?: string;
  };
  templates: {
    defaultLanguage: 'vi' | 'en';
    fallbackToDefault: boolean;
  };
  retry: {
    maxAttempts: number;
    backoffMultiplier: number;
    initialDelay: number;
  };
  rateLimit: {
    enabled: boolean;
    windowMs: number;
    maxRequests: number;
  };
}

// =====================================================
// SERVICE INTERFACES
// =====================================================

export interface NotificationService {
  // Single notifications
  send(request: NotificationRequest): Promise<NotificationResult>;
  sendEmail(recipient: string, subject: string, message: string, data?: any): Promise<NotificationResult>;
  sendSMS(recipient: string, message: string, data?: any): Promise<NotificationResult>;
  sendPush(recipient: string, title: string, message: string, data?: any): Promise<NotificationResult>;
  
  // Bulk notifications
  sendBulk(request: BulkNotificationRequest): Promise<BulkNotificationResult>;
  
  // Appointment-specific notifications
  sendAppointmentReminder(data: AppointmentReminderData): Promise<NotificationResult>;
  sendAppointmentCreated(data: AppointmentNotificationData): Promise<NotificationResult>;
  sendAppointmentUpdated(data: AppointmentNotificationData): Promise<NotificationResult>;
  sendAppointmentCancelled(data: AppointmentNotificationData): Promise<NotificationResult>;
  
  // Template management
  renderTemplate(templateId: string, data: TemplateData, language?: 'vi' | 'en'): Promise<string>;
  
  // Configuration
  isConfigured(): boolean;
  getConfig(): NotificationConfig;
  updateConfig(config: Partial<NotificationConfig>): void;
}

// =====================================================
// ERROR TYPES
// =====================================================

export class NotificationError extends Error {
  constructor(
    message: string,
    public code: string,
    public type: NotificationType,
    public recipient?: string
  ) {
    super(message);
    this.name = 'NotificationError';
  }
}

export class ProviderError extends NotificationError {
  constructor(
    message: string,
    public provider: string,
    type: NotificationType,
    recipient?: string
  ) {
    super(message, 'PROVIDER_ERROR', type, recipient);
    this.name = 'ProviderError';
  }
}

export class TemplateError extends NotificationError {
  constructor(
    message: string,
    public templateId: string,
    type: NotificationType
  ) {
    super(message, 'TEMPLATE_ERROR', type);
    this.name = 'TemplateError';
  }
}

export class ConfigurationError extends NotificationError {
  constructor(message: string, public configKey: string) {
    super(message, 'CONFIG_ERROR', 'system_alert');
    this.name = 'ConfigurationError';
  }
}
