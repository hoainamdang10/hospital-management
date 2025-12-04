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
import { isAxiosError } from 'axios';

import {
  getUserNotifications,
  markNotificationAsRead,
  getUnreadNotificationsCount,
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
const POLLING_INTERVAL_MS = 60_000; // fallback poll khi chưa có realtime

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
    const role = user?.role?.toUpperCase();
    const prioritized: string[] = [];
    const addCandidate = (value?: string | null) => {
      if (value) {
        prioritized.push(value);
      }
    };

    if (role === 'PATIENT') {
      addCandidate(user?.patientId);
      addCandidate(patient?.id);
      addCandidate(patientId);
      addCandidate(internalId);
    } else {
      addCandidate(user?.staffId);
      addCandidate(user?.userId);
      addCandidate(user?.id);
      addCandidate(internalId);
    }

    return Array.from(new Set(prioritized.filter(Boolean)));
  }, [
    internalId,
    patient?.id,
    patientId,
    user?.patientId,
    user?.staffId,
    user?.userId,
    user?.id,
    user?.role,
  ]);

  const primaryRecipientId = recipientIds[0] || null;

  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<NotificationStatusFilter>('all');
  const [isPollingEnabled, setIsPollingEnabled] = useState(true);

  const supportsRealtime =
    typeof window !== 'undefined' && isSupabaseConfigured() && Boolean(supabase);

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

  const fetchUnreadCount = useCallback(async () => {
    if (recipientIds.length === 0) {
      setUnreadCount(0);
      persistUnreadCount(0);
      return;
    }
    try {
      const responses = await Promise.all(
        recipientIds.map(async (recipientId) => {
          try {
            return await getUnreadNotificationsCount(recipientId);
          } catch (error) {
            console.error(
              `[useNotifications] Failed to fetch unread summary for ${recipientId}:`,
              error
            );
            return null;
          }
        })
      );
      const total = responses.reduce((sum, response) => {
        if (response?.success && typeof response.data.unreadCount === 'number') {
          return sum + response.data.unreadCount;
        }
        return sum;
      }, 0);
      setUnreadCount(total);
      persistUnreadCount(total);
    } catch (error) {
      console.error('[useNotifications] Failed to fetch unread summary:', error);
    }
  }, [recipientIds, persistUnreadCount]);

  const fetchNotifications = useCallback(async () => {
    if (recipientIds.length === 0) {
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
        recipientIds.map(async (recipientId) => {
          try {
            const response = await getUserNotifications(recipientId, {
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
                    recipientKey: notification.recipientId || recipientId,
                  });
                }
              });
            }
          } catch (err) {
            console.error(
              `[useNotifications] Failed to fetch notifications for ${recipientId}:`,
              err
            );
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
      fetchUnreadCount();
    } catch (err) {
      console.error('[useNotifications] Failed to fetch notifications:', err);
      setError('Không thể tải thông báo');
    } finally {
      setIsLoading(false);
    }
  }, [recipientIds, filter, persistUnreadCount, fetchUnreadCount]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  useEffect(() => {
    if (!primaryRecipientId || !isPollingEnabled || typeof window === 'undefined') {
      return undefined;
    }
    const intervalId = window.setInterval(() => {
      fetchUnreadCount();
    }, POLLING_INTERVAL_MS);
    return () => window.clearInterval(intervalId);
  }, [primaryRecipientId, fetchUnreadCount, isPollingEnabled]);

  useEffect(() => {
    if (!primaryRecipientId || !supportsRealtime || !supabase) {
      setIsPollingEnabled(true);
      return undefined;
    }

    const channel = supabase
      .channel(`notifications:${primaryRecipientId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'notifications_schema',
          table: 'notifications',
          filter: `recipient_id=eq.${primaryRecipientId}`,
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
          filter: `recipient_id=eq.${primaryRecipientId}`,
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsPollingEnabled(false);
        }
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          setIsPollingEnabled(true);
        }
      });

    return () => {
      supabase?.removeChannel(channel);
      if (supportsRealtime) {
        setIsPollingEnabled(true);
      }
    };
  }, [primaryRecipientId, fetchNotifications, supportsRealtime]);

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
        await markNotificationAsRead(
          notificationId,
          target.recipientId || recipientForNotification,
          true
        );
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
        if (isAxiosError(err) && err.response) {
          const status = err.response.status;
          if (status === 404 || status === 403) {
            setNotifications((prev) =>
              prev.filter((notification) => notification.notificationId !== notificationId)
            );
            if (!target.readAt) {
              setUnreadCount((prev) => {
                const next = Math.max(0, prev - 1);
                persistUnreadCount(next);
                return next;
              });
            }
            toast.info(
              status === 403
                ? 'Thông báo này thuộc hồ sơ khác nên đã bị ẩn khỏi danh sách của bạn.'
                : 'Thông báo này không còn tồn tại.'
            );
            return;
          }
        }
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
      const results = await Promise.allSettled(
        unread.map((notification) =>
          markNotificationAsRead(
            notification.notificationId,
            notification.recipientId || (notification as any).recipientKey || primaryRecipientId,
            true
          )
        )
      );

      const succeededIds = new Set(
        results
          .map((result, index) =>
            result.status === 'fulfilled' ? unread[index].notificationId : null
          )
          .filter((value): value is string => Boolean(value))
      );

      if (succeededIds.size === 0) {
        throw new Error('No notifications were updated');
      }

      setNotifications((prev) => {
        const updated = prev
          .map((notification) =>
            succeededIds.has(notification.notificationId)
              ? { ...notification, readAt: new Date().toISOString() }
              : notification
          )
          .filter((notification) =>
            filter === 'unread' ? !succeededIds.has(notification.notificationId) : true
          );
        return updated;
      });

      setUnreadCount((prev) => {
        const next = Math.max(0, prev - succeededIds.size);
        persistUnreadCount(next);
        return next;
      });

      // Force sync with server to ensure badge + list reflect the latest state (avoid stale cache)
      await fetchUnreadCount();

      if (succeededIds.size < unread.length) {
        toast.info(`Đã đánh dấu ${succeededIds.size}/${unread.length} thông báo`);
      }
    } catch (err) {
      console.error('[useNotifications] Failed to mark all as read:', err);
      toast.error('Không thể đánh dấu tất cả thông báo');
    }
  }, [notifications, primaryRecipientId, persistUnreadCount, filter, fetchUnreadCount]);

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
