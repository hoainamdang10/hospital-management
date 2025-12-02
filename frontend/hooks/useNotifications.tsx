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

const buildUnreadCacheKey = (recipientId: string) =>
  `hmv2:notifications:unread:${recipientId}`;

const getPlainText = (value?: string | null) =>
  value ? value.replace(/<[^>]*>/g, '').trim() : '';

const resolveRecipientId = (user: ReturnType<typeof useAuth>['user']) =>
  user?.patientId || user?.staffId || user?.userId || null;

export function NotificationProvider({ children }: { children: ReactNode }) {
  const value = useProvideNotifications();
  return (
    <NotificationContext.Provider value={value} >
      {children}
    </NotificationContext.Provider>
  );
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
  const recipientId = useMemo(() => resolveRecipientId(user), [user]);

  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<NotificationStatusFilter>('all');

  const persistUnreadCount = useCallback(
    (value: number) => {
      if (!recipientId || typeof window === 'undefined') {
        return;
      }
      try {
        window.localStorage.setItem(
          buildUnreadCacheKey(recipientId),
          String(value),
        );
      } catch {
        // Ignore quota errors
      }
    },
    [recipientId],
  );

  useEffect(() => {
    if (!recipientId || typeof window === 'undefined') {
      return;
    }
    try {
      const cached = window.localStorage.getItem(
        buildUnreadCacheKey(recipientId),
      );
      if (cached !== null) {
        const parsed = Number.parseInt(cached, 10);
        if (!Number.isNaN(parsed)) {
          setUnreadCount(parsed);
        }
      }
    } catch {
      // Ignore malformed cache
    }
  }, [recipientId]);

  const fetchNotifications = useCallback(async () => {
    if (!recipientId) {
      setNotifications([]);
      setUnreadCount(0);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await getUserNotifications(recipientId, {
        limit: 20,
        status: filter,
      });

      if (response.success) {
        setNotifications(response.data.notifications);
        setUnreadCount(response.data.unreadCount);
        persistUnreadCount(response.data.unreadCount);
      } else {
        setNotifications([]);
        setUnreadCount(0);
        persistUnreadCount(0);
      }
    } catch (err) {
      console.error('[useNotifications] Failed to fetch notifications:', err);
      setError('Không thể tải thông báo');
    } finally {
      setIsLoading(false);
    }
  }, [recipientId, filter, persistUnreadCount]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (
      !recipientId ||
      !isSupabaseConfigured() ||
      typeof window === 'undefined' ||
      !supabase
    ) {
      return undefined;
    }

    const channel = supabase
      .channel(`notifications:${recipientId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'notifications_schema',
          table: 'notifications',
          filter: `recipient_id=eq.${recipientId}`,
        },
        (payload) => {
          const subject = payload.new?.subject || 'Thông báo mới';
          const body = getPlainText(payload.new?.body);
          toast.info(subject, {
            description: body ? body.substring(0, 120) : undefined,
          });
          fetchNotifications();
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'notifications_schema',
          table: 'notifications',
          filter: `recipient_id=eq.${recipientId}`,
        },
        () => {
          fetchNotifications();
        },
      )
      .subscribe();

    return () => {
      supabase?.removeChannel(channel);
    };
  }, [recipientId, fetchNotifications]);

  const markAsRead = useCallback(
    async (notificationId: string) => {
      if (!recipientId) return;

      const target = notifications.find(
        (notification) => notification.notificationId === notificationId,
      );
      if (!target || target.readAt) {
        return;
      }

      try {
        await markNotificationAsRead(notificationId, recipientId, true);
        setNotifications((prev) => {
          const updated = prev.map((notification) =>
            notification.notificationId === notificationId
              ? {
                ...notification,
                readAt: new Date().toISOString(),
              }
              : notification,
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
    [notifications, recipientId, persistUnreadCount, filter],
  );

  const markAllAsRead = useCallback(async () => {
    if (!recipientId) return;
    const unread = notifications.filter((notification) => !notification.readAt);
    if (unread.length === 0) return;

    try {
      await Promise.all(
        unread.map((notification) =>
          markNotificationAsRead(notification.notificationId, recipientId, true),
        ),
      );
      setNotifications((prev) => {
        const updated = prev.map((notification) =>
          notification.readAt
            ? notification
            : {
              ...notification,
              readAt: new Date().toISOString(),
            },
        );
        return filter === 'unread' ? [] : updated;
      });
      setUnreadCount(0);
      persistUnreadCount(0);
    } catch (err) {
      console.error('[useNotifications] Failed to mark all as read:', err);
      toast.error('Không thể đánh dấu tất cả thông báo');
    }
  }, [notifications, recipientId, persistUnreadCount, filter]);

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
