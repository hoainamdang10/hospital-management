/**
 * useNotifications Hook
 * Real-time notifications using Supabase Realtime
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { supabase, isSupabaseConfigured } from '@/lib/supabase-client';
import { toast } from 'sonner';

export interface Notification {
  id: string;
  notification_id: string;
  recipient_id: string;
  recipient_type: string;
  template_type: string;
  subject: string;
  body: string;
  channels: string[];
  status: string;
  priority: string;
  scheduled_at: string | null;
  sent_at: string | null;
  delivered_at: string | null;
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial notifications
  const fetchNotifications = useCallback(async () => {
    if (!user?.id || !isSupabaseConfigured()) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (fetchError) throw fetchError;

      setNotifications(data || []);
      setUnreadCount(data?.filter((n) => !n.read_at).length || 0);
    } catch (err: any) {
      console.error('[useNotifications] Failed to fetch notifications:', err);
      setError(err.message || 'Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Subscribe to realtime changes
  useEffect(() => {
    if (!user?.id || !isSupabaseConfigured()) {
      return;
    }

    // Fetch initial data
    fetchNotifications();

    // Subscribe to INSERT events for new notifications
    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'notifications_schema',
          table: 'notifications',
          filter: `recipient_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('[useNotifications] New notification received:', payload);
          const newNotification = payload.new as Notification;

          // Add to notifications list
          setNotifications((prev) => [newNotification, ...prev]);
          setUnreadCount((prev) => prev + 1);

          // Show toast notification
          toast.info(newNotification.subject, {
            description: newNotification.body,
            duration: 5000,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'notifications_schema',
          table: 'notifications',
          filter: `recipient_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('[useNotifications] Notification updated:', payload);
          const updatedNotification = payload.new as Notification;

          // Update notification in list
          setNotifications((prev) =>
            prev.map((n) => (n.id === updatedNotification.id ? updatedNotification : n))
          );

          // Update unread count if read_at changed
          if (updatedNotification.read_at) {
            setUnreadCount((prev) => Math.max(0, prev - 1));
          }
        }
      )
      .subscribe();

    console.log('[useNotifications] Subscribed to realtime notifications');

    // Cleanup subscription
    return () => {
      console.log('[useNotifications] Unsubscribing from realtime notifications');
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchNotifications]);

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const { error: updateError } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (updateError) throw updateError;
    } catch (err: any) {
      console.error('[useNotifications] Failed to mark as read:', err);
      toast.error('Failed to mark notification as read');
    }
  };

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    reload: fetchNotifications,
  };
}

