'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { toast } from 'sonner';

import {
  getUserNotifications,
  markNotificationAsRead,
  type NotificationStatusFilter,
  type UserNotification,
} from '@/lib/api/notifications.service';
import { supabase, isSupabaseConfigured } from '@/lib/supabase-client';
import { useAuth } from './useAuth';
import { usePatient } from './usePatient';

interface UseNotificationsState {
  notifications: UserNotification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refresh: () => Promise<void>;
  filter: NotificationStatusFilter;
  setFilter: (filter: NotificationStatusFilter) => void;
}

type NotificationContextValue = UseNotificationsState;

const NotificationContext = createContext<NotificationContextValue | null>(null);

const buildUnreadCacheKey = (recipientId: string) => `hmv2:notifications:unread:${recipientId}`;

const getPlainText = (value?: string | null) => (value ? value.replace(/<[^>]*>/g, '').trim() : '');

export function NotificationProvider({ children }: { children: ReactNode }) {
  const value = useProvideNotifications();
  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications(): NotificationContextValue {
  const context = useContext(NotificationContext);
  if (context) {
    return context;
  }
  return useProvideNotifications();
}

function useProvideNotifications(): NotificationContextValue {
  const { user } = useAuth();
  const { patient, patientId, internalId } = usePatient();

  const recipientIds = useMemo(() => {
    const ids = new Set<string>();
    if (internalId) ids.add(internalId);
    if (patient?.id) ids.add(patient.id);
    if (patientId) ids.add(patientId);
    if (user?.patientId) ids.add(user.patientId);
    if (user?.userId) ids.add(user.userId);
    if (user?.id) ids.add(user.id);
    return Array.from(ids);
  }, [internalId, patient?.id, patientId, user?.patientId, user?.userId, user?.id]);

  const primaryRecipientId = recipientIds[0] || null;

  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<NotificationStatusFilter>('all');

  const persistUnreadCount = useCallback(
    (value: number) => {
      if (!primaryRecipientId || typeof window === 'undefined') {
        return;
      }
      try {
        window.localStorage.setItem(buildUnreadCacheKey(primaryRecipientId), String(value));
      } catch {
        // Ignore quota errors
      }
    },
    [primaryRecipientId]
  );

  useEffect(() => {
    if (!primaryRecipientId || typeof window === 'undefined') {
      return;
    }
    try {
      const cached = window.localStorage.getItem(buildUnreadCacheKey(primaryRecipientId));
      if (cached !== null) {
        const parsed = Number.parseInt(cached, 10);
        if (!Number.isNaN(parsed)) {
          setUnreadCount(parsed);
        }
      }
    } catch {
      // Ignore malformed cache
    }
  }, [primaryRecipientId]);

  const fetchNotifications = useCallback(async () => {
    if (!recipientIds.length) {
      setNotifications([]);
      setUnreadCount(0);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const mergedMap = new Map<string, UserNotification & { recipientKey?: string }>();

      await Promise.all(
        recipientIds.map(async (id) => {
          try {
            const response = await getUserNotifications(id, {
              limit: 20,
              status: filter,
            });

            if (response.success) {
              response.data.notifications.forEach((notification) => {
                const existing = mergedMap.get(notification.notificationId);
                if (
                  !existing ||
                  new Date(notification.createdAt).getTime() >
                    new Date(existing.createdAt).getTime()
                ) {
                  mergedMap.set(notification.notificationId, {
                    ...notification,
                    recipientKey: id,
                  });
                }
              });
            }
          } catch (err) {
            console.error(`[useNotifications] Failed to fetch notifications for ${id}:`, err);
          }
        })
      );

      const mergedNotifications = Array.from(mergedMap.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      const combinedUnread = mergedNotifications.filter(
        (notification) => !notification.readAt
      ).length;

      setNotifications(mergedNotifications);
      setUnreadCount(combinedUnread);
      persistUnreadCount(combinedUnread);
    } catch (err) {
      console.error('[useNotifications] Failed to fetch notifications:', err);
      setError('Không thể tải thông báo');
    } finally {
      setIsLoading(false);
    }
  }, [recipientIds, filter, persistUnreadCount]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (
      !recipientIds.length ||
      !isSupabaseConfigured() ||
      typeof window === 'undefined' ||
      !supabase
    ) {
      return undefined;
    }

    const channels = recipientIds.map((id) =>
      supabase
        .channel(`notifications:${id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'notifications_schema',
            table: 'notifications',
            filter: `recipient_id=eq.${id}`,
          },
          (payload) => {
            const subject = payload.new?.subject || 'Thông báo mới';
            const body = getPlainText(payload.new?.body);
            toast.info(subject, {
              description: body ? body.substring(0, 120) : undefined,
            });
            fetchNotifications();
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'notifications_schema',
            table: 'notifications',
            filter: `recipient_id=eq.${id}`,
          },
          () => {
            fetchNotifications();
          }
        )
        .subscribe()
    );

    return () => {
      channels.forEach((channel) => supabase?.removeChannel(channel));
    };
  }, [recipientIds, fetchNotifications]);

  const markAsRead = useCallback(
    async (notificationId: string) => {
      if (!primaryRecipientId) return;

      const target = notifications.find(
        (notification) => notification.notificationId === notificationId
      );
      if (!target || target.readAt) {
        return;
      }

      try {
        const recipientForNotification = (target as any).recipientKey || primaryRecipientId;
        await markNotificationAsRead(notificationId, recipientForNotification, true);
        setNotifications((prev) => {
          const updated = prev.map((notification) =>
            notification.notificationId === notificationId
              ? {
                  ...notification,
                  readAt: new Date().toISOString(),
                }
              : notification
          );
          if (filter === 'unread') {
            return updated.filter((notification) => !notification.readAt);
          }
          return updated;
        });
        setUnreadCount((prev) => {
          const next = Math.max(0, prev - 1);
          persistUnreadCount(next);
          return next;
        });
      } catch (err) {
        console.error('[useNotifications] Failed to mark as read:', err);
        toast.error('Không thể đánh dấu thông báo đã đọc');
      }
    },
    [notifications, primaryRecipientId, persistUnreadCount, filter]
  );

  const markAllAsRead = useCallback(async () => {
    if (!primaryRecipientId) return;
    const unread = notifications.filter((notification) => !notification.readAt);
    if (unread.length === 0) return;

    try {
      await Promise.all(
        unread.map((notification) =>
          markNotificationAsRead(
            notification.notificationId,
            (notification as any).recipientKey || primaryRecipientId,
            true
          )
        )
      );
      setNotifications((prev) => {
        const updated = prev.map((notification) =>
          notification.readAt
            ? notification
            : {
                ...notification,
                readAt: new Date().toISOString(),
              }
        );
        return filter === 'unread' ? [] : updated;
      });
      setUnreadCount(0);
      persistUnreadCount(0);
    } catch (err) {
      console.error('[useNotifications] Failed to mark all as read:', err);
      toast.error('Không thể đánh dấu tất cả thông báo');
    }
  }, [notifications, primaryRecipientId, persistUnreadCount, filter]);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    refresh: fetchNotifications,
    filter,
    setFilter,
  };
}
