/**
 * Notifications Service
 * API service for fetching notifications and recent activities
 */

import apiClient from './client';

export interface Notification {
  id: string;
  recipientId: string;
  recipientType: string;
  templateType: string;
  status: string;
  priority: string;
  channels: string[];
  content: {
    subject?: string;
    body?: string;
  };
  metadata?: {
    healthcareContext?: {
      patientId?: string;
      appointmentId?: string;
      medicalRecordId?: string;
      doctorId?: string;
    };
    tags?: string[];
  };
  createdAt: string;
  sentAt?: string;
  deliveredAt?: string;
}

export interface NotificationsResponse {
  success: boolean;
  data: {
    notifications: Notification[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
  message?: string;
}

export interface RecentActivity {
  id: string;
  type: 'discharge' | 'admission' | 'maintenance' | 'medication' | 'emergency' | 'appointment' | 'test_result' | 'payment';
  title: string;
  description: string;
  time: string;
}

/**
 * Get notifications for a patient
 */
export async function getPatientNotifications(
  patientId: string,
  limit: number = 10
): Promise<NotificationsResponse> {
  const response = await apiClient.get(`/api/v1/notifications/patient/${patientId}`, {
    params: { limit, sortBy: 'createdAt', sortOrder: 'DESC' }
  });
  return response.data;
}

/**
 * Transform notifications to recent activities
 */
export function transformNotificationsToActivities(notifications: Notification[]): RecentActivity[] {
  return notifications.map(notification => {
    const activity: RecentActivity = {
      id: notification.id,
      type: mapTemplateTypeToActivityType(notification.templateType),
      title: notification.content.subject || 'Thông báo mới',
      description: extractDescription(notification),
      time: formatTime(notification.createdAt),
    };
    return activity;
  });
}

/**
 * Map notification template type to activity type
 */
function mapTemplateTypeToActivityType(templateType: string): RecentActivity['type'] {
  const typeMap: Record<string, RecentActivity['type']> = {
    'APPOINTMENT_REMINDER': 'appointment',
    'APPOINTMENT_CONFIRMED': 'appointment',
    'APPOINTMENT_CANCELLED': 'appointment',
    'TEST_RESULTS_READY': 'test_result',
    'PAYMENT_REMINDER': 'payment',
    'PAYMENT_CONFIRMED': 'payment',
    'ADMISSION_NOTICE': 'admission',
    'DISCHARGE_NOTICE': 'discharge',
    'MEDICATION_REMINDER': 'medication',
    'EMERGENCY_ALERT': 'emergency',
  };
  
  return typeMap[templateType] || 'appointment';
}

/**
 * Extract description from notification
 */
function extractDescription(notification: Notification): string {
  // Try to get description from body
  if (notification.content.body) {
    // Remove HTML tags and get first 100 characters
    const plainText = notification.content.body.replace(/<[^>]*>/g, '');
    return plainText.length > 100 ? plainText.substring(0, 100) + '...' : plainText;
  }
  
  // Fallback to metadata
  if (notification.metadata?.healthcareContext) {
    const context = notification.metadata.healthcareContext;
    if (context.appointmentId) return 'Liên quan đến lịch hẹn';
    if (context.medicalRecordId) return 'Liên quan đến hồ sơ bệnh án';
  }
  
  return '';
}

/**
 * Format time to relative time
 */
function formatTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Vừa xong';
  if (diffMins < 60) return `${diffMins} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays < 7) return `${diffDays} ngày trước`;
  
  // Format as time
  return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Get recent activities for patient dashboard
 */
export async function getRecentActivities(patientId: string): Promise<RecentActivity[]> {
  try {
    const response = await getPatientNotifications(patientId, 10);
    
    if (response.success && response.data.notifications) {
      return transformNotificationsToActivities(response.data.notifications);
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    return [];
  }
}
