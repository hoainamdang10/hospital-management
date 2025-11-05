"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  Bell,
  X,
  AlertTriangle,
  Calendar,
  MessageCircle,
  Heart,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { ScrollArea } from "../ui/scroll-area";
import { toast } from "sonner";
import { notificationsServiceAPI } from "../../services/notifications/NotificationsServiceAPI";
import { authService } from "../auth/services";

export type NotificationType =
  | "appointment"
  | "emergency"
  | "chat"
  | "system"
  | "payment";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  urgent?: boolean;
  userId?: string;
  metadata?: Record<string, any>;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (
    notification: Omit<Notification, "id" | "timestamp" | "read">
  ) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Load notifications from API
  useEffect(() => {
    loadNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    const user = authService.getCurrentUser();
    if (!user?.id) return;

    try {
      const response = await notificationsServiceAPI.getAllNotifications({
        userId: user.id,
        limit: 50,
      });
      if (response.success && response.data) {
        const apiNotifications = Array.isArray(response.data)
          ? response.data
          : [response.data];
        setNotifications(
          apiNotifications.map((n) => ({
            id: n.id,
            type: n.type as NotificationType,
            title: n.title,
            message: n.message,
            timestamp: new Date(n.createdAt),
            read: n.read,
            urgent: n.type === "emergency",
            userId: n.userId,
            metadata: n.metadata,
          }))
        );
      }
    } catch (err) {
      console.error("Error loading notifications:", err);
    }
  };

  const addNotification = async (
    notificationData: Omit<Notification, "id" | "timestamp" | "read">
  ) => {
    const user = authService.getCurrentUser();
    if (!user?.id) {
      // Fallback to local-only if not authenticated
      const notification: Notification = {
        ...notificationData,
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date(),
        read: false,
      };
      setNotifications((prev) => [notification, ...prev]);
      return;
    }

    try {
      // Create notification in backend
      const response = await notificationsServiceAPI.createNotification({
        userId: user.id,
        type: notificationData.type,
        title: notificationData.title,
        message: notificationData.message,
        metadata: notificationData.metadata,
      });

      if (response.success && response.data && !Array.isArray(response.data)) {
        const notification: Notification = {
          id: response.data.id,
          type: response.data.type as NotificationType,
          title: response.data.title,
          message: response.data.message,
          timestamp: new Date(response.data.createdAt),
          read: response.data.read,
          urgent: response.data.type === "emergency",
          userId: response.data.userId,
          metadata: response.data.metadata,
        };

        setNotifications((prev) => [notification, ...prev]);

        // Show toast notification
        toast(notification.title, {
          description: notification.message,
          duration: notification.urgent ? 10000 : 5000,
        });

        // Play notification sound for urgent notifications
        if (notification.urgent) {
          try {
            const audio = new Audio("/notification-urgent.mp3");
            audio.play().catch(() => {
              console.log("Unable to play notification sound");
            });
          } catch (error) {
            console.log("Notification sound not available");
          }
        }
      }
    } catch (err) {
      console.error("Error creating notification:", err);
    }
  };

  const markAsRead = async (id: string) => {
    // Update local state immediately
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );

    // Sync with backend
    try {
      await notificationsServiceAPI.markAsRead(id);
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const markAllAsRead = async () => {
    const user = authService.getCurrentUser();
    if (!user?.id) {
      // Fallback to local-only
      setNotifications((prev) =>
        prev.map((notification) => ({ ...notification, read: true }))
      );
      return;
    }

    // Update local state immediately
    setNotifications((prev) =>
      prev.map((notification) => ({ ...notification, read: true }))
    );

    // Sync with backend
    try {
      await notificationsServiceAPI.markAllAsRead(user.id);
    } catch (err) {
      console.error("Error marking all as read:", err);
    }
  };

  const removeNotification = async (id: string) => {
    // Update local state immediately
    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== id)
    );

    // Sync with backend
    try {
      await notificationsServiceAPI.deleteNotification(id);
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  };

  const clearAll = () => {
    setNotifications([]);
    // Note: Backend doesn't have clear all endpoint, so we just clear locally
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        removeNotification,
        clearAll,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
}

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case "appointment":
      return <Calendar className="h-4 w-4 text-blue-500" />;
    case "emergency":
      return <Heart className="h-4 w-4 text-red-500" />;
    case "chat":
      return <MessageCircle className="h-4 w-4 text-green-500" />;
    case "system":
      return <AlertTriangle className="h-4 w-4 text-orange-500" />;
    default:
      return <Bell className="h-4 w-4 text-gray-500" />;
  }
};

export function NotificationDropdown() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
  } = useNotifications();

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Vừa xong";
    if (minutes < 60) return `${minutes} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    return `${days} ngày trước`;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative h-9 w-9 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-80 p-0 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Thông báo
            </h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                >
                  Đánh dấu đã đọc
                </Button>
              )}
              {notifications.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAll}
                  className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  Xóa tất cả
                </Button>
              )}
            </div>
          </div>
        </div>

        <ScrollArea className="h-96">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Không có thông báo nào</p>
            </div>
          ) : (
            <div className="p-2">
              <AnimatePresence>
                {notifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 100 }}
                    className={`p-3 rounded-lg mb-2 border cursor-pointer transition-colors ${
                      notification.read
                        ? "bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600"
                        : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                    } ${
                      notification.urgent
                        ? "ring-2 ring-red-200 dark:ring-red-800"
                        : ""
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-3">
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p
                            className={`text-sm font-medium ${
                              notification.read
                                ? "text-gray-600 dark:text-gray-300"
                                : "text-gray-900 dark:text-white"
                            }`}
                          >
                            {notification.title}
                            {notification.urgent && (
                              <Badge
                                variant="destructive"
                                className="ml-2 text-xs"
                              >
                                Khẩn cấp
                              </Badge>
                            )}
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeNotification(notification.id);
                            }}
                            className="h-6 w-6 p-0 hover:bg-gray-200 dark:hover:bg-gray-600"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                          {formatTime(notification.timestamp)}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
