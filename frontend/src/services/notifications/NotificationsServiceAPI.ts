import { apiClient } from "../api/client";

export interface Notification {
  id: string;
  userId: string;
  type:
    | "appointment"
    | "emergency"
    | "chat"
    | "system"
    | "payment"
    | "billing"
    | "medical";
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  metadata?: Record<string, any>;
}

export interface NotificationResponse {
  success: boolean;
  data?: Notification | Notification[];
  message?: string;
  error?: string;
}

export class NotificationsServiceAPI {
  private static instance: NotificationsServiceAPI;
  private baseUrl: string = "/notifications-service/api/v1/notifications";

  private constructor() {}

  public static getInstance(): NotificationsServiceAPI {
    if (!NotificationsServiceAPI.instance) {
      NotificationsServiceAPI.instance = new NotificationsServiceAPI();
    }
    return NotificationsServiceAPI.instance;
  }

  async getAllNotifications(params?: {
    userId?: string;
    type?: string;
    read?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<NotificationResponse> {
    let url = this.baseUrl;
    if (params) {
      const queryParams = new URLSearchParams();
      if (params.userId) queryParams.append("userId", params.userId);
      if (params.type) queryParams.append("type", params.type);
      if (params.read !== undefined)
        queryParams.append("read", String(params.read));
      if (params.limit) queryParams.append("limit", String(params.limit));
      if (params.offset) queryParams.append("offset", String(params.offset));
      const queryString = queryParams.toString();
      if (queryString) url += `?${queryString}`;
    }
    const response = await apiClient.get<Notification[]>(url);
    return {
      success: response.success,
      data: response.data,
      message: response.message,
      error: response.error,
    };
  }

  async getNotificationById(id: string): Promise<NotificationResponse> {
    const response = await apiClient.get<Notification>(`${this.baseUrl}/${id}`);
    return {
      success: response.success,
      data: response.data,
      message: response.message,
      error: response.error,
    };
  }

  async createNotification(
    notification: Omit<Notification, "id" | "createdAt" | "read">
  ): Promise<NotificationResponse> {
    const response = await apiClient.post<Notification>(
      this.baseUrl,
      notification
    );
    return {
      success: response.success,
      data: response.data,
      message: response.message,
      error: response.error,
    };
  }

  async markAsRead(notificationId: string): Promise<NotificationResponse> {
    const response = await apiClient.patch<Notification>(
      `${this.baseUrl}/${notificationId}/read`
    );
    return {
      success: response.success,
      data: response.data,
      message: response.message,
      error: response.error,
    };
  }

  async markAllAsRead(userId: string): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> {
    const response = await apiClient.patch(`${this.baseUrl}/read-all`, {
      userId,
    });
    return {
      success: response.success,
      message: response.message,
      error: response.error,
    };
  }

  async deleteNotification(id: string): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> {
    const response = await apiClient.delete(`${this.baseUrl}/${id}`);
    return {
      success: response.success,
      message: response.message,
      error: response.error,
    };
  }
}

export const notificationsServiceAPI = NotificationsServiceAPI.getInstance();
