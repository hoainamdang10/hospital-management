
'use client';

import { Bell, CheckCheck, Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { useNotifications } from '@/hooks/useNotifications';

function formatRelativeTime(timestamp: string) {
  const date = new Date(timestamp);
  const diff = Date.now() - date.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return 'V?a xong';
  if (diff < hour) return `${Math.floor(diff / minute)} ph?t tr??c`;
  if (diff < day) return `${Math.floor(diff / hour)} gi? tr??c`;
  if (diff < 7 * day) return `${Math.floor(diff / day)} ng?y tr??c`;

  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getPlainText(body: string | undefined) {
  if (!body) return '';
  return body.replace(/<[^>]*>/g, '').trim();
}

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    refresh,
  } = useNotifications();

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      refresh();
    }
  }, [isOpen, refresh]);

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
  };

  const handleNotificationClick = async (notificationId: string) => {
    await markAsRead(notificationId);
  };

  const showEmptyState = !isLoading && notifications.length === 0;

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={handleToggle}
        className="relative rounded-full p-2 text-gray-600 transition hover:bg-gray-100"
        aria-label="Th?ng b?o"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 min-w-[1.25rem] rounded-full bg-red-500 px-1 text-center text-xs font-semibold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-96 rounded-xl border border-gray-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">Th?ng b?o</p>
              <p className="text-xs text-gray-500">
                {unreadCount > 0
                  ? `${unreadCount} th?ng b?o ch?a ??c`
                  : '?? ??c t?t c?'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isLoading && <Loader2 className="h-4 w-4 animate-spin text-gray-500" />}
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 transition hover:bg-gray-200"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  ??nh d?u t?t c?
                </button>
              )}
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {showEmptyState && (
              <div className="px-4 py-8 text-center text-sm text-gray-500">
                Kh?ng c? th?ng b?o n?o
              </div>
            )}

            {notifications.map((notification) => {
              const isUnread = !notification.readAt;
              return (
                <button
                  key={notification.notificationId}
                  onClick={() => handleNotificationClick(notification.notificationId)}
                  className={`block w-full border-b border-gray-100 p-4 text-left transition hover:bg-gray-50 ${
                    isUnread ? 'bg-blue-50/70' : 'bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {notification.subject || 'Th?ng b?o m?i'}
                      </p>
                      <p className="mt-1 line-clamp-2 text-sm text-gray-600">
                        {getPlainText(notification.body) || 'Chi ti?t s? ???c c?p nh?t.'}
                      </p>
                    </div>
                    {isUnread && (
                      <span className="mt-1 h-2 w-2 rounded-full bg-blue-500" aria-hidden />
                    )}
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    {formatRelativeTime(notification.createdAt)}
                  </p>
                </button>
              );
            })}

            {isLoading && notifications.length === 0 && (
              <div className="px-4 py-6 text-center text-sm text-gray-500">
                ?ang t?i th?ng b?o...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
