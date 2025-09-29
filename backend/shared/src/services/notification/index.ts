// Shared Notification Library - Main Export
// Hospital Management System - Phase 2A Implementation

// Main service class
export { NotificationService } from './notification.service';

// Type definitions
export * from './types/notification.types';

// Template utilities
export { 
  AppointmentTemplateRenderer,
  APPOINTMENT_TEMPLATES_VI,
  APPOINTMENT_TEMPLATES_EN,
  NOTIFICATION_TEMPLATES
} from './templates/appointment.templates';

// Provider implementations
export { NodemailerEmailProvider } from './providers/email.provider';
export { TwilioSMSProvider } from './providers/sms.provider';
export { FirebasePushProvider } from './providers/push.provider';

// Convenience function to get singleton instance
export const getNotificationService = () => {
  return NotificationService.getInstance();
};

// Helper functions for common notification patterns
export const sendAppointmentReminder = async (data: any) => {
  const service = NotificationService.getInstance();
  return await service.sendAppointmentReminder(data);
};

export const sendAppointmentNotification = async (type: 'created' | 'updated' | 'cancelled', data: any) => {
  const service = NotificationService.getInstance();
  
  switch (type) {
    case 'created':
      return await service.sendAppointmentCreated(data);
    case 'updated':
      return await service.sendAppointmentUpdated(data);
    case 'cancelled':
      return await service.sendAppointmentCancelled(data);
    default:
      throw new Error(`Unsupported appointment notification type: ${type}`);
  }
};

export const sendQuickNotification = async (
  type: 'email' | 'sms' | 'push',
  recipient: string,
  subject: string,
  message: string,
  data?: any
) => {
  const service = NotificationService.getInstance();
  
  switch (type) {
    case 'email':
      return await service.sendEmail(recipient, subject, message, data);
    case 'sms':
      return await service.sendSMS(recipient, message, data);
    case 'push':
      return await service.sendPush(recipient, subject, message, data);
    default:
      throw new Error(`Unsupported notification type: ${type}`);
  }
};

// Configuration helper
export const configureNotificationService = (config: any) => {
  const service = NotificationService.getInstance();
  service.updateConfig(config);
  return service;
};

// Health check helper
export const checkNotificationServiceHealth = () => {
  const service = NotificationService.getInstance();
  return {
    isConfigured: service.isConfigured(),
    stats: service.getServiceStats(),
    timestamp: new Date().toISOString()
  };
};

// Validation helpers
export const validateVietnamesePhoneNumber = (phoneNumber: string): boolean => {
  return TwilioSMSProvider.isValidVietnamesePhoneNumber(phoneNumber);
};

export const validateFCMToken = (token: string): boolean => {
  return FirebasePushProvider.isValidFCMToken(token);
};

// Default export for convenience
export default NotificationService;
