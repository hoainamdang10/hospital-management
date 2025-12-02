'use client';

import Link from 'next/link';
import { Bell, CheckCheck, Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { useNotifications } from '@/hooks/useNotifications';
import {
  type NotificationStatusFilter,
  type UserNotification,
  formatNotificationPreview,
} from '@/lib/api/notifications.service';

const FILTERS: { label: string; value: NotificationStatusFilter }[] = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Chưa đọc', value: 'unread' },
];

function formatRelativeTime(timestamp: string) {
  const date = new Date(timestamp);
  const diff = Date.now() - date.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return 'Vừa xong';
  if (diff < hour) return `${Math.floor(diff / minute)} phút trước`;
  if (diff < day) return `${Math.floor(diff / hour)} giờ trước`;
  if (diff < 7 * day) return `${Math.floor(diff / day)} ngày trước`;

  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
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
    filter,
    setFilter,
  } = useNotifications();

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
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
        aria-label="Thông báo"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[1.25rem] rounded-full bg-red-500 px-1 text-center text-xs font-semibold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-96 rounded-xl border border-gray-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">Thông báo</p>
              <p className="text-xs text-gray-500">
                {unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : 'Đã đọc tất cả'}
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
                  Danh dấu tất cả
                </button>
              )}
            </div>
          </div>
          <div className="flex gap-2 border-b px-4 pt-2 pb-3">
            {FILTERS.map((option) => {
              const isActive = option.value === filter;
              return (
                <button
                  key={option.value}
                  onClick={() => setFilter(option.value)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {showEmptyState && (
              <div className="px-4 py-8 text-center text-sm text-gray-500">Không có thông báo</div>
            )}

            {notifications.map((notification) => {
              const isUnread = !notification.readAt;
              const detailHref = buildNotificationLink(notification);
              const preview = formatNotificationPreview(notification);
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
                      <p className="text-sm font-semibold text-gray-900">{preview.title}</p>
                      <p className="mt-1 line-clamp-2 text-sm text-gray-600">
                        {preview.description || 'Chi tiết sẽ được cập nhật.'}
                      </p>
                    </div>
                    {isUnread && (
                      <span className="mt-1 h-2 w-2 rounded-full bg-blue-500" aria-hidden />
                    )}
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                    <span>{formatRelativeTime(notification.createdAt)}</span>
                    <Link
                      href={detailHref}
                      className="font-medium text-blue-600 hover:underline"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleNotificationClick(notification.notificationId);
                      }}
                    >
                      Xem chi tiết
                    </Link>
                  </div>
                </button>
              );
            })}

            {isLoading && notifications.length === 0 && (
              <div className="px-4 py-6 text-center text-sm text-gray-500">
                Đang tải thông báo...
              </div>
            )}
          </div>
          <div className="border-t px-4 py-2 text-right">
            <Link
              href="/dashboard/notifications"
              className="text-sm font-medium text-blue-600 hover:underline"
              onClick={() => setIsOpen(false)}
            >
              Xem tất cả thông báo
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function buildNotificationLink(notification: UserNotification): string {
  const context = notification.healthcareContext;
  if (context?.appointmentId) {
    return `/dashboard/appointments/${context.appointmentId}`;
  }
  if (context?.invoiceId) {
    return `/dashboard/billing/${context.invoiceId}`;
  }
  if (context?.medicalRecordId) {
    return `/dashboard/records/${context.medicalRecordId}`;
  }
  return '/dashboard/notifications';
}
