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
  recipientKey?: string;
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
  }
): Promise<UserNotificationsResponse> {
  const response = await apiClient.get(`/v1/notifications/user/${userId}`, {
    params,
  });
  return response.data;
}

export async function getUnreadNotificationsCount(userId: string) {
  const response = await apiClient.get(`/v1/notifications/user/${userId}/unread-count`);
  return response.data as {
    success: boolean;
    data: { userId: string; unreadCount: number };
  };
}

export async function markNotificationAsRead(
  notificationId: string,
  userId: string,
  isRead: boolean = true
) {
  const response = await apiClient.patch(`/v1/notifications/${notificationId}/read`, {
    userId,
    isRead,
  });
  return response.data;
}

export function transformNotificationsToActivities(
  notifications: UserNotification[]
): RecentActivity[] {
  return notifications.map((notification) => ({
    id: notification.notificationId,
    type: mapNotificationToActivityType(notification),
    title: formatNotificationPreview(notification).title,
    description: formatNotificationPreview(notification).description,
    time: formatTime(notification.createdAt),
  }));
}

export interface NotificationPreview {
  title: string;
  description: string;
}

const formatCurrency = (value?: number | null): string | null => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return null;
  }
  return `${value.toLocaleString('vi-VN')} đ`;
};

type AppointmentNotificationPayload = {
  patientName?: string;
  doctorName?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  newAppointmentDate?: string;
  newAppointmentTime?: string;
  oldAppointmentDate?: string;
  oldAppointmentTime?: string;
  reason?: string;
  cancellationReason?: string;
};

export function formatNotificationPreview(notification: UserNotification): NotificationPreview {
  const template = (notification.templateType || notification.subject || '').toUpperCase();
  const payload = parseStructuredBody(notification.body);
  const fallbackDescription = extractDescription(notification);
  const metadata = notification.metadata || {};
  const invoiceId =
    notification.healthcareContext?.invoiceId || (metadata.invoiceId as string | undefined);
  const amount =
    (metadata.amount as number | undefined) ??
    (metadata.totalAmount as number | undefined) ??
    (payload as any)?.amount;
  const dueDate =
    (metadata.dueDate as string | undefined) ||
    (payload as any)?.dueDate ||
    (metadata.due_at as string | undefined);

  switch (template) {
    case 'PAYMENT_COMPLETED': {
      const amountText = formatCurrency(amount);
      return {
        title: 'Thanh toán thành công',
        description: amountText
          ? `Bạn đã thanh toán ${amountText} cho lịch hẹn/hoá đơn này.`
          : fallbackDescription || 'Thanh toán đã được xử lý thành công.',
      };
    }
    case 'PAYMENT_REMINDER': {
      const amountText = formatCurrency(amount);
      const dueText = dueDate
        ? new Date(dueDate).toLocaleString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        : null;
      return {
        title: 'Nhắc nhở thanh toán',
        description:
          amountText && dueText
            ? `Vui lòng thanh toán ${amountText} trước ${dueText}.`
            : fallbackDescription || 'Hóa đơn của bạn sắp tới hạn.',
      };
    }
    case 'REFUND_PROCESSED': {
      const amountText = formatCurrency(amount || (metadata.refundAmount as number | undefined));
      return {
        title: 'Hoàn tiền đã được xử lý',
        description:
          amountText || fallbackDescription
            ? `${amountText || ''} ${fallbackDescription || ''}`.trim()
            : 'Khoản hoàn tiền đã được chuyển về phương thức thanh toán ban đầu.',
      };
    }
    case 'APPOINTMENT_CONFIRMED': {
      const dateText = formatAppointmentDate(payload?.appointmentDate, payload?.appointmentTime);
      return {
        title: 'Lịch hẹn đã được xác nhận',
        description: dateText
          ? `Bác sĩ ${payload?.doctorName || 'phụ trách'} sẽ khám vào ${dateText}.`
          : fallbackDescription,
      };
    }
    case 'APPOINTMENT_SCHEDULED': {
      const dateText = formatAppointmentDate(payload?.appointmentDate, payload?.appointmentTime);
      return {
        title: 'Bạn đã đặt lịch thành công',
        description: dateText
          ? `Lịch hẹn với ${payload?.doctorName || 'bác sĩ'} vào ${dateText}.`
          : fallbackDescription,
      };
    }
    case 'APPOINTMENT_RESCHEDULED': {
      const newDate = formatAppointmentDate(
        payload?.newAppointmentDate,
        payload?.newAppointmentTime
      );
      const oldDate = formatAppointmentDate(
        payload?.appointmentDate || payload?.oldAppointmentDate,
        payload?.appointmentTime || payload?.oldAppointmentTime
      );
      return {
        title: 'Lịch hẹn đã được dời',
        description:
          newDate && oldDate
            ? `Từ ${oldDate} sang ${newDate}.`
            : newDate
              ? `Thời gian mới: ${newDate}.`
              : fallbackDescription,
      };
    }
    case 'APPOINTMENT_CANCELLED': {
      return {
        title: 'Lịch hẹn đã bị hủy',
        description:
          payload?.reason ||
          payload?.cancellationReason ||
          fallbackDescription ||
          'Vui lòng đặt lịch lại nếu cần.',
      };
    }
    default:
      if (invoiceId) {
        const amountText =
          formatCurrency(amount) ||
          formatCurrency(metadata.patientResponsibility as number | undefined);
        return {
          title: notification.subject || 'Hóa đơn mới',
          description: amountText
            ? `Hóa đơn ${invoiceId} có số tiền ${amountText}.`
            : fallbackDescription || 'Vui lòng kiểm tra chi tiết hóa đơn.',
        };
      }
      return {
        title: notification.subject || 'Thông báo mới',
        description: fallbackDescription,
      };
  }
}

function mapNotificationToActivityType(notification: UserNotification): RecentActivity['type'] {
  const template = notification.templateType?.toUpperCase();
  const typeMap: Record<string, RecentActivity['type']> = {
    APPOINTMENT_REMINDER: 'appointment',
    APPOINTMENT_CONFIRMATION: 'appointment',
    APPOINTMENT_CANCELLED: 'appointment',
    APPOINTMENT_UPDATED: 'appointment',
    APPOINTMENT_RESCHEDULED: 'appointment',
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
    return plainText.length > 100 ? `${plainText.substring(0, 100)}...` : plainText;
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

export async function getRecentActivities(userId: string): Promise<RecentActivity[]> {
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

function parseStructuredBody(body?: string | null): AppointmentNotificationPayload | null {
  if (!body) return null;
  const trimmed = body.trim();
  if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) {
    return null;
  }
  try {
    return JSON.parse(trimmed) as AppointmentNotificationPayload;
  } catch {
    return null;
  }
}

function formatAppointmentDate(date?: string, time?: string): string | null {
  if (!date) return null;
  const isoString = time ? `${date}T${time}` : `${date}T00:00:00`;
  const parsed = new Date(isoString);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toLocaleString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
