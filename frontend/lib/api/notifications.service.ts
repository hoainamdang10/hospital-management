import apiClient from './axios';

export type NotificationStatusFilter = 'read' | 'unread' | 'all';

export interface UserNotification {
  notificationId: string;
  templateType?: string;
  subject: string;
  body: string;
  priority: string;
  status: string;
  channels: string[];
  readAt: string | null;
  createdAt: string;
  sentAt: string | null;
  deliveredAt: string | null;
  healthcareContext?: {
    patientId?: string;
    doctorId?: string;
    appointmentId?: string;
    medicalRecordId?: string;
    invoiceId?: string;
  };
  metadata?: Record<string, unknown>;
}

export interface UserNotificationsResponse {
  success: boolean;
  data: {
    notifications: UserNotification[];
    total: number;
    unreadCount: number;
    hasMore: boolean;
    pagination: {
      limit: number;
      offset: number;
    };
  };
  message?: string;
}

export interface RecentActivity {
  id: string;
  type:
    | 'discharge'
    | 'admission'
    | 'maintenance'
    | 'medication'
    | 'emergency'
    | 'appointment'
    | 'test_result'
    | 'payment';
  title: string;
  description: string;
  time: string;
}

export async function getUserNotifications(
  userId: string,
  params?: {
    limit?: number;
    offset?: number;
    status?: NotificationStatusFilter;
    priority?: string;
    startDate?: string;
    endDate?: string;
  },
): Promise<UserNotificationsResponse> {
  const response = await apiClient.get(`/v1/notifications/user/${userId}`, {
    params,
  });
  return response.data;
}

export async function getUnreadNotificationsCount(userId: string) {
  const response = await apiClient.get(
    `/v1/notifications/user/${userId}/unread-count`,
  );
  return response.data as {
    success: boolean;
    data: { userId: string; unreadCount: number };
  };
}

export async function markNotificationAsRead(
  notificationId: string,
  userId: string,
  isRead: boolean = true,
) {
  const response = await apiClient.patch(
    `/v1/notifications/${notificationId}/read`,
    { userId, isRead },
  );
  return response.data;
}

export function transformNotificationsToActivities(
  notifications: UserNotification[],
): RecentActivity[] {
  return notifications.map((notification) => ({
    id: notification.notificationId,
    type: mapNotificationToActivityType(notification),
    title: notification.subject || 'Th?ng b?o m?i',
    description: extractDescription(notification),
    time: formatTime(notification.createdAt),
  }));
}

function mapNotificationToActivityType(
  notification: UserNotification,
): RecentActivity['type'] {
  const template = notification.templateType?.toUpperCase();
  const typeMap: Record<string, RecentActivity['type']> = {
    APPOINTMENT_REMINDER: 'appointment',
    APPOINTMENT_CONFIRMATION: 'appointment',
    APPOINTMENT_CANCELLED: 'appointment',
    APPOINTMENT_UPDATED: 'appointment',
    TEST_RESULTS_READY: 'test_result',
    BILLING_PAYMENT_COMPLETED: 'payment',
    PAYMENT_REMINDER: 'payment',
    ADMISSION_NOTICE: 'admission',
    DISCHARGE_NOTICE: 'discharge',
    MEDICATION_REMINDER: 'medication',
    EMERGENCY_ALERT: 'emergency',
  };

  if (template && typeMap[template]) {
    return typeMap[template];
  }

  if (notification.healthcareContext?.invoiceId) return 'payment';
  if (notification.healthcareContext?.medicalRecordId) return 'test_result';

  return 'appointment';
}

function extractDescription(notification: UserNotification): string {
  const body = notification.body ?? '';
  if (body.trim().length > 0) {
    const plainText = body.replace(/<[^>]*>/g, '').trim();
    return plainText.length > 100
      ? `${plainText.substring(0, 100)}...`
      : plainText;
  }

  if (notification.healthcareContext?.appointmentId) {
    return 'Th?ng b?o li?n quan ??n l?ch h?n';
  }
  if (notification.healthcareContext?.invoiceId) {
    return 'Th?ng b?o li?n quan ??n thanh to?n';
  }
  if (notification.healthcareContext?.medicalRecordId) {
    return 'Th?ng b?o v? h? s? b?nh ?n';
  }

  return '';
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  const now = Date.now();
  const diffMs = now - date.getTime();

  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 1) return 'V?a xong';
  if (diffMinutes < 60) return `${diffMinutes} ph?t tr??c`;
  if (diffHours < 24) return `${diffHours} gi? tr??c`;
  if (diffDays < 7) return `${diffDays} ng?y tr??c`;

  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export async function getRecentActivities(
  userId: string,
): Promise<RecentActivity[]> {
  try {
    const response = await getUserNotifications(userId, { limit: 10 });
    if (response.success) {
      return transformNotificationsToActivities(response.data.notifications);
    }
    return [];
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    return [];
  }
}
