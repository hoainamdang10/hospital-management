
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import {
  getUserNotifications,
  markNotificationAsRead,
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
}

const getPlainText = (value?: string | null) =>
  value ? value.replace(/<[^>]*>/g, '').trim() : '';

const resolveRecipientId = (user: ReturnType<typeof useAuth>['user']) =>
  user?.patientId || user?.staffId || user?.userId || null;

export function useNotifications(): UseNotificationsState {
  const { user } = useAuth();
  const recipientId = useMemo(() => resolveRecipientId(user), [user]);

  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      const response = await getUserNotifications(recipientId, { limit: 20 });
      if (response.success) {
        setNotifications(response.data.notifications);
        setUnreadCount(response.data.unreadCount);
      } else {
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('[useNotifications] Failed to fetch notifications:', err);
      setError('Kh?ng th? t?i th?ng b?o');
    } finally {
      setIsLoading(false);
    }
  }, [recipientId]);

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
          const subject = payload.new?.subject || 'Th?ng b?o m?i';
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
      supabase.removeChannel(channel);
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
        setNotifications((prev) =>
          prev.map((notification) =>
            notification.notificationId === notificationId
              ? {
                  ...notification,
                  readAt: new Date().toISOString(),
                }
              : notification,
          ),
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.error('[useNotifications] Failed to mark as read:', err);
        toast.error('Kh?ng th? ??nh d?u th?ng b?o ?? ??c');
      }
    },
    [notifications, recipientId],
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
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.readAt
            ? notification
            : {
                ...notification,
                readAt: new Date().toISOString(),
              },
        ),
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('[useNotifications] Failed to mark all as read:', err);
      toast.error('Kh?ng th? ??nh d?u t?t c? th?ng b?o');
    }
  }, [notifications, recipientId]);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    refresh: fetchNotifications,
  };
}
